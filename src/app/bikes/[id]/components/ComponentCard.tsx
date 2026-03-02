"use client";

import type { Component } from "@/lib/types";

interface ComponentCardProps {
  component: Component;
  onEdit: (component: Component) => void;
  onDelete: (id: string) => void;
  onRetire: (id: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  chain: "Chain",
  cassette: "Cassette",
  chainring: "Chainring",
  tire_front: "Front Tire",
  tire_rear: "Rear Tire",
  brake_pads: "Brake Pads",
  cables: "Cables",
  bar_tape: "Bar Tape",
  custom: "Custom",
};

export default function ComponentCard({ component, onEdit, onDelete, onRetire }: ComponentCardProps) {
  const isRetired = !!component.retired_at;

  return (
    <div
      className={`rounded-lg border p-4 ${isRetired ? "border-zinc-200 bg-zinc-50" : "border-zinc-200"}`}
      data-testid={`component-card-${component.id}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">{component.name}</h4>
          <p className="text-sm text-zinc-500">
            {TYPE_LABELS[component.type] || component.type} · {component.max_distance_km.toLocaleString()} km limit
          </p>
          {isRetired && (
            <span className="text-sm text-zinc-400">Retired</span>
          )}
        </div>
        <div className="flex gap-2">
          {!isRetired && (
            <button
              onClick={() => onRetire(component.id)}
              className="rounded bg-yellow-100 px-3 py-1 text-sm text-yellow-800 hover:bg-yellow-200"
            >
              Retire
            </button>
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