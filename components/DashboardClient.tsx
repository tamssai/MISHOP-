"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Site, Agent } from "@/lib/data";
import { haversineKm } from "@/lib/geo";
import {
  loadCustomSites,
  loadCustomAgents,
  saveCustomSite,
  saveCustomAgent,
  subscribeToCustomData,
  loadAssignments,
  assignAgentToSite,
  unassignAgent,
  type AssignmentMap,
} from "@/lib/storage";
import SitePanel from "./SitePanel";
import AddItemModal from "./AddItemModal";
import ExportMenu from "./ExportMenu";

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
  const [assignments, setAssignments] = useState<AssignmentMap>({});
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("radius");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchMode, setSearchMode] = useState<SearchMode>("agent");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialMode, setModalInitialMode] = useState<"site" | "agent">(
    "agent",
  );

  // Charger les ajouts persistés + s'abonner aux changements temps réel
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [sites, agents] = await Promise.all([
        loadCustomSites(),
        loadCustomAgents(),
      ]);
      if (cancelled) return;
      setCustomSites(sites);
      setCustomAgents(agents);
      setAssignments(loadAssignments());
    })();

    const unsubscribe = subscribeToCustomData({
      onSitesChange: setCustomSites,
      onAgentsChange: setCustomAgents,
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const handleAssignAgent = useCallback(
    (agentId: string, siteId: string) => {
      assignAgentToSite(agentId, siteId);
      setAssignments((prev) => ({ ...prev, [agentId]: siteId }));
    },
    [],
  );

  const handleUnassignAgent = useCallback((agentId: string) => {
    unassignAgent(agentId);
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[agentId];
      return next;
    });
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

  // Agents affectés à ce site:
  // 1. via la colonne assignedSiteId du fichier d'affectations Phoenix
  // 2. via la table d'assignment locale (overrides manuels via UI)
  const assignedAgents = useMemo(() => {
    if (!selectedSite) return [];
    return agentsWithDistance
      .filter((a) => {
        const manualSiteId = assignments[a.id];
        const fileSiteId = a.assignedSiteId;
        const effective = manualSiteId ?? fileSiteId;
        return effective === selectedSite.id;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [agentsWithDistance, selectedSite, assignments]);

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

  // Mode "focus agent" : dès qu'un agent est sélectionné (peu importe
  // si un site est aussi sélectionné dans la sidebar), on masque tout
  // pour ne garder que l'agent + son site d'affectation sur la carte.
  const isFocusOnAgent = !!selectedAgent;
  const focusedAssignedSite = useMemo(() => {
    if (!isFocusOnAgent || !selectedAgent?.assignedSiteId) return null;
    return sites.find((s) => s.id === selectedAgent.assignedSiteId) ?? null;
  }, [isFocusOnAgent, selectedAgent, sites]);

  const agentsOnMap = useMemo(() => {
    if (isFocusOnAgent && selectedAgent) {
      return [selectedAgent];
    }
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
    isFocusOnAgent,
    selectedAgent,
    searchMode,
    searchQuery,
    agentSearchResults,
    selectedSite,
    viewMode,
    agentsAllSorted,
    agentsInRadius,
  ]);

  // En mode focus, on ne garde qu'un seul site visible (celui de l'agent)
  const sitesForMap = useMemo(() => {
    if (isFocusOnAgent && focusedAssignedSite) {
      return [focusedAssignedSite];
    }
    return sites;
  }, [isFocusOnAgent, focusedAssignedSite, sites]);

  const handleSelectSite = useCallback(
    (id: string) => {
      setSelectedSiteId(id);
      setSelectedAgentId(null);
      setViewMode("radius");
      if (searchMode === "site") setSearchQuery("");
    },
    [searchMode],
  );

  const handleClearSite = useCallback(() => {
    setSelectedSiteId(null);
    setSelectedAgentId(null);
    setViewMode("radius");
  }, []);

  const handleSelectAgent = useCallback((id: string) => {
    setSelectedAgentId(id);
  }, []);

  const handleAddSite = async (site: Site) => {
    // Mise à jour optimiste — l'abonnement realtime se chargera de la synchro
    setCustomSites((prev) => [site, ...prev]);
    handleSelectSite(site.id);
    const ok = await saveCustomSite(site);
    if (!ok) {
      // rollback en cas d'échec
      setCustomSites((prev) => prev.filter((s) => s.id !== site.id));
      alert("L'enregistrement du site a échoué. Vérifie ta connexion.");
    }
  };

  const handleAddAgent = async (agent: Agent) => {
    setCustomAgents((prev) => [agent, ...prev]);
    setSelectedAgentId(agent.id);
    setSearchMode("agent");
    setSearchQuery(agent.fullName);
    const ok = await saveCustomAgent(agent);
    if (!ok) {
      setCustomAgents((prev) => prev.filter((a) => a.id !== agent.id));
      alert("L'enregistrement de l'agent a échoué. Vérifie ta connexion.");
    }
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 relative">
        <MapView
          sites={sitesForMap}
          agents={agentsOnMap}
          selectedSite={selectedSite}
          selectedAgent={selectedAgent}
          focusedAssignedSite={focusedAssignedSite}
          radiusKm={RADIUS_KM}
          onSelectSite={handleSelectSite}
          onSelectAgent={handleSelectAgent}
        />
        <div className="absolute top-3 left-3 z-[500] flex flex-col gap-2 items-start">
          <div className="bg-white/95 backdrop-blur rounded-lg shadow-md px-3 py-2 text-xs max-w-xs">
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
          <ExportMenu
            sites={sites}
            agents={agents}
            selectedSite={selectedSite}
          />
        </div>
      </div>

      <aside className="w-[420px] border-l border-slate-200 bg-white overflow-y-auto shadow-xl">
        <SitePanel
          allSites={sites}
          site={selectedSite}
          assignedAgents={assignedAgents}
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
          onSelectAgent={handleSelectAgent}
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
