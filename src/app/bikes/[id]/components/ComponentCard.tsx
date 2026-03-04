"use client";

import { useState } from "react";
import type { Component, ComponentWearStats, DistanceUnit } from "@/lib/types";
import { formatDistance } from "@/lib/distance";
import WearBar from "@/app/dashboard/WearBar";
import { COMPONENT_TYPE_LABELS } from "@/lib/constants";

interface ComponentCardProps {
  component: Component;
  wear?: ComponentWearStats;
  distanceUnit: DistanceUnit;
  onEdit: (component: Component) => void;
  onDelete: (id: string) => void;
  onRetire: (id: string, retiredAt: string) => void;
}

export default function ComponentCard({ component, wear, distanceUnit, onEdit, onDelete, onRetire }: ComponentCardProps) {
  const isRetired = !!component.retired_at;
  const [showRetireDate, setShowRetireDate] = useState(false);
  const [retireDate, setRetireDate] = useState(() => new Date().toISOString().slice(0, 10));

  return (
    <div
      className={`rounded-lg border p-4 ${isRetired ? "border-zinc-200 bg-zinc-50" : "border-zinc-200"}`}
      data-testid={`component-card-${component.id}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">{component.name}</h4>
          <p className="text-sm text-zinc-500">
            {COMPONENT_TYPE_LABELS[component.type] ?? component.type} · {formatDistance(wear?.distance_km ?? 0, distanceUnit)} / {formatDistance(component.max_distance_km, distanceUnit)} limit
          </p>
          {isRetired && (
            <span className="text-sm text-zinc-400">Retired</span>
          )}
          {wear && !isRetired && (
            <WearBar wear_pct={wear.wear_pct} status={wear.status} compact />
          )}
        </div>
        <div className="flex gap-2">
          {!isRetired && !showRetireDate && (
            <button
              onClick={() => setShowRetireDate(true)}
              className="rounded bg-yellow-100 px-3 py-1 text-sm text-yellow-800 hover:bg-yellow-200"
            >
              Retire
            </button>
          )}
          {showRetireDate && (
            <>
              <input
                type="date"
                aria-label="Retire date"
                value={retireDate}
                onChange={(e) => setRetireDate(e.target.value)}
                className="rounded border border-zinc-300 px-2 py-1 text-sm"
              />
              <button
                onClick={() => { onRetire(component.id, retireDate); setShowRetireDate(false); }}
                className="rounded bg-yellow-600 px-3 py-1 text-sm text-white hover:bg-yellow-700"
              >
                Confirm Retire
              </button>
              <button
                onClick={() => setShowRetireDate(false)}
                className="rounded bg-zinc-100 px-3 py-1 text-sm hover:bg-zinc-200"
              >
                Cancel
              </button>
            </>
          )}
          <button
            onClick={() => onEdit(component)}
            className="rounded bg-zinc-100 px-3 py-1 text-sm hover:bg-zinc-200"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(component.id)}
            className="rounded bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}