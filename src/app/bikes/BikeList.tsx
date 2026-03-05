"use client";

import { useState } from "react";
import type { Bike, DistanceUnit } from "@/lib/types";
import BikeCard from "./BikeCard";
import BikeForm from "./BikeForm";

interface BikeListProps {
  initialBikes: Bike[];
  bikeTotals: Record<string, number>;
  distanceUnit: DistanceUnit;
}

export default function BikeList({ initialBikes, bikeTotals, distanceUnit }: BikeListProps) {
  const [bikes, setBikes] = useState<Bike[]>(initialBikes);
  const [showForm, setShowForm] = useState(false);
  const [editingBike, setEditingBike] = useState<Bike | null>(null);
  const [error, setError] = useState("");

  async function handleCreate(data: { name: string }) {
    setError("");
    const res = await fetch("/api/bikes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error || "Failed to create bike");
      return;
    }
    const { bike } = await res.json();
    setBikes((prev) => [...prev, bike]);
    setShowForm(false);
  }

  async function handleUpdate(data: { name: string }) {
    if (!editingBike) return;
    setError("");
    const res = await fetch(`/api/bikes/${editingBike.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error || "Failed to update bike");
      return;
    }
    const { bike } = await res.json();
    setBikes((prev) => prev.map((b) => (b.id === bike.id ? bike : b)));
    setEditingBike(null);
  }

  async function handleDelete(id: string) {
    setError("");
    const res = await fetch(`/api/bikes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete bike");
      return;
    }
    setBikes((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {showForm || editingBike ? (
        <BikeForm
          bike={editingBike}
          onSubmit={editingBike ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingBike(null);
          }}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add Bike
        </button>
      )}

      {bikes.length === 0 && !showForm && (
        <p className="text-zinc-500">No bikes yet. Add one to get started.</p>
      )}

      <div className="space-y-2">
        {bikes.map((bike) => (
          <BikeCard
            key={bike.id}
            bike={bike}
            totalDistanceKm={bikeTotals[bike.id] ?? 0}
            distanceUnit={distanceUnit}
            onEdit={(b) => setEditingBike(b)}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
