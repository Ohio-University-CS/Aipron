export interface RealtimeToolCall {
  name: string;
  callId: string;
  args: Record<string, unknown>;
}

/** When `requestModelFollowUp` is false, only the function output is sent — no `response.create`. Cooking uses this so the model does not chain `next_step` or read the whole recipe aloud after each tool call. */
export type SendToolResultOptions = {
  requestModelFollowUp?: boolean;
};

export type SendNarrationOptions = {
  /**
   * Drop client-side "busy" state and any queued narration, then send this line.
   * Cooking uses this after next_step so step TTS is not stuck behind a stale tool turn.
   */
  preempt?: boolean;
};

export interface UseRealtimeVoiceOptions {
  instructions?: string;
  /**
   * Cooking mode: disable VAD auto-responses so the server does not speak on its
   * own right after connection (or on noise/silence) while the app is also
   * driving step narration via `sendNarration`. User utterances are still
   * processed by firing `response.create` on `speech_stopped`.
   */
  manualVoiceTurns?: boolean;
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
  sendToolResult: (
    callId: string,
    result: unknown,
    options?: SendToolResultOptions,
  ) => void;
  /**
   * Ask the assistant to read the given text out loud verbatim, without
   * improvising around it. Used by cooking mode to narrate each step.
   * No-op if the data channel is not open yet.
   */
  sendNarration: (text: string, options?: SendNarrationOptions) => void;
  /**
   * Replace the live session's system instructions. Useful when the same
   * connection transitions between contexts (e.g. chat -> cooking a specific
   * recipe). No-op if the data channel is not open yet.
   */
  updateInstructions: (instructions: string) => void;
}
