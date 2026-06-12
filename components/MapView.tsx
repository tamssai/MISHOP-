"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { Site, Agent } from "@/lib/data";

const SITE_COLORS: Record<Site["status"], string> = {
  actif: "#10b981",
  alerte: "#ef4444",
  inactif: "#94a3b8",
};

const CONTRACT_COLORS: Record<Agent["contractType"], string> = {
  CDI: "#10b981",
  CDD: "#2563eb",
};

function siteIcon(site: Site, isSelected: boolean) {
  const border = isSelected ? "3px solid #ff4214" : "2px solid white";
  const size = isSelected ? 28 : 22;
  return L.divIcon({
    className: "",
    html: `<div class="site-marker ${
      site.status === "alerte" ? "pulse" : ""
    }" style="background:${SITE_COLORS[site.status]};border:${border};width:${size}px;height:${size}px;font-size:12px">🏢</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function agentIcon(a: Agent, isHighlighted: boolean) {
  const size = isHighlighted ? 20 : 12;
  const border = isHighlighted ? "3px solid #ff4214" : "2px solid white";
  return L.divIcon({
    className: "",
    html: `<div class="gardien-marker" style="background:${CONTRACT_COLORS[a.contractType]};width:${size}px;height:${size}px;border:${border}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createClusterCustomIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();
  let size = 36;
  let bg = "#10b981";
  if (count > 50) {
    size = 52;
    bg = "#c71d0b";
  } else if (count > 20) {
    size = 44;
    bg = "#f02a0a";
  } else if (count > 10) {
    size = 40;
    bg = "#ff6a3a";
  }
  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};color:white;width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:13px">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Cadre la carte sur l'ensemble des sites une seule fois au chargement.
 */
function FitToSites({ sites }: { sites: Site[] }) {
  const map = useMap();
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current || sites.length === 0) return;
    const bounds = L.latLngBounds(sites.map((s) => [s.lat, s.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    didInit.current = true;
  }, [map, sites]);
  return null;
}

/**
 * Cadre la carte sur 2 points précis (mode focus agent + son site).
 */
function FitToTwoPoints({
  a,
  b,
  triggerKey,
}: {
  a: [number, number];
  b: [number, number];
  triggerKey: string;
}) {
  const map = useMap();
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    if (lastKey.current === triggerKey) return;
    lastKey.current = triggerKey;
    const bounds = L.latLngBounds([a, b]);
    map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 14, duration: 0.8 });
  }, [map, a, b, triggerKey]);
  return null;
}

/**
 * Déplace la carte vers une cible.
 * Utilise une clé unique pour ne déclencher l'animation qu'une fois par cible.
 */
function FlyTo({
  lat,
  lng,
  zoom,
  triggerKey,
}: {
  lat: number;
  lng: number;
  zoom: number;
  triggerKey: string;
}) {
  const map = useMap();
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    if (lastKey.current === triggerKey) return;
    lastKey.current = triggerKey;
    map.flyTo([lat, lng], zoom, { duration: 0.8 });
  }, [map, lat, lng, zoom, triggerKey]);
  return null;
}

/**
 * Layer de clustering pour les sites.
 * Le cluster est créé UNE SEULE FOIS et les markers sont mis à jour à chaque
 * changement de sélection sans tout recréer.
 */
function SitesClusterLayer({
  sites,
  selectedSiteId,
  onSelectSite,
}: {
  sites: Site[];
  selectedSiteId: string | null;
  onSelectSite: (id: string) => void;
}) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  // Garde la dernière version du callback sans déclencher de re-render
  const onSelectRef = useRef(onSelectSite);
  onSelectRef.current = onSelectSite;

  // Création unique du cluster + markers
  useEffect(() => {
    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 50,
      iconCreateFunction: createClusterCustomIcon,
    });

    const markersMap = new Map<string, L.Marker>();

    sites.forEach((site) => {
      const marker = L.marker([site.lat, site.lng], {
        icon: siteIcon(site, false),
      });
      const approx = site.approximate
        ? '<br><em style="color:#9a3412">⚠ Position approximative</em>'
        : "";
      marker.bindPopup(
        `<div style="font-size:13px;min-width:200px">
          <strong>${site.client}</strong><br>
          <span style="color:#555">${site.lieu}</span>
          ${approx}
          <br><br>
          <button data-site-id="${site.id}" style="background:#ff4214;color:white;border:none;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:11px">Voir les agents</button>
        </div>`,
      );
      marker.on("popupopen", (e) => {
        const el = e.popup.getElement();
        if (el) {
          const btn = el.querySelector<HTMLButtonElement>(
            "button[data-site-id]",
          );
          if (btn) {
            btn.onclick = () => {
              onSelectRef.current(site.id);
              map.closePopup();
            };
          }
        }
      });
      cluster.addLayer(marker);
      markersMap.set(site.id, marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;
    markersRef.current = markersMap;

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
        markersRef.current.clear();
      }
    };
    // sites est la SEULE dep — pas onSelectSite ni selectedSiteId
  }, [map, sites]);

  // Mise à jour des icônes (ajout/retrait du surlignage rouge) sans tout recréer
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const site = sites.find((s) => s.id === id);
      if (!site) return;
      marker.setIcon(siteIcon(site, id === selectedSiteId));
    });
  }, [selectedSiteId, sites]);

  return null;
}

export default function MapView({
  sites,
  agents,
  selectedSite,
  selectedAgent,
  focusedAssignedSite,
  radiusKm,
  onSelectSite,
  onSelectAgent,
}: {
  sites: Site[];
  agents: Agent[];
  selectedSite: Site | null;
  selectedAgent: Agent | null;
  focusedAssignedSite: Site | null;
  radiusKm: number;
  onSelectSite: (id: string) => void;
  onSelectAgent: (id: string) => void;
}) {
  const isFocusMode = !!selectedAgent && !selectedSite;
  return (
    <MapContainer
      center={[14.4974, -14.4524]}
      zoom={7}
      minZoom={6}
      maxZoom={18}
      scrollWheelZoom
      className="h-full w-full"
      worldCopyJump={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />

      {!isFocusMode && <FitToSites sites={sites} />}

      {selectedSite && (
        <>
          <FlyTo
            lat={selectedSite.lat}
            lng={selectedSite.lng}
            zoom={13}
            triggerKey={`site:${selectedSite.id}`}
          />
          <Circle
            center={[selectedSite.lat, selectedSite.lng]}
            radius={radiusKm * 1000}
            pathOptions={{
              color: "#ff4214",
              fillColor: "#ff4214",
              fillOpacity: 0.08,
              weight: 2,
              dashArray: "6 6",
            }}
          />
        </>
      )}

      {/* Mode focus: agent sélectionné sans site → cadre sur agent + son site */}
      {isFocusMode && selectedAgent && focusedAssignedSite && (
        <FitToTwoPoints
          a={[selectedAgent.lat, selectedAgent.lng]}
          b={[focusedAssignedSite.lat, focusedAssignedSite.lng]}
          triggerKey={`focus:${selectedAgent.id}`}
        />
      )}

      {/* Agent sélectionné sans site assigné → simple flyTo */}
      {isFocusMode && selectedAgent && !focusedAssignedSite && (
        <FlyTo
          lat={selectedAgent.lat}
          lng={selectedAgent.lng}
          zoom={14}
          triggerKey={`agent:${selectedAgent.id}`}
        />
      )}

      <SitesClusterLayer
        sites={sites}
        selectedSiteId={selectedSite?.id ?? null}
        onSelectSite={onSelectSite}
      />

      {agents.map((a) => {
        const isHighlighted = selectedAgent?.id === a.id;
        return (
          <Marker
            key={a.id}
            position={[a.lat, a.lng]}
            icon={agentIcon(a, isHighlighted)}
            eventHandlers={{ click: () => onSelectAgent(a.id) }}
          >
            <Popup>
              <div className="text-sm">
                <strong>{a.fullName}</strong>
                <br />
                Mat. {a.matricule || "—"} · {a.contractType}
                {a.address && (
                  <>
                    <br />
                    <span className="text-slate-500">📍 {a.address}</span>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
