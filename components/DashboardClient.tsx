"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Site, Gardien } from "@/lib/data";
import { haversineKm } from "@/lib/geo";
import SiteDetails from "./SiteDetails";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-slate-100 text-slate-500">
      Chargement de la carte…
    </div>
  ),
});

export const RADIUS_KM = 3;

export default function DashboardClient({
  sites,
  initialGardiens,
}: {
  sites: Site[];
  initialGardiens: Gardien[];
}) {
  const [gardiens, setGardiens] = useState<Gardien[]>(initialGardiens);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Simulation temps réel: léger déplacement des gardiens en service toutes les 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setGardiens((prev) =>
        prev.map((g) => {
          if (g.status !== "en_service") return g;
          const jitter = 0.0003; // ~30 m
          return {
            ...g,
            lat: g.lat + (Math.random() - 0.5) * jitter,
            lng: g.lng + (Math.random() - 0.5) * jitter,
          };
        }),
      );
      setLastUpdate(new Date());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const selectedSite = useMemo(
    () => sites.find((s) => s.id === selectedSiteId) ?? null,
    [sites, selectedSiteId],
  );

  const gardiensInRadius = useMemo(() => {
    if (!selectedSite) return [];
    return gardiens
      .map((g) => ({
        ...g,
        distanceKm: haversineKm(
          { lat: selectedSite.lat, lng: selectedSite.lng },
          { lat: g.lat, lng: g.lng },
        ),
      }))
      .filter((g) => g.distanceKm <= RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [gardiens, selectedSite]);

  return (
    <div className="flex h-full">
      <div className="flex-1 relative">
        <MapView
          sites={sites}
          gardiens={gardiens}
          selectedSite={selectedSite}
          radiusKm={RADIUS_KM}
          onSelectSite={(id) => setSelectedSiteId(id)}
        />
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur rounded-lg shadow-md px-3 py-2 text-xs z-[500]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse" />
            <span className="font-medium">Temps réel</span>
            <span className="text-slate-500">
              · MAJ {lastUpdate.toLocaleTimeString("fr-FR")}
            </span>
          </div>
          <div className="text-slate-500 mt-1">
            {sites.length} sites · {gardiens.length} gardiens
          </div>
        </div>
      </div>

      <aside className="w-[380px] border-l border-slate-200 bg-white overflow-y-auto shadow-xl">
        <SiteDetails
          site={selectedSite}
          gardiens={gardiensInRadius}
          radiusKm={RADIUS_KM}
          allSites={sites}
          onSelectSite={(id) => setSelectedSiteId(id)}
          onClose={() => setSelectedSiteId(null)}
        />
      </aside>
    </div>
  );
}
