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
  /**
   * Ask the assistant to read the given text out loud verbatim, without
   * improvising around it. Used by cooking mode to narrate each step.
   * No-op if the data channel is not open yet.
   */
  sendNarration: (text: string) => void;
  /**
   * Replace the live session's system instructions. Useful when the same
   * connection transitions between contexts (e.g. chat -> cooking a specific
   * recipe). No-op if the data channel is not open yet.
   */
  updateInstructions: (instructions: string) => void;
}
