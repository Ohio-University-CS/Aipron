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
  const { instructions } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.createElement("audio");
    el.autoplay = true;
    el.setAttribute("playsinline", "true");
    remoteAudioRef.current = el;
    return () => {
      el.srcObject = null;
      el.remove();
      remoteAudioRef.current = null;
    };
  }, []);

  const handleServerEvent = useCallback((event: Record<string, unknown>) => {
    switch (event.type) {
      case "input_audio_buffer.speech_started":
        setIsListening(true);
        setIsSpeaking(false);
        break;

      case "input_audio_buffer.speech_stopped":
        setIsListening(false);
        break;

      case "response.audio.started":
        setIsSpeaking(true);
        break;

      case "response.audio.done":
        setIsSpeaking(false);
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
          const errObj = event.error as { message?: string } | undefined;
          const msg = errObj?.message || "Realtime API error";
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
    dc.send(JSON.stringify({ type: "response.create" }));
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
      const session = await realtimeApi.createSession(instructions);

      const pc = new RTC({ iceServers: [] });
      pcRef.current = pc;

      pc.ontrack = (ev) => {
        if (ev.track.kind !== "audio") return;
        const audio = remoteAudioRef.current;
        if (!audio) return;
        const [stream] = ev.streams;
        if (stream) {
          audio.srcObject = stream;
          void audio.play().catch(() => {});
        }
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
  }, [instructions, cleanup, handleServerEvent]);

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
  };
}
