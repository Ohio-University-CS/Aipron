import { useCallback, useEffect, useRef, useState } from "react";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { realtimeApi } from "../services/api";
import type { UseRealtimeVoiceOptions, UseRealtimeVoiceReturn, SendToolResultOptions, SendNarrationOptions } from "./useRealtimeVoice.types";

export type {
  RealtimeToolCall,
  SendNarrationOptions,
  SendToolResultOptions,
  UseRealtimeVoiceOptions,
  UseRealtimeVoiceReturn,
} from "./useRealtimeVoice.types";

const OPENAI_REALTIME_URL = "https://api.openai.com/v1/realtime";

/** Matches backend `buildSessionConfig` VAD; `create_response: false` stops duplicate auto-replies in cooking mode. */
function sendCookingVoiceTurnPatch(dc: { send: (s: string) => void }) {
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

const EXPO_GO_VOICE_MSG =
  "Voice needs a development build (npx expo run:ios / run:android). It does not run in Expo Go.";

function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

function loadWebRTC(): {
  RTCPeerConnection: new (config: { iceServers: unknown[] }) => any;
  mediaDevices: { getUserMedia: (c: object) => Promise<any> };
  MediaStream: new () => any;
} {
  /* Deep paths skip the package main entry (which loads RTCView and breaks requireNativeComponent in Expo Go). */
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RTCPeerConnection = require("react-native-webrtc/lib/module/RTCPeerConnection").default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mediaDevices = require("react-native-webrtc/lib/module/MediaDevices").default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const MediaStream = require("react-native-webrtc/lib/module/MediaStream").default;
  return { RTCPeerConnection, mediaDevices, MediaStream };
}

export function useRealtimeVoice(
  options: UseRealtimeVoiceOptions = {}
): UseRealtimeVoiceReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<any>(null);
  const dcRef = useRef<any>(null);
  const localStreamRef = useRef<any>(null);

  // Gate sendNarration: true while the model is mid-response.
  const responseActiveRef = useRef(false);
  const pendingNarrationRef = useRef<string | null>(null);
  const pendingResponseCreateRef = useRef(false);
  const sendNarrationRef = useRef<(text: string, options?: SendNarrationOptions) => void>(
    () => {},
  );
  /** `speech_started` raised this turn; ignore stray `speech_stopped`. */
  const userVadTurnOpenRef = useRef(false);
  /** Timestamp from `response.done` — grace blocks bogus user turns after TTS. */
  const lastAssistantOutputEndedAtRef = useRef(0);
  /** User finished speaking while a response was still active (e.g. during step TTS). */
  const pendingDeferredUserTurnRef = useRef(false);

  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  const handleServerEvent = useCallback((event: any) => {
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
          // If the model or step narration is still in-flight, do not drop the
          // user's command — run it once the current response completes.
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
          if (dc) {
            responseActiveRef.current = true;
            dc.send(JSON.stringify({ type: "response.create" }));
          }
        }
        break;

      case "response.created":
        responseActiveRef.current = true;
        break;

      case "response.audio.started":
        setIsSpeaking(true);
        break;

      case "response.audio.done":
        setIsSpeaking(false);
        break;

      case "response.done":
      case "response.cancelled":
      case "response.failed":
        setIsSpeaking(false);
        responseActiveRef.current = false;
        lastAssistantOutputEndedAtRef.current = Date.now();
        if (pendingResponseCreateRef.current) {
          pendingResponseCreateRef.current = false;
          responseActiveRef.current = true;
          dcRef.current?.send(JSON.stringify({ type: "response.create" }));
          break;
        }
        if (pendingNarrationRef.current) {
          const queued = pendingNarrationRef.current;
          pendingNarrationRef.current = null;
          sendNarrationRef.current(queued);
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
        if (event.transcript) {
          callbacksRef.current.onTranscript?.(event.transcript, "user");
        }
        break;

      case "response.audio_transcript.done":
        if (event.transcript) {
          callbacksRef.current.onTranscript?.(event.transcript, "assistant");
        }
        break;

      case "response.function_call_arguments.done": {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(event.arguments || "{}");
        } catch {}
        callbacksRef.current.onToolCall?.({
          name: event.name,
          callId: event.call_id,
          args,
        });
        break;
      }

      case "error": {
        const msg = event.error?.message || "Realtime API error";
        const code = event.error?.code;
        const benign =
          /active response|already has an active response|conversation_already_has_active_response/i.test(
            msg
          ) || code === "conversation_already_has_active_response";
        if (benign) {
          console.warn("[realtime] benign error suppressed:", msg);
          break;
        }
        setError(msg);
        callbacksRef.current.onError?.(new Error(msg));
        break;
      }
    }
  }, []);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t: any) => t.stop());
      localStreamRef.current = null;
    }
    if (dcRef.current) {
      try { dcRef.current.close(); } catch {}
      dcRef.current = null;
    }
    if (pcRef.current) {
      try { pcRef.current.close(); } catch {}
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
    if (!dc) return;

    const followUp = opts?.requestModelFollowUp !== false;

    const event = {
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: callId,
        output: JSON.stringify(result),
      },
    };
    dc.send(JSON.stringify(event));
    if (!followUp) {
      if (callbacksRef.current.manualVoiceTurns) {
        // Silent tool output (e.g. next_step). The session can keep
        // responseActiveRef true until response.done; step narration queued from
        // React then never plays. Nudge flush shortly after when audio is pending.
        setTimeout(() => {
          const q = pendingNarrationRef.current;
          if (!q) return;
          pendingNarrationRef.current = null;
          responseActiveRef.current = false;
          sendNarrationRef.current(q);
        }, 120);
        setTimeout(() => {
          const q = pendingNarrationRef.current;
          if (!q) return;
          pendingNarrationRef.current = null;
          responseActiveRef.current = false;
          sendNarrationRef.current(q);
        }, 320);
      }
      return;
    }
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
    if (!dc || !trimmed) return;
    if (opts?.preempt) {
      pendingNarrationRef.current = null;
      responseActiveRef.current = false;
    }
    // Queue if the model is mid-response — the handler flushes on response.done.
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
            `Say ONLY the following text, word for word, at a clear and calm pace. ` +
            `Do not add any introduction, confirmation, rephrasing, or follow-up. ` +
            `Do not say "Sure", "Of course", "Step", or anything else. ` +
            `Start speaking the text immediately:\n\n${trimmed}`,
        },
      })
    );
  }, []);
  sendNarrationRef.current = sendNarration;

  const updateInstructions = useCallback((instructions: string) => {
    const dc = dcRef.current;
    if (!dc) return;
    dc.send(
      JSON.stringify({
        type: "session.update",
        session: { instructions },
      })
    );
  }, []);

  const connect = useCallback(async () => {
    if (pcRef.current) return;

    if (isExpoGo()) {
      setError(EXPO_GO_VOICE_MSG);
      callbacksRef.current.onError?.(new Error(EXPO_GO_VOICE_MSG));
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const { RTCPeerConnection, mediaDevices, MediaStream } = loadWebRTC();

      const session = await realtimeApi.createSession();

      const pc = new RTCPeerConnection({ iceServers: [] });
      pcRef.current = pc;

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

      dc.addEventListener("message", (evt: any) => {
        try {
          const msg = JSON.parse(evt.data);
          handleServerEvent(msg);
        } catch {}
      });

      pc.addEventListener("iceconnectionstatechange", () => {
        const state = pc.iceConnectionState;
        if (state === "failed" || state === "disconnected" || state === "closed") {
          cleanup();
        }
      });

      const stream = await mediaDevices.getUserMedia({
        // Echo cancellation + noise suppression stop the mic from picking up
        // the assistant's own speech, which otherwise trips server VAD and
        // cuts narration off mid-sentence.
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

      const sdpResponse = await fetch(
        `${OPENAI_REALTIME_URL}?model=${session.model}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.clientSecret}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      if (!sdpResponse.ok) {
        throw new Error(`WebRTC negotiation failed: ${sdpResponse.status}`);
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    } catch (err: any) {
      const msg = err?.message || "Voice connection failed";
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
