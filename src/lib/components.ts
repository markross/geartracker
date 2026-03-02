import type { SupabaseClient } from "@supabase/supabase-js";
import type { ComponentInsert, ComponentUpdate } from "./types";

export async function getComponents(
  supabase: SupabaseClient,
  bikeId: string
) {
  return supabase.from("components").select("*").eq("bike_id", bikeId);
}

export async function createComponent(
  supabase: SupabaseClient,
  component: ComponentInsert
) {
  return supabase.from("components").insert(component).select().single();
}

export async function updateComponent(
  supabase: SupabaseClient,
  id: string,
  updates: ComponentUpdate
) {
  return supabase.from("components").update(updates).eq("id", id);
}

export async function retireComponent(
  supabase: SupabaseClient,
  id: string,
  retiredAt: string
) {
  return supabase
    .from("components")
    .update({ retired_at: retiredAt })
    .eq("id", id);
}

export async function deleteComponent(supabase: SupabaseClient, id: string) {
  return supabase.from("components").delete().eq("id", id);
}
