import type { SupabaseClient } from "@supabase/supabase-js";
import type { User, RideInsert } from "./types";
import { fetchAllStravaActivities } from "./strava/activities";
import { getValidStravaToken } from "./strava/token";
import { getBikes } from "./bikes";
import { getRides } from "./rides";

export interface SyncResult {
  fetched: number;
  imported: number;
  skipped: number;
  errors: number;
}

export async function syncStravaActivities(
  supabase: SupabaseClient,
  user: User,
  clientId: string,
  clientSecret: string
): Promise<SyncResult> {
  const token = await getValidStravaToken(user, supabase, clientId, clientSecret);

  // Fetch all activities (ride type only)
  const activities = await fetchAllStravaActivities(token);
  const rides = activities.filter((a) => a.type === "Ride" || a.type === "VirtualRide");

  // Get existing rides to dedup by strava_activity_id
  const { data: existingRides, error: ridesError } = await getRides(supabase, user.id);
  if (ridesError) {
    throw new Error(`Failed to fetch existing rides: ${ridesError.message}`);
  }
  const existingStravaIds = new Set(
    (existingRides ?? [])
      .map((r) => r.strava_activity_id)
      .filter((id): id is number => id !== null)
  );

  // Get bikes to match by strava_gear_id
  const { data: bikes, error: bikesError } = await getBikes(supabase, user.id);
  if (bikesError) {
    throw new Error(`Failed to fetch bikes: ${bikesError.message}`);
  }
  const gearToBike = new Map<string, string>();
  for (const bike of bikes ?? []) {
    if (bike.strava_gear_id) {
      gearToBike.set(bike.strava_gear_id, bike.id);
    }
  }

  // Build batch of new rides
  const newRides: RideInsert[] = [];
  let skipped = 0;

  for (const activity of rides) {
    if (existingStravaIds.has(activity.id)) {
      skipped++;
      continue;
    }

    const bikeId = activity.gear_id ? gearToBike.get(activity.gear_id) ?? null : null;

    newRides.push({
      user_id: user.id,
      strava_activity_id: activity.id,
      name: activity.name,
      distance_km: activity.distance / 1000,
      moving_time_seconds: activity.moving_time,
      started_at: activity.start_date,
      bike_id: bikeId,
    });
  }

  // Batch insert
  let imported = 0;
  let errors = 0;

  if (newRides.length > 0) {
    const { data, error } = await supabase
      .from("rides")
      .insert(newRides)
      .select();

    if (error) {
      throw new Error(`Failed to insert rides: ${error.message}`);
    }
    imported = data?.length ?? 0;
    errors = newRides.length - imported;
  }

  return { fetched: rides.length, imported, skipped, errors };
}
