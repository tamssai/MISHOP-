// Stockage local des sites et agents ajoutés par l'utilisateur.
// Données persistées dans le navigateur (localStorage).
// À remplacer par un vrai backend quand disponible.

import type { Site } from "./sites";
import type { Agent } from "./agents";

const SITES_KEY = "phoenix:custom_sites";
const AGENTS_KEY = "phoenix:custom_agents";

function safeRead<T>(key: string): T[] {
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

function safeWrite<T>(key: string, items: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // quota dépassé ou stockage indisponible — ignorer silencieusement
  }
}

export function loadCustomSites(): Site[] {
  return safeRead<Site>(SITES_KEY);
}

export function saveCustomSites(sites: Site[]) {
  safeWrite(SITES_KEY, sites);
}

export function loadCustomAgents(): Agent[] {
  return safeRead<Agent>(AGENTS_KEY);
}

export function saveCustomAgents(agents: Agent[]) {
  safeWrite(AGENTS_KEY, agents);
}
