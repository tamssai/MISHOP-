"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Site, Agent } from "@/lib/data";
import { haversineKm } from "@/lib/geo";
import {
  loadCustomSites,
  loadCustomAgents,
  saveCustomSites,
  saveCustomAgents,
} from "@/lib/storage";
import SitePanel from "./SitePanel";
import AddItemModal from "./AddItemModal";

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
export type SiteWithDistance = Site & { distanceKm?: number };
export type ViewMode = "radius" | "all";
export type SearchMode = "agent" | "site";

export default function DashboardClient({
  sites: baseSites,
  agents: baseAgents,
}: {
  sites: Site[];
  agents: Agent[];
}) {
  const [customSites, setCustomSites] = useState<Site[]>([]);
  const [customAgents, setCustomAgents] = useState<Agent[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("radius");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchMode, setSearchMode] = useState<SearchMode>("agent");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialMode, setModalInitialMode] = useState<"site" | "agent">(
    "agent",
  );

  // Charger les ajouts persistés
  useEffect(() => {
    setCustomSites(loadCustomSites());
    setCustomAgents(loadCustomAgents());
  }, []);

  // Fusion base + ajouts custom
  const sites = useMemo(
    () => [...baseSites, ...customSites],
    [baseSites, customSites],
  );
  const agents = useMemo(
    () => [...baseAgents, ...customAgents],
    [baseAgents, customAgents],
  );

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

  const agentSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || searchMode !== "agent") return [];
    return agentsWithDistance.filter(
      (a) =>
        a.fullName.toLowerCase().includes(q) ||
        a.matricule.toLowerCase().includes(q),
    );
  }, [agentsWithDistance, searchQuery, searchMode]);

  const siteSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || searchMode !== "site") return [];
    return sites.filter(
      (s) =>
        s.client.toLowerCase().includes(q) ||
        s.lieu.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q),
    );
  }, [sites, searchQuery, searchMode]);

  const selectedAgent =
    agents.find((a) => a.id === selectedAgentId) ?? null;

  const agentsOnMap = useMemo(() => {
    if (searchMode === "agent" && searchQuery.trim() && agentSearchResults.length > 0) {
      return agentSearchResults.slice(0, 200);
    }
    if (selectedSite) {
      return viewMode === "all"
        ? agentsAllSorted.slice(0, 200)
        : agentsInRadius;
    }
    return [];
  }, [
    searchMode,
    searchQuery,
    agentSearchResults,
    selectedSite,
    viewMode,
    agentsAllSorted,
    agentsInRadius,
  ]);

  const handleSelectSite = (id: string) => {
    setSelectedSiteId(id);
    setSelectedAgentId(null);
    setViewMode("radius");
    // On vide la recherche pour montrer les agents du site
    if (searchMode === "site") setSearchQuery("");
  };

  const handleClearSite = () => {
    setSelectedSiteId(null);
    setSelectedAgentId(null);
    setViewMode("radius");
  };

  const handleAddSite = (site: Site) => {
    const next = [...customSites, site];
    setCustomSites(next);
    saveCustomSites(next);
    handleSelectSite(site.id);
  };

  const handleAddAgent = (agent: Agent) => {
    const next = [...customAgents, agent];
    setCustomAgents(next);
    saveCustomAgents(next);
    setSelectedAgentId(agent.id);
    setSearchMode("agent");
    setSearchQuery(agent.fullName);
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

      <aside className="w-[420px] border-l border-slate-200 bg-white overflow-y-auto shadow-xl">
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
          searchMode={searchMode}
          onChangeSearchMode={setSearchMode}
          agentSearchResults={agentSearchResults}
          siteSearchResults={siteSearchResults}
          selectedAgentId={selectedAgentId}
          onSelectSite={handleSelectSite}
          onClearSite={handleClearSite}
          onSelectAgent={setSelectedAgentId}
          onOpenAddModal={(mode) => {
            setModalInitialMode(mode);
            setModalOpen(true);
          }}
        />
      </aside>

      <AddItemModal
        isOpen={modalOpen}
        initialMode={modalInitialMode}
        onClose={() => setModalOpen(false)}
        onAddSite={handleAddSite}
        onAddAgent={handleAddAgent}
      />
    </div>
  );
}
