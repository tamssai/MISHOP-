"use client";

import { useMemo, useState } from "react";
import type { Site, Agent } from "@/lib/data";
import type {
  AgentWithDistance,
  ViewMode,
  SearchMode,
} from "./DashboardClient";

const SITE_BADGE: Record<Site["status"], string> = {
  actif: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  alerte: "bg-red-100 text-red-700 ring-red-200",
  inactif: "bg-slate-100 text-slate-600 ring-slate-200",
};

const CONTRACT_BADGE: Record<Agent["contractType"], string> = {
  CDI: "bg-emerald-100 text-emerald-700",
  CDD: "bg-blue-100 text-blue-700",
};

export default function SitePanel({
  allSites,
  site,
  agentsInRadius,
  agentsAllSorted,
  viewMode,
  onChangeViewMode,
  radiusKm,
  searchQuery,
  onChangeSearch,
  searchMode,
  onChangeSearchMode,
  agentSearchResults,
  siteSearchResults,
  selectedAgentId,
  onSelectSite,
  onClearSite,
  onSelectAgent,
  onOpenAddModal,
}: {
  allSites: Site[];
  site: Site | null;
  agentsInRadius: AgentWithDistance[];
  agentsAllSorted: AgentWithDistance[];
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  radiusKm: number;
  searchQuery: string;
  onChangeSearch: (q: string) => void;
  searchMode: SearchMode;
  onChangeSearchMode: (m: SearchMode) => void;
  agentSearchResults: AgentWithDistance[];
  siteSearchResults: Site[];
  selectedAgentId: string | null;
  onSelectSite: (id: string) => void;
  onClearSite: () => void;
  onSelectAgent: (id: string) => void;
  onOpenAddModal: (mode: "site" | "agent") => void;
}) {
  const placeholder =
    searchMode === "agent"
      ? "Nom, prénom ou matricule…"
      : "Client, lieu ou nom de site…";

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Rechercher
          </span>
          <button
            onClick={() => onOpenAddModal(searchMode)}
            className="text-xs bg-phoenix-600 hover:bg-phoenix-700 text-white px-2.5 py-1 rounded-md font-medium flex items-center gap-1"
          >
            <span>+</span> Ajouter
          </button>
        </div>

        <div className="bg-white rounded-lg p-1 flex text-xs mb-2 border border-slate-200">
          <button
            onClick={() => {
              onChangeSearchMode("agent");
              onChangeSearch("");
            }}
            className={`flex-1 py-1.5 rounded-md font-medium transition ${
              searchMode === "agent"
                ? "bg-phoenix-50 text-phoenix-700"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            👤 Agent
          </button>
          <button
            onClick={() => {
              onChangeSearchMode("site");
              onChangeSearch("");
            }}
            className={`flex-1 py-1.5 rounded-md font-medium transition ${
              searchMode === "site"
                ? "bg-phoenix-50 text-phoenix-700"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            🏢 Site
          </button>
        </div>

        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-phoenix-500"
          />
          {searchQuery && (
            <button
              onClick={() => onChangeSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              aria-label="Effacer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {searchQuery.trim() ? (
          searchMode === "agent" ? (
            <AgentSearchResults
              results={agentSearchResults}
              selectedAgentId={selectedAgentId}
              onSelectAgent={onSelectAgent}
              hasSelectedSite={!!site}
            />
          ) : (
            <SiteSearchResults
              results={siteSearchResults}
              onSelectSite={onSelectSite}
            />
          )
        ) : site ? (
          <SiteView
            site={site}
            agentsInRadius={agentsInRadius}
            agentsAllSorted={agentsAllSorted}
            viewMode={viewMode}
            onChangeViewMode={onChangeViewMode}
            radiusKm={radiusKm}
            selectedAgentId={selectedAgentId}
            onClearSite={onClearSite}
            onSelectAgent={onSelectAgent}
          />
        ) : (
          <SitesList allSites={allSites} onSelectSite={onSelectSite} />
        )}
      </div>
    </div>
  );
}

function SitesList({
  allSites,
  onSelectSite,
}: {
  allSites: Site[];
  onSelectSite: (id: string) => void;
}) {
  const [filter, setFilter] = useState("");
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const byClient = useMemo(() => {
    const map = new Map<string, Site[]>();
    allSites.forEach((s) => {
      if (!map.has(s.client)) map.set(s.client, []);
      map.get(s.client)!.push(s);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [allSites]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return byClient;
    return byClient
      .map(([client, sites]) => {
        if (client.toLowerCase().includes(q)) return [client, sites] as const;
        const matched = sites.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.lieu.toLowerCase().includes(q),
        );
        return matched.length > 0 ? ([client, matched] as const) : null;
      })
      .filter((x): x is readonly [string, Site[]] => x !== null);
  }, [byClient, filter]);

  return (
    <div>
      <h2 className="font-bold text-lg mb-1">
        Sites Phoenix ({allSites.length})
      </h2>
      <p className="text-sm text-slate-500 mb-3">
        Cliquez sur un site pour voir les agents à proximité.
      </p>

      <div className="mb-3">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrer par client ou lieu…"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-phoenix-500"
        />
      </div>

      <div className="space-y-1">
        {filtered.map(([client, sites]) => {
          const isExpanded =
            expandedClient === client || (!!filter && filter.length > 0);
          return (
            <div
              key={client}
              className="border border-slate-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedClient(expandedClient === client ? null : client)
                }
                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-50"
              >
                <span className="font-medium text-sm truncate">{client}</span>
                <span className="text-xs text-slate-500 ml-2 shrink-0">
                  {sites.length} {sites.length > 1 ? "sites" : "site"}
                </span>
              </button>
              {isExpanded && (
                <ul className="bg-slate-50 border-t border-slate-200">
                  {sites.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => onSelectSite(s.id)}
                        className="w-full text-left px-3 py-2 hover:bg-phoenix-50 hover:text-phoenix-700 text-xs flex items-center justify-between gap-2 border-t border-slate-200"
                      >
                        <span className="truncate">{s.lieu || s.name}</span>
                        <span className="flex items-center gap-1 shrink-0">
                          {s.approximate && (
                            <span
                              title="Position approximative"
                              className="text-amber-500"
                            >
                              ⚠
                            </span>
                          )}
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.5 rounded-full ring-1 ${SITE_BADGE[s.status]}`}
                          >
                            {s.status}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SiteView({
  site,
  agentsInRadius,
  agentsAllSorted,
  viewMode,
  onChangeViewMode,
  radiusKm,
  selectedAgentId,
  onClearSite,
  onSelectAgent,
}: {
  site: Site;
  agentsInRadius: AgentWithDistance[];
  agentsAllSorted: AgentWithDistance[];
  viewMode: ViewMode;
  onChangeViewMode: (m: ViewMode) => void;
  radiusKm: number;
  selectedAgentId: string | null;
  onClearSite: () => void;
  onSelectAgent: (id: string) => void;
}) {
  const cdi = agentsInRadius.filter((a) => a.contractType === "CDI").length;
  const cdd = agentsInRadius.filter((a) => a.contractType === "CDD").length;

  return (
    <div>
      <button
        onClick={onClearSite}
        className="text-xs text-slate-500 hover:text-slate-900 mb-3"
      >
        ← Retour à la liste des sites
      </button>

      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            {site.client}
          </p>
          <h2 className="font-bold text-lg leading-tight">{site.lieu}</h2>
        </div>
        <span
          className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ring-1 ${SITE_BADGE[site.status]}`}
        >
          {site.status}
        </span>
      </div>
      <p className="text-xs text-slate-400 mt-1">
        Site #{site.num} · {site.lat.toFixed(4)}, {site.lng.toFixed(4)}
      </p>
      {site.approximate && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2">
          ⚠ Position approximative (basée sur le nom du site).
        </p>
      )}

      <div className="grid grid-cols-3 gap-2 my-4">
        <Stat label={`Dans ${radiusKm} km`} value={agentsInRadius.length} />
        <Stat label="CDI" value={cdi} accent="emerald" />
        <Stat label="CDD" value={cdd} accent="blue" />
      </div>

      <div className="bg-slate-100 rounded-lg p-1 flex text-xs mb-4">
        <button
          onClick={() => onChangeViewMode("radius")}
          className={`flex-1 py-1.5 rounded-md font-medium transition ${
            viewMode === "radius"
              ? "bg-white shadow text-slate-900"
              : "text-slate-500"
          }`}
        >
          Rayon {radiusKm} km
        </button>
        <button
          onClick={() => onChangeViewMode("all")}
          className={`flex-1 py-1.5 rounded-md font-medium transition ${
            viewMode === "all"
              ? "bg-white shadow text-slate-900"
              : "text-slate-500"
          }`}
        >
          Tous les agents
        </button>
      </div>

      {viewMode === "radius" ? (
        <>
          <SectionHeader
            title="Agents proches de ce site"
            count={agentsInRadius.length}
          />
          <p className="text-xs text-slate-500 mb-2">
            Agents Phoenix dont l&apos;adresse de domicile est dans un rayon
            de {radiusKm} km autour de ce site.
          </p>
          {agentsInRadius.length === 0 ? (
            <EmptyMsg text="Aucun agent dans le rayon." />
          ) : (
            <AgentList
              agents={agentsInRadius}
              selectedAgentId={selectedAgentId}
              onSelectAgent={onSelectAgent}
            />
          )}
        </>
      ) : (
        <>
          <SectionHeader
            title="Tous les agents par distance"
            count={agentsAllSorted.length}
          />
          <p className="text-xs text-slate-500 mb-2">
            Trié du plus proche au plus éloigné. Affichage des 200 premiers.
          </p>
          <AgentList
            agents={agentsAllSorted.slice(0, 200)}
            selectedAgentId={selectedAgentId}
            onSelectAgent={onSelectAgent}
          />
        </>
      )}
    </div>
  );
}

function AgentSearchResults({
  results,
  selectedAgentId,
  onSelectAgent,
  hasSelectedSite,
}: {
  results: AgentWithDistance[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
  hasSelectedSite: boolean;
}) {
  return (
    <div>
      <h2 className="font-bold text-lg mb-1">Agents ({results.length})</h2>
      <p className="text-sm text-slate-500 mb-3">
        {hasSelectedSite
          ? "Distance calculée par rapport au site sélectionné."
          : "Cliquez sur un agent pour le voir sur la carte."}
      </p>
      {results.length === 0 ? (
        <EmptyMsg text="Aucun agent ne correspond." />
      ) : (
        <>
          <ul className="space-y-2">
            {results.slice(0, 200).map((a) => (
              <AgentCard
                key={a.id}
                a={a}
                isSelected={selectedAgentId === a.id}
                onClick={() => onSelectAgent(a.id)}
                showDistance={hasSelectedSite}
              />
            ))}
          </ul>
          {results.length > 200 && (
            <p className="text-xs text-slate-400 italic text-center pt-2">
              Affichage limité aux 200 premiers. Affinez la recherche.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function SiteSearchResults({
  results,
  onSelectSite,
}: {
  results: Site[];
  onSelectSite: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="font-bold text-lg mb-1">Sites ({results.length})</h2>
      <p className="text-sm text-slate-500 mb-3">
        Cliquez sur un site pour voir les agents à proximité.
      </p>
      {results.length === 0 ? (
        <EmptyMsg text="Aucun site ne correspond." />
      ) : (
        <ul className="space-y-2">
          {results.slice(0, 200).map((s) => (
            <li key={s.id}>
              <button
                onClick={() => onSelectSite(s.id)}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-phoenix-50 hover:border-phoenix-300 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm truncate">
                    {s.client}
                  </span>
                  <span
                    className={`text-[10px] uppercase px-2 py-0.5 rounded-full ring-1 shrink-0 ${SITE_BADGE[s.status]}`}
                  >
                    {s.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate flex items-center gap-1">
                  {s.approximate && (
                    <span className="text-amber-500" title="Position approx.">
                      ⚠
                    </span>
                  )}
                  📍 {s.lieu}
                </div>
              </button>
            </li>
          ))}
          {results.length > 200 && (
            <li className="text-xs text-slate-400 italic text-center pt-2">
              Affichage limité aux 200 premiers.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function AgentList({
  agents,
  selectedAgentId,
  onSelectAgent,
}: {
  agents: AgentWithDistance[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
}) {
  return (
    <ul className="space-y-2">
      {agents.map((a) => (
        <AgentCard
          key={a.id}
          a={a}
          isSelected={selectedAgentId === a.id}
          onClick={() => onSelectAgent(a.id)}
          showDistance
        />
      ))}
    </ul>
  );
}

function AgentCard({
  a,
  isSelected,
  onClick,
  showDistance,
}: {
  a: AgentWithDistance;
  isSelected: boolean;
  onClick: () => void;
  showDistance: boolean;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full text-left p-3 rounded-lg border transition ${
          isSelected
            ? "border-phoenix-500 bg-phoenix-50 ring-2 ring-phoenix-200"
            : "border-slate-200 hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{a.fullName}</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${CONTRACT_BADGE[a.contractType]}`}
          >
            {a.contractType}
          </span>
        </div>
        <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate">Mat. {a.matricule || "—"}</span>
          {showDistance && (
            <span className="font-semibold text-slate-700 shrink-0">
              {a.distanceKm.toFixed(2)} km
            </span>
          )}
        </div>
        {a.address && (
          <div className="text-xs text-slate-400 mt-1 truncate flex items-center gap-1">
            {a.approximate && (
              <span className="text-amber-500" title="Position approximative">
                ⚠
              </span>
            )}
            📍 {a.address}
          </div>
        )}
      </button>
    </li>
  );
}

function SectionHeader({
  title,
  count,
  className = "",
}: {
  title: string;
  count: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between mb-2 ${className}`}>
      <h3 className="font-semibold text-sm">{title}</h3>
      <span className="text-xs text-slate-400">
        {count} résultat{count > 1 ? "s" : ""}
      </span>
    </div>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return <p className="text-sm text-slate-500 italic">{text}</p>;
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "emerald" | "amber" | "blue";
}) {
  const color =
    accent === "emerald"
      ? "text-emerald-700 bg-emerald-50"
      : accent === "amber"
        ? "text-amber-700 bg-amber-50"
        : accent === "blue"
          ? "text-blue-700 bg-blue-50"
          : "text-slate-700 bg-slate-50";
  return (
    <div className={`rounded-lg p-2 text-center ${color}`}>
      <div className="text-xl font-bold leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}
