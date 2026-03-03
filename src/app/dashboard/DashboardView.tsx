"use client";

import Link from "next/link";
import type { BikeWearStats, DistanceUnit } from "@/lib/types";
import ComponentWearCard from "./ComponentWearCard";

interface DashboardViewProps {
  initialData: BikeWearStats[];
  distanceUnit: DistanceUnit;
}

export default function DashboardView({ initialData, distanceUnit }: DashboardViewProps) {
  if (initialData.length === 0) {
    return (
      <div className="text-center text-zinc-500">
        <p>No active bikes found.</p>
        <Link href="/bikes" className="mt-2 inline-block text-blue-600 hover:underline">
          Add a bike to get started
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {initialData.map(({ bike, components }) => (
        <section key={bike.id}>
          <div className="mb-3 flex items-center justify-between">
            <Link
              href={`/bikes/${bike.id}/components`}
              className="text-xl font-semibold hover:underline"
            >
              {bike.name}
            </Link>
            <span className="text-sm text-zinc-400">
              {components.length} component{components.length !== 1 ? "s" : ""}
            </span>
          </div>
          {components.length === 0 ? (
            <p className="text-sm text-zinc-400">No active components</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {components
                .sort((a, b) => b.wear_pct - a.wear_pct)
                .map((stats) => (
                  <ComponentWearCard key={stats.component.id} stats={stats} distanceUnit={distanceUnit} />
                ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
