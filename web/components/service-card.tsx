"use client";

import { useState } from "react";
import { ServiceItem } from "@/types/search";
import { Button } from "@/components/ui/Button";
import { FaStar, FaChevronRight, FaChartLine } from "react-icons/fa";
import { motion } from "motion/react";
import { PriceHistoryChart } from "@/components/price-history-chart";

interface ServiceCardProps {
  item: ServiceItem;
  index: number;
}

export function ServiceCard({ item, index }: ServiceCardProps) {
  const [showPriceHistory, setShowPriceHistory] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.35 }}
        className="p-6 rounded-[18px] blogs-card flex flex-col sm:flex-row sm:items-center justify-between gap-6"
      >
      {/* Left side: Structured Information */}
      <div className="space-y-3.5 flex-1 text-left">
        {/* Top Metadata Row */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground font-heading">
            {item.badge}
          </span>
          <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
            <FaStar className="size-2.5 fill-current" />
            <span>{item.rating}</span>
            <span className="text-muted-foreground/80 font-normal text-[9px] ml-0.5">
              (
              {item.reviewsCount.replace(" отзывов", "").replace(" отзыва", "")}
              )
            </span>
          </div>
          {item.workHours && (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>{item.workHours === "Круглосуточно" ? "Круглосуточно" : `до ${item.workHours.split("-")[1] || "21:00"}`}</span>
            </span>
          )}
        </div>

        {/* Content Hierarchy */}
        <div className="space-y-1.5">
          <h3 className="font-didact font-extrabold text-lg sm:text-xl text-foreground leading-tight tracking-tight">
            {item.title}
          </h3>
          <p className="font-didact text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            {item.clinic}
          </p>
        </div>

        {/* Location & Metro Block with high-end dot markers */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground pt-0.5">
          <span>{item.address}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
            <span className="font-heading font-bold text-foreground">
              {item.metro}
            </span>
          </span>
          <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span>{item.distance}</span>
        </div>
      </div>

      {/* Right side: Price and Action Button */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-between gap-4 shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-border/10 min-w-[150px]">
        <div className="text-left sm:text-right space-y-1">
          <div className="flex items-baseline gap-1.5 justify-start sm:justify-end">
            <span className="font-didact font-extrabold text-2xl text-foreground tracking-tight">
              {item.price}
            </span>
            <span className="text-xs text-muted-foreground line-through opacity-60">
              {item.oldPrice}
            </span>
          </div>
          {item.oldPrice && item.priceRaw && item.oldPriceRaw && item.oldPriceRaw > item.priceRaw && (
            <div className="text-[10px] text-green-600 font-bold bg-green-500/10 px-2 py-0.5 rounded-full w-fit sm:ml-auto">
              Скидка {Math.round((1 - item.priceRaw / item.oldPriceRaw) * 100)}%
            </div>
          )}
          
          {/* Price History Button */}
          {item.id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPriceHistory(true);
              }}
              className="flex items-center gap-1.5 text-[10px] text-accent hover:text-accent/80 font-heading font-semibold transition-colors mt-1 sm:ml-auto"
            >
              <FaChartLine className="size-2.5" />
              <span>История цен</span>
            </button>
          )}
        </div>

        <Button
          variant="primary"
          size="sm"
          className="shadow-[0_4px_12px_rgba(56,189,248,0.2)] hover:shadow-[0_6px_20px_rgba(56,189,248,0.35)] cursor-pointer"
        >
          <span>Записаться</span>
          <FaChevronRight className="size-2" />
        </Button>
      </div>
    </motion.div>

    {/* Price History Modal */}
    {showPriceHistory && item.id && (
      <PriceHistoryChart
        serviceId={item.id}
        serviceName={item.title}
        onClose={() => setShowPriceHistory(false)}
      />
    )}
    </>
  );
}
