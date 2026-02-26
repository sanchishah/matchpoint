"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

interface SlotMapProps {
  slots: {
    id: string;
    club: { id: string; name: string; address: string; city: string; lat: number; lng: number };
    startTime: string;
    format: string;
    perPersonCents: number;
    spotsLeft: number;
  }[];
}

export default function SlotMap({ slots }: SlotMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamic import to avoid SSR issues
    import("leaflet").then((L) => {
      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Default center: South Bay Area
      const defaultCenter: [number, number] = [37.3861, -122.0839];
      const map = L.map(mapRef.current!, { scrollWheelZoom: true }).setView(defaultCenter, 11);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      mapInstanceRef.current = map;

      // Group slots by club
      const clubSlots = new Map<string, typeof slots>();
      for (const slot of slots) {
        const existing = clubSlots.get(slot.club.id) || [];
        existing.push(slot);
        clubSlots.set(slot.club.id, existing);
      }

      const bounds: [number, number][] = [];
      for (const [, clubSlotList] of clubSlots) {
        const club = clubSlotList[0].club;
        bounds.push([club.lat, club.lng]);

        const popupContent = `
          <div style="font-family: sans-serif; min-width: 160px;">
            <strong>${club.name}</strong><br/>
            <span style="color: #64748B; font-size: 12px;">${club.address}, ${club.city}</span><br/>
            <span style="color: #0B4F6C; font-size: 13px; font-weight: 500;">${clubSlotList.length} slot${clubSlotList.length !== 1 ? "s" : ""} available</span>
          </div>
        `;

        L.marker([club.lat, club.lng])
          .addTo(map)
          .bindPopup(popupContent);
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers when slots change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current!;

      // Remove existing markers
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      // Group slots by club
      const clubSlots = new Map<string, typeof slots>();
      for (const slot of slots) {
        const existing = clubSlots.get(slot.club.id) || [];
        existing.push(slot);
        clubSlots.set(slot.club.id, existing);
      }

      const bounds: [number, number][] = [];
      for (const [, clubSlotList] of clubSlots) {
        const club = clubSlotList[0].club;
        bounds.push([club.lat, club.lng]);

        const popupContent = `
          <div style="font-family: sans-serif; min-width: 160px;">
            <strong>${club.name}</strong><br/>
            <span style="color: #64748B; font-size: 12px;">${club.address}, ${club.city}</span><br/>
            <span style="color: #0B4F6C; font-size: 13px; font-weight: 500;">${clubSlotList.length} slot${clubSlotList.length !== 1 ? "s" : ""} available</span>
          </div>
        `;

        L.marker([club.lat, club.lng])
          .addTo(map)
          .bindPopup(popupContent);
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    });
  }, [slots]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div ref={mapRef} className="w-full h-[500px] rounded-xl border border-[#E2E8F0]" />
    </>
  );
}
