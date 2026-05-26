"use client";

import type { Site, Gardien } from "@/lib/data";

type GardienWithDistance = Gardien & { distanceKm: number };

const STATUS_BADGE: Record<Site["status"], string> = {
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

export default function SiteDetails({
  site,
  gardiens,
  radiusKm,
  allSites,
  onSelectSite,
  onClose,
}: {
  site: Site | null;
  gardiens: GardienWithDistance[];
  radiusKm: number;
  allSites: Site[];
  onSelectSite: (id: string) => void;
  onClose: () => void;
}) {
  if (!site) {
    return (
      <div className="p-5">
        <h2 className="font-bold text-lg mb-1">Sites Phoenix</h2>
        <p className="text-sm text-slate-500 mb-4">
          Cliquez sur un site pour voir les gardiens dans un rayon de {radiusKm} km.
        </p>
        <ul className="space-y-2">
          {allSites.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => onSelectSite(s.id)}
                className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-phoenix-400 hover:bg-phoenix-50 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{s.name}</span>
                  <span
                    className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ring-1 ${STATUS_BADGE[s.status]}`}
                  >
                    {s.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {s.city} · {s.agentsCount} gardiens affectés
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const enService = gardiens.filter((g) => g.status === "en_service").length;
  const enPause = gardiens.filter((g) => g.status === "en_pause").length;

  return (
    <div className="p-5">
      <button
        onClick={onClose}
        className="text-xs text-slate-500 hover:text-slate-900 mb-3"
      >
        ← Retour à la liste
      </button>

      <div className="flex items-start justify-between gap-2 mb-2">
        <h2 className="font-bold text-lg leading-tight">{site.name}</h2>
        <span
          className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ring-1 ${STATUS_BADGE[site.status]}`}
        >
          {site.status}
        </span>
      </div>
      <p className="text-sm text-slate-500">
        {site.address}, {site.city}
      </p>
      <p className="text-xs text-slate-400 mt-1">
        {site.lat.toFixed(4)}, {site.lng.toFixed(4)}
      </p>

      <div className="grid grid-cols-3 gap-2 my-4">
        <Stat label="Dans rayon" value={gardiens.length} />
        <Stat label="En service" value={enService} accent="emerald" />
        <Stat label="En pause" value={enPause} accent="amber" />
      </div>

      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">
          Gardiens dans {radiusKm} km
        </h3>
        <span className="text-xs text-slate-400">
          {gardiens.length} résultat{gardiens.length > 1 ? "s" : ""}
        </span>
      </div>

      {gardiens.length === 0 ? (
        <p className="text-sm text-slate-500 italic">
          Aucun gardien dans le rayon.
        </p>
      ) : (
        <ul className="space-y-2">
          {gardiens.map((g) => (
            <li
              key={g.id}
              className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{g.fullName}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${GARDIEN_BADGE[g.status]}`}
                >
                  {GARDIEN_LABEL[g.status]}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                <span>
                  {g.phone} · Shift {g.shift}
                </span>
                <span className="font-semibold text-slate-700">
                  {g.distanceKm.toFixed(2)} km
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
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
