import { useEffect, useRef, useState } from "react";
import { Bot, Send, User, X } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AIAssistantProps {
  onClose: () => void;
}

const SAMPLE_RESPONSES = [
  "Great question! Make sure your pan is properly heated before adding the ingredients.",
  "I'd recommend using medium-high heat for this step. You want to hear a nice sizzle!",
  "You can substitute with olive oil if you prefer, though it will slightly change the flavor.",
  "This step usually takes about 5-7 minutes. You'll know it's ready when it turns golden brown.",
  "Yes, you can prepare this ahead of time. Store it covered in the refrigerator for up to 24 hours.",
];

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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages((previous) => [...previous, userMessage]);
    setInput("");

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          SAMPLE_RESPONSES[
            Math.floor(Math.random() * SAMPLE_RESPONSES.length)
          ],
      };
      setMessages((previous) => [...previous, aiMessage]);
    }, 800);
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
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-orange-400/30 bg-orange-600/30 p-3">
        <div className="flex gap-2">
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
            className="flex-1 rounded-lg bg-white/20 px-3 py-2 text-sm text-white placeholder:text-white/60 outline-none ring-0 focus:ring-2 focus:ring-white/40"
          />
          <button
            type="button"
            onClick={handleSend}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-orange-500 transition-colors hover:bg-orange-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

