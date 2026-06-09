"use client";

import { useEffect, useMemo, useRef } from "react";
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
import type { Site, Gardien } from "@/lib/data";

const SITE_COLORS: Record<Site["status"], string> = {
  actif: "#10b981",
  alerte: "#ef4444",
  inactif: "#94a3b8",
};

const GARDIEN_COLORS: Record<Gardien["status"], string> = {
  en_service: "#2563eb",
  en_pause: "#f59e0b",
  hors_service: "#94a3b8",
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

function gardienIcon(g: Gardien, isHighlighted: boolean) {
  const size = isHighlighted ? 20 : 12;
  const border = isHighlighted ? "3px solid #ff4214" : "2px solid white";
  return L.divIcon({
    className: "",
    html: `<div class="gardien-marker" style="background:${GARDIEN_COLORS[g.status]};width:${size}px;height:${size}px;border:${border}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Cluster icon stylé Phoenix
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

function FlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 0.8 });
  }, [map, lat, lng, zoom]);
  return null;
}

// Cluster layer pour les sites
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

  useEffect(() => {
    if (clusterRef.current) {
      clusterRef.current.clearLayers();
      map.removeLayer(clusterRef.current);
    }

    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 50,
      iconCreateFunction: createClusterCustomIcon,
    });

    sites.forEach((site) => {
      const marker = L.marker([site.lat, site.lng], {
        icon: siteIcon(site, selectedSiteId === site.id),
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
          <button data-site-id="${site.id}" style="background:#ff4214;color:white;border:none;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:11px">Voir les détails</button>
        </div>`,
      );
      marker.on("popupopen", (e) => {
        const popup = e.popup;
        const el = popup.getElement();
        if (el) {
          const btn = el.querySelector<HTMLButtonElement>("button[data-site-id]");
          if (btn) {
            btn.onclick = () => {
              onSelectSite(site.id);
              map.closePopup();
            };
          }
        }
      });
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }
    };
  }, [map, sites, selectedSiteId, onSelectSite]);

  return null;
}

export default function MapView({
  sites,
  gardiens,
  selectedSite,
  selectedGardien,
  radiusKm,
  onSelectSite,
  onSelectGardien,
}: {
  sites: Site[];
  gardiens: Gardien[];
  selectedSite: Site | null;
  selectedGardien: Gardien | null;
  radiusKm: number;
  onSelectSite: (id: string) => void;
  onSelectGardien: (id: string) => void;
}) {
  return (
    <MapContainer
      center={[14.4974, -14.4524]} // centre du Sénégal
      zoom={7}
      minZoom={6}
      maxZoom={18}
      scrollWheelZoom
      className="h-full w-full"
      worldCopyJump={false}
    >
      {/* Fond CartoDB Voyager - net, rapide, gratuit */}
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />

      <FitToSites sites={sites} />

      {selectedSite && (
        <>
          <FlyTo lat={selectedSite.lat} lng={selectedSite.lng} zoom={14} />
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

      {selectedGardien && !selectedSite && (
        <FlyTo
          lat={selectedGardien.lat}
          lng={selectedGardien.lng}
          zoom={14}
        />
      )}

      <SitesClusterLayer
        sites={sites}
        selectedSiteId={selectedSite?.id ?? null}
        onSelectSite={onSelectSite}
      />

      {/* Marqueurs gardiens (rendus seulement quand un site est sélectionné ou recherche) */}
      {gardiens.map((g) => {
        const isHighlighted = selectedGardien?.id === g.id;
        return (
          <Marker
            key={g.id}
            position={[g.lat, g.lng]}
            icon={gardienIcon(g, isHighlighted)}
            eventHandlers={{ click: () => onSelectGardien(g.id) }}
          >
            <Popup>
              <div className="text-sm">
                <strong>{g.fullName}</strong>
                <br />
                {g.phone}
                <br />
                <span className="text-slate-500">
                  {g.shift} · {g.status.replace("_", " ")}
                </span>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
