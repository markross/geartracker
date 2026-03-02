import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bike, BikeInsert, BikeUpdate } from "./types";

export async function getBikes(supabase: SupabaseClient, userId: string) {
  return supabase.from("bikes").select("*").eq("user_id", userId);
}

export async function createBike(supabase: SupabaseClient, bike: BikeInsert) {
  return supabase.from("bikes").insert(bike).select().single();
}

export async function updateBike(
  supabase: SupabaseClient,
  id: string,
  updates: BikeUpdate
) {
  return supabase.from("bikes").update(updates).eq("id", id).select().single();
}

export async function deleteBike(supabase: SupabaseClient, id: string) {
  return supabase.from("bikes").delete().eq("id", id);
}
