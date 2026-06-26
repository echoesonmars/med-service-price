"use client";

import { Button } from "@/components/ui/button";
import { FaStethoscope, FaHeartbeat, FaMicroscope } from "react-icons/fa";

interface PopularCategoriesProps {
  onSelect: (category: string) => void;
}

export function PopularCategories({ onSelect }: PopularCategoriesProps) {
  return (
    <div className="space-y-3 pt-4 text-left">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Популярные исследования
      </p>
      <div className="flex flex-wrap justify-start gap-3">
        <Button
          onClick={() => onSelect("Прием врача-терапевта")}
          variant="outline"
          className="flex items-center gap-2 bg-background border-transparent shadow-[0_2px_8px_rgba(56,189,248,0.25)] hover:shadow-[0_4px_12px_rgba(56,189,248,0.35)] transition-shadow duration-300 cursor-pointer"
        >
          <FaStethoscope className="text-accent" />
          <span>Терапия</span>
        </Button>
        <Button
          onClick={() => onSelect("Консультация врача-кардиолога")}
          variant="outline"
          className="flex items-center gap-2 bg-background border-transparent shadow-[0_2px_8px_rgba(56,189,248,0.25)] hover:shadow-[0_4px_12px_rgba(56,189,248,0.35)] transition-shadow duration-300 cursor-pointer"
        >
          <FaHeartbeat className="text-accent" />
          <span>Кардиология</span>
        </Button>
        <Button
          onClick={() => onSelect("Клинический анализ крови с лейкоцитарной формулой")}
          variant="outline"
          className="flex items-center gap-2 bg-background border-transparent shadow-[0_2px_8px_rgba(56,189,248,0.25)] hover:shadow-[0_4px_12px_rgba(56,189,248,0.35)] transition-shadow duration-300 cursor-pointer"
        >
          <FaMicroscope className="text-accent" />
          <span>Анализы</span>
        </Button>
      </div>
    </div>
  );
}
