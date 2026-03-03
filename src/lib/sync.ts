import type { SupabaseClient } from "@supabase/supabase-js";
import type { User, RideInsert } from "./types";
import type { StravaActivity } from "./strava/activities";
import { fetchAllStravaActivities } from "./strava/activities";
import { getValidStravaToken } from "./strava/token";
import { fetchStravaGear, stravaGearDisplayName } from "./strava/gear";
import { getBikes, createBike } from "./bikes";
import { getRides, createRide } from "./rides";

export interface SyncResult {
  fetched: number;
  imported: number;
  skipped: number;
  errors: number;
  bikes_created: number;
}

export interface SingleActivityResult {
  action: "imported" | "skipped" | "ignored";
  bike_created: boolean;
}

export async function processSingleActivity(
  supabase: SupabaseClient,
  user: User,
  activity: StravaActivity,
  accessToken: string
): Promise<SingleActivityResult> {
  // Filter non-ride activities
  if (activity.type !== "Ride" && activity.type !== "VirtualRide") {
    return { action: "ignored", bike_created: false };
  }

  // Dedup check
  const { data: existingRides, error: ridesError } = await getRides(supabase, user.id);
  if (ridesError) {
    throw new Error(`Failed to fetch existing rides: ${ridesError.message}`);
  }
  const existingStravaIds = new Set(
    (existingRides ?? [])
      .map((r) => r.strava_activity_id)
      .filter((id): id is number => id !== null)
  );
  if (existingStravaIds.has(activity.id)) {
    return { action: "skipped", bike_created: false };
  }

  // Bike matching
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

  // Auto-create bike if needed
  let bikeCreated = false;
  if (activity.gear_id && !gearToBike.has(activity.gear_id)) {
    try {
      const gear = await fetchStravaGear(accessToken, activity.gear_id);
      const name = stravaGearDisplayName(gear);
      const { data: newBike, error } = await createBike(supabase, {
        user_id: user.id,
        name,
        strava_gear_id: activity.gear_id,
      });
      if (newBike && !error) {
        gearToBike.set(activity.gear_id, newBike.id);
        bikeCreated = true;
      }
    } catch {
      // Skip bike creation on error
    }
  }

  const bikeId = activity.gear_id ? gearToBike.get(activity.gear_id) ?? null : null;

  const ride: RideInsert = {
    user_id: user.id,
    strava_activity_id: activity.id,
    name: activity.name,
    distance_km: activity.distance / 1000,
    moving_time_seconds: activity.moving_time,
    started_at: activity.start_date,
    bike_id: bikeId,
  };

  const { error: insertError } = await createRide(supabase, ride);
  if (insertError) {
    throw new Error(`Failed to insert ride: ${insertError.message}`);
  }

  return { action: "imported", bike_created: bikeCreated };
}

export async function syncStravaActivities(
  supabase: SupabaseClient,
  user: User,
  clientId: string,
  clientSecret: string
): Promise<SyncResult> {
  const token = await getValidStravaToken(user, supabase, clientId, clientSecret);

  // Fetch all activities (ride type only)
  const activities = await fetchAllStravaActivities(token, 1741022636);
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

  // Auto-create bikes for unknown gear_ids
  const unknownGearIds = new Set<string>();
  for (const activity of rides) {
    if (activity.gear_id && !gearToBike.has(activity.gear_id)) {
      unknownGearIds.add(activity.gear_id);
    }
  }

  let bikesCreated = 0;
  for (const gearId of unknownGearIds) {
    try {
      const gear = await fetchStravaGear(token, gearId);
      const name = stravaGearDisplayName(gear);
      const { data: newBike, error } = await createBike(supabase, {
        user_id: user.id,
        name,
        strava_gear_id: gearId,
      });
      if (newBike && !error) {
        gearToBike.set(gearId, newBike.id);
        bikesCreated++;
      }
    } catch {
      // Skip bike creation on error, rides will get bike_id: null
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

  return { fetched: rides.length, imported, skipped, errors, bikes_created: bikesCreated };
}
