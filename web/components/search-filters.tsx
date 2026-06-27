"use client";

import { FaSortAmountDown, FaSortAmountUp, FaMapMarkerAlt, FaStar, FaClock, FaFilter } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { CategoryCount } from "@/types/search";

interface SearchFiltersProps {
  activeFilter: string;
  onFilterChange: (id: string) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categories: CategoryCount[];
}

export function SearchFilters({
  activeFilter,
  onFilterChange,
  activeCategory,
  onCategoryChange,
  categories,
}: SearchFiltersProps) {
  const sortFilters = [
    { id: "all", label: "Все", icon: null },
    { id: "price_asc", label: "Сначала дешевые", icon: FaSortAmountDown },
    { id: "price_desc", label: "Сначала дорогие", icon: FaSortAmountUp },
    { id: "rating", label: "По рейтингу", icon: FaStar },
  ];

  return (
    <div className="space-y-2">
      {/* Sort filters */}
      <div className="flex flex-wrap items-center gap-1.5 w-full">
        {sortFilters.map((filter) => {
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
                  : "bg-background text-foreground border-border hover:bg-zinc-100 dark:hover:bg-zinc-800",
              )}
            >
              {Icon && <Icon className="size-3" />}
              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 w-full">
          <span className="text-[10px] text-muted-foreground font-heading font-bold uppercase tracking-wider flex items-center gap-1">
            <FaFilter className="size-2.5" />
            Категории:
          </span>
          <button
            onClick={() => onCategoryChange("all")}
            className={cn(
              "h-6 px-2 rounded-full text-[10px] font-heading font-semibold transition-all duration-300 cursor-pointer shrink-0 border outline-none",
              activeCategory === "all"
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-background text-foreground border-border hover:bg-zinc-100",
            )}
          >
            Все
          </button>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              className={cn(
                "h-6 px-2 rounded-full text-[10px] font-heading font-semibold transition-all duration-300 cursor-pointer shrink-0 border outline-none",
                activeCategory === cat.value
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-background text-foreground border-border hover:bg-zinc-100",
              )}
            >
              {cat.label}
              <span className="ml-1 opacity-60">{cat.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
