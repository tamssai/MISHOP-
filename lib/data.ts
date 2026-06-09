import { sites as realSites, type Site as RealSite } from "./sites";
import { agents as realAgents, type Agent } from "./agents";

export type Site = RealSite;
export type { Agent };
export type ContractType = "CDD" | "CDI";

export const sites: Site[] = realSites;
export const agents: Agent[] = realAgents;
