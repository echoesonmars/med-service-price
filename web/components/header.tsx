"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaMapMarkerAlt, FaHistory, FaTrash } from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Cookie helper functions
const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(";").shift() || "");
  return null;
};

const setCookie = (name: string, value: string, days = 365) => {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `; expires=${date.toUTCString()}`;
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
};

interface HeaderProps {
  onSearchTrigger?: (query: string) => void;
  searchHistory: string[];
  onClearHistory: () => void;
}

export function Header({ onSearchTrigger, searchHistory, onClearHistory }: HeaderProps) {
  const [geoState, setGeoState] = useState<"loading" | "granted" | "denied">("loading");
  const [locationName, setLocationName] = useState("Моя локация");

  const requestGeo = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoState("denied");
      return;
    }
    setGeoState("loading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setGeoState("granted");
        const formatted = `${newCoords.lat.toFixed(4)}, ${newCoords.lng.toFixed(4)}`;
        setLocationName(formatted);
        setCookie("med_user_coords", JSON.stringify(newCoords));
        setCookie("med_user_location_name", "Моя локация");
        
        // Dispatch custom event to notify app/page.tsx
        window.dispatchEvent(new Event("med_location_updated"));
      },
      (error) => {
        console.warn("Geolocation prompt failed:", error);
        if (error.code === 1) {
          alert("Разрешите доступ к геолокации в настройках вашего браузера (кликните по иконке настроек/замочка в адресной строке).");
          setGeoState("denied");
        } else {
          // Hardware/Timeout fallback to Shymkent
          const defaultCoords = { lat: 42.32, lng: 69.60 };
          setGeoState("granted");
          setLocationName("Моя локация");
          setCookie("med_user_coords", JSON.stringify(defaultCoords));
          setCookie("med_user_location_name", "Моя локация");
          window.dispatchEvent(new Event("med_location_updated"));
        }
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load saved location name and coordinates from cookies
    const savedName = getCookie("med_user_location_name");
    const savedCoords = getCookie("med_user_coords");

    if (savedName && savedCoords) {
      if (savedName === "Моя локация") {
        try {
          const { lat, lng } = JSON.parse(savedCoords);
          setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } catch {
          setLocationName(savedName);
        }
      } else {
        setLocationName(savedName);
      }
      setGeoState("granted");
    } else {
      // Default to Shymkent, Kazakhstan initially without prompting browser Geolocation popup
      const defaultCoords = { lat: 42.32, lng: 69.60 };
      setLocationName("Моя локация");
      setGeoState("granted");
      setCookie("med_user_coords", JSON.stringify(defaultCoords));
      setCookie("med_user_location_name", "Моя локация");
      // Fire event to ensure page state aligns
      window.dispatchEvent(new Event("med_location_updated"));
    }

    // Listen to external updates to location (e.g. if updated elsewhere)
    const handleLocationUpdate = () => {
      const updatedName = getCookie("med_user_location_name") || "Моя локация";
      if (updatedName === "Моя локация") {
        const coords = getCookie("med_user_coords");
        if (coords) {
          try {
            const { lat, lng } = JSON.parse(coords);
            setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          } catch {
            setLocationName(updatedName);
          }
        }
      } else {
        setLocationName(updatedName);
      }
    };

    window.addEventListener("med_location_updated", handleLocationUpdate);
    return () => {
      window.removeEventListener("med_location_updated", handleLocationUpdate);
    };
  }, []);

  return (
    <header className="w-full h-16 flex items-center justify-between px-6 absolute top-0 left-0 right-0 z-50">
      {/* Brand Logo */}
      <Link 
        href="/"
        className="h-9 flex items-center font-didact font-extrabold text-lg sm:text-xl text-foreground tracking-tight cursor-pointer select-none leading-none"
      >
        MedServicePrice
      </Link>

      {/* Action Buttons: Location indicator, Geolocation trigger & Search History */}
      <div className="h-9 flex items-center gap-2">
        {/* Active Location Pill */}
        <div className="h-9 flex items-center gap-1.5 px-4 rounded-full border border-border bg-background text-[11px] font-heading font-bold text-foreground shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{locationName}</span>
        </div>

        {/* Geolocation Request Button */}
        <button
          onClick={requestGeo}
          className="size-9 rounded-full border border-border bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground flex items-center justify-center cursor-pointer transition-colors shadow-sm outline-none relative animate-fade-in"
          title="Обновить геолокацию через GPS"
        >
          {geoState === "loading" ? (
            <div className="relative w-4 h-4">
              <div className="absolute inset-0 rounded-full border border-accent/20" />
              <div className="absolute inset-0 rounded-full border border-accent border-t-transparent animate-spin" />
            </div>
          ) : (
            <FaMapMarkerAlt className={cn(
              "size-3.5 transition-colors",
              geoState === "granted" ? "text-sky-400" : "text-muted-foreground/50"
            )} />
          )}
        </button>

        {/* Search History Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="size-9 rounded-full border border-border bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground flex items-center justify-center cursor-pointer transition-colors shadow-sm outline-none"
            title="История поиска"
          >
            <FaHistory className="size-3.5 text-foreground/75" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 bg-background border border-border rounded-xl shadow-lg p-1.5 z-[100]">
            <div className="px-2 py-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-heading">
              История поиска
            </div>
            <DropdownMenuSeparator className="my-1 bg-border/10" />

            {searchHistory.length === 0 ? (
              <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                История пуста
              </div>
            ) : (
              <>
                <div className="max-h-48 overflow-y-auto no-scrollbar space-y-0.5">
                  {searchHistory.map((query, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => onSearchTrigger?.(query)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-secondary cursor-pointer transition-colors outline-none"
                    >
                      <FaHistory className="size-3 text-muted-foreground shrink-0" />
                      <span className="truncate text-foreground">{query}</span>
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator className="my-1 bg-border/10" />
                <DropdownMenuItem
                  onClick={onClearHistory}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-destructive hover:bg-destructive/10 cursor-pointer transition-colors outline-none w-full"
                >
                  <FaTrash className="size-2.5" />
                  <span>Очистить историю</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
