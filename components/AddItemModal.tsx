"use client";

import { useState } from "react";
import type { Site } from "@/lib/sites";
import type { Agent } from "@/lib/agents";

type Mode = "site" | "agent";

export default function AddItemModal({
  isOpen,
  initialMode,
  onClose,
  onAddSite,
  onAddAgent,
}: {
  isOpen: boolean;
  initialMode: Mode;
  onClose: () => void;
  onAddSite: (site: Site) => void;
  onAddAgent: (agent: Agent) => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-lg">
            Ajouter {mode === "site" ? "un site" : "un agent"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-2xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="bg-slate-100 rounded-lg p-1 flex text-sm">
            <button
              onClick={() => setMode("site")}
              className={`flex-1 py-2 rounded-md font-medium transition ${
                mode === "site"
                  ? "bg-white shadow text-slate-900"
                  : "text-slate-500"
              }`}
            >
              🏢 Site
            </button>
            <button
              onClick={() => setMode("agent")}
              className={`flex-1 py-2 rounded-md font-medium transition ${
                mode === "agent"
                  ? "bg-white shadow text-slate-900"
                  : "text-slate-500"
              }`}
            >
              👤 Agent
            </button>
          </div>
        </div>

        <div className="p-5">
          {mode === "site" ? (
            <SiteForm onSubmit={onAddSite} onClose={onClose} />
          ) : (
            <AgentForm onSubmit={onAddAgent} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}

function SiteForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (s: Site) => void;
  onClose: () => void;
}) {
  const [client, setClient] = useState("");
  const [lieu, setLieu] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [status, setStatus] = useState<Site["status"]>("actif");
  const [agentsCount, setAgentsCount] = useState("3");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (
      !client.trim() ||
      !lieu.trim() ||
      isNaN(latNum) ||
      isNaN(lngNum)
    ) {
      alert("Merci de remplir tous les champs obligatoires.");
      return;
    }
    const id = `custom-site-${Date.now()}`;
    const newSite: Site = {
      id,
      num: 0,
      name: `${client.trim()}/${lieu.trim()}`,
      client: client.trim(),
      lieu: lieu.trim(),
      lat: latNum,
      lng: lngNum,
      status,
      agentsCount: parseInt(agentsCount, 10) || 0,
      approximate: false,
    };
    onSubmit(newSite);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label="Client / Société *">
        <input
          required
          value={client}
          onChange={(e) => setClient(e.target.value)}
          placeholder="Ex: BOA, SONATEL, NSIA…"
          className={inputCls}
        />
      </Field>

      <Field label="Lieu / Branche *">
        <input
          required
          value={lieu}
          onChange={(e) => setLieu(e.target.value)}
          placeholder="Ex: Agence Mermoz, Siège, Villa DG…"
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Latitude *">
          <input
            required
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="14.6736"
            inputMode="decimal"
            className={inputCls}
          />
        </Field>
        <Field label="Longitude *">
          <input
            required
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="-17.4319"
            inputMode="decimal"
            className={inputCls}
          />
        </Field>
      </div>

      <p className="text-xs text-slate-500 -mt-1">
        💡 Sur Google Maps, fais clic droit sur l&apos;emplacement → tu peux
        copier les coordonnées.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Statut">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Site["status"])}
            className={inputCls}
          >
            <option value="actif">Actif</option>
            <option value="alerte">Alerte</option>
            <option value="inactif">Inactif</option>
          </select>
        </Field>
        <Field label="Agents prévus">
          <input
            type="number"
            min="0"
            value={agentsCount}
            onChange={(e) => setAgentsCount(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <FormActions onCancel={onClose} />
    </form>
  );
}

function AgentForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (a: Agent) => void;
  onClose: () => void;
}) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [matricule, setMatricule] = useState("");
  const [address, setAddress] = useState("");
  const [contractType, setContractType] = useState<Agent["contractType"]>(
    "CDD",
  );
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!prenom.trim() || !nom.trim() || isNaN(latNum) || isNaN(lngNum)) {
      alert(
        "Merci de remplir prénom, nom, latitude et longitude (obligatoires).",
      );
      return;
    }
    const id = `custom-ag-${Date.now()}`;
    const newAgent: Agent = {
      id,
      matricule: matricule.trim(),
      prenom: prenom.trim(),
      nom: nom.trim(),
      fullName: `${prenom.trim()} ${nom.trim()}`,
      address: address.trim(),
      contractType,
      lat: latNum,
      lng: lngNum,
      approximate: false,
    };
    onSubmit(newAgent);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prénom *">
          <input
            required
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            placeholder="Mamadou"
            className={inputCls}
          />
        </Field>
        <Field label="Nom *">
          <input
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="DIOP"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Matricule">
          <input
            value={matricule}
            onChange={(e) => setMatricule(e.target.value)}
            placeholder="A1234 ou B5678"
            className={inputCls}
          />
        </Field>
        <Field label="Type de contrat">
          <select
            value={contractType}
            onChange={(e) =>
              setContractType(e.target.value as Agent["contractType"])
            }
            className={inputCls}
          >
            <option value="CDI">CDI (permanent)</option>
            <option value="CDD">CDD (contractuel)</option>
          </select>
        </Field>
      </div>

      <Field label="Adresse">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Parcelles Assainies Unité 22 Villa 321"
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Latitude *">
          <input
            required
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="14.7700"
            inputMode="decimal"
            className={inputCls}
          />
        </Field>
        <Field label="Longitude *">
          <input
            required
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="-17.4300"
            inputMode="decimal"
            className={inputCls}
          />
        </Field>
      </div>

      <p className="text-xs text-slate-500 -mt-1">
        💡 Sur Google Maps, fais clic droit sur l&apos;adresse de l&apos;agent
        → tu peux copier les coordonnées.
      </p>

      <FormActions onCancel={onClose} />
    </form>
  );
}

const inputCls =
  "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-phoenix-500";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-600 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function FormActions({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex gap-2 pt-3">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
      >
        Annuler
      </button>
      <button
        type="submit"
        className="flex-1 px-3 py-2 bg-phoenix-600 hover:bg-phoenix-700 text-white rounded-lg text-sm font-semibold"
      >
        Enregistrer
      </button>
    </div>
  );
}
