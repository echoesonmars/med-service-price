"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { isToolUIPart, getToolName, DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { FaMicrophone, FaPaperPlane, FaCopy, FaRedo } from "react-icons/fa";
import { ServiceItem } from "@/types/search";
import { ServiceCard } from "@/components/service-card";
import { MarkdownMessage } from "@/components/markdown-message";
import { cn } from "@/lib/utils";

interface AIChatProps {
  initialQuery?: string;
  onSelectClinic: (clinic: ServiceItem | null) => void;
  selectedClinic: ServiceItem | null;
  allClinics: ServiceItem[];
}

export function AIChat({ initialQuery = "", onSelectClinic, selectedClinic }: AIChatProps) {
  const { messages, sendMessage, setMessages, status, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });
  
  const isLoading = status === "streaming" || status === "submitted";
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick symptom suggestions
  const suggestions = [
    "Болит спина в пояснице",
    "Сильная головная боль",
    "Где сделать МРТ мозга?",
    "Анализ крови на витамины"
  ];

  // Simulate voice recording input
  const startVoiceSim = () => {
    if (isRecording) return;
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setInput("Сильная головная боль и головокружение");
    }, 2000);
  };

  const lastSentQueryRef = useRef("");

  // Handle initial query on mount or programmatically
  useEffect(() => {
    if (initialQuery && initialQuery !== lastSentQueryRef.current) {
      lastSentQueryRef.current = initialQuery;
      sendMessage({ text: initialQuery });
    }
  }, [initialQuery, sendMessage]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto py-3 px-4 md:py-4 md:px-6 flex flex-col gap-3.5 no-scrollbar bg-zinc-50/50 dark:bg-zinc-950/20">
        {messages.map((msg) => {
          const isBot = msg.role === "assistant";
          
          let messageText = "";
          const msgWithContent = msg as unknown as { content?: string };
          if (msgWithContent.content) {
            messageText = msgWithContent.content;
          }

          const recommendations: ServiceItem[] = [];

          if (msg.parts) {
            // If parts are present, they take precedence or append to text
            let partsText = "";
            for (const part of msg.parts) {
              if (part.type === "text") {
                partsText += part.text;
              } else if (isToolUIPart(part)) {
                const toolName = getToolName(part);
                if (
                  toolName === "search_clinics_by_symptom" &&
                  part.state === "output-available"
                ) {
                  recommendations.push(...(part.output as ServiceItem[]));
                }
              }
            }
            if (partsText) {
              messageText = partsText;
            }
          }

          if (!messageText && recommendations.length === 0) {
            return null;
          }

          return (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[85%] space-y-2 animate-fade-in shrink-0",
                isBot ? "self-start items-start" : "self-end items-end ml-auto"
              )}
            >
              {/* Message bubble */}
              {messageText && (
                <div className="group relative flex flex-col items-start gap-1">
                  <div
                    className={cn(
                      "py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-heading shadow-sm",
                      isBot
                        ? "bg-background border border-border text-foreground"
                        : "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                    )}
                  >
                    {isBot ? (
                      <MarkdownMessage
                        text={messageText}
                        isStreaming={status === "streaming" && messages[messages.length - 1]?.id === msg.id}
                      />
                    ) : (
                      <span className="leading-relaxed">{messageText}</span>
                    )}
                  </div>
                  
                  {/* Actions for Assistant Messages */}
                  {isBot && (
                    <div className="flex items-center gap-2 px-1 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => navigator.clipboard.writeText(messageText)}
                        className="flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 outline-none"
                        title="Копировать текст"
                      >
                        <FaCopy className="size-2.5" />
                        <span>Копировать</span>
                      </button>
                      <button
                        onClick={() => regenerate({ messageId: msg.id })}
                        className="flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 outline-none"
                        title="Регенерировать ответ"
                      >
                        <FaRedo className="size-2.5" />
                        <span>Регенерировать</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Clinic recommendations inside bubble */}
              {isBot && recommendations.length > 0 && (
                <div className="w-full space-y-2 pt-2 animate-fade-in">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 px-1">
                    Подобрано для вас:
                  </div>
                  <div className="space-y-2">
                    {recommendations.map((clinic, idx) => {
                      const isSelected =
                        selectedClinic &&
                        selectedClinic.clinic === clinic.clinic &&
                        selectedClinic.title === clinic.title;
                      return (
                        <div
                          key={idx}
                          onClick={() => onSelectClinic(clinic)}
                          className={cn(
                            "cursor-pointer transition-all duration-300 rounded-xl",
                            isSelected
                              ? "ring-2 ring-sky-400/60 shadow-[0_0_12px_rgba(56,189,248,0.15)]"
                              : ""
                          )}
                        >
                          <ServiceCard item={clinic} index={idx} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-center gap-2 self-start max-w-[85%] animate-fade-in shrink-0">
            <div className="py-3 px-4 rounded-2xl bg-background border border-border text-foreground shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions chips */}
      {messages.length <= 1 && (
        <div className="px-4 py-2 border-t border-border/40 bg-background/50 backdrop-blur-sm flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                sendMessage({ text: s });
              }}
              className="h-8 px-4 rounded-full border border-border bg-background hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-heading font-medium text-foreground cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md shrink-0 outline-none"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input container */}
      <div className="py-2.5 px-4 border-t border-border bg-background shrink-0">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2"
        >
          {/* Micro Button (Simulated voice recording) */}
          <button
            type="button"
            onClick={startVoiceSim}
            className={cn(
              "size-10 rounded-full border flex items-center justify-center cursor-pointer transition-all outline-none shrink-0",
              isRecording
                ? "bg-destructive border-destructive text-destructive-foreground animate-pulse"
                : "border-border bg-background hover:bg-zinc-100 text-foreground"
            )}
            title={isRecording ? "Запись идет..." : "Записать симптомы голосом"}
          >
            <FaMicrophone className="size-4" />
          </button>

          {/* Text Input */}
          <input
            value={input}
            onChange={handleInputChange}
            type="text"
            placeholder={isRecording ? "Говорите..." : "Опишите ваши симптомы..."}
            className="flex-1 h-10 border border-border rounded-full px-4 text-xs sm:text-sm font-heading font-medium bg-background text-foreground outline-none focus:border-zinc-400 transition-colors"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim()}
            className="size-10 rounded-full bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:bg-secondary disabled:text-muted-foreground flex items-center justify-center cursor-pointer transition-colors outline-none shrink-0"
          >
            <FaPaperPlane className="size-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
