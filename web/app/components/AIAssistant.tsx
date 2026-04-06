"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Mic, MicOff, Send, User, X } from "lucide-react";
import { useWebSpeechToText } from "../hooks/useWebSpeechToText";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AIAssistantProps {
  onClose: () => void;
}

export function AIAssistant({ onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hey there, chef! I'm your AI cooking assistant. Ask me anything about this recipe - techniques, substitutions, timing, or cooking tips!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const voiceBaseRef = useRef("");

  const { supported: voiceSupported, listening, startListening, stopListening } =
    useWebSpeechToText();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleVoiceClick = () => {
    if (listening) {
      stopListening();
      return;
    }
    voiceBaseRef.current = input.trim();
    startListening((text, isFinal) => {
      if (isFinal) {
        const next = voiceBaseRef.current
          ? `${voiceBaseRef.current} ${text}`.trim()
          : text.trim();
        voiceBaseRef.current = next;
        setInput(next);
      } else {
        setInput(
          voiceBaseRef.current
            ? `${voiceBaseRef.current} ${text}`.trim()
            : text
        );
      }
    });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.content,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again in a moment!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[450px] flex-col overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-2xl">
      <div className="flex items-center justify-between border-b border-orange-400/30 bg-orange-600/50 p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
            <Bot className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Chef AI</div>
            <div className="text-xs text-orange-200">Your cooking assistant</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-white/70 transition-colors hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={[
              "flex gap-2",
              message.role === "user" ? "flex-row-reverse" : "",
            ].join(" ")}
          >
            <div
              className={[
                "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
                message.role === "assistant" ? "bg-white" : "bg-orange-700",
              ].join(" ")}
            >
              {message.role === "assistant" ? (
                <Bot className="h-3.5 w-3.5 text-orange-500" />
              ) : (
                <User className="h-3.5 w-3.5 text-white" />
              )}
            </div>
            <div
              className={[
                "max-w-[75%] rounded-xl p-2.5 text-sm",
                message.role === "assistant"
                  ? "rounded-tl-none bg-white/90 text-gray-800"
                  : "rounded-tr-none bg-orange-700 text-white",
              ].join(" ")}
            >
              {message.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white">
              <Bot className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <div className="flex items-center gap-1.5 rounded-xl rounded-tl-none bg-white/90 p-2.5 text-sm text-gray-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-orange-400/30 bg-orange-600/30 p-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleVoiceClick}
            disabled={loading || !voiceSupported}
            title={
              voiceSupported
                ? listening
                  ? "Stop listening"
                  : "Speak your question"
                : "Voice input needs a supported browser (e.g. Chrome)"
            }
            className={[
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-40",
              listening
                ? "bg-red-500/90 text-white hover:bg-red-500"
                : "bg-white/20 text-white hover:bg-white/30",
            ].join(" ")}
          >
            {listening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about this recipe..."
            disabled={loading}
            className="min-w-0 flex-1 rounded-lg bg-white/20 px-3 py-2 text-sm text-white placeholder:text-white/60 outline-none ring-0 focus:ring-2 focus:ring-white/40 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white text-orange-500 transition-colors hover:bg-orange-50 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
