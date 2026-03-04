import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "../types";
import { fetchStravaActivity } from "./activities";
import { getValidStravaToken } from "./token";
import { processSingleActivity, type SingleActivityResult } from "../sync";
import { deleteRideByStravaId } from "../rides";

export interface StravaWebhookEvent {
  object_type: "activity" | "athlete";
  object_id: number;
  aspect_type: "create" | "update" | "delete";
  owner_id: number;
  subscription_id: number;
  event_time: number;
  updates?: Record<string, unknown>;
}

async function lookupUser(supabase: SupabaseClient, athleteId: number): Promise<User> {
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("strava_athlete_id", athleteId)
    .single();

  if (error || !user) {
    throw new Error(`User not found for athlete ${athleteId}`);
  }
  return user as User;
}

export async function processWebhookEvent(
  supabase: SupabaseClient,
  event: StravaWebhookEvent,
  clientId: string,
  clientSecret: string
): Promise<SingleActivityResult> {
  // Only process activity events
  if (event.object_type !== "activity") {
    return { action: "ignored", bike_created: false };
  }

  if (event.aspect_type === "delete") {
    const user = await lookupUser(supabase, event.owner_id);
    const { error } = await deleteRideByStravaId(supabase, user.id, event.object_id);
    if (error) {
      throw new Error(`Failed to delete ride for activity ${event.object_id}: ${error.message}`);
    }
    return { action: "deleted", bike_created: false };
  }

  if (event.aspect_type !== "create") {
    return { action: "ignored", bike_created: false };
  }

  const user = await lookupUser(supabase, event.owner_id);
  const token = await getValidStravaToken(user, supabase, clientId, clientSecret);
  const activity = await fetchStravaActivity(token, event.object_id);

  return processSingleActivity(supabase, user, activity, token);
}
