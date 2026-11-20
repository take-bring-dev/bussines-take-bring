"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

export type LiveMapMarker = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  sublabel?: string;
  recordedAt?: string;
};

type Props = {
  markers: LiveMapMarker[];
  trail?: Array<{ lat: number; lng: number }>;
  className?: string;
  height?: number | string;
};

/**
 * Leaflet + OSM tiles (free). Client-only — no Google billing.
 */
export function LiveMap({
  markers,
  trail = [],
  className,
  height = 320,
}: Props) {
  const mapId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{
    map: import("leaflet").Map;
    layer: import("leaflet").LayerGroup;
    L: typeof import("leaflet");
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!containerRef.current || mapRef.current) return;
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !containerRef.current) return;

      // Fix default marker icons under bundlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([51.16, 10.45], 6);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(map);

      const layer = L.layerGroup().addTo(map);
      mapRef.current = { map, layer, L };
    }

    void boot();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.map.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const ctx = mapRef.current;
    if (!ctx) return;
    const { map, layer, L } = ctx;
    layer.clearLayers();

    if (trail.length >= 2) {
      L.polyline(
        trail.map((p) => [p.lat, p.lng] as [number, number]),
        { color: "#556500", weight: 3, opacity: 0.75 },
      ).addTo(layer);
    }

    const bounds: [number, number][] = [];
    for (const m of markers) {
      if (!Number.isFinite(m.lat) || !Number.isFinite(m.lng)) continue;
      bounds.push([m.lat, m.lng]);
      const marker = L.marker([m.lat, m.lng]).addTo(layer);
      const when = m.recordedAt
        ? new Date(m.recordedAt).toLocaleString("de-DE")
        : "";
      marker.bindPopup(
        `<strong>${escapeHtml(m.label || "Driver")}</strong>` +
          (m.sublabel ? `<br/>${escapeHtml(m.sublabel)}` : "") +
          (when ? `<br/><span style="opacity:.7">${escapeHtml(when)}</span>` : ""),
      );
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 12);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
    }
  }, [markers, trail]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <div
        id={`live-map-${mapId}`}
        ref={containerRef}
        style={{ height, width: "100%" }}
        className="z-0"
      />
      {!markers.length ? (
        <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
          No live GPS points yet. Drivers need Traccar Client (or TBD open) with
          tracking enabled.
        </p>
      ) : null}
    </div>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
