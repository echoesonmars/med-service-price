"use client";

import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { SearchFilters } from "@/components/search-filters";
import { PopularCategories } from "@/components/popular-categories";
import { SearchSkeletons } from "@/components/search-skeletons";
import { ServiceCard } from "@/components/service-card";
import { ServiceItem } from "@/types/search";
import { FaArrowLeft } from "react-icons/fa";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export default function Home() {
  const placeholders = [
    "МРТ головного мозга с контрастом",
    "УЗИ органов брюшной полости",
    "Прием врача-терапевта",
    "Клинический анализ крови с лейкоцитарной формулой",
    "Консультация врача-кардиолога",
    "Компьютерная томография (КТ) легких"
  ];

  const mockResults: ServiceItem[] = [
    {
      title: "МРТ головного мозга с контрастированием",
      price: "8 400 ₽",
      oldPrice: "10 500 ₽",
      clinic: "Клиника «Медика Сити»",
      address: "ул. Ленина, д. 45",
      metro: "Петроградская",
      distance: "1.2 км",
      rating: "4.8",
      reviewsCount: "142 отзыва",
      badge: "Мед услуги",
    },
    {
      title: "МРТ головного мозга (обзорное)",
      price: "4 200 ₽",
      oldPrice: "5 500 ₽",
      clinic: "Медицинский центр «Скандинавия»",
      address: "пр. Мира, д. 12",
      metro: "Проспект Мира",
      distance: "0.8 км",
      rating: "4.9",
      reviewsCount: "89 отзывов",
      badge: "Мед услуги",
    },
    {
      title: "МРТ головного мозга + сосуды",
      price: "11 000 ₽",
      oldPrice: "13 200 ₽",
      clinic: "Центр диагностики «Энерго»",
      address: "Киевская ул., д. 8",
      metro: "Фрунзенская",
      distance: "2.4 км",
      rating: "4.7",
      reviewsCount: "216 отзывов",
      badge: "Мед услуги",
    },
  ];

  const [searchState, setSearchState] = useState<"idle" | "searching" | "done">("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const triggerSearch = (queryText: string) => {
    setSearchQuery(queryText);
    setSearchState("searching");

    // Simulate search results loading for 2.5 seconds
    setTimeout(() => {
      setSearchState("done");
    }, 2500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery) return;
    triggerSearch(searchQuery);
  };

  const resetSearch = () => {
    setSearchQuery("");
    setSearchState("idle");
    setActiveFilter("all");
  };

  return (
    <main
      className={cn(
        "flex min-h-screen flex-col items-center p-6 bg-background relative overflow-hidden selection:bg-accent selection:text-accent-foreground",
        searchState === "idle" ? "justify-center" : "justify-start pt-12 sm:pt-16"
      )}
    >
      {/* Decorative clean radial background gradients for high-end feel */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

      {/* Main interactive wrapper with motion layout */}
      <motion.div
        layout="position"
        transition={{ type: "spring", stiffness: 220, damping: 28 }}
        className="max-w-2xl w-full text-left space-y-5 relative z-10"
      >
        {/* Title and subtitle section (Animate out when searching) */}
        <AnimatePresence>
          {searchState === "idle" && (
            <motion.div
              initial={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0, marginBottom: -16, overflow: "hidden" }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="space-y-4"
            >
              <h1
                style={{ fontFamily: "var(--font-didact-gothic), sans-serif" }}
                className="text-5xl md:text-6xl font-bold text-foreground tracking-tight"
              >
                Что нужно проверить?
              </h1>
              <p className="text-md md:text-lg text-muted-foreground leading-relaxed">
                Поиск реальных цен на медицинские услуги среди сотен клиник.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input container row (Input + Back Button when active) */}
        <motion.div layout className="flex items-center gap-3 w-full">
          <AnimatePresence mode="popLayout">
            {searchState !== "idle" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="shrink-0"
              >
                <button
                  onClick={resetSearch}
                  className="h-12 w-12 rounded-full border border-border bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground flex items-center justify-center cursor-pointer transition-colors shadow-sm outline-none"
                >
                  <FaArrowLeft className="size-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex-1">
            <PlaceholdersAndVanishInput
              placeholders={placeholders}
              onChange={handleChange}
              onSubmit={onSubmit}
              value={searchQuery}
              setValue={setSearchQuery}
            />
          </div>
        </motion.div>

        {/* Filter Pills (Visible when active) */}
        <AnimatePresence>
          {searchState !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="w-full"
            >
              <SearchFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Popular categories layout (Animate out when searching) */}
        <AnimatePresence>
          {searchState === "idle" && (
            <motion.div
              initial={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0, marginTop: -12, overflow: "hidden" }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="w-full"
            >
              <PopularCategories onSelect={triggerSearch} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Results & Loader section */}
        <AnimatePresence mode="wait">
          {searchState !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="space-y-6 pt-2 w-full"
            >
              {searchState === "searching" && (
                <SearchSkeletons query={searchQuery} />
              )}

              {searchState === "done" && (
                <div className="space-y-4">
                  <div className="space-y-4">
                    {mockResults.map((item, idx) => (
                      <ServiceCard key={idx} item={item} index={idx} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
