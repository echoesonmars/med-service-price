"use client";

import { FaSortAmountDown, FaMapMarkerAlt, FaStar, FaClock } from "react-icons/fa";
import { cn } from "@/lib/utils";

interface SearchFiltersProps {
  activeFilter: string;
  onFilterChange: (id: string) => void;
}

export function SearchFilters({ activeFilter, onFilterChange }: SearchFiltersProps) {
  const filters = [
    { id: "all", label: "Все предложения", icon: null },
    { id: "cheap", label: "Сначала дешевые", icon: FaSortAmountDown },
    { id: "near", label: "Рядом со мной", icon: FaMapMarkerAlt },
    { id: "rating", label: "Рейтинг 4.5+", icon: FaStar },
    { id: "open", label: "Открыто сейчас", icon: FaClock },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1 w-full">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              "h-7 px-2.5 rounded-full text-[11px] font-heading font-semibold transition-all duration-300 flex items-center gap-1 cursor-pointer shrink-0 border outline-none",
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-[0_2px_8px_rgba(56,189,248,0.3)]"
                : "bg-background text-foreground border-border hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            {Icon && <Icon className="size-3" />}
            <span>{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
}
