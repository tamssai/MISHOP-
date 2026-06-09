"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
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
  const border = isSelected ? "4px solid #ff4214" : "3px solid white";
  return L.divIcon({
    className: "",
    html: `<div class="site-marker ${
      site.status === "alerte" ? "pulse" : ""
    }" style="background:${SITE_COLORS[site.status]};border:${border}">🏢</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function gardienIcon(g: Gardien, isHighlighted: boolean) {
  const size = isHighlighted ? 22 : 14;
  const border = isHighlighted ? "3px solid #ff4214" : "2px solid white";
  return L.divIcon({
    className: "",
    html: `<div class="gardien-marker" style="background:${GARDIEN_COLORS[g.status]};width:${size}px;height:${size}px;border:${border}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitSenegal({ sites }: { sites: Site[] }) {
  const map = useMap();
  useEffect(() => {
    if (sites.length === 0) return;
    const bounds = L.latLngBounds(sites.map((s) => [s.lat, s.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
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
      // Centre approximatif du Sénégal
      center={[14.4974, -14.4524]}
      zoom={7}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png"
      />

      {!selectedSite && !selectedGardien && <FitSenegal sites={sites} />}

      {selectedSite && (
        <>
          <FlyTo lat={selectedSite.lat} lng={selectedSite.lng} zoom={13} />
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

      {sites.map((site) => (
        <Marker
          key={site.id}
          position={[site.lat, site.lng]}
          icon={siteIcon(site, selectedSite?.id === site.id)}
          eventHandlers={{ click: () => onSelectSite(site.id) }}
        >
          <Popup>
            <div className="text-sm">
              <strong>{site.name}</strong>
              <br />
              {site.address}, {site.city}
              <br />
              <span className="text-slate-500">
                Région : {site.region} · {site.status}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}

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
