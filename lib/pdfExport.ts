"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Site, Agent } from "./data";
import { haversineKm } from "./geo";

// ============== HELPERS ==============

function dateSlug(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function todayFr(): string {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  // En-tête Phoenix
  doc.setFontSize(20);
  doc.setTextColor(255, 66, 20);
  doc.setFont("helvetica", "bold");
  doc.text("PHOENIX SÉNÉGAL", 14, 18);

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "italic");
  doc.text("securite intelligente", 14, 24);

  // Titre du document
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 36);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, 14, 42);
  }

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.text(`Édité le ${todayFr()}`, 14, subtitle ? 48 : 42);
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(
      `Phoenix Portal RH · Confidentiel · Page ${i}/${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" },
    );
  }
}

const HEAD_STYLE = {
  fillColor: [255, 66, 20] as [number, number, number],
  textColor: 255,
  fontStyle: "bold" as const,
};

// ============== ÉTAT 1 — Tous les sites ==============

export function exportAllSites(sites: Site[]) {
  const doc = new jsPDF();
  addHeader(
    doc,
    "État 1 — Tous les sites Phoenix",
    `${sites.length} sites au Sénégal`,
  );

  autoTable(doc, {
    startY: 55,
    head: [["#", "Client", "Lieu", "Statut", "Position GPS"]],
    body: sites
      .slice()
      .sort((a, b) => a.client.localeCompare(b.client))
      .map((s) => [
        s.num,
        s.client,
        s.lieu,
        s.status,
        `${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}${s.approximate ? " ⚠" : ""}`,
      ]),
    theme: "striped",
    headStyles: HEAD_STYLE,
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 50 },
      2: { cellWidth: 60 },
      3: { cellWidth: 22 },
      4: { cellWidth: 40 },
    },
  });

  addFooter(doc);
  doc.save(`phoenix_etat1_sites_${dateSlug()}.pdf`);
}

// ============== ÉTAT 2 — Tous les agents ==============

export function exportAllAgents(agents: Agent[], sites: Site[]) {
  const doc = new jsPDF({ orientation: "landscape" });
  const sitesById = new Map(sites.map((s) => [s.id, s]));

  const cdi = agents.filter((a) => a.contractType === "CDI").length;
  const cdd = agents.filter((a) => a.contractType === "CDD").length;

  addHeader(
    doc,
    "État 2 — Tous les agents Phoenix",
    `${agents.length} agents (${cdi} CDI · ${cdd} CDD)`,
  );

  autoTable(doc, {
    startY: 55,
    head: [
      ["Matricule", "Prénom", "Nom", "Contrat", "Site d'affectation", "Adresse"],
    ],
    body: agents
      .slice()
      .sort((a, b) => a.nom.localeCompare(b.nom))
      .map((a) => {
        const site = a.assignedSiteId ? sitesById.get(a.assignedSiteId) : null;
        return [
          a.matricule || "—",
          a.prenom,
          a.nom,
          a.contractType,
          site ? `${site.client} — ${site.lieu}` : "(non affecté)",
          a.address || "—",
        ];
      }),
    theme: "striped",
    headStyles: HEAD_STYLE,
    styles: { fontSize: 7, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 35 },
      2: { cellWidth: 35 },
      3: { cellWidth: 18 },
      4: { cellWidth: 75 },
      5: { cellWidth: 80 },
    },
  });

  addFooter(doc);
  doc.save(`phoenix_etat2_agents_${dateSlug()}.pdf`);
}

// ============== ÉTAT 3 — Détail d'un site ==============

const RADIUS_KM = 3;

export function exportSiteDetail(site: Site, agents: Agent[], sites: Site[]) {
  const doc = new jsPDF();
  const sitesById = new Map(sites.map((s) => [s.id, s]));

  addHeader(
    doc,
    `État 3 — Site ${site.client}`,
    `${site.lieu}${site.approximate ? " (position approximative)" : ""}`,
  );

  // Encart info site
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(
    `Site #${site.num} · Statut: ${site.status} · Position: ${site.lat.toFixed(4)}, ${site.lng.toFixed(4)}`,
    14,
    55,
  );

  // === Agents affectés à ce site ===
  const assigned = agents.filter((a) => a.assignedSiteId === site.id);
  const assignedCdi = assigned.filter((a) => a.contractType === "CDI").length;
  const assignedCdd = assigned.filter((a) => a.contractType === "CDD").length;

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Agents affectés à ce site — ${assigned.length} (${assignedCdi} CDI · ${assignedCdd} CDD)`,
    14,
    66,
  );

  if (assigned.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "italic");
    doc.text(
      "Aucun agent affecté à ce site dans le fichier Phoenix.",
      14,
      73,
    );
  } else {
    autoTable(doc, {
      startY: 70,
      head: [["Matricule", "Prénom", "Nom", "Contrat", "Adresse domicile"]],
      body: assigned
        .slice()
        .sort((a, b) => a.nom.localeCompare(b.nom))
        .map((a) => [
          a.matricule || "—",
          a.prenom,
          a.nom,
          a.contractType,
          a.address || "—",
        ]),
      theme: "striped",
      headStyles: HEAD_STYLE,
      styles: { fontSize: 8 },
    });
  }

  // === Agents à proximité (3km) ===
  const nearby = agents
    .map((a) => ({
      ...a,
      distanceKm: haversineKm(
        { lat: site.lat, lng: site.lng },
        { lat: a.lat, lng: a.lng },
      ),
    }))
    .filter((a) => a.distanceKm <= RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  // Position pour la section suivante
  const lastY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 80;

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Agents dans un rayon de ${RADIUS_KM} km — ${nearby.length}`,
    14,
    lastY + 12,
  );
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Agents Phoenix dont le domicile est proche de ce site, classés par distance.",
    14,
    lastY + 17,
  );

  if (nearby.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "italic");
    doc.text("Aucun agent à moins de 3 km.", 14, lastY + 24);
  } else {
    autoTable(doc, {
      startY: lastY + 20,
      head: [
        [
          "Matricule",
          "Prénom",
          "Nom",
          "Contrat",
          "Distance",
          "Site affecté",
        ],
      ],
      body: nearby.map((a) => {
        const ownSite = a.assignedSiteId
          ? sitesById.get(a.assignedSiteId)
          : null;
        return [
          a.matricule || "—",
          a.prenom,
          a.nom,
          a.contractType,
          `${a.distanceKm.toFixed(2)} km`,
          ownSite
            ? ownSite.id === site.id
              ? "✓ ce site"
              : `${ownSite.client} — ${ownSite.lieu}`
            : "—",
        ];
      }),
      theme: "striped",
      headStyles: HEAD_STYLE,
      styles: { fontSize: 7 },
    });
  }

  addFooter(doc);
  const safeName = (site.client + "_" + site.lieu)
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .slice(0, 40);
  doc.save(`phoenix_etat3_${safeName}_${dateSlug()}.pdf`);
}

// ============== ÉTAT 4 — Sites avec agents à + de 3km ==============
// Pour chaque site, liste les agents affectés à ce site mais qui vivent
// à plus de 3 km (commute long).

export function exportFarAgentsPerSite(sites: Site[], agents: Agent[]) {
  const doc = new jsPDF({ orientation: "landscape" });

  // Grouper par site
  type Far = Agent & { distanceKm: number };
  const farPerSite = new Map<string, Far[]>();
  let totalFar = 0;

  for (const a of agents) {
    if (!a.assignedSiteId) continue;
    const site = sites.find((s) => s.id === a.assignedSiteId);
    if (!site) continue;
    const d = haversineKm(
      { lat: site.lat, lng: site.lng },
      { lat: a.lat, lng: a.lng },
    );
    if (d > RADIUS_KM) {
      const list = farPerSite.get(site.id) ?? [];
      list.push({ ...a, distanceKm: d });
      farPerSite.set(site.id, list);
      totalFar++;
    }
  }

  // Trier les sites par nombre d'agents éloignés (desc)
  const sitesWithFar = Array.from(farPerSite.entries())
    .map(([sid, list]) => {
      const site = sites.find((s) => s.id === sid)!;
      return {
        site,
        agents: list.sort((a, b) => b.distanceKm - a.distanceKm),
      };
    })
    .sort((a, b) => b.agents.length - a.agents.length);

  addHeader(
    doc,
    "État 4 — Agents éloignés (> 3 km)",
    `${totalFar} agents affectés à des sites où ils habitent à plus de 3 km, sur ${sitesWithFar.length} sites concernés`,
  );

  if (sitesWithFar.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("Aucun agent n'habite à plus de 3 km de son site d'affectation.", 14, 60);
  } else {
    // Tableau global : 1 ligne par agent éloigné
    autoTable(doc, {
      startY: 55,
      head: [
        [
          "Site d'affectation",
          "Lieu",
          "Matricule",
          "Prénom",
          "Nom",
          "Contrat",
          "Distance domicile → site",
          "Adresse domicile",
        ],
      ],
      body: sitesWithFar.flatMap(({ site, agents }) =>
        agents.map((a) => [
          site.client,
          site.lieu,
          a.matricule || "—",
          a.prenom,
          a.nom,
          a.contractType,
          `${a.distanceKm.toFixed(2)} km`,
          a.address || "—",
        ]),
      ),
      theme: "striped",
      headStyles: HEAD_STYLE,
      styles: { fontSize: 7, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 35 },
        2: { cellWidth: 18 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 15 },
        6: { cellWidth: 25 },
        7: { cellWidth: 80 },
      },
    });
  }

  addFooter(doc);
  doc.save(`phoenix_etat4_agents_eloignes_${dateSlug()}.pdf`);
}
