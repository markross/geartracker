"use client";

import { useState } from "react";
import type { Component, ComponentType, DistanceUnit } from "@/lib/types";
import { kmToMiles, milesToKm, distanceLabel } from "@/lib/distance";

const COMPONENT_TYPES: { value: ComponentType; label: string }[] = [
  { value: "chain", label: "Chain" },
  { value: "cassette", label: "Cassette" },
  { value: "chainring", label: "Chainring" },
  { value: "tire_front", label: "Front Tire" },
  { value: "tire_rear", label: "Rear Tire" },
  { value: "brake_pads", label: "Brake Pads" },
  { value: "cables", label: "Cables" },
  { value: "bar_tape", label: "Bar Tape" },
  { value: "custom", label: "Custom" },
];

interface ComponentFormProps {
  component?: Component | null;
  distanceUnit?: DistanceUnit;
  onSubmit: (data: { name: string; type: ComponentType; max_distance_km: number }) => void;
  onCancel: () => void;
}

export default function ComponentForm({ component, distanceUnit = "km", onSubmit, onCancel }: ComponentFormProps) {
  const [name, setName] = useState(component?.name ?? "");
  const [type, setType] = useState<ComponentType>(component?.type ?? "chain");
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
    onSubmit({ name: trimmed, type, max_distance_km: Math.round(distKm) });
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
          {COMPONENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
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