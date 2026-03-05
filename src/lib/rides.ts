import type { SupabaseClient } from "@supabase/supabase-js";
import type { RideInsert } from "./types";

export async function getRides(supabase: SupabaseClient, userId: string) {
  return supabase
    .from("rides")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false });
}

export async function getRidesCount(supabase: SupabaseClient, userId: string) {
  return supabase.from("rides").select('*', { count: 'exact', head: true }).eq('user_id', userId);
}

export async function getRidesForBike(
  supabase: SupabaseClient,
  userId: string,
  bikeId: string
) {
  return supabase
    .from("rides")
    .select("*")
    .eq("user_id", userId)
    .eq("bike_id", bikeId)
    .order("started_at", { ascending: false });
}

export async function createRide(supabase: SupabaseClient, ride: RideInsert) {
  return supabase.from("rides").insert(ride).select().single();
}

export async function getUnassignedRides(supabase: SupabaseClient, userId: string) {
  return supabase
    .from("rides")
    .select("*")
    .eq("user_id", userId)
    .is("bike_id", null)
    .order("started_at", { ascending: false });
}

export async function getBikeTotalDistances(
  supabase: SupabaseClient,
  userId: string
): Promise<Record<string, number>> {
  const { data } = await supabase
    .from("rides")
    .select("bike_id, distance_km")
    .eq("user_id", userId)
    .not("bike_id", "is", null);

  const totals: Record<string, number> = {};
  for (const ride of data ?? []) {
    if (ride.bike_id) {
      totals[ride.bike_id] = (totals[ride.bike_id] ?? 0) + ride.distance_km;
    }
  }
  return totals;
}

export async function deleteRideByStravaId(
  supabase: SupabaseClient,
  userId: string,
  stravaActivityId: number
) {
  return supabase
    .from("rides")
    .delete()
    .eq("user_id", userId)
    .eq("strava_activity_id", stravaActivityId);
}

export async function updateRideBike(
  supabase: SupabaseClient,
  rideId: string,
  userId: string,
  bikeId: string | null
) {
  return supabase
    .from("rides")
    .update({ bike_id: bikeId })
    .eq("id", rideId)
    .eq("user_id", userId)
    .select()
    .single();
}
