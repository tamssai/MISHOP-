"use client";

import { useEffect, useRef, useState } from "react";
import type { Site, Agent } from "@/lib/data";
import {
  exportAllSites,
  exportAllAgents,
  exportSiteDetail,
  exportFarAgentsPerSite,
} from "@/lib/pdfExport";

export default function ExportMenu({
  sites,
  agents,
  selectedSite,
}: {
  sites: Site[];
  agents: Agent[];
  selectedSite: Site | null;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermer au clic extérieur
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      window.addEventListener("mousedown", onClick);
      return () => window.removeEventListener("mousedown", onClick);
    }
  }, [open]);

  const run = async (key: string, fn: () => void) => {
    setLoading(key);
    // Petit délai pour laisser le menu se fermer
    await new Promise((r) => setTimeout(r, 50));
    try {
      fn();
    } finally {
      setLoading(null);
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-white/95 backdrop-blur shadow-md rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-1.5 hover:bg-white"
      >
        <span>📄</span>
        <span>Exporter PDF</span>
        <span className={`text-slate-400 transition ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white shadow-xl rounded-lg w-72 z-[1000] border border-slate-200 overflow-hidden">
          <MenuItem
            number="1"
            title="Tous les sites"
            subtitle={`${sites.length} sites sur la carte`}
            loading={loading === "1"}
            onClick={() => run("1", () => exportAllSites(sites))}
          />
          <MenuItem
            number="2"
            title="Tous les agents"
            subtitle={`${agents.length} agents (CDI + CDD + stagiaires + congés)`}
            loading={loading === "2"}
            onClick={() => run("2", () => exportAllAgents(agents, sites))}
          />
          <MenuItem
            number="3"
            title="Détail d'un site"
            subtitle={
              selectedSite
                ? `${selectedSite.client} — ${selectedSite.lieu}`
                : "Sélectionne d'abord un site sur la carte"
            }
            loading={loading === "3"}
            disabled={!selectedSite}
            onClick={() =>
              selectedSite &&
              run("3", () => exportSiteDetail(selectedSite, agents, sites))
            }
          />
          <MenuItem
            number="4"
            title="Agents éloignés (> 3 km)"
            subtitle="Pour chaque site, agents affectés vivant à + de 3 km"
            loading={loading === "4"}
            onClick={() =>
              run("4", () => exportFarAgentsPerSite(sites, agents))
            }
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  number,
  title,
  subtitle,
  loading,
  disabled,
  onClick,
}: {
  number: string;
  title: string;
  subtitle: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full text-left px-3 py-2.5 border-b border-slate-100 last:border-b-0 transition ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-phoenix-50 cursor-pointer"
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="text-xs font-bold text-phoenix-600 bg-phoenix-50 rounded-md px-1.5 py-0.5 mt-0.5">
          État {number}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-900">{title}</div>
          <div className="text-xs text-slate-500 mt-0.5 truncate">
            {loading ? "Génération…" : subtitle}
          </div>
        </div>
      </div>
    </button>
  );
}
