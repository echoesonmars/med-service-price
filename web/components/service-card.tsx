"use client";

import { ServiceItem } from "@/types/search";
import { Button } from "@/components/ui/button";
import { FaStar } from "react-icons/fa";
import { motion } from "motion/react";

interface ServiceCardProps {
  item: ServiceItem;
  index: number;
}

export function ServiceCard({ item, index }: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className="p-5 rounded-2xl border border-border bg-background hover:shadow-[0_8px_24px_rgba(56,189,248,0.15)] transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground">
            {item.badge}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Открыто до 21:00
          </span>
        </div>

        <h3 className="font-heading font-bold text-base sm:text-lg text-foreground leading-tight text-left">
          {item.title}
        </h3>

        <p className="text-sm font-heading font-medium text-foreground/90 text-left">
          {item.clinic}
        </p>

        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-left">
          <span>{item.address}</span>
          <span className="opacity-40">•</span>
          <span className="text-accent font-semibold">{item.metro}</span>
          <span className="opacity-40">•</span>
          <span>{item.distance}</span>
        </p>

        <div className="flex items-center gap-2 pt-1 text-xs justify-start">
          <div className="flex items-center text-amber-500 gap-0.5">
            <FaStar className="size-3 fill-current" />
            <span className="font-bold text-foreground">{item.rating}</span>
          </div>
          <span className="text-muted-foreground">({item.reviewsCount})</span>
        </div>
      </div>

      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/10">
        <div className="text-left sm:text-right">
          <div className="flex items-baseline gap-1.5 justify-start sm:justify-end">
            <span className="font-heading font-extrabold text-xl sm:text-2xl text-foreground">
              {item.price}
            </span>
            <span className="text-xs text-muted-foreground line-through opacity-70">
              {item.oldPrice}
            </span>
          </div>
          <p className="text-[10px] text-green-500 font-semibold">Скидка 20% по записи онлайн</p>
        </div>

        <Button
          size="default"
          variant="outline"
          className="bg-background border-transparent shadow-[0_4px_12px_rgba(56,189,248,0.25)] hover:shadow-[0_6px_16px_rgba(56,189,248,0.35)] transition-all duration-300 font-heading font-semibold text-xs py-1.5 px-4 h-9 cursor-pointer"
        >
          Записаться
        </Button>
      </div>
    </motion.div>
  );
}
