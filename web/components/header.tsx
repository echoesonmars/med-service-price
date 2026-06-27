"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaMapMarkerAlt, FaHistory, FaTrash } from "react-icons/fa";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
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

interface HeaderProps {
  onSearchTrigger?: (query: string) => void;
  searchHistory: string[];
  onClearHistory: () => void;
}

export function Header({
  onSearchTrigger,
  searchHistory,
  onClearHistory,
}: HeaderProps) {
  const [geoState, setGeoState] = useState<"loading" | "granted" | "denied">(
    "loading",
  );
  const [locationName, setLocationName] = useState("Шымкент");

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
          alert(
            "Разрешите доступ к геолокации в настройках вашего браузера (кликните по иконке настроек/замочка в адресной строке).",
          );
          setGeoState("denied");
        } else {
          // Hardware/Timeout fallback to Shymkent
          const defaultCoords = { lat: 42.32, lng: 69.6 };
          setGeoState("granted");
          setLocationName("Моя локация");
          setCookie("med_user_coords", JSON.stringify(defaultCoords));
          setCookie("med_user_location_name", "Моя локация");
          window.dispatchEvent(new Event("med_location_updated"));
        }
      },
      { enableHighAccuracy: true, timeout: 6000 },
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
      const defaultCoords = { lat: 42.32, lng: 69.6 };
      setLocationName("Шымкент");
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
            <FaMapMarkerAlt
              className={cn(
                "size-3.5 transition-colors",
                geoState === "granted"
                  ? "text-sky-400"
                  : "text-muted-foreground/50",
              )}
            />
          )}
        </button>

        {/* Search History Dropdown */}
        <DropdownMenu
          trigger={
            <div
              className="size-9 rounded-full border border-border bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground flex items-center justify-center cursor-pointer transition-colors shadow-sm"
              title="История поиска"
            >
              <FaHistory className="size-3.5 text-foreground/75" />
            </div>
          }
          items={
            searchHistory.length === 0
              ? [{ key: "empty", label: "История пуста", disabled: true }]
              : [
                  ...searchHistory.map((query, idx) => ({
                    key: `h:${idx}`,
                    label: query,
                    icon: <FaHistory className="size-3" />,
                  })),
                  { key: "d:", label: "", divider: true as const },
                  {
                    key: "c:",
                    label: "Очистить историю",
                    danger: true,
                    icon: <FaTrash className="size-2.5" />,
                  },
                ]
          }
          onSelect={(key) => {
            if (key === "c:") {
              onClearHistory();
            } else if (key.startsWith("h:")) {
              const idx = parseInt(key.slice(2));
              onSearchTrigger?.(searchHistory[idx]);
            }
          }}
          position="bottom-end"
        />
      </div>
    </header>
  );
}
