"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Site, Agent } from "@/lib/data";
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

export type AgentWithDistance = Agent & { distanceKm: number };
export type ViewMode = "radius" | "all";

export default function DashboardClient({
  sites,
  agents,
}: {
  sites: Site[];
  agents: Agent[];
}) {
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("radius");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const selectedSite = useMemo(
    () => sites.find((s) => s.id === selectedSiteId) ?? null,
    [sites, selectedSiteId],
  );

  const agentsWithDistance: AgentWithDistance[] = useMemo(() => {
    if (!selectedSite) {
      return agents.map((a) => ({ ...a, distanceKm: 0 }));
    }
    return agents.map((a) => ({
      ...a,
      distanceKm: haversineKm(
        { lat: selectedSite.lat, lng: selectedSite.lng },
        { lat: a.lat, lng: a.lng },
      ),
    }));
  }, [agents, selectedSite]);

  const agentsInRadius = useMemo(() => {
    if (!selectedSite) return [];
    return agentsWithDistance
      .filter((a) => a.distanceKm <= RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [agentsWithDistance, selectedSite]);

  const agentsAllSorted = useMemo(() => {
    if (!selectedSite) return [];
    return [...agentsWithDistance].sort(
      (a, b) => a.distanceKm - b.distanceKm,
    );
  }, [agentsWithDistance, selectedSite]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return agentsWithDistance.filter(
      (a) =>
        a.fullName.toLowerCase().includes(q) ||
        a.matricule.toLowerCase().includes(q),
    );
  }, [agentsWithDistance, searchQuery]);

  const selectedAgent =
    agents.find((a) => a.id === selectedAgentId) ?? null;

  const agentsOnMap = useMemo(() => {
    if (searchQuery.trim() && searchResults.length > 0) {
      return searchResults.slice(0, 200);
    }
    if (selectedSite) {
      return viewMode === "all"
        ? agentsAllSorted.slice(0, 200)
        : agentsInRadius;
    }
    return [];
  }, [
    searchQuery,
    searchResults,
    selectedSite,
    viewMode,
    agentsAllSorted,
    agentsInRadius,
  ]);

  const handleSelectSite = (id: string) => {
    setSelectedSiteId(id);
    setSelectedAgentId(null);
    setViewMode("radius");
  };

  const handleClearSite = () => {
    setSelectedSiteId(null);
    setSelectedAgentId(null);
    setViewMode("radius");
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 relative">
        <MapView
          sites={sites}
          agents={agentsOnMap}
          selectedSite={selectedSite}
          selectedAgent={selectedAgent}
          radiusKm={RADIUS_KM}
          onSelectSite={handleSelectSite}
          onSelectAgent={setSelectedAgentId}
        />
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur rounded-lg shadow-md px-3 py-2 text-xs z-[500] max-w-xs">
          <div className="font-medium text-slate-800">
            {sites.length} sites · {agents.length} agents (
            {agents.filter((a) => a.contractType === "CDI").length} CDI /{" "}
            {agents.filter((a) => a.contractType === "CDD").length} CDD)
          </div>
          {selectedSite && (
            <div className="text-slate-500 mt-0.5 truncate">
              📍 {selectedSite.client} – {selectedSite.lieu}
            </div>
          )}
        </div>
      </div>

      <aside className="w-[400px] border-l border-slate-200 bg-white overflow-y-auto shadow-xl">
        <SitePanel
          allSites={sites}
          site={selectedSite}
          agentsInRadius={agentsInRadius}
          agentsAllSorted={agentsAllSorted}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          radiusKm={RADIUS_KM}
          searchQuery={searchQuery}
          onChangeSearch={setSearchQuery}
          searchResults={searchResults}
          selectedAgentId={selectedAgentId}
          onSelectSite={handleSelectSite}
          onClearSite={handleClearSite}
          onSelectAgent={setSelectedAgentId}
        />
      </aside>
    </div>
  );
}
