"use client";

import type { Site, Gardien } from "@/lib/data";
import type { GardienWithDistance, ViewMode } from "./DashboardClient";

const SITE_BADGE: Record<Site["status"], string> = {
  actif: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  alerte: "bg-red-100 text-red-700 ring-red-200",
  inactif: "bg-slate-100 text-slate-600 ring-slate-200",
};

const GARDIEN_BADGE: Record<Gardien["status"], string> = {
  en_service: "bg-blue-100 text-blue-700",
  en_pause: "bg-amber-100 text-amber-700",
  hors_service: "bg-slate-100 text-slate-600",
};

const GARDIEN_LABEL: Record<Gardien["status"], string> = {
  en_service: "En service",
  en_pause: "En pause",
  hors_service: "Hors service",
};

export default function SitePanel({
  allSites,
  site,
  assignedGardiens,
  gardiensInRadius,
  gardiensAllSorted,
  viewMode,
  onChangeViewMode,
  radiusKm,
  searchQuery,
  onChangeSearch,
  searchResults,
  selectedGardienId,
  onSelectSite,
  onClearSite,
  onSelectGardien,
}: {
  allSites: Site[];
  site: Site | null;
  assignedGardiens: GardienWithDistance[];
  gardiensInRadius: GardienWithDistance[];
  gardiensAllSorted: GardienWithDistance[];
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  radiusKm: number;
  searchQuery: string;
  onChangeSearch: (q: string) => void;
  searchResults: GardienWithDistance[];
  selectedGardienId: string | null;
  onSelectSite: (id: string) => void;
  onClearSite: () => void;
  onSelectGardien: (id: string) => void;
}) {
  const sitesById = new Map<string, Site>(allSites.map((s) => [s.id, s]));

  return (
    <div className="flex flex-col h-full">
      {/* Barre de recherche toujours visible */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          Rechercher un agent
        </label>
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Nom de l'agent…"
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
          <SearchResults
            results={searchResults}
            sitesById={sitesById}
            selectedGardienId={selectedGardienId}
            onSelectGardien={onSelectGardien}
            hasSelectedSite={!!site}
          />
        ) : site ? (
          <SiteView
            site={site}
            sitesById={sitesById}
            assignedGardiens={assignedGardiens}
            gardiensInRadius={gardiensInRadius}
            gardiensAllSorted={gardiensAllSorted}
            viewMode={viewMode}
            onChangeViewMode={onChangeViewMode}
            radiusKm={radiusKm}
            selectedGardienId={selectedGardienId}
            onClearSite={onClearSite}
            onSelectGardien={onSelectGardien}
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
  // Groupe par région
  const byRegion = allSites.reduce<Record<string, Site[]>>((acc, s) => {
    (acc[s.region] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div>
      <h2 className="font-bold text-lg mb-1">Sites Phoenix au Sénégal</h2>
      <p className="text-sm text-slate-500 mb-4">
        Cliquez sur un site pour voir les agents affectés et ceux dans un rayon
        configurable.
      </p>
      <div className="space-y-4">
        {Object.entries(byRegion).map(([region, regionSites]) => (
          <div key={region}>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              {region}
            </h3>
            <ul className="space-y-1.5">
              {regionSites.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => onSelectSite(s.id)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-phoenix-400 hover:bg-phoenix-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{s.name}</span>
                      <span
                        className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ring-1 ${SITE_BADGE[s.status]}`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {s.city} · {s.agentsCount} agents affectés
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function SiteView({
  site,
  sitesById,
  assignedGardiens,
  gardiensInRadius,
  gardiensAllSorted,
  viewMode,
  onChangeViewMode,
  radiusKm,
  selectedGardienId,
  onClearSite,
  onSelectGardien,
}: {
  site: Site;
  sitesById: Map<string, Site>;
  assignedGardiens: GardienWithDistance[];
  gardiensInRadius: GardienWithDistance[];
  gardiensAllSorted: GardienWithDistance[];
  viewMode: ViewMode;
  onChangeViewMode: (m: ViewMode) => void;
  radiusKm: number;
  selectedGardienId: string | null;
  onClearSite: () => void;
  onSelectGardien: (id: string) => void;
}) {
  const enService = gardiensInRadius.filter(
    (g) => g.status === "en_service",
  ).length;
  const enPause = gardiensInRadius.filter(
    (g) => g.status === "en_pause",
  ).length;

  // "Autres agents dans le rayon" = dans 3km mais NON affectés à ce site
  const nearbyNotAssigned = gardiensInRadius.filter(
    (g) => g.assignedSiteId !== site.id,
  );

  return (
    <div>
      <button
        onClick={onClearSite}
        className="text-xs text-slate-500 hover:text-slate-900 mb-3"
      >
        ← Retour à la liste des sites
      </button>

      <div className="flex items-start justify-between gap-2 mb-2">
        <h2 className="font-bold text-lg leading-tight">{site.name}</h2>
        <span
          className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ring-1 ${SITE_BADGE[site.status]}`}
        >
          {site.status}
        </span>
      </div>
      <p className="text-sm text-slate-500">
        {site.address}, {site.city} · {site.region}
      </p>
      <p className="text-xs text-slate-400 mt-1">
        {site.lat.toFixed(4)}, {site.lng.toFixed(4)}
      </p>

      <div className="grid grid-cols-3 gap-2 my-4">
        <Stat label={`Dans ${radiusKm} km`} value={gardiensInRadius.length} />
        <Stat label="En service" value={enService} accent="emerald" />
        <Stat label="En pause" value={enPause} accent="amber" />
      </div>

      {/* Toggle de vue */}
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
          {/* Agents affectés au site */}
          <SectionHeader
            title="Agents affectés à ce site"
            count={assignedGardiens.length}
          />
          {assignedGardiens.length === 0 ? (
            <EmptyMsg text="Aucun agent affecté à ce site." />
          ) : (
            <GardienList
              gardiens={assignedGardiens}
              sitesById={sitesById}
              selectedGardienId={selectedGardienId}
              onSelectGardien={onSelectGardien}
              showSiteLabel={false}
            />
          )}

          {/* Autres agents dans le rayon */}
          <SectionHeader
            title={`Autres agents dans ${radiusKm} km`}
            count={nearbyNotAssigned.length}
            className="mt-5"
          />
          {nearbyNotAssigned.length === 0 ? (
            <EmptyMsg text="Aucun autre agent à proximité." />
          ) : (
            <GardienList
              gardiens={nearbyNotAssigned}
              sitesById={sitesById}
              selectedGardienId={selectedGardienId}
              onSelectGardien={onSelectGardien}
              showSiteLabel={true}
            />
          )}
        </>
      ) : (
        <>
          <SectionHeader
            title="Tous les agents par distance"
            count={gardiensAllSorted.length}
          />
          <p className="text-xs text-slate-500 mb-2">
            Trié du plus proche au plus éloigné de {site.name}.
          </p>
          <GardienList
            gardiens={gardiensAllSorted}
            sitesById={sitesById}
            selectedGardienId={selectedGardienId}
            onSelectGardien={onSelectGardien}
            showSiteLabel={true}
            highlightAssignedTo={site.id}
          />
        </>
      )}
    </div>
  );
}

function SearchResults({
  results,
  sitesById,
  selectedGardienId,
  onSelectGardien,
  hasSelectedSite,
}: {
  results: GardienWithDistance[];
  sitesById: Map<string, Site>;
  selectedGardienId: string | null;
  onSelectGardien: (id: string) => void;
  hasSelectedSite: boolean;
}) {
  return (
    <div>
      <h2 className="font-bold text-lg mb-1">
        Résultats ({results.length})
      </h2>
      <p className="text-sm text-slate-500 mb-3">
        {hasSelectedSite
          ? "Distance calculée par rapport au site sélectionné."
          : "Sélectionne un agent pour le voir sur la carte."}
      </p>
      {results.length === 0 ? (
        <EmptyMsg text="Aucun agent ne correspond." />
      ) : (
        <ul className="space-y-2">
          {results.map((g) => {
            const assignedSite = g.assignedSiteId
              ? sitesById.get(g.assignedSiteId)
              : null;
            return (
              <GardienCard
                key={g.id}
                g={g}
                isSelected={selectedGardienId === g.id}
                onClick={() => onSelectGardien(g.id)}
                showDistance={hasSelectedSite}
                siteLabel={assignedSite?.name}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}

function GardienList({
  gardiens,
  sitesById,
  selectedGardienId,
  onSelectGardien,
  showSiteLabel,
  highlightAssignedTo,
}: {
  gardiens: GardienWithDistance[];
  sitesById: Map<string, Site>;
  selectedGardienId: string | null;
  onSelectGardien: (id: string) => void;
  showSiteLabel: boolean;
  highlightAssignedTo?: string;
}) {
  return (
    <ul className="space-y-2">
      {gardiens.map((g) => {
        const siteName =
          showSiteLabel && g.assignedSiteId
            ? sitesById.get(g.assignedSiteId)?.name
            : undefined;
        return (
          <GardienCard
            key={g.id}
            g={g}
            isSelected={selectedGardienId === g.id}
            onClick={() => onSelectGardien(g.id)}
            showDistance
            siteLabel={siteName}
            isAssignedToHighlighted={
              highlightAssignedTo
                ? g.assignedSiteId === highlightAssignedTo
                : false
            }
          />
        );
      })}
    </ul>
  );
}

function GardienCard({
  g,
  isSelected,
  onClick,
  showDistance,
  siteLabel,
  isAssignedToHighlighted,
}: {
  g: GardienWithDistance;
  isSelected: boolean;
  onClick: () => void;
  showDistance: boolean;
  siteLabel?: string;
  isAssignedToHighlighted?: boolean;
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
          <span className="font-medium text-sm">{g.fullName}</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${GARDIEN_BADGE[g.status]}`}
          >
            {GARDIEN_LABEL[g.status]}
          </span>
        </div>
        <div className="text-xs text-slate-500 mt-1 flex items-center justify-between gap-2">
          <span className="truncate">
            {g.phone} · Shift {g.shift}
            {siteLabel && (
              <span
                className={`ml-1 ${isAssignedToHighlighted ? "text-phoenix-600 font-medium" : ""}`}
              >
                · {siteLabel}
              </span>
            )}
          </span>
          {showDistance && (
            <span className="font-semibold text-slate-700 shrink-0">
              {g.distanceKm.toFixed(2)} km
            </span>
          )}
        </div>
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
  accent?: "emerald" | "amber";
}) {
  const color =
    accent === "emerald"
      ? "text-emerald-700 bg-emerald-50"
      : accent === "amber"
        ? "text-amber-700 bg-amber-50"
        : "text-slate-700 bg-slate-50";
  return (
    <div className={`rounded-lg p-2 text-center ${color}`}>
      <div className="text-xl font-bold leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}
