import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Component,
  Bike,
  WearStatus,
  ComponentWearStats,
  BikeWearStats,
} from "./types";

export function getWearStatus(pct: number): WearStatus {
  if (pct > 100) return "overdue";
  if (pct > 80) return "critical";
  if (pct >= 60) return "warning";
  return "good";
}

export async function getComponentWear(
  supabase: SupabaseClient,
  component: Component
): Promise<ComponentWearStats> {
  const upperBound = component.retired_at ?? new Date().toISOString();

  const { data: rides, error } = await supabase
    .from("rides")
    .select("distance_km")
    .eq("bike_id", component.bike_id)
    .gte("started_at", component.installed_at)
    .lte("started_at", upperBound);

  if (error) throw error;

  const distance_km = (rides ?? []).reduce(
    (sum: number, r: { distance_km: number }) => sum + r.distance_km,
    0
  );

  const wear_pct =
    component.max_distance_km > 0
      ? Math.round((distance_km / component.max_distance_km) * 100)
      : 0;

  return {
    component,
    distance_km,
    wear_pct,
    status: getWearStatus(wear_pct),
  };
}

export async function getBikeWearStats(
  supabase: SupabaseClient,
  bike: Bike,
  components: Component[]
): Promise<BikeWearStats> {
  const stats = await Promise.all(
    components.map((c) => getComponentWear(supabase, c))
  );

  return { bike, components: stats };
}
