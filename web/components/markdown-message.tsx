"use client";

import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
  text: string;
  isStreaming?: boolean;
  className?: string;
}

export function MarkdownMessage({ text, isStreaming = false, className }: MarkdownMessageProps) {
  const [displayed, setDisplayed] = useState("");
  const displayedRef = useRef("");
  const targetRef = useRef(text);
  const animFrameRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const isTypingRef = useRef(false);
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    targetRef.current = text;

    // If target is shorter than displayed (reset), snap immediately
    if (text.length < displayedRef.current.length) {
      displayedRef.current = text;
      setDisplayed(text);
      setShowCursor(false);
      return;
    }

    // Already fully displayed — nothing to animate
    if (text === displayedRef.current) return;

    // Start animation loop if not already running
    if (isTypingRef.current) return;

    isTypingRef.current = true;
    setShowCursor(true);

    const CHARS_PER_FRAME = 3; // speed: characters animated per animation frame

    const tick = () => {
      const target = targetRef.current;
      const current = displayedRef.current;

      if (current.length >= target.length) {
        // Caught up — check if still streaming
        if (!isTypingRef.current) return;
        // Wait for more text
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const next = target.slice(0, current.length + CHARS_PER_FRAME);
      displayedRef.current = next;
      setDisplayed(next);

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      // cleanup only on unmount
    };
  }, [text]);

  // Stop cursor when streaming ends and we've caught up
  useEffect(() => {
    if (!isStreaming && displayed === text) {
      isTypingRef.current = false;
      setShowCursor(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
  }, [isStreaming, displayed, text]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isTypingRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-2 pl-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-2 pl-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          h1: ({ children }) => (
            <h1 className="text-base font-bold mb-2 mt-1">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold mb-1.5 mt-1">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-bold mb-1 mt-1">{children}</h3>
          ),
          code: ({ children, className: cls }) => {
            const isBlock = cls?.includes("language-");
            if (isBlock) {
              return (
                <pre className="bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-2 my-2 overflow-x-auto text-[10px]">
                  <code>{children}</code>
                </pre>
              );
            }
            return (
              <code className="bg-zinc-100 dark:bg-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono">
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-zinc-300 dark:border-zinc-600 pl-3 italic text-muted-foreground my-2">
              {children}
            </blockquote>
          ),
        }}
      >
        {displayed}
      </ReactMarkdown>

      {/* Blinking cursor shown while animating */}
      {showCursor && (
        <span className="inline-block w-[2px] h-[1em] bg-current ml-0.5 align-middle animate-[blink_0.8s_ease-in-out_infinite]" />
      )}
    </div>
  );
}
