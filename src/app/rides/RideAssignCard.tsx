"use client";

import { useState } from "react";
import type { Ride, Bike } from "@/lib/types";

interface RideAssignCardProps {
  ride: Ride;
  bikes: Bike[];
  onAssigned: (rideId: string, bikeId: string) => void;
}

export default function RideAssignCard({ ride, bikes, onAssigned }: RideAssignCardProps) {
  const [selectedBikeId, setSelectedBikeId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!selectedBikeId) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/rides/${ride.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bike_id: selectedBikeId }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Failed to assign bike");
        return;
      }

      onAssigned(ride.id, selectedBikeId);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  const date = new Date(ride.started_at).toLocaleDateString();
  const distanceKm = Math.round(ride.distance_km * 10) / 10;

  return (
    <div className="rounded-lg border border-zinc-200 p-4" data-testid={`ride-card-${ride.id}`}>
      <div className="mb-2">
        <h3 className="font-medium">{ride.name}</h3>
        <p className="text-sm text-zinc-500">
          {date} &middot; {distanceKm} km
        </p>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={selectedBikeId}
          onChange={(e) => setSelectedBikeId(e.target.value)}
          className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm"
          data-testid="bike-select"
        >
          <option value="">Select a bike...</option>
          {bikes.map((bike) => (
            <option key={bike.id} value={bike.id}>
              {bike.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleSave}
          disabled={!selectedBikeId || saving}
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Assign"}
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
