"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Site, Gardien } from "@/lib/data";
import { haversineKm } from "@/lib/geo";
import SitePanel from "./SitePanel";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-slate-100 text-slate-500">
      Chargement de la carte…
    </div>
  ),
});

export const RADIUS_KM = 3;

export type GardienWithDistance = Gardien & { distanceKm: number };
export type ViewMode = "radius" | "all";

export default function DashboardClient({
  sites,
  initialGardiens,
}: {
  sites: Site[];
  initialGardiens: Gardien[];
}) {
  const [gardiens] = useState<Gardien[]>(initialGardiens);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedGardienId, setSelectedGardienId] = useState<string | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("radius");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const selectedSite = useMemo(
    () => sites.find((s) => s.id === selectedSiteId) ?? null,
    [sites, selectedSiteId],
  );

  const gardiensWithDistance: GardienWithDistance[] = useMemo(() => {
    if (!selectedSite) {
      return gardiens.map((g) => ({ ...g, distanceKm: 0 }));
    }
    return gardiens.map((g) => ({
      ...g,
      distanceKm: haversineKm(
        { lat: selectedSite.lat, lng: selectedSite.lng },
        { lat: g.lat, lng: g.lng },
      ),
    }));
  }, [gardiens, selectedSite]);

  const assignedGardiens = useMemo(() => {
    if (!selectedSite) return [];
    return gardiensWithDistance
      .filter((g) => g.assignedSiteId === selectedSite.id)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [gardiensWithDistance, selectedSite]);

  const gardiensInRadius = useMemo(() => {
    if (!selectedSite) return [];
    return gardiensWithDistance
      .filter((g) => g.distanceKm <= RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [gardiensWithDistance, selectedSite]);

  const gardiensAllSorted = useMemo(() => {
    if (!selectedSite) return [];
    return [...gardiensWithDistance].sort(
      (a, b) => a.distanceKm - b.distanceKm,
    );
  }, [gardiensWithDistance, selectedSite]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return gardiensWithDistance.filter((g) =>
      g.fullName.toLowerCase().includes(q),
    );
  }, [gardiensWithDistance, searchQuery]);

  const selectedGardien =
    gardiens.find((g) => g.id === selectedGardienId) ?? null;

  // Quoi afficher comme marqueurs gardiens sur la carte
  const gardiensOnMap = useMemo(() => {
    if (searchQuery.trim() && searchResults.length > 0) {
      return searchResults;
    }
    if (selectedSite) {
      return viewMode === "all" ? gardiensAllSorted : gardiensInRadius;
    }
    return [];
  }, [
    searchQuery,
    searchResults,
    selectedSite,
    viewMode,
    gardiensAllSorted,
    gardiensInRadius,
  ]);

  const handleSelectSite = (id: string) => {
    setSelectedSiteId(id);
    setSelectedGardienId(null);
    setViewMode("radius");
  };

  const handleClearSite = () => {
    setSelectedSiteId(null);
    setSelectedGardienId(null);
    setViewMode("radius");
  };

  const handleSelectGardien = (id: string) => {
    setSelectedGardienId(id);
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 relative">
        <MapView
          sites={sites}
          gardiens={gardiensOnMap}
          selectedSite={selectedSite}
          selectedGardien={selectedGardien}
          radiusKm={RADIUS_KM}
          onSelectSite={handleSelectSite}
          onSelectGardien={handleSelectGardien}
        />
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur rounded-lg shadow-md px-3 py-2 text-xs z-[500]">
          <div className="font-medium text-slate-800">
            {sites.length} sites · {gardiens.length} gardiens
          </div>
          {selectedSite && (
            <div className="text-slate-500 mt-0.5">
              Site sélectionné : {selectedSite.name}
            </div>
          )}
        </div>
      </div>

      <aside className="w-[400px] border-l border-slate-200 bg-white overflow-y-auto shadow-xl">
        <SitePanel
          allSites={sites}
          site={selectedSite}
          assignedGardiens={assignedGardiens}
          gardiensInRadius={gardiensInRadius}
          gardiensAllSorted={gardiensAllSorted}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          radiusKm={RADIUS_KM}
          searchQuery={searchQuery}
          onChangeSearch={setSearchQuery}
          searchResults={searchResults}
          selectedGardienId={selectedGardienId}
          onSelectSite={handleSelectSite}
          onClearSite={handleClearSite}
          onSelectGardien={handleSelectGardien}
        />
      </aside>
    </div>
  );
}
