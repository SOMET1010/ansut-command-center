import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { chatWithAssistant } from "@/lib/api/chatbot.functions";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatBotProps {
  eventName: string;
  eventSlug: string;
  sessions?: Array<{
    title: string;
    speaker?: string;
    starts_at?: string;
    location?: string;
  }>;
  wifiSsid?: string;
  wifiPassword?: string;
  venue?: string;
  language?: "fr" | "en" | "ar" | "pt";
}

const GREETING: Record<string, string> = {
  fr: "Bonjour ! Je suis SUTA, votre assistant pour cet événement. Comment puis-je vous aider ?",
  en: "Hello! I'm SUTA, your assistant for this event. How can I help you?",
  ar: "مرحبًا! أنا SUTA، مساعدك لهذا الحدث. كيف يمكنني مساعدتك؟",
  pt: "Olá! Eu sou SUTA, seu assistente para este evento. Como posso ajudá-lo?",
};

const PLACEHOLDER: Record<string, string> = {
  fr: "Posez votre question...",
  en: "Ask your question...",
  ar: "اطرح سؤالك...",
  pt: "Faça sua pergunta...",
};

export function ChatBot({
  eventName,
  eventSlug,
  sessions,
  wifiSsid,
  wifiPassword,
  venue,
  language = "fr",
}: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: GREETING[language] || GREETING.fr },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await chatWithAssistant({
        data: {
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          eventContext: {
            eventName,
            eventSlug,
            sessions,
            wifiSsid,
            wifiPassword,
            venue,
          },
          language,
        },
      });

      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            language === "fr"
              ? "Désolé, une erreur est survenue. Réessayez."
              : "Sorry, an error occurred. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl"
          aria-label="Ouvrir l'assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 flex h-[500px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl sm:bottom-6 sm:right-6">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-primary to-primary/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">SUTA</p>
                <p className="text-[10px] text-white/70">
                  {language === "fr"
                    ? "Assistant IA — ANSUT"
                    : language === "en"
                      ? "AI Assistant — ANSUT"
                      : language === "ar"
                        ? "مساعد ذكي — ANSUT"
                        : "Assistente IA — ANSUT"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                    msg.role === "user"
                      ? "bg-primary/10 text-primary"
                      : "bg-purple-100 text-purple-600"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-slate-100 text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border bg-slate-50 px-3 py-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={PLACEHOLDER[language] || PLACEHOLDER.fr}
                className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
