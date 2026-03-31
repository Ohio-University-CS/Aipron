import { useCallback, useEffect, useRef, useState } from "react";
import type {
  RealtimeToolCall,
  UseRealtimeVoiceOptions,
  UseRealtimeVoiceReturn,
} from "./useRealtimeVoice.types";

export type { RealtimeToolCall, UseRealtimeVoiceOptions, UseRealtimeVoiceReturn } from "./useRealtimeVoice.types";

export function useRealtimeVoice(
  options: UseRealtimeVoiceOptions = {}
): UseRealtimeVoiceReturn {
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  const [isConnected] = useState(false);
  const [isConnecting] = useState(false);
  const [isListening] = useState(false);
  const [isSpeaking] = useState(false);
  const [error] = useState<string | null>(null);

  const cleanup = useCallback(() => {}, []);

  const sendToolResult = useCallback(() => {}, []);

  const connect = useCallback(async () => {
    const msg = "Voice is not available in the web preview. Use the iOS or Android app.";
    callbacksRef.current.onError?.(new Error(msg));
  }, []);

  const disconnect = useCallback(() => {}, []);

  useEffect(() => {
    return cleanup;
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
