"use client";

import { useState } from "react";
import type { Ride, Bike, DistanceUnit } from "@/lib/types";
import { formatDistance } from "@/lib/distance";

interface AllRideListProps {
  rides: Ride[];
  bikes: Bike[];
  distanceUnit: DistanceUnit;
}

export default function AllRideList({ rides: initialRides, bikes, distanceUnit }: AllRideListProps) {
  const [rides, setRides] = useState<Ride[]>(initialRides);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleReassign(rideId: string, value: string) {
    if (!value) return;
    const bikeId = value === "__unassign__" ? null : value;
    setSavingId(rideId);
    try {
      const res = await fetch(`/api/rides/${rideId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bike_id: bikeId }),
      });
      if (res.ok) {
        setRides((prev) => prev.map((r) => r.id === rideId ? { ...r, bike_id: bikeId } : r));
      }
    } finally {
      setSavingId(null);
    }
  }

  function bikeName(bikeId: string | null): string {
    if (!bikeId) return "Unassigned";
    return bikes.find((b) => b.id === bikeId)?.name ?? "Unknown bike";
  }

  if (rides.length === 0) {
    return <p className="text-center text-zinc-500">No rides yet.</p>;
  }

  return (
    <div className="space-y-2">
      {rides.map((ride) => {
        const date = new Date(ride.started_at).toLocaleDateString();
        const currentBike = ride.bike_id;
        const otherOptions = bikes.filter((b) => b.id !== currentBike);
        return (
          <div key={ride.id} data-testid={`ride-row-${ride.id}`} className="flex items-center justify-between rounded border border-zinc-200 px-3 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <span className="font-medium">{ride.name}</span>
              <span className="ml-2 text-zinc-500">{date} &middot; {formatDistance(ride.distance_km, distanceUnit)}</span>
              <span className={`ml-2 text-xs ${currentBike ? "text-blue-600" : "text-orange-500"}`}>
                {bikeName(currentBike)}
              </span>
            </div>
            <select
              data-testid="reassign-select"
              value=""
              disabled={savingId === ride.id}
              onChange={(e) => handleReassign(ride.id, e.target.value)}
              className="ml-2 rounded border border-zinc-300 px-2 py-1 text-xs"
            >
              <option value="">Move to...</option>
              {otherOptions.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
              {currentBike && <option value="__unassign__">Unassign</option>}
            </select>
          </div>
        );
      })}
    </div>
  );
}
