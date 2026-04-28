import { useCallback, useEffect, useRef, useState } from "react";
import { realtimeApi } from "../services/api";
import type {
  RealtimeToolCall,
  SendNarrationOptions,
  SendToolResultOptions,
  UseRealtimeVoiceOptions,
  UseRealtimeVoiceReturn,
} from "./useRealtimeVoice.types";

export type {
  RealtimeToolCall,
  SendNarrationOptions,
  SendToolResultOptions,
  UseRealtimeVoiceOptions,
  UseRealtimeVoiceReturn,
} from "./useRealtimeVoice.types";

/** Matches backend `buildSessionConfig` VAD; `create_response: false` stops duplicate auto-replies in cooking mode. */
function sendCookingVoiceTurnPatch(dc: RTCDataChannel) {
  dc.send(
    JSON.stringify({
      type: "session.update",
      session: {
        turn_detection: {
          type: "server_vad",
          threshold: 0.6,
          prefix_padding_ms: 300,
          silence_duration_ms: 1300,
          create_response: false,
          interrupt_response: false,
        },
      },
    })
  );
}

/** After assistant audio, ignore very-early mic tails; keep short so real "next" is not dropped. */
const POST_ASSISTANT_INPUT_GRACE_MS = 280;

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
  // True when a tool result was submitted while a response was already active.
  // On response.done we fire a response.create so the model can speak its
  // confirmation (e.g. "Done! Your recipe has been saved.").
  const pendingResponseCreateRef = useRef(false);
  const userVadTurnOpenRef = useRef(false);
  const lastAssistantOutputEndedAtRef = useRef(0);
  const pendingDeferredUserTurnRef = useRef(false);

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
        if (callbacksRef.current.manualVoiceTurns) {
          userVadTurnOpenRef.current = true;
        }
        break;

      case "input_audio_buffer.speech_stopped":
        setIsListening(false);
        if (callbacksRef.current.manualVoiceTurns) {
          if (!userVadTurnOpenRef.current) {
            break;
          }
          if (responseActiveRef.current) {
            pendingDeferredUserTurnRef.current = true;
            userVadTurnOpenRef.current = false;
            break;
          }
          userVadTurnOpenRef.current = false;
          const lastEnd = lastAssistantOutputEndedAtRef.current;
          if (
            lastEnd > 0 &&
            Date.now() - lastEnd < POST_ASSISTANT_INPUT_GRACE_MS
          ) {
            break;
          }
          const dc = dcRef.current;
          if (dc && dc.readyState === "open") {
            responseActiveRef.current = true;
            dc.send(JSON.stringify({ type: "response.create" }));
          }
        }
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
        lastAssistantOutputEndedAtRef.current = Date.now();
        // A tool result was submitted while a response was in-flight (e.g.
        // a "working on it" narration was playing while the recipe generated).
        // Now that the response is done, ask the model to speak its follow-up.
        if (pendingResponseCreateRef.current) {
          pendingResponseCreateRef.current = false;
          responseActiveRef.current = true;
          dcRef.current?.send(JSON.stringify({ type: "response.create" }));
          break;
        }
        if (pendingNarrationRef.current) {
          const queued = pendingNarrationRef.current;
          pendingNarrationRef.current = null;
          sendNarrationRef.current?.(queued);
          break;
        }
        if (pendingDeferredUserTurnRef.current) {
          pendingDeferredUserTurnRef.current = false;
          responseActiveRef.current = true;
          dcRef.current?.send(JSON.stringify({ type: "response.create" }));
          break;
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
    pendingResponseCreateRef.current = false;
    userVadTurnOpenRef.current = false;
    lastAssistantOutputEndedAtRef.current = 0;
    pendingDeferredUserTurnRef.current = false;
  }, []);

  const sendToolResult = useCallback((
    callId: string,
    result: unknown,
    opts?: SendToolResultOptions,
  ) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;

    const followUp = opts?.requestModelFollowUp !== false;

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
    if (!followUp) {
      if (callbacksRef.current.manualVoiceTurns) {
        setTimeout(() => {
          const q = pendingNarrationRef.current;
          if (!q) return;
          pendingNarrationRef.current = null;
          responseActiveRef.current = false;
          sendNarrationRef.current?.(q);
        }, 120);
        setTimeout(() => {
          const q = pendingNarrationRef.current;
          if (!q) return;
          pendingNarrationRef.current = null;
          responseActiveRef.current = false;
          sendNarrationRef.current?.(q);
        }, 320);
      }
      return;
    }
    // Only request a follow-up response if the model is idle.
    // If a narration is currently playing (e.g. "Working on it...") we park
    // a flag so response.done fires the response.create instead.
    if (!responseActiveRef.current) {
      responseActiveRef.current = true;
      dc.send(JSON.stringify({ type: "response.create" }));
    } else {
      pendingResponseCreateRef.current = true;
    }
  }, []);

  const sendNarration = useCallback((text: string, opts?: SendNarrationOptions) => {
    const dc = dcRef.current;
    const trimmed = text?.trim();
    if (!dc || dc.readyState !== "open" || !trimmed) return;
    if (opts?.preempt) {
      pendingNarrationRef.current = null;
      responseActiveRef.current = false;
    }
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
          // Strict verbatim prompt: the model must NOT add preamble ("Sure!",
          // "Of course", "Step N:"), paraphrase, summarise, or add anything
          // before or after the instruction text. This stops partial reads and
          // double-reads caused by the model embellishing.
          instructions:
            `Say ONLY the following text, word for word, at a clear and calm pace. ` +
            `Do not add any introduction, confirmation, rephrasing, or follow-up. ` +
            `Do not say "Sure", "Of course", "Step", or anything else. ` +
            `Start speaking the text immediately:\n\n${trimmed}`,
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
        if (callbacksRef.current.manualVoiceTurns) {
          sendCookingVoiceTurnPatch(dc);
          lastAssistantOutputEndedAtRef.current = Date.now();
          userVadTurnOpenRef.current = false;
        }
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
        // Explicit echo cancellation + noise suppression are critical: without
        // them the mic picks up the assistant's own audio through the
        // speakers and server VAD treats it as user speech, cutting the
        // narration off mid-sentence.
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
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
