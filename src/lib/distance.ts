import type { DistanceUnit } from "./types";

const KM_PER_MILE = 1.60934;

export function kmToMiles(km: number): number {
  return km / KM_PER_MILE;
}

export function milesToKm(mi: number): number {
  return mi * KM_PER_MILE;
}

export function distanceLabel(unit: DistanceUnit): string {
  return unit;
}

/** Format a distance stored in km to the user's preferred unit. */
export function formatDistance(km: number, unit: DistanceUnit): string {
  const value = unit === "mi" ? kmToMiles(km) : km;
  return `${Math.round(value).toLocaleString()} ${unit}`;
}
