"use client";

import React, { useState, useRef, useCallback } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  fullWidth?: boolean;
}

const shellConfig: Record<
  string,
  {
    bg: string;
    innerBg: string;
    fill: string;
    shadow: string;
    hoverShadow: string;
    pressedShadow: string;
    gradient: string;
  }
> = {
  primary: {
    bg: "bg-neutral-900 border border-neutral-700/40",
    innerBg: "bg-neutral-800 text-white",
    fill: "bg-white/[0.08]",
    shadow:
      "0 1px 3px rgba(0,0,0,0.35), 0 4px 12px -3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
    hoverShadow:
      "0 2px 8px rgba(0,0,0,0.45), 0 8px 24px -4px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.09)",
    pressedShadow:
      "0 0 2px rgba(0,0,0,0.3), 0 1px 3px -1px rgba(0,0,0,0.2), inset 0 2px 4px rgba(0,0,0,0.15)",
    gradient:
      "linear-gradient(to bottom, rgba(255,255,255,0.07) 0%, transparent 40%, rgba(0,0,0,0.1) 100%)",
  },
  secondary: {
    bg: "bg-neutral-100/80 border border-neutral-200/70",
    innerBg: "bg-white text-neutral-800",
    fill: "bg-neutral-900/[0.03]",
    shadow:
      "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px -3px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
    hoverShadow:
      "0 2px 8px rgba(0,0,0,0.1), 0 8px 24px -4px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)",
    pressedShadow:
      "0 0 2px rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04), inset 0 2px 4px rgba(0,0,0,0.03)",
    gradient:
      "linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, transparent 40%, rgba(0,0,0,0.015) 100%)",
  },
  outline: {
    bg: "bg-neutral-50/50 border border-neutral-200/70",
    innerBg: "bg-white text-neutral-700",
    fill: "bg-neutral-900/[0.03]",
    shadow:
      "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px -3px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
    hoverShadow:
      "0 2px 8px rgba(0,0,0,0.1), 0 8px 24px -4px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)",
    pressedShadow:
      "0 0 2px rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04), inset 0 2px 4px rgba(0,0,0,0.03)",
    gradient:
      "linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, transparent 40%, rgba(0,0,0,0.015) 100%)",
  },
};

const flatConfig: Record<
  ButtonVariant,
  {
    bg: string;
    fill: string;
    shadow: string;
    hoverShadow: string;
    pressedShadow: string;
    gradient: string;
  }
> = {
  primary: {
    bg: "bg-neutral-900 text-white border border-transparent",
    fill: "bg-white/[0.13]",
    shadow:
      "0 1px 3px rgba(0,0,0,0.35), 0 4px 12px -3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
    hoverShadow:
      "0 2px 8px rgba(0,0,0,0.45), 0 8px 24px -4px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.09)",
    pressedShadow:
      "0 0 2px rgba(0,0,0,0.3), 0 1px 3px -1px rgba(0,0,0,0.2), inset 0 2px 4px rgba(0,0,0,0.15)",
    gradient:
      "linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, transparent 40%, rgba(0,0,0,0.12) 100%)",
  },
  secondary: {
    bg: "bg-neutral-50 text-neutral-800 border border-neutral-200/60",
    fill: "bg-neutral-900/[0.04]",
    shadow:
      "0 1px 2px rgba(0,0,0,0.06), 0 3px 8px -2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)",
    hoverShadow:
      "0 2px 6px rgba(0,0,0,0.08), 0 6px 16px -3px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)",
    pressedShadow:
      "0 0 1px rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.04), inset 0 2px 3px rgba(0,0,0,0.03)",
    gradient:
      "linear-gradient(to bottom, rgba(255,255,255,0.6) 0%, transparent 40%, rgba(0,0,0,0.01) 100%)",
  },
  ghost: {
    bg: "bg-transparent text-neutral-500 border border-transparent",
    fill: "bg-neutral-900/[0.06]",
    shadow: "none",
    hoverShadow: "0 1px 4px rgba(0,0,0,0.04)",
    pressedShadow: "inset 0 1px 3px rgba(0,0,0,0.06)",
    gradient: "none",
  },
  outline: {
    bg: "bg-transparent text-neutral-700 border border-neutral-200/60",
    fill: "bg-neutral-50",
    shadow:
      "0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.7)",
    hoverShadow:
      "0 2px 6px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.85)",
    pressedShadow:
      "0 0 1px rgba(0,0,0,0.04), inset 0 2px 3px rgba(0,0,0,0.04)",
    gradient:
      "linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, transparent 50%)",
  },
};

const innerPadding: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-[13px]",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3 text-[15px]",
  icon: "w-7 h-7 p-0 text-[13px]",
};

const flatSizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2.5 text-[13px] rounded-lg",
  md: "px-5 py-3 text-sm rounded-lg",
  lg: "px-7 py-3.5 text-[15px] rounded-lg",
  icon: "w-8 h-8 p-0 rounded-lg text-[13px]",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  disabled,
  onClick,
  style,
  ...rest
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPressed(true);
  }, []);

  const handlePointerUp = useCallback(() => {
    timerRef.current = setTimeout(() => setPressed(false), 150);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setHovered(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPressed(false), 150);
  }, []);

  const layered = variant !== "ghost" && size !== "icon";

  const content = (
    <span className="relative z-10 inline-flex items-center gap-1.5">
      {children}
    </span>
  );

  if (layered) {
    const cfg = shellConfig[variant];
    const currentShadow = pressed
      ? cfg.pressedShadow
      : hovered
        ? cfg.hoverShadow
        : cfg.shadow;

    return (
      <button
        className={[
          "group/btn relative inline-flex cursor-pointer select-none whitespace-nowrap",
          cfg.bg,
          "rounded-xl p-[3px]",
          pressed ? "scale-[0.975]" : "",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
          "disabled:opacity-40 disabled:pointer-events-none",
          fullWidth ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          boxShadow: currentShadow,
          transition:
            "transform 200ms ease-out, box-shadow 200ms ease-out",
          ...style,
        }}
        disabled={disabled}
        onClick={onClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerUp}
        onPointerEnter={() => setHovered(true)}
        {...rest}
      >
        <span
          className={[
            "relative overflow-hidden flex items-center justify-center gap-1.5 font-medium w-full rounded-lg",
            cfg.innerBg,
            innerPadding[size],
          ].join(" ")}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-lg"
            style={{ background: cfg.gradient }}
          />
          <span
            aria-hidden="true"
            className={[
              "pointer-events-none absolute inset-0 origin-bottom transition-transform duration-300 ease-out",
              pressed
                ? "scale-y-100"
                : "scale-y-0 group-hover/btn:scale-y-100",
              cfg.fill,
            ].join(" ")}
          />
          {content}
        </span>
      </button>
    );
  }

  const cfg = flatConfig[variant];
  const currentShadow = pressed
    ? cfg.pressedShadow
    : hovered
      ? cfg.hoverShadow
      : cfg.shadow;
  const hasGradient = cfg.gradient !== "none";

  return (
    <button
      className={[
        "group/btn relative overflow-hidden inline-flex items-center justify-center gap-1.5 font-medium cursor-pointer select-none whitespace-nowrap",
        pressed ? "scale-[0.975]" : "",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
        "disabled:opacity-40 disabled:pointer-events-none",
        cfg.bg,
        flatSizeStyles[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        boxShadow: currentShadow,
        transition:
          "transform 200ms ease-out, box-shadow 200ms ease-out",
        ...style,
      }}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerUp}
      onPointerEnter={() => setHovered(true)}
      {...rest}
    >
      {hasGradient && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-lg"
          style={{ background: cfg.gradient }}
        />
      )}
      <span
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-0 origin-bottom transition-transform duration-300 ease-out",
          pressed ? "scale-y-100" : "scale-y-0 group-hover/btn:scale-y-100",
          cfg.fill,
        ].join(" ")}
      />
      {content}
    </button>
  );
}
