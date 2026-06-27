"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FaMicrophone, FaPaperPlane } from "react-icons/fa";
import { ServiceItem } from "@/types/search";
import { ServiceCard } from "@/components/service-card";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  recommendations?: ServiceItem[];
}

interface AIChatProps {
  initialQuery?: string;
  onSelectClinic: (clinic: ServiceItem | null) => void;
  selectedClinic: ServiceItem | null;
  allClinics: ServiceItem[];
}

export function AIChat({ initialQuery = "", onSelectClinic, selectedClinic, allClinics }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick symptom suggestions
  const suggestions = [
    "Болит спина в пояснице",
    "Сильная головная боль",
    "Где сделать МРТ мозга?",
    "Анализ крови на витамины"
  ];

  // Helper to trigger assistant response
  const triggerBotResponse = useCallback((userText: string) => {
    const lowerText = userText.toLowerCase();
    let botText = "Я проанализировал симптомы. Для точной диагностики рекомендуется очная консультация специалиста. Вот медицинские центры в Шымкенте широкого профиля, где вы можете пройти обследование:";
    let recs: ServiceItem[] = [];

    if (lowerText.includes("спин") || lowerText.includes("поясн")) {
      botText = "По симптомам боли в спине рекомендуется сделать МРТ поясничного отдела позвоночника, чтобы исключить грыжи и протрузии. Вот лучшие предложения по МРТ в клиниках Шымкента:";
      recs = allClinics.filter(c => c.title.toLowerCase().includes("поясн") || c.title.toLowerCase().includes("мрт"));
    } else if (lowerText.includes("голов") || lowerText.includes("мозг")) {
      botText = "При частых головных болях рекомендуется провести обзорное МРТ головного мозга. Ниже приведены диагностические центры Шымкента с наиболее выгодными ценами:";
      recs = allClinics.filter(c => c.title.toLowerCase().includes("голов"));
    } else if (lowerText.includes("кров") || lowerText.includes("анализ")) {
      botText = "Для общей оценки состояния здоровья рекомендуется сдать клинический анализ крови. Вы можете сделать это в следующих лабораториях:";
      recs = allClinics.slice(0, 2);
    } else {
      recs = allClinics;
    }

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "bot",
          text: botText,
          recommendations: recs
        }
      ]);
    }, 1000);
  }, [allClinics]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: text
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal("");

    // Trigger AI reply
    triggerBotResponse(text);
  };

  // Simulate voice recording input
  const startVoiceSim = () => {
    if (isRecording) return;
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setInputVal("Сильная головная боль и головокружение");
    }, 2000);
  };

  // Handle initial query on mount
  useEffect(() => {
    if (initialQuery) {
      const userMsg: Message = {
        id: "initial-user",
        sender: "user",
        text: initialQuery
      };
      setMessages([userMsg]);
      triggerBotResponse(initialQuery);
    } else {
      // Welcome message
      setMessages([
        {
          id: "welcome",
          sender: "bot",
          text: "Здравствуйте! Я ваш интеллектуальный помощник MedServicePrice. Опишите ваши симптомы или то, что вас беспокоит, и я помогу подобрать нужные медицинские исследования и покажу клиники на карте Шымкента."
        }
      ]);
    }
  }, [initialQuery, triggerBotResponse]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto py-3 px-4 md:py-4 md:px-6 flex flex-col gap-3.5 no-scrollbar bg-zinc-50/50 dark:bg-zinc-950/20">
        {messages.map((msg) => {
          const isBot = msg.sender === "bot";
          return (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[85%] space-y-2 animate-fade-in shrink-0",
                isBot ? "self-start items-start" : "self-end items-end ml-auto"
              )}
            >
              {/* Message bubble */}
              <div
                className={cn(
                  "py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-heading leading-relaxed shadow-sm",
                  isBot
                    ? "bg-background border border-border text-foreground"
                    : "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                )}
              >
                {msg.text}
              </div>

              {/* Clinic recommendations inside bubble */}
              {isBot && msg.recommendations && msg.recommendations.length > 0 && (
                <div className="w-full space-y-2 pt-2 animate-fade-in">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 px-1">
                    Подобрано для вас:
                  </div>
                  <div className="space-y-2">
                    {msg.recommendations.map((clinic, idx) => {
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
        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions chips */}
      {messages.length <= 1 && (
        <div className="px-4 py-2 border-t border-border/40 bg-background/50 backdrop-blur-sm flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
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
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputVal);
          }}
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
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            type="text"
            placeholder={isRecording ? "Говорите..." : "Опишите ваши симптомы..."}
            className="flex-1 h-10 border border-border rounded-full px-4 text-xs sm:text-sm font-heading font-medium bg-background text-foreground outline-none focus:border-zinc-400 transition-colors"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="size-10 rounded-full bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:bg-secondary disabled:text-muted-foreground flex items-center justify-center cursor-pointer transition-colors outline-none shrink-0"
          >
            <FaPaperPlane className="size-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
