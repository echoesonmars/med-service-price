"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { ServiceItem } from "@/types/search";

// Cookie helper
const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(";").shift() || "");
  return null;
};

interface ClinicMapProps {
  clinics: ServiceItem[];
  selectedClinic: ServiceItem | null;
  onSelectClinic: (clinic: ServiceItem | null) => void;
  userCoords: { lat: number; lng: number } | null;
}

export default function ClinicMap({
  clinics,
  selectedClinic,
  onSelectClinic,
  userCoords,
}: ClinicMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default center to Shymkent, Kazakhstan
    const defaultCenter: [number, number] = [42.32, 69.60];
    const defaultZoom = 12;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: false, // Disabled to place a custom styled zoom control
    });

    // Add CartoDB Positron tiles for a premium light-grey look
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 20,
      }
    ).addTo(map);

    // Add custom styled zoom control
    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(map);

    mapRef.current = map;
    markerGroupRef.current = L.layerGroup().addTo(map);

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update User Location Marker (Only if actual GPS, not the default center point)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const isActual = getCookie("med_user_location_name") === "Моя локация";

    if (userCoords && isActual) {
      const userIcon = L.divIcon({
        className: "user-location-marker",
        html: `
          <div class="relative flex items-center justify-center w-6 h-6">
            <div class="absolute inset-0 rounded-full bg-sky-400/30 animate-ping"></div>
            <div class="w-3.5 h-3.5 rounded-full bg-sky-400 border-2 border-white shadow-md relative z-10"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
      } else {
        userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], {
          icon: userIcon,
        }).addTo(map);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userCoords]);

  // Center/Pan Map on User Coordinates when GPS updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userCoords) return;

    const isActual = getCookie("med_user_location_name") === "Моя локация";
    if (isActual) {
      map.setView([userCoords.lat, userCoords.lng], 14, {
        animate: true,
        duration: 0.8,
      });
    }
  }, [userCoords]);

  // Update Clinic Markers
  useEffect(() => {
    const map = mapRef.current;
    const markerGroup = markerGroupRef.current;
    if (!map || !markerGroup) return;

    // Clear existing clinic markers
    markerGroup.clearLayers();
    markersRef.current = {};

    const bounds = L.latLngBounds([]);

    clinics.forEach((clinic) => {
      if (typeof clinic.lat !== "number" || typeof clinic.lng !== "number") return;

      const clinicKey = `${clinic.clinic}-${clinic.title}`;
      const isSelected =
        selectedClinic &&
        selectedClinic.clinic === clinic.clinic &&
        selectedClinic.title === clinic.title;

      // Custom marker icon showing the price
      const markerIcon = L.divIcon({
        className: "custom-price-marker",
        html: `
          <div class="flex items-center justify-center bg-white border ${
            isSelected
              ? "border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.5)] scale-110"
              : "border-black shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
          } rounded-lg px-2.5 py-1 text-[11px] font-didact font-bold text-black transition-all duration-300 hover:border-sky-400 hover:shadow-[0_0_15px_rgba(56,189,248,0.5)] hover:scale-105 cursor-pointer">
            ${clinic.price}
          </div>
        `,
        iconSize: [64, 26],
        iconAnchor: [32, 13],
      });

      const markerPopup = L.popup({
        offset: [0, -10],
        closeButton: true,
      }).setContent(`
        <div class="p-4 space-y-3 font-sans text-left">
          <div class="flex items-center justify-between">
            <span class="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-400/15 text-black font-heading">
              ${clinic.badge}
            </span>
            <div class="flex items-center gap-1 bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full text-[9px] font-bold">
              <span class="text-amber-500">★</span>
              <span>${clinic.rating}</span>
            </div>
          </div>

          <div class="space-y-1">
            <h4 class="font-didact font-extrabold text-sm text-black leading-tight">
              ${clinic.clinic}
            </h4>
            <p class="font-didact text-xs text-zinc-500 leading-snug">
              ${clinic.address}
            </p>
          </div>

          <div class="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <span class="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]"></span>
            <span class="font-heading font-bold text-black truncate max-w-[100px]">${clinic.metro}</span>
            <span class="w-1 h-1 rounded-full bg-zinc-300"></span>
            <span>${clinic.distance}</span>
          </div>

          <div class="h-[1px] bg-zinc-200/80 my-1"></div>

          <div class="flex items-center justify-between pt-1">
            <div class="flex items-baseline gap-1">
              <span class="font-didact font-extrabold text-lg text-black tracking-tight">
                ${clinic.price}
              </span>
              <span class="text-[10px] text-zinc-400 line-through">
                ${clinic.oldPrice}
              </span>
            </div>
            
            <button class="bg-black text-white border border-black text-[10px] py-1 px-3 rounded-lg hover:bg-sky-400 hover:text-black hover:border-sky-400 transition-all font-bold">
              Записаться
            </button>
          </div>
        </div>
      `);

      const marker = L.marker([clinic.lat, clinic.lng], {
        icon: markerIcon,
      })
        .bindPopup(markerPopup)
        .addTo(markerGroup);

      // Handle click events
      marker.on("click", () => {
        onSelectClinic(clinic);
      });

      markerPopup.on("remove", () => {
        // If popup is closed by user (not programmatically), reset selection
        setTimeout(() => {
          if (!mapRef.current?.openPopup) {
            onSelectClinic(null);
          }
        }, 100);
      });

      markersRef.current[clinicKey] = marker;
      bounds.extend([clinic.lat, clinic.lng]);
    });

    // Auto-fit bounds if we have markers
    if (clinics.length > 0) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
      });
    }
  }, [clinics, selectedClinic, onSelectClinic]);

  // Programmatically Open Popups
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedClinic) return;

    const clinicKey = `${selectedClinic.clinic}-${selectedClinic.title}`;
    const marker = markersRef.current[clinicKey];

    if (marker && (typeof selectedClinic.lat === "number" && typeof selectedClinic.lng === "number")) {
      map.panTo([selectedClinic.lat, selectedClinic.lng], {
        animate: true,
        duration: 0.5,
      });
      marker.openPopup();
    }
  }, [selectedClinic]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full relative z-0 border-l border-border"
      style={{ minHeight: "100%" }}
    />
  );
}
