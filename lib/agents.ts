import agentsJson from "./agents.json";

export type ContractType = "CDD" | "CDI";

export type Agent = {
  id: string;
  matricule: string;
  prenom: string;
  nom: string;
  fullName: string;
  address: string;
  contractType: ContractType;
  lat: number;
  lng: number;
  approximate: boolean;
  assignedSiteId?: string | null;
};

export const agents: Agent[] = agentsJson as Agent[];
