"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FaPlus, FaChevronDown, FaPaperclip, FaImage, FaTimes } from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface Pixel {
  x: number;
  y: number;
  color: number[];
}

interface Particle {
  x: number;
  y: number;
  r: number;
  color: string;
}

export function PlaceholdersAndVanishInput({
  placeholders,
  onChange,
  onSubmit,
  value: controlledValue,
  setValue: setControlledValue,
}: {
  placeholders: string[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  value?: string;
  setValue?: (val: string) => void;
}) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [selectedType, setSelectedType] = useState("Мед услуги");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const types = ["Аптеки", "Лекарства", "Мед центры", "Врачи", "Мед услуги"];

  useEffect(() => {
    const startAnimation = () => {
      intervalRef.current = setInterval(() => {
        setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
      }, 3000);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible" && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else if (document.visibilityState === "visible") {
        startAnimation();
      }
    };

    startAnimation();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [placeholders]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const newDataRef = useRef<Particle[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [localValue, setLocalValue] = useState("");
  const value = controlledValue !== undefined ? controlledValue : localValue;
  const setValue = setControlledValue !== undefined ? setControlledValue : setLocalValue;
  const [animating, setAnimating] = useState(false);

  const draw = useCallback(() => {
    if (!inputRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 800;
    ctx.clearRect(0, 0, 800, 800);
    const computedStyles = getComputedStyle(inputRef.current);

    const fontSize = parseFloat(computedStyles.getPropertyValue("font-size"));
    ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;
    ctx.fillStyle = "#000";
    ctx.textAlign = "left";
    ctx.fillText(value, 8, 40);

    const imageData = ctx.getImageData(0, 0, 800, 800);
    const pixelData = imageData.data;
    const newData: Pixel[] = [];

    for (let t = 0; t < 800; t++) {
      const i = 4 * t * 800;
      for (let n = 0; n < 800; n++) {
        const e = i + 4 * n;
        if (pixelData[e + 3] > 0) {
          newData.push({
            x: n,
            y: t,
            color: [
              pixelData[e],
              pixelData[e + 1],
              pixelData[e + 2],
              pixelData[e + 3],
            ],
          });
        }
      }
    }

    newDataRef.current = newData.map(({ x, y, color }) => ({
      x,
      y,
      r: 1,
      color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`,
    }));
  }, [value]);

  useEffect(() => {
    draw();
  }, [value, draw]);

  const animate = (start: number) => {
    const animateFrame = (pos: number = 0) => {
      requestAnimationFrame(() => {
        const newArr: Particle[] = [];
        for (let i = 0; i < newDataRef.current.length; i++) {
          const current = newDataRef.current[i];
          if (current.x < pos) {
            newArr.push(current);
          } else {
            if (current.r <= 0) {
              current.r = 0;
              continue;
            }
            current.x += Math.random() > 0.5 ? 1 : -1;
            current.y += Math.random() > 0.5 ? 1 : -1;
            current.r -= 0.05 * Math.random();
            newArr.push(current);
          }
        }
        newDataRef.current = newArr;
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.clearRect(pos, 0, 800, 800);
          newDataRef.current.forEach((t) => {
            const { x: n, y: i, r: s, color: color } = t;
            if (n > pos) {
              ctx.beginPath();
              ctx.rect(n, i, s, s);
              ctx.fillStyle = color;
              ctx.strokeStyle = color;
              ctx.stroke();
            }
          });
        }
        if (newDataRef.current.length > 0) {
          animateFrame(pos - 8);
        } else {
          setValue("");
          setAnimating(false);
        }
      });
    };
    animateFrame(start);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !animating) {
      vanishAndSubmit();
    }
  };

  const vanishAndSubmit = () => {
    setAnimating(true);
    draw();

    const val = inputRef.current?.value || "";
    if (val && inputRef.current) {
      const maxX = newDataRef.current.reduce(
        (prev, current) => (current.x > prev ? current.x : prev),
        0
      );
      animate(maxX);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    vanishAndSubmit();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const clearAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  return (
    <form
      className={cn(
        "w-full relative max-w-2xl mx-auto bg-background border border-border h-12 rounded-full overflow-hidden shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.05)] transition-shadow duration-500 ease-in-out focus-within:shadow-[0_8px_16px_-6px_rgba(56,189,248,0.35)] flex items-center px-2 gap-2",
        value && "bg-background"
      )}
      onSubmit={handleSubmit}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        ref={photoInputRef}
        onChange={handlePhotoChange}
        className="hidden"
      />

      {/* Left controls */}
      <div className="flex items-center gap-1.5 shrink-0 z-50">
        {/* Dropdown 1: Plus button for files */}
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 w-8 rounded-full bg-secondary text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer outline-none shrink-0">
            <FaPlus className="size-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 cursor-pointer"
            >
              <FaPaperclip className="size-3.5 opacity-60" />
              <span>Закрепить файл</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => photoInputRef.current?.click()}
              className="flex items-center gap-2 cursor-pointer"
            >
              <FaImage className="size-3.5 opacity-60" />
              <span>Закрепить фото</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dropdown 2: Type selector */}
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 px-3 rounded-full bg-secondary text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center gap-1.5 text-xs font-heading font-semibold transition-colors cursor-pointer outline-none shrink-0">
            <span>{selectedType}</span>
            <FaChevronDown className="size-2.5 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {types.map((t) => (
              <DropdownMenuItem
                key={t}
                onClick={() => setSelectedType(t)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span>{t}</span>
                {selectedType === t && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Attached file pill */}
        {attachedFile && (
          <div className="h-8 pl-2.5 pr-1.5 rounded-full bg-accent/15 text-accent-foreground text-xs flex items-center gap-1.5 border border-accent/20 font-heading font-medium max-w-[140px] shrink-0">
            <span className="truncate">{attachedFile.name}</span>
            <button
              type="button"
              onClick={clearAttachedFile}
              className="w-5 h-5 rounded-full hover:bg-accent/20 flex items-center justify-center cursor-pointer outline-none shrink-0 text-current"
            >
              <FaTimes className="size-2.5" />
            </button>
          </div>
        )}
      </div>

      {/* Input container */}
      <div className="relative flex-1 h-full flex items-center min-w-0">
        <canvas
          className={cn(
            "absolute pointer-events-none text-base transform scale-50 top-[20%] left-0 origin-top-left pr-14",
            !animating ? "opacity-0" : "opacity-100"
          )}
          ref={canvasRef}
        />
        <input
          onChange={(e) => {
            if (!animating) {
              setValue(e.target.value);
              if (onChange) {
                onChange(e);
              }
            }
          }}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          value={value}
          type="text"
          className={cn(
            "w-full h-full bg-transparent border-none outline-none focus:ring-0 text-left font-heading font-medium text-sm sm:text-base text-foreground pl-1 pr-2",
            animating && "text-transparent"
          )}
        />
        <AnimatePresence mode="wait">
          {!value && (
            <motion.p
              initial={{
                y: 5,
                opacity: 0,
              }}
              key={`current-placeholder-${currentPlaceholder}`}
              animate={{
                y: 0,
                opacity: 1,
              }}
              exit={{
                y: -15,
                opacity: 0,
              }}
              transition={{
                duration: 0.3,
                ease: "linear",
              }}
              className="absolute left-1 text-sm sm:text-base font-normal text-muted-foreground text-left font-heading w-[calc(100%-1rem)] truncate pointer-events-none"
            >
              {placeholders[currentPlaceholder]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Search Submit button */}
      <div className="shrink-0 z-50">
        <button
          disabled={!value}
          type="submit"
          className="h-8 w-8 rounded-full disabled:bg-secondary disabled:text-muted-foreground bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition duration-200 flex items-center justify-center cursor-pointer outline-none"
        >
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-current"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <motion.path
              d="M5 12l14 0"
              initial={{
                strokeDasharray: "50%",
                strokeDashoffset: "50%",
              }}
              animate={{
                strokeDashoffset: value ? 0 : "50%",
              }}
              transition={{
                duration: 0.3,
                ease: "linear",
              }}
            />
            <path d="M13 18l6 -6" />
            <path d="M13 6l6 6" />
          </motion.svg>
        </button>
      </div>
    </form>
  );
}
