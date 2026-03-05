"use client";

import { useState } from "react";
import type { Ride, Bike, DistanceUnit } from "@/lib/types";
import { formatDistance } from "@/lib/distance";

interface BikeRideListProps {
  rides: Ride[];
  bikes: Bike[];
  currentBikeId: string;
  distanceUnit: DistanceUnit;
}

export default function BikeRideList({ rides: initialRides, bikes, currentBikeId, distanceUnit }: BikeRideListProps) {
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
        setRides((prev) => prev.filter((r) => r.id !== rideId));
      }
    } finally {
      setSavingId(null);
    }
  }

  if (rides.length === 0) {
    return <p className="text-sm text-zinc-500">No rides on this bike.</p>;
  }

  const otherBikes = bikes.filter((b) => b.id !== currentBikeId);

  return (
    <div className="space-y-2">
      <p className="text-sm text-zinc-500">
        {rides.length} ride{rides.length !== 1 ? "s" : ""} on this bike
      </p>
      {rides.map((ride) => {
        const date = new Date(ride.started_at).toLocaleDateString();
        return (
          <div key={ride.id} className="flex items-center justify-between rounded border border-zinc-200 px-3 py-2 text-sm">
            <div>
              <span className="font-medium">{ride.name}</span>
              <span className="ml-2 text-zinc-500">{date} &middot; {formatDistance(ride.distance_km, distanceUnit)}</span>
            </div>
            <select
              data-testid="reassign-select"
              value=""
              disabled={savingId === ride.id}
              onChange={(e) => handleReassign(ride.id, e.target.value)}
              className="rounded border border-zinc-300 px-2 py-1 text-xs"
            >
              <option value="">Move to...</option>
              {otherBikes.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
              <option value="__unassign__">Unassign</option>
            </select>
          </div>
        );
      })}
    </div>
  );
}
