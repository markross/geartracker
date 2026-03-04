"use client";

import { useState } from "react";
import type { Component, ComponentFormData, ComponentType, DistanceUnit } from "@/lib/types";
import { kmToMiles, milesToKm, distanceLabel } from "@/lib/distance";
import { VALID_COMPONENT_TYPES, COMPONENT_TYPE_LABELS } from "@/lib/constants";

interface ComponentFormProps {
  component?: Component | null;
  distanceUnit?: DistanceUnit;
  onSubmit: (data: ComponentFormData) => void;
  onCancel: () => void;
}

export default function ComponentForm({ component, distanceUnit = "km", onSubmit, onCancel }: ComponentFormProps) {
  const [name, setName] = useState(component?.name ?? "");
  const [type, setType] = useState<ComponentType>(component?.type ?? "chain");
  const [installedAt, setInstalledAt] = useState(
    () => component?.installed_at ? component.installed_at.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const initialDisplay = component?.max_distance_km
    ? distanceUnit === "mi" ? Math.round(kmToMiles(component.max_distance_km)).toString() : component.max_distance_km.toString()
    : "";
  const [maxDistance, setMaxDistance] = useState(initialDisplay);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }
    const dist = Number(maxDistance);
    if (!maxDistance || isNaN(dist) || dist <= 0) {
      setError("Max distance must be a positive number");
      return;
    }
    setError("");
    const distKm = distanceUnit === "mi" ? milesToKm(dist) : dist;
    onSubmit({ name: trimmed, type, max_distance_km: Math.round(distKm), installed_at: installedAt });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="component-name" className="block text-sm font-medium">Name</label>
        <input
          id="component-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          placeholder="e.g. KMC X11"
        />
      </div>
      <div>
        <label htmlFor="component-type" className="block text-sm font-medium">Type</label>
        <select
          id="component-type"
          value={type}
          onChange={(e) => setType(e.target.value as ComponentType)}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
        >
          {VALID_COMPONENT_TYPES.map((v) => (
            <option key={v} value={v}>{COMPONENT_TYPE_LABELS[v]}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="max-distance" className="block text-sm font-medium">Max Distance ({distanceLabel(distanceUnit)})</label>
        <input
          id="max-distance"
          type="number"
          value={maxDistance}
          onChange={(e) => setMaxDistance(e.target.value)}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          placeholder="e.g. 5000"
        />
      </div>
      <div>
        <label htmlFor="installed-at" className="block text-sm font-medium">Installed Date</label>
        <input
          id="installed-at"
          type="date"
          value={installedAt}
          onChange={(e) => setInstalledAt(e.target.value)}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          {component ? "Update" : "Create"}
        </button>
        <button type="button" onClick={onCancel} className="rounded bg-zinc-100 px-4 py-2 hover:bg-zinc-200">
          Cancel
        </button>
      </div>
    </form>
  );
}