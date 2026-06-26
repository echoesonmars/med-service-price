"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FaMapMarkerAlt, FaHistory, FaTrash } from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onSearchTrigger: (query: string) => void;
  searchHistory: string[];
  onClearHistory: () => void;
}

export function Header({ onSearchTrigger, searchHistory, onClearHistory }: HeaderProps) {
  const [geoState, setGeoState] = useState<"loading" | "granted" | "denied">("loading");

  const requestGeo = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoState("denied");
      return;
    }
    setGeoState("loading");

    if (navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((result) => {
          if (result.state === "denied") {
            // User explicitly blocked it in browser settings. Show guidance.
            alert("Разрешите доступ к геолокации в настройках вашего браузера (нажмите на значок замочка в адресной строке).");
            setGeoState("denied");
            return;
          }

          navigator.geolocation.getCurrentPosition(
            () => {
              setGeoState("granted");
            },
            (error) => {
              console.warn("Geolocation prompt failed:", error);
              // error.code 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
              if (error.code === 2 || error.code === 3) {
                // The user allowed permission, but hardware/OS couldn't fetch coordinates
                setGeoState("granted");
              } else {
                setGeoState("denied");
              }
            },
            { enableHighAccuracy: false, timeout: 5000, maximumAge: Infinity }
          );
        })
        .catch(() => {
          navigator.geolocation.getCurrentPosition(
            () => setGeoState("granted"),
            (error) => {
              if (error.code === 2 || error.code === 3) {
                setGeoState("granted");
              } else {
                setGeoState("denied");
              }
            },
            { enableHighAccuracy: false, timeout: 5000 }
          );
        });
    } else {
      navigator.geolocation.getCurrentPosition(
        () => setGeoState("granted"),
        (error) => {
          if (error.code === 2 || error.code === 3) {
            setGeoState("granted");
          } else {
            setGeoState("denied");
          }
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((result) => {
          if (result.state === "granted") {
            setGeoState("granted");
          } else if (result.state === "denied") {
            setGeoState("denied");
          } else {
            requestGeo();
          }

          result.onchange = () => {
            if (result.state === "granted") {
              setGeoState("granted");
            } else if (result.state === "denied") {
              setGeoState("denied");
            }
          };
        })
        .catch(() => {
          requestGeo();
        });
    } else {
      requestGeo();
    }
  }, []);

  return (
    <header className="w-full flex items-center justify-between py-4 px-6 absolute top-0 left-0 right-0 z-50">
      {/* Brand Logo in Didact Gothic */}
      <div 
        onClick={() => window.location.reload()}
        className="font-didact font-extrabold text-lg sm:text-xl text-foreground tracking-tight cursor-pointer select-none"
      >
        MedServicePrice
      </div>

      {/* Action Buttons: Geolocation & Search History */}
      <div className="flex items-center gap-2">
        {/* Geolocation Button */}
        <button
          onClick={requestGeo}
          className="size-9 rounded-full border border-border bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground flex items-center justify-center cursor-pointer transition-colors shadow-sm outline-none relative"
          title={
            geoState === "granted"
              ? "Геолокация активна"
              : geoState === "loading"
              ? "Определение геолокации..."
              : "Геолокация отключена. Нажмите для запроса разрешения"
          }
        >
          {geoState === "granted" ? (
            <FaMapMarkerAlt className="size-4 text-accent animate-pulse" />
          ) : geoState === "loading" ? (
            <div className="relative w-4 h-4">
              <div className="absolute inset-0 rounded-full border border-accent/20" />
              <div className="absolute inset-0 rounded-full border border-accent border-t-transparent animate-spin" />
            </div>
          ) : (
            // Custom crossed-out geolocation icon
            <div className="relative flex items-center justify-center">
              <FaMapMarkerAlt className="size-4 text-muted-foreground/40" />
              <span className="absolute w-5 h-[1.5px] bg-destructive rotate-45 rounded-full" />
            </div>
          )}
        </button>

        {/* Search History Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="size-9 rounded-full border border-border bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground flex items-center justify-center cursor-pointer transition-colors shadow-sm outline-none"
              title="История поиска"
            >
              <FaHistory className="size-3.5 text-foreground/75" />
            </button>
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
                      onClick={() => onSearchTrigger(query)}
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
