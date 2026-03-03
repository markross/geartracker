import type { SupabaseClient } from "@supabase/supabase-js";
import type { RideInsert } from "./types";

export async function getRides(supabase: SupabaseClient, userId: string) {
  return supabase
    .from("rides")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false });
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
