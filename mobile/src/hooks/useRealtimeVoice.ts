import { useCallback, useEffect, useRef, useState } from "react";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { realtimeApi } from "../services/api";
import type { UseRealtimeVoiceOptions, UseRealtimeVoiceReturn } from "./useRealtimeVoice.types";

export type {
  RealtimeToolCall,
  UseRealtimeVoiceOptions,
  UseRealtimeVoiceReturn,
} from "./useRealtimeVoice.types";

const OPENAI_REALTIME_URL = "https://api.openai.com/v1/realtime";

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

  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  const handleServerEvent = useCallback((event: any) => {
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

      case "error":
        setError(event.error?.message || "Realtime API error");
        callbacksRef.current.onError?.(
          new Error(event.error?.message || "Realtime API error")
        );
        break;
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
  }, []);

  const sendToolResult = useCallback((callId: string, result: unknown) => {
    const dc = dcRef.current;
    if (!dc) return;

    const event = {
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: callId,
        output: JSON.stringify(result),
      },
    };
    dc.send(JSON.stringify(event));
    dc.send(JSON.stringify({ type: "response.create" }));
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
        audio: true,
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
  };
}
