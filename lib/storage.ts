// Stockage des sites et agents ajoutés via le portail.
// Utilise Supabase si configuré (partagé entre tous les utilisateurs),
// sinon localStorage en fallback (données locales au navigateur).

import type { Site } from "./sites";
import type { Agent } from "./agents";
import { getSupabase } from "./supabase";

const SITES_KEY = "phoenix:custom_sites";
const AGENTS_KEY = "phoenix:custom_agents";
const ASSIGNMENTS_KEY = "phoenix:assignments";

// ============== MAPPING DB ↔ TS ==============

type SiteRow = {
  id: string;
  num: number;
  name: string;
  client: string;
  lieu: string;
  lat: number;
  lng: number;
  status: Site["status"];
  agents_count: number;
  approximate: boolean;
};

type AgentRow = {
  id: string;
  matricule: string;
  prenom: string;
  nom: string;
  full_name: string;
  address: string;
  contract_type: Agent["contractType"];
  lat: number;
  lng: number;
  approximate: boolean;
};

function rowToSite(r: SiteRow): Site {
  return {
    id: r.id,
    num: r.num ?? 0,
    name: r.name,
    client: r.client,
    lieu: r.lieu,
    lat: r.lat,
    lng: r.lng,
    status: r.status,
    agentsCount: r.agents_count ?? 0,
    approximate: r.approximate ?? false,
  };
}

function siteToRow(s: Site): SiteRow {
  return {
    id: s.id,
    num: s.num,
    name: s.name,
    client: s.client,
    lieu: s.lieu,
    lat: s.lat,
    lng: s.lng,
    status: s.status,
    agents_count: s.agentsCount,
    approximate: s.approximate,
  };
}

function rowToAgent(r: AgentRow): Agent {
  return {
    id: r.id,
    matricule: r.matricule,
    prenom: r.prenom,
    nom: r.nom,
    fullName: r.full_name,
    address: r.address,
    contractType: r.contract_type,
    lat: r.lat,
    lng: r.lng,
    approximate: r.approximate ?? false,
  };
}

function agentToRow(a: Agent): AgentRow {
  return {
    id: a.id,
    matricule: a.matricule,
    prenom: a.prenom,
    nom: a.nom,
    full_name: a.fullName,
    address: a.address,
    contract_type: a.contractType,
    lat: a.lat,
    lng: a.lng,
    approximate: a.approximate,
  };
}

// ============== LOCAL STORAGE FALLBACK ==============

function lsRead<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function lsWrite<T>(key: string, items: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

// ============== API PUBLIQUE ==============

export async function loadCustomSites(): Promise<Site[]> {
  const sb = getSupabase();
  if (!sb) return lsRead<Site>(SITES_KEY);

  const { data, error } = await sb
    .from("custom_sites")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Supabase load sites error:", error.message);
    return lsRead<Site>(SITES_KEY);
  }
  return (data ?? []).map((r: SiteRow) => rowToSite(r));
}

export async function loadCustomAgents(): Promise<Agent[]> {
  const sb = getSupabase();
  if (!sb) return lsRead<Agent>(AGENTS_KEY);

  const { data, error } = await sb
    .from("custom_agents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Supabase load agents error:", error.message);
    return lsRead<Agent>(AGENTS_KEY);
  }
  return (data ?? []).map((r: AgentRow) => rowToAgent(r));
}

export async function saveCustomSite(site: Site): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) {
    const all = lsRead<Site>(SITES_KEY);
    lsWrite(SITES_KEY, [...all, site]);
    return true;
  }
  const { error } = await sb.from("custom_sites").insert(siteToRow(site));
  if (error) {
    console.error("Supabase insert site failed:", error.message);
    return false;
  }
  return true;
}

export async function saveCustomAgent(agent: Agent): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) {
    const all = lsRead<Agent>(AGENTS_KEY);
    lsWrite(AGENTS_KEY, [...all, agent]);
    return true;
  }
  const { error } = await sb.from("custom_agents").insert(agentToRow(agent));
  if (error) {
    console.error("Supabase insert agent failed:", error.message);
    return false;
  }
  return true;
}

// ============== AFFECTATIONS AGENT → SITE ==============
// Map de agent.id → site.id, stockée en localStorage.
// (peut être migrée vers Supabase quand l'auth pro sera réactivée)

export type AssignmentMap = Record<string, string>;

export function loadAssignments(): AssignmentMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ASSIGNMENTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveAssignments(map: AssignmentMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function assignAgentToSite(agentId: string, siteId: string) {
  const map = loadAssignments();
  map[agentId] = siteId;
  saveAssignments(map);
}

export function unassignAgent(agentId: string) {
  const map = loadAssignments();
  delete map[agentId];
  saveAssignments(map);
}

// ============== REALTIME ==============
// Abonnement aux changements pour synchroniser entre tous les utilisateurs.

export function subscribeToCustomData(handlers: {
  onSitesChange: (sites: Site[]) => void;
  onAgentsChange: (agents: Agent[]) => void;
}): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};

  const sitesChannel = sb
    .channel("custom_sites_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "custom_sites" },
      async () => {
        handlers.onSitesChange(await loadCustomSites());
      },
    )
    .subscribe();

  const agentsChannel = sb
    .channel("custom_agents_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "custom_agents" },
      async () => {
        handlers.onAgentsChange(await loadCustomAgents());
      },
    )
    .subscribe();

  return () => {
    sb.removeChannel(sitesChannel);
    sb.removeChannel(agentsChannel);
  };
}
