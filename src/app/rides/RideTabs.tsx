"use client";

import { useState } from "react";
import type { Ride, Bike, DistanceUnit } from "@/lib/types";
import UnassignedRideList from "./UnassignedRideList";
import AllRideList from "./AllRideList";

interface RideTabsProps {
  unassignedRides: Ride[];
  allRides: Ride[];
  bikes: Bike[];
  distanceUnit: DistanceUnit;
}

export default function RideTabs({ unassignedRides, allRides, bikes, distanceUnit }: RideTabsProps) {
  const [tab, setTab] = useState<"unassigned" | "all">("unassigned");

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-lg bg-zinc-100 p-1">
        <button
          onClick={() => setTab("unassigned")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "unassigned" ? "bg-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"}`}
        >
          Unassigned ({unassignedRides.length})
        </button>
        <button
          onClick={() => setTab("all")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "all" ? "bg-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"}`}
        >
          All Rides ({allRides.length})
        </button>
      </div>
      {tab === "unassigned" ? (
        <UnassignedRideList initialRides={unassignedRides} bikes={bikes} distanceUnit={distanceUnit} />
      ) : (
        <AllRideList rides={allRides} bikes={bikes} distanceUnit={distanceUnit} />
      )}
    </div>
  );
}
