"use client";

import { useState } from "react";
import type { Ride, Bike, DistanceUnit } from "@/lib/types";
import RideAssignCard from "./RideAssignCard";

interface UnassignedRideListProps {
  initialRides: Ride[];
  bikes: Bike[];
  distanceUnit: DistanceUnit;
}

export default function UnassignedRideList({ initialRides, bikes, distanceUnit }: UnassignedRideListProps) {
  const [rides, setRides] = useState<Ride[]>(initialRides);

  function handleAssigned(rideId: string) {
    setRides((prev) => prev.filter((r) => r.id !== rideId));
  }

  if (rides.length === 0) {
    return (
      <p className="text-center text-zinc-500">All rides are assigned to bikes.</p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500">
        {rides.length} ride{rides.length !== 1 ? "s" : ""} without a bike
      </p>
      {rides.map((ride) => (
        <RideAssignCard
          key={ride.id}
          ride={ride}
          bikes={bikes}
          distanceUnit={distanceUnit}
          onAssigned={handleAssigned}
        />
      ))}
    </div>
  );
}
