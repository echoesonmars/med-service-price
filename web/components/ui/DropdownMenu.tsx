"use client";

import React, { useState, useRef, useEffect, ReactNode } from "react";

type DropdownMenuPosition =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end";

export interface DropdownMenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownMenuItem[];
  position?: DropdownMenuPosition;
  onSelect?: (key: string) => void;
  className?: string;
}

const positionStyles: Record<DropdownMenuPosition, string> = {
  "bottom-start": "top-full left-0 mt-2",
  "bottom-end": "top-full right-0 mt-2",
  "top-start": "bottom-full left-0 mb-2",
  "top-end": "bottom-full right-0 mb-2",
};

const enterFrom: Record<DropdownMenuPosition, string> = {
  "bottom-start": "-translate-y-1.5",
  "bottom-end": "-translate-y-1.5",
  "top-start": "translate-y-1.5",
  "top-end": "translate-y-1.5",
};

export function DropdownMenu({
  trigger,
  items,
  position = "bottom-end",
  onSelect,
  className = "",
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      );
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 180);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function handleSelect(item: DropdownMenuItem) {
    if (item.disabled) return;
    onSelect?.(item.key);
    setOpen(false);
  }

  return (
    <div ref={ref} className={["relative inline-flex", className].join(" ")}>
      <div onClick={() => setOpen((v) => !v)} className="cursor-pointer">
        {trigger}
      </div>
      {mounted && (
        <div
          className={[
            "absolute z-50 min-w-[180px] rounded-2xl p-1.5 overflow-hidden",
            "transition-all duration-200 ease-[cubic-bezier(0.34,1.4,0.64,1)]",
            visible
              ? "opacity-100 scale-100 translate-y-0"
              : ["opacity-0 scale-[0.96]", enterFrom[position]].join(" "),
            positionStyles[position],
          ].join(" ")}
          style={{
            background:
              "linear-gradient(180deg, rgba(253,253,253,1) 0%, rgba(248,248,248,1) 100%)",
            boxShadow:
              "0 4px 16px -4px rgba(17,17,17,0.12), 0 16px 40px -12px rgba(17,17,17,0.18), 0 0 0 1px rgba(17,17,17,0.06), inset 0 1px 0 rgba(255,255,255,0.95)",
          }}
        >
          <div className="bg-white rounded-xl py-1">
            {items.map((item) => {
              if (item.divider) {
                return (
                  <div
                    key={item.key}
                    className="h-px bg-neutral-100 my-1 mx-2"
                  />
                );
              }

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSelect(item)}
                  disabled={item.disabled}
                  className={[
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer",
                    item.disabled && "opacity-35 pointer-events-none",
                    item.danger
                      ? "text-red-600 hover:bg-red-50"
                      : "text-neutral-900 hover:bg-neutral-100",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {item.icon && (
                    <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-neutral-500">
                      {item.icon}
                    </span>
                  )}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.shortcut && (
                    <kbd
                      className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md text-[11px] font-semibold text-neutral-500 bg-neutral-100 border border-neutral-200/80"
                      style={{
                        boxShadow:
                          "0 1px 0 rgba(17,17,17,0.07), inset 0 1px 0 rgba(255,255,255,0.9)",
                      }}
                    >
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
