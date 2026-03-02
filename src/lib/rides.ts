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
