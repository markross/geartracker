"use client";

import type { ComponentWearStats, DistanceUnit } from "@/lib/types";
import { formatDistance } from "@/lib/distance";
import WearBar from "./WearBar";
import { COMPONENT_TYPE_LABELS } from "@/lib/constants";

interface ComponentWearCardProps {
  stats: ComponentWearStats;
  distanceUnit: DistanceUnit;
}

export default function ComponentWearCard({ stats, distanceUnit }: ComponentWearCardProps) {
  const { component, distance_km, wear_pct, status } = stats;

  return (
    <div
      className={`rounded-lg border p-3 ${
        status === "overdue" || status === "critical"
          ? "border-red-200 bg-red-50"
          : status === "warning"
          ? "border-yellow-200 bg-yellow-50"
          : "border-zinc-200"
      }`}
      data-testid={`wear-card-${component.id}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{component.name}</h4>
          <p className="text-xs text-zinc-500">
            {COMPONENT_TYPE_LABELS[component.type] ?? component.type}
          </p>
        </div>
        <p className="text-sm text-zinc-600">
          {formatDistance(distance_km, distanceUnit)} / {formatDistance(component.max_distance_km, distanceUnit)}
        </p>
      </div>
      <WearBar wear_pct={wear_pct} status={status} />
    </div>
  );
}
