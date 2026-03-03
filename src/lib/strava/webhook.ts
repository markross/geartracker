import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "../types";
import { fetchStravaActivity } from "./activities";
import { getValidStravaToken } from "./token";
import { processSingleActivity, type SingleActivityResult } from "../sync";

export interface StravaWebhookEvent {
  object_type: "activity" | "athlete";
  object_id: number;
  aspect_type: "create" | "update" | "delete";
  owner_id: number;
  subscription_id: number;
  event_time: number;
  updates?: Record<string, unknown>;
}

export async function processWebhookEvent(
  supabase: SupabaseClient,
  event: StravaWebhookEvent,
  clientId: string,
  clientSecret: string
): Promise<SingleActivityResult> {
  // Only process activity creates
  if (event.object_type !== "activity" || event.aspect_type !== "create") {
    return { action: "ignored", bike_created: false };
  }

  // Look up user by strava_athlete_id
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("strava_athlete_id", event.owner_id)
    .single();

  if (userError || !user) {
    throw new Error(`User not found for athlete ${event.owner_id}`);
  }

  const typedUser = user as User;
  const token = await getValidStravaToken(typedUser, supabase, clientId, clientSecret);
  const activity = await fetchStravaActivity(token, event.object_id);

  return processSingleActivity(supabase, typedUser, activity, token);
}
