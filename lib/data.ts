export type Site = {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  status: "actif" | "alerte" | "inactif";
  agentsCount: number;
};

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

export const sites: Site[] = [
  {
    id: "site-plateau",
    name: "Phoenix HQ - Plateau",
    address: "Avenue Léopold Sédar Senghor",
    city: "Dakar",
    lat: 14.6736,
    lng: -17.4319,
    status: "actif",
    agentsCount: 12,
  },
  {
    id: "site-almadies",
    name: "Résidence Almadies",
    address: "Route des Almadies",
    city: "Dakar",
    lat: 14.7405,
    lng: -17.5103,
    status: "actif",
    agentsCount: 8,
  },
  {
    id: "site-yoff",
    name: "Aéroport Yoff",
    address: "Zone aéroportuaire",
    city: "Dakar",
    lat: 14.7475,
    lng: -17.4775,
    status: "alerte",
    agentsCount: 15,
  },
  {
    id: "site-mermoz",
    name: "Centre Commercial Mermoz",
    address: "Boulevard de la Corniche",
    city: "Dakar",
    lat: 14.7191,
    lng: -17.4843,
    status: "actif",
    agentsCount: 6,
  },
  {
    id: "site-mbao",
    name: "Usine Mbao",
    address: "Zone industrielle Mbao",
    city: "Mbao",
    lat: 14.73,
    lng: -17.2997,
    status: "actif",
    agentsCount: 10,
  },
  {
    id: "site-rufisque",
    name: "Dépôt Rufisque",
    address: "Route Nationale 1",
    city: "Rufisque",
    lat: 14.7167,
    lng: -17.2667,
    status: "inactif",
    agentsCount: 4,
  },
  {
    id: "site-pikine",
    name: "Marché Pikine",
    address: "Avenue Cheikh Anta Diop",
    city: "Pikine",
    lat: 14.7546,
    lng: -17.3974,
    status: "actif",
    agentsCount: 7,
  },
  {
    id: "site-parcelles",
    name: "Banque Parcelles Assainies",
    address: "Unité 15",
    city: "Dakar",
    lat: 14.77,
    lng: -17.43,
    status: "alerte",
    agentsCount: 5,
  },
  {
    id: "site-thies",
    name: "Antenne Thiès",
    address: "Centre-ville",
    city: "Thiès",
    lat: 14.7833,
    lng: -16.9333,
    status: "actif",
    agentsCount: 9,
  },
  {
    id: "site-saintlouis",
    name: "Antenne Saint-Louis",
    address: "Île Saint-Louis",
    city: "Saint-Louis",
    lat: 16.0179,
    lng: -16.4896,
    status: "actif",
    agentsCount: 6,
  },
];

const PRENOMS = [
  "Mamadou", "Aliou", "Cheikh", "Ibrahima", "Moussa", "Ousmane", "Modou",
  "Babacar", "Abdoulaye", "Pape", "Lamine", "Souleymane", "Aminata",
  "Fatou", "Awa", "Khady", "Bineta", "Coumba", "Astou", "Ndèye",
];

const NOMS = [
  "Diop", "Ndiaye", "Fall", "Sow", "Ba", "Sy", "Diallo", "Sarr", "Gueye",
  "Cissé", "Faye", "Mbaye", "Thiam", "Seck", "Camara", "Niang", "Kane",
  "Wade", "Dieng", "Touré",
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
    // Chaque site a ses gardiens propres + quelques uns dans le rayon
    const totalNearby = site.agentsCount + Math.floor(rand() * 4);
    for (let i = 0; i < totalNearby; i++) {
      // dispersion ~3km autour du site (1° lat ≈ 111km)
      const radiusKm = rand() * 3.5; // certains hors rayon pour tester filtre
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
        statusRoll > 0.85
          ? "hors_service"
          : statusRoll > 0.7
            ? "en_pause"
            : "en_service";

      gardiens.push({
        id: `gard-${counter.toString().padStart(4, "0")}`,
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
