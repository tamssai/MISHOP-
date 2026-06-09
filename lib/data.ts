import { sites as realSites, type Site as RealSite } from "./sites";

export type Site = RealSite;
export const sites: Site[] = realSites;

export type Gardien = {
  id: string;
  fullName: string;
  phone: string;
  shift: "jour" | "nuit";
  status: "en_service" | "en_pause" | "hors_service";
  lat: number;
  lng: number;
  assignedSiteId?: string;
};

const PRENOMS = [
  "Mamadou", "Aliou", "Cheikh", "Ibrahima", "Moussa", "Ousmane", "Modou",
  "Babacar", "Abdoulaye", "Pape", "Lamine", "Souleymane", "Aminata",
  "Fatou", "Awa", "Khady", "Bineta", "Coumba", "Astou", "Ndèye", "Assane",
  "Demba", "Boubacar", "Samba", "Idrissa", "Mor", "Saliou", "El Hadji",
  "Mouhamed", "Serigne", "Bara", "Aly", "Daouda", "Birame", "Mansour",
];

const NOMS = [
  "Diop", "Ndiaye", "Fall", "Sow", "Ba", "Sy", "Diallo", "Sarr", "Gueye",
  "Cissé", "Faye", "Mbaye", "Thiam", "Seck", "Camara", "Niang", "Kane",
  "Wade", "Dieng", "Touré", "Diagne", "Mbacké", "Diakhaté", "Sané", "Ka",
];

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateGardiens(): Gardien[] {
  const rand = seeded(42);
  const gardiens: Gardien[] = [];
  let counter = 1;

  sites.forEach((site) => {
    const total = site.agentsCount;
    for (let i = 0; i < total; i++) {
      // Dispersion autour du site (la majorité dans 2km, certains jusqu'à 4km)
      const radiusKm = rand() * 4;
      const angle = rand() * 2 * Math.PI;
      const dLat = (radiusKm / 111) * Math.cos(angle);
      const dLng =
        (radiusKm / (111 * Math.cos((site.lat * Math.PI) / 180))) *
        Math.sin(angle);

      const prenom = PRENOMS[Math.floor(rand() * PRENOMS.length)];
      const nom = NOMS[Math.floor(rand() * NOMS.length)];
      const shift: Gardien["shift"] = rand() > 0.5 ? "jour" : "nuit";
      const statusRoll = rand();
      const status: Gardien["status"] =
        statusRoll > 0.88
          ? "hors_service"
          : statusRoll > 0.75
            ? "en_pause"
            : "en_service";

      gardiens.push({
        id: `gard-${counter.toString().padStart(5, "0")}`,
        fullName: `${prenom} ${nom}`,
        phone: `+221 7${Math.floor(rand() * 9)}${Math.floor(
          rand() * 10_000_000,
        )
          .toString()
          .padStart(7, "0")}`,
        shift,
        status,
        lat: site.lat + dLat,
        lng: site.lng + dLng,
        assignedSiteId: site.id,
      });
      counter++;
    }
  });

  return gardiens;
}
