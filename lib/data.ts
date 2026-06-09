export type Site = {
  id: string;
  name: string;
  address: string;
  city: string;
  region: string;
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
  // ---------- DAKAR ----------
  {
    id: "site-plateau",
    name: "Phoenix HQ - Plateau",
    address: "Avenue Léopold Sédar Senghor",
    city: "Dakar",
    region: "Dakar",
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
    region: "Dakar",
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
    region: "Dakar",
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
    region: "Dakar",
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
    region: "Dakar",
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
    region: "Dakar",
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
    region: "Dakar",
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
    region: "Dakar",
    lat: 14.77,
    lng: -17.43,
    status: "alerte",
    agentsCount: 5,
  },
  // ---------- AUTRES RÉGIONS ----------
  {
    id: "site-thies",
    name: "Antenne Thiès",
    address: "Centre-ville",
    city: "Thiès",
    region: "Thiès",
    lat: 14.7833,
    lng: -16.9333,
    status: "actif",
    agentsCount: 9,
  },
  {
    id: "site-mbour",
    name: "Resort Saly",
    address: "Saly Portudal",
    city: "Mbour",
    region: "Thiès",
    lat: 14.4422,
    lng: -16.9569,
    status: "actif",
    agentsCount: 8,
  },
  {
    id: "site-saintlouis",
    name: "Antenne Saint-Louis",
    address: "Île Saint-Louis",
    city: "Saint-Louis",
    region: "Saint-Louis",
    lat: 16.0179,
    lng: -16.4896,
    status: "actif",
    agentsCount: 6,
  },
  {
    id: "site-louga",
    name: "Dépôt Louga",
    address: "Zone industrielle",
    city: "Louga",
    region: "Louga",
    lat: 15.6173,
    lng: -16.224,
    status: "actif",
    agentsCount: 5,
  },
  {
    id: "site-diourbel",
    name: "Centre Diourbel",
    address: "Avenue principale",
    city: "Diourbel",
    region: "Diourbel",
    lat: 14.6553,
    lng: -16.2336,
    status: "actif",
    agentsCount: 6,
  },
  {
    id: "site-touba",
    name: "Site Touba",
    address: "Quartier Darou Khoudoss",
    city: "Touba",
    region: "Diourbel",
    lat: 14.85,
    lng: -15.8833,
    status: "actif",
    agentsCount: 7,
  },
  {
    id: "site-kaolack",
    name: "Marché Kaolack",
    address: "Centre commercial",
    city: "Kaolack",
    region: "Kaolack",
    lat: 14.1465,
    lng: -16.0726,
    status: "actif",
    agentsCount: 7,
  },
  {
    id: "site-fatick",
    name: "Antenne Fatick",
    address: "Route de Foundiougne",
    city: "Fatick",
    region: "Fatick",
    lat: 14.3349,
    lng: -16.4163,
    status: "actif",
    agentsCount: 4,
  },
  {
    id: "site-ziguinchor",
    name: "Antenne Ziguinchor",
    address: "Boulevard 54",
    city: "Ziguinchor",
    region: "Ziguinchor",
    lat: 12.5641,
    lng: -16.2731,
    status: "actif",
    agentsCount: 8,
  },
  {
    id: "site-kolda",
    name: "Bureau Kolda",
    address: "Centre-ville",
    city: "Kolda",
    region: "Kolda",
    lat: 12.8939,
    lng: -14.9412,
    status: "actif",
    agentsCount: 5,
  },
  {
    id: "site-tambacounda",
    name: "Site Tambacounda",
    address: "Zone administrative",
    city: "Tambacounda",
    region: "Tambacounda",
    lat: 13.7708,
    lng: -13.6673,
    status: "actif",
    agentsCount: 6,
  },
  {
    id: "site-kedougou",
    name: "Mine Kédougou",
    address: "Zone aurifère",
    city: "Kédougou",
    region: "Kédougou",
    lat: 12.5605,
    lng: -12.1747,
    status: "alerte",
    agentsCount: 10,
  },
  {
    id: "site-matam",
    name: "Antenne Matam",
    address: "Route nationale",
    city: "Matam",
    region: "Matam",
    lat: 15.6559,
    lng: -13.2554,
    status: "actif",
    agentsCount: 5,
  },
];

const PRENOMS = [
  "Mamadou", "Aliou", "Cheikh", "Ibrahima", "Moussa", "Ousmane", "Modou",
  "Babacar", "Abdoulaye", "Pape", "Lamine", "Souleymane", "Aminata",
  "Fatou", "Awa", "Khady", "Bineta", "Coumba", "Astou", "Ndèye", "Assane",
  "Demba", "Boubacar", "Samba", "Idrissa", "Mor", "Saliou", "El Hadji",
];

const NOMS = [
  "Diop", "Ndiaye", "Fall", "Sow", "Ba", "Sy", "Diallo", "Sarr", "Gueye",
  "Cissé", "Faye", "Mbaye", "Thiam", "Seck", "Camara", "Niang", "Kane",
  "Wade", "Dieng", "Touré", "Diagne", "Mbacké", "Diakhaté", "Sané",
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
    const totalNearby = site.agentsCount + Math.floor(rand() * 3);
    for (let i = 0; i < totalNearby; i++) {
      // dispersion autour du site, certains au-delà de 3 km
      const radiusKm = rand() * 4.5;
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
