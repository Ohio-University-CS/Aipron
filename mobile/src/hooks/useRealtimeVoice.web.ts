import { useCallback, useEffect, useRef, useState } from "react";
import { realtimeApi } from "../services/api";
import type {
  RealtimeToolCall,
  UseRealtimeVoiceOptions,
  UseRealtimeVoiceReturn,
} from "./useRealtimeVoice.types";

export type {
  RealtimeToolCall,
  UseRealtimeVoiceOptions,
  UseRealtimeVoiceReturn,
} from "./useRealtimeVoice.types";

export function useRealtimeVoice(
  options: UseRealtimeVoiceOptions = {}
): UseRealtimeVoiceReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // True while the model is mid-response. Used to gate `sendNarration` so we
  // never trigger OpenAI's "conversation already has an active response"
  // protocol error when a step advances while the assistant is still speaking.
  const responseActiveRef = useRef(false);
  const pendingNarrationRef = useRef<string | null>(null);

  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.createElement("audio");
    el.autoplay = true;
    el.setAttribute("playsinline", "true");
    el.setAttribute("aria-hidden", "true");
    el.style.position = "fixed";
    el.style.width = "1px";
    el.style.height = "1px";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    remoteAudioRef.current = el;
    return () => {
      el.srcObject = null;
      el.remove();
      remoteAudioRef.current = null;
    };
  }, []);

  const handleServerEvent = useCallback((event: Record<string, unknown>) => {
    if (typeof event.type === "string") {
      console.log("[realtime] event:", event.type);
    }
    switch (event.type) {
      case "input_audio_buffer.speech_started":
        setIsListening(true);
        setIsSpeaking(false);
        break;

      case "input_audio_buffer.speech_stopped":
        setIsListening(false);
        break;

      case "response.created":
        responseActiveRef.current = true;
        break;

      case "response.audio.started":
      case "response.output_audio.delta":
      case "response.audio.delta":
        setIsSpeaking(true);
        break;

      case "response.audio.done":
      case "response.output_audio.done":
        setIsSpeaking(false);
        break;

      case "response.done":
      case "response.cancelled":
      case "response.failed":
        setIsSpeaking(false);
        responseActiveRef.current = false;
        // Flush any narration that arrived while the model was busy.
        if (pendingNarrationRef.current) {
          const queued = pendingNarrationRef.current;
          pendingNarrationRef.current = null;
          sendNarrationRef.current?.(queued);
        }
        break;

      case "conversation.item.input_audio_transcription.completed":
        if (typeof event.transcript === "string" && event.transcript) {
          callbacksRef.current.onTranscript?.(event.transcript, "user");
        }
        break;

      case "response.audio_transcript.done":
        if (typeof event.transcript === "string" && event.transcript) {
          callbacksRef.current.onTranscript?.(event.transcript, "assistant");
        }
        break;

      case "response.function_call_arguments.done": {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(String(event.arguments || "{}"));
        } catch {
          /* noop */
        }
        const name = event.name;
        const callId = event.call_id;
        if (typeof name === "string" && typeof callId === "string") {
          callbacksRef.current.onToolCall?.({
            name,
            callId,
            args,
          } as RealtimeToolCall);
        }
        break;
      }

      case "error":
        {
          const errObj = event.error as { message?: string; code?: string } | undefined;
          const msg = errObj?.message || "Realtime API error";
          // Non-fatal race: we asked the model to speak while a response was
          // still in flight. We already queue narrations internally, so just
          // log it — never surface to the user.
          const benign =
            /active response|already has an active response|conversation_already_has_active_response/i.test(
              msg
            ) || errObj?.code === "conversation_already_has_active_response";
          if (benign) {
            console.warn("[realtime] benign error suppressed:", msg);
            break;
          }
          setError(msg);
          callbacksRef.current.onError?.(new Error(msg));
        }
        break;
    }
  }, []);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    if (dcRef.current) {
      try {
        dcRef.current.close();
      } catch {
        /* noop */
      }
      dcRef.current = null;
    }
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {
        /* noop */
      }
      pcRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsListening(false);
    setIsSpeaking(false);
    responseActiveRef.current = false;
    pendingNarrationRef.current = null;
  }, []);

  const sendToolResult = useCallback((callId: string, result: unknown) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;

    dc.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify(result),
        },
      })
    );
    // Only request a follow-up response if the model is idle. Otherwise the
    // model's in-flight response already counts as the reply to this tool.
    if (!responseActiveRef.current) {
      responseActiveRef.current = true;
      dc.send(JSON.stringify({ type: "response.create" }));
    }
  }, []);

  const sendNarration = useCallback((text: string) => {
    const dc = dcRef.current;
    const trimmed = text?.trim();
    if (!dc || dc.readyState !== "open" || !trimmed) return;
    // If a response is still playing, remember the latest narration and fire
    // it after `response.done`. We keep only the most recent pending line —
    // if the user advances two steps in a row while the model is talking, we
    // narrate the newer one, not the stale first one.
    if (responseActiveRef.current) {
      pendingNarrationRef.current = trimmed;
      return;
    }
    responseActiveRef.current = true;
    dc.send(
      JSON.stringify({
        type: "response.create",
        response: {
          modalities: ["audio", "text"],
          instructions:
            `Read the following cooking instruction aloud, clearly and at a calm pace. ` +
            `Do not add commentary or rephrase it. Just say it:\n\n${trimmed}`,
        },
      })
    );
  }, []);
  // Mirror latest sendNarration onto a ref so the server-event handler can
  // flush queued narrations without depending on closure identity.
  const sendNarrationRef = useRef(sendNarration);
  sendNarrationRef.current = sendNarration;

  const updateInstructions = useCallback((instructions: string) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(
      JSON.stringify({
        type: "session.update",
        session: { instructions },
      })
    );
  }, []);

  const connect = useCallback(async () => {
    if (pcRef.current) return;

    const RTC = globalThis.RTCPeerConnection;
    if (!RTC || !navigator.mediaDevices?.getUserMedia) {
      const msg = "WebRTC or microphone is not supported in this browser.";
      setError(msg);
      callbacksRef.current.onError?.(new Error(msg));
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const session = await realtimeApi.createSession();

      const pc = new RTC({ iceServers: [] });
      pcRef.current = pc;

      pc.ontrack = (ev) => {
        console.log("[realtime] ontrack", ev.track.kind, {
          muted: ev.track.muted,
          readyState: ev.track.readyState,
          streams: ev.streams?.length,
        });
        if (ev.track.kind !== "audio") return;
        const audio = remoteAudioRef.current;
        if (!audio) {
          console.warn("[realtime] audio element missing");
          return;
        }
        const [stream] = ev.streams;
        const remoteStream = stream || new MediaStream([ev.track]);
        audio.srcObject = remoteStream;
        audio.muted = false;
        audio.volume = 1;
        const tryPlay = () => {
          void audio
            .play()
            .then(() => console.log("[realtime] audio playback started"))
            .catch((err) => {
              console.warn("[realtime] audio autoplay blocked:", err);
            });
        };
        tryPlay();
        ev.track.addEventListener("unmute", tryPlay);
      };

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.addEventListener("open", () => {
        setIsConnected(true);
        setIsConnecting(false);
      });

      dc.addEventListener("close", () => {
        cleanup();
      });

      dc.addEventListener("message", (evt: MessageEvent<string>) => {
        try {
          const msg = JSON.parse(evt.data) as Record<string, unknown>;
          handleServerEvent(msg);
        } catch {
          /* noop */
        }
      });

      pc.addEventListener("iceconnectionstatechange", () => {
        const state = pc.iceConnectionState;
        if (state === "failed" || state === "disconnected" || state === "closed") {
          cleanup();
        }
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      localStreamRef.current = stream;

      for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);
      }

      const offer = await pc.createOffer({});
      await pc.setLocalDescription(offer);

      if (!offer.sdp) {
        throw new Error("Missing local SDP");
      }

      const answerSdp = await realtimeApi.negotiateSdp(
        offer.sdp,
        session.clientSecret,
        session.model
      );

      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Voice connection failed";
      setError(msg);
      callbacksRef.current.onError?.(err instanceof Error ? err : new Error(msg));
      cleanup();
    }
  }, [cleanup, handleServerEvent]);

  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isConnected,
    isConnecting,
    isListening,
    isSpeaking,
    error,
    connect,
    disconnect,
    sendToolResult,
    sendNarration,
    updateInstructions,
  };
}
