"use client";

import { useState } from "react";
import type { Component, ComponentType, ComponentWearStats, DistanceUnit } from "@/lib/types";
import ComponentCard from "./ComponentCard";
import ComponentForm from "./ComponentForm";

interface ComponentListProps {
  bikeId: string;
  initialComponents: Component[];
  initialWear?: Record<string, ComponentWearStats>;
  distanceUnit: DistanceUnit;
}

export default function ComponentList({ bikeId, initialComponents, initialWear = {}, distanceUnit }: ComponentListProps) {
  const [components, setComponents] = useState<Component[]>(initialComponents);
  const [showForm, setShowForm] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [error, setError] = useState("");

  async function handleCreate(data: { name: string; type: ComponentType; max_distance_km: number }) {
    setError("");
    const res = await fetch(`/api/bikes/${bikeId}/components`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error || "Failed to create component");
      return;
    }
    const { component } = await res.json();
    setComponents((prev) => [...prev, component]);
    setShowForm(false);
  }

  async function handleUpdate(data: { name: string; type: ComponentType; max_distance_km: number }) {
    if (!editingComponent) return;
    setError("");
    const res = await fetch(`/api/bikes/${bikeId}/components/${editingComponent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error || "Failed to update component");
      return;
    }
    const { component } = await res.json();
    setComponents((prev) => prev.map((c) => (c.id === component.id ? component : c)));
    setEditingComponent(null);
  }

  async function handleDelete(id: string) {
    setError("");
    const res = await fetch(`/api/bikes/${bikeId}/components/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete component");
      return;
    }
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleRetire(id: string) {
    setError("");
    const res = await fetch(`/api/bikes/${bikeId}/components/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "retire" }),
    });
    if (!res.ok) {
      setError("Failed to retire component");
      return;
    }
    const { component } = await res.json();
    setComponents((prev) => prev.map((c) => (c.id === component.id ? component : c)));
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {showForm || editingComponent ? (
        <ComponentForm
          component={editingComponent}
          distanceUnit={distanceUnit}
          onSubmit={editingComponent ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingComponent(null);
          }}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add Component
        </button>
      )}

      {components.length === 0 && !showForm && (
        <p className="text-zinc-500">No components yet. Add one to start tracking wear.</p>
      )}

      <div className="space-y-2">
        {components.map((comp) => (
          <ComponentCard
            key={comp.id}
            component={comp}
            wear={initialWear[comp.id]}
            distanceUnit={distanceUnit}
            onEdit={(c) => setEditingComponent(c)}
            onDelete={handleDelete}
            onRetire={handleRetire}
          />
        ))}
      </div>
    </div>
  );
}