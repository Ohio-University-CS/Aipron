export interface RealtimeToolCall {
  name: string;
  callId: string;
  args: Record<string, unknown>;
}

export interface UseRealtimeVoiceOptions {
  instructions?: string;
  onTranscript?: (text: string, role: "user" | "assistant") => void;
  onToolCall?: (toolCall: RealtimeToolCall) => void;
  onError?: (error: Error) => void;
}

export interface UseRealtimeVoiceReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendToolResult: (callId: string, result: unknown) => void;
}
