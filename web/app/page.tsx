"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { SearchFilters } from "@/components/search-filters";
import { PopularCategories } from "@/components/popular-categories";
import { SearchSkeletons } from "@/components/search-skeletons";
import { ServiceCard } from "@/components/service-card";
import { ServiceItem, SearchResponse, CategoryCount } from "@/types/search";
import { FaArrowLeft, FaList, FaMap, FaColumns } from "react-icons/fa";
import { Header } from "@/components/header";
import { AIChat } from "@/components/ai-chat";
import { CompareTable } from "@/components/compare-table";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

// Cookie helper functions
const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2)
    return decodeURIComponent(parts.pop()?.split(";").shift() || "");
  return null;
};

const setCookie = (name: string, value: string, days = 365) => {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `; expires=${date.toUTCString()}`;
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
};

// Dynamically import map component to avoid SSR errors
const ClinicMap = dynamic(() => import("@/components/clinic-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-background border-l border-border">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
          <div className="absolute inset-0 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
        <span className="text-xs font-heading font-semibold text-muted-foreground">
          Загрузка интерактивной карты...
        </span>
      </div>
    </div>
  ),
});

const placeholders = [
  "МРТ головного мозга с контрастом",
  "УЗИ органов брюшной полости",
  "Прием врача-терапевта",
  "Клинический анализ крови с лейкоцитарной формулой",
  "Консультация врача-кардиолога",
  "Компьютерная томография (КТ) легких",
];

const aiPlaceholders = [
  "Опишите ваши симптомы (например, болит спина)...",
  "Сильная головная боль и головокружение",
  "Какого врача пройти при хронической усталости?",
  "Болит ухо и заложило нос",
];

export default function Home() {
  const [searchState, setSearchState] = useState<"idle" | "searching" | "done">(
    "idle",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<ServiceItem[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<ServiceItem | null>(
    null,
  );
  const [showMobileList, setShowMobileList] = useState(false);
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searchType, setSearchType] = useState("Мед услуги");
  const [activeMode, setActiveMode] = useState<"search" | "chat">("search");
  const [showCompare, setShowCompare] = useState(false);
  const [semanticSearch, setSemanticSearch] = useState(false);

  // Fetch services from API
  const fetchServices = useCallback(
    async (query: string, filter: string, category: string, useSemantic: boolean) => {
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (category && category !== "all") params.set("category", category);
        if (useSemantic) params.set("semantic", "true");

        // Map filter to sort parameter
        switch (filter) {
          case "price_asc":
            params.set("sortBy", "price_asc");
            break;
          case "price_desc":
            params.set("sortBy", "price_desc");
            break;
          case "rating":
            params.set("sortBy", "rating");
            break;
          default:
            params.set("sortBy", "relevance");
        }

        const response = await fetch(`/api/services?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch services");

        const data: SearchResponse = await response.json();

        // Calculate distances if user coords available
        const resultsWithDistance = data.results.map((item) => {
          if (userCoords && item.lat && item.lng) {
            const dist = calculateDistance(
              userCoords.lat,
              userCoords.lng,
              item.lat,
              item.lng,
            );
            return { ...item, distance: `${dist.toFixed(1)} км` };
          }
          return item;
        });

        setSearchResults(resultsWithDistance);
        setTotalResults(data.total);
        setCategories(data.categories);
      } catch (error) {
        console.error("Error fetching services:", error);
        setSearchResults([]);
        setTotalResults(0);
      }
    },
    [userCoords],
  );

  // Load search history, URL query parameters, and cached geolocation on mount
  useEffect(() => {
    let currentHistory: string[] = [];
    const saved = localStorage.getItem("med_search_history");
    if (saved) {
      try {
        currentHistory = JSON.parse(saved);
        setSearchHistory(currentHistory);
      } catch (e) {
        console.error("Failed to parse search history:", e);
      }
    }

    // Load cached coordinates from cookies (default to Shymkent if empty)
    const storedCoords = getCookie("med_user_coords");
    if (storedCoords) {
      try {
        setUserCoords(JSON.parse(storedCoords));
      } catch (e) {
        console.error("Failed to parse stored coordinates:", e);
      }
    } else {
      const defaultCoords = { lat: 42.32, lng: 69.6 };
      setUserCoords(defaultCoords);
      setCookie("med_user_coords", JSON.stringify(defaultCoords));
    }
  }, []);

  // Handle URL query parameter on mount (after coords are loaded)
  useEffect(() => {
    if (!userCoords) return;

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const query = params.get("q");
      if (query && searchState === "idle") {
        setSearchQuery(query);
        setSearchState("searching");

        const saved = localStorage.getItem("med_search_history");
        let currentHistory: string[] = [];
        if (saved) {
          try {
            currentHistory = JSON.parse(saved);
          } catch { /* ignore */ }
        }
        const filtered = currentHistory.filter((item) => item !== query);
        const updatedHistory = [query, ...filtered].slice(0, 8);
        setSearchHistory(updatedHistory);
        localStorage.setItem(
          "med_search_history",
          JSON.stringify(updatedHistory),
        );

        fetchServices(query, "all", "all", false).then(() => {
          setSearchState("done");
        });
      }
    }
  }, [userCoords, fetchServices, searchState]);

  // Listen to custom location update event
  useEffect(() => {
    const handleLocationUpdate = () => {
      const stored = getCookie("med_user_coords");
      if (stored) {
        try {
          setUserCoords(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse updated coordinates:", e);
        }
      }
    };

    window.addEventListener("med_location_updated", handleLocationUpdate);
    return () => {
      window.removeEventListener("med_location_updated", handleLocationUpdate);
    };
  }, []);

  const saveHistory = (newList: string[]) => {
    setSearchHistory(newList);
    localStorage.setItem("med_search_history", JSON.stringify(newList));
  };

  const triggerSearch = async (queryText: string) => {
    setSearchQuery(queryText);
    setSearchState("searching");

    // Add to history (deduplicate and keep max 8)
    const filtered = searchHistory.filter((item) => item !== queryText);
    const updatedHistory = [queryText, ...filtered].slice(0, 8);
    saveHistory(updatedHistory);

    if (searchType === "ИИ-Ассистент") {
      setActiveMode("chat");
      setSearchState("done");
    } else {
      setActiveMode("search");
      await fetchServices(queryText, activeFilter, activeCategory, semanticSearch);
      setSearchState("done");
    }

    // Sync URL query parameter without page reload
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("q", queryText);
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Re-fetch when filter, category, or semantic search changes
  useEffect(() => {
    if (searchState === "done" && activeMode === "search" && searchQuery) {
      fetchServices(searchQuery, activeFilter, activeCategory, semanticSearch);
    }
  }, [activeFilter, activeCategory, semanticSearch, searchState, activeMode, searchQuery, fetchServices]);

  const clearHistory = () => {
    saveHistory([]);
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
    setActiveCategory("all");
    setSearchResults([]);
    setTotalResults(0);
    setCategories([]);
    setSelectedClinic(null);
    setActiveMode("search");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("q");
      window.history.replaceState({}, "", url.toString());
    }
  };

  // RENDER SEARCH ACTIVE/DONE SPLIT-SCREEN LAYOUT
  if (searchState !== "idle") {
    return (
      <main className="w-full h-screen flex flex-col bg-background overflow-hidden relative select-none selection:bg-accent selection:text-accent-foreground pt-16">
        {/* Header Overlay */}
        <Header
          onSearchTrigger={triggerSearch}
          searchHistory={searchHistory}
          onClearHistory={clearHistory}
        />

        {/* Main Content Layout - Split Screen based on Golden Ratio */}
        <div className="flex-1 w-full h-full flex flex-row relative overflow-hidden">
          {/* Left Side: Sidebar with Clinics & Search */}
          <div
            className={cn(
              "w-full md:w-[38.2%] flex flex-col h-full bg-background relative z-10 transition-transform duration-300 md:translate-x-0 border-r border-border shrink-0",
              showMobileList
                ? "translate-x-0 absolute inset-0 md:relative"
                : "-translate-x-full absolute inset-0 md:relative hidden md:flex",
            )}
          >
            {activeMode === "chat" ? (
              <div className="flex flex-col h-full bg-background relative overflow-hidden">
                {/* Chat Header */}
                <div className="py-3 px-4 md:py-3.5 md:px-6 border-b border-border bg-background flex items-center gap-3">
                  <button
                    onClick={resetSearch}
                    className="size-11 rounded-full border border-border bg-background hover:bg-zinc-100 flex items-center justify-center text-foreground cursor-pointer transition-colors shadow-sm outline-none shrink-0"
                    title="Вернуться на главную"
                  >
                    <FaArrowLeft className="size-3.5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-heading font-bold text-foreground truncate">
                      ИИ-Ассистент
                    </h2>
                    <p className="text-[10px] text-muted-foreground font-heading truncate">
                      Диагностика симптомов и подбор исследований
                    </p>
                  </div>
                </div>

                {/* AI Chat container */}
                <div className="flex-1 min-h-0">
                  <AIChat
                    initialQuery={searchQuery}
                    onSelectClinic={(clinic) => {
                      setSelectedClinic(clinic);
                      if (showMobileList) {
                        setShowMobileList(false);
                      }
                    }}
                    selectedClinic={selectedClinic}
                    allClinics={searchResults}
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Search container in Sidebar */}
                <div className="p-4 md:p-6 border-b border-border bg-background space-y-4">
                  <div className="flex items-center gap-3 w-full">
                    <button
                      onClick={resetSearch}
                      className="size-11 rounded-full border border-border bg-background hover:bg-zinc-100 flex items-center justify-center text-foreground cursor-pointer transition-colors shadow-sm outline-none shrink-0"
                      title="Вернуться на главную"
                    >
                      <FaArrowLeft className="size-3.5" />
                    </button>
                    <div className="flex-1">
                      <PlaceholdersAndVanishInput
                        placeholders={
                          searchType === "ИИ-Ассистент"
                            ? aiPlaceholders
                            : placeholders
                        }
                        onChange={handleChange}
                        onSubmit={onSubmit}
                        value={searchQuery}
                        setValue={setSearchQuery}
                        selectedType={searchType}
                        onTypeChange={setSearchType}
                      />
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="w-full pt-1">
                    <SearchFilters
                      activeFilter={activeFilter}
                      onFilterChange={setActiveFilter}
                      activeCategory={activeCategory}
                      onCategoryChange={setActiveCategory}
                      categories={categories}
                      semanticSearch={semanticSearch}
                      onSemanticSearchChange={setSemanticSearch}
                    />
                  </div>
                </div>

                {/* Scrollable Results Container */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar bg-background">
                  <AnimatePresence mode="wait">
                    {searchState === "searching" ? (
                      <motion.div
                        key="loader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-4"
                      >
                        <SearchSkeletons query={searchQuery} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <div className="flex justify-between items-center text-xs text-muted-foreground font-heading font-semibold px-1">
                          <span>
                            Найдено предложений: {totalResults}
                          </span>
                          <div className="flex items-center gap-3">
                            {searchResults.length > 1 && (
                              <button
                                onClick={() => setShowCompare(true)}
                                className="flex items-center gap-1.5 text-accent hover:underline cursor-pointer"
                              >
                                <FaColumns className="text-xs" />
                                <span>Сравнить цены</span>
                              </button>
                            )}
                            {selectedClinic && (
                              <button
                                onClick={() => setSelectedClinic(null)}
                                className="text-accent hover:underline cursor-pointer"
                              >
                                Сбросить выбор
                              </button>
                            )}
                          </div>
                        </div>

                        {searchResults.length === 0 ? (
                          <div className="py-12 text-center text-sm text-muted-foreground font-heading">
                            Ничего не найдено по этому запросу. Попробуйте
                            изменить фильтры.
                          </div>
                        ) : (
                          searchResults.map((clinic, idx) => {
                            const isSelected =
                              selectedClinic &&
                              selectedClinic.clinic === clinic.clinic &&
                              selectedClinic.title === clinic.title;
                            return (
                              <div
                                key={clinic.id || idx}
                                onClick={() => {
                                  setSelectedClinic(clinic);
                                  if (showMobileList) {
                                    setShowMobileList(false);
                                  }
                                }}
                                className={cn(
                                  "cursor-pointer transition-all duration-300 rounded-xl",
                                  isSelected
                                    ? "ring-2 ring-sky-400/60 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                                    : "",
                                )}
                              >
                                <ServiceCard item={clinic} index={idx} />
                              </div>
                            );
                          })
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>

          {/* Right Side: Map Container */}
          <div className="flex-1 h-full relative z-0">
            {/* Inner edge fade matching page background */}
            <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_80px_50px_rgba(235,235,235,1)]" />
            <ClinicMap
              clinics={searchResults}
              selectedClinic={selectedClinic}
              onSelectClinic={setSelectedClinic}
              userCoords={userCoords}
            />
          </div>

          {/* Floating Mobile Toggle Button */}
          <button
            onClick={() => setShowMobileList(!showMobileList)}
            className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black text-white hover:bg-zinc-900 border border-black px-4 py-2.5 rounded-full text-xs font-heading font-bold shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-all cursor-pointer outline-none"
          >
            {showMobileList ? (
              <>
                <FaMap className="size-3.5" />
                <span>Показать карту</span>
              </>
            ) : (
              <>
                <FaList className="size-3.5" />
                <span>Показать список ({totalResults})</span>
              </>
            )}
          </button>
        </div>

        {/* Compare Table Modal */}
        {showCompare && searchResults.length > 0 && (
          <CompareTable
            services={searchResults}
            onClose={() => setShowCompare(false)}
          />
        )}
      </main>
    );
  }

  // RENDER LANDING PAGE IDLE STATE
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background relative overflow-hidden selection:bg-accent selection:text-accent-foreground">
      <Header
        onSearchTrigger={triggerSearch}
        searchHistory={searchHistory}
        onClearHistory={clearHistory}
      />
      {/* Decorative clean radial background gradients for high-end feel */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

      {/* Main interactive wrapper with motion layout */}
      <motion.div
        layout="position"
        transition={{ type: "spring", stiffness: 220, damping: 28 }}
        className="max-w-2xl w-full text-left space-y-5 relative z-10"
      >
        <div className="space-y-4">
          <h1
            style={{ fontFamily: "var(--font-didact-gothic), sans-serif" }}
            className="text-5xl md:text-6xl font-bold text-foreground tracking-tight"
          >
            Что нужно проверить?
          </h1>
          <p className="text-md md:text-lg text-muted-foreground leading-relaxed">
            Поиск реальных цен на медицинские услуги среди сотен клиник.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full">
          <div className="flex-1">
            <PlaceholdersAndVanishInput
              placeholders={
                searchType === "ИИ-Ассистент" ? aiPlaceholders : placeholders
              }
              onChange={handleChange}
              onSubmit={onSubmit}
              value={searchQuery}
              setValue={setSearchQuery}
              selectedType={searchType}
              onTypeChange={setSearchType}
            />
          </div>
        </div>

        <PopularCategories onSelect={triggerSearch} />
      </motion.div>
    </main>
  );
}

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
