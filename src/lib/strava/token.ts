import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "../types";
import { refreshStravaToken } from "./strava";

export async function getValidStravaToken(
  user: User,
  supabase: SupabaseClient,
  clientId: string,
  clientSecret: string
): Promise<string> {
  const expiresAt = new Date(user.strava_token_expires_at || 0).getTime();
  const now = Date.now();

  // Token still valid (with 60s buffer)
  if (expiresAt > now + 60_000) {
    return user.strava_access_token!;
  }

  // Need to refresh
  if (!user.strava_refresh_token) {
    throw new Error("No refresh token available");
  }

  const refreshed = await refreshStravaToken(
    user.strava_refresh_token,
    clientId,
    clientSecret
  );

  // Update tokens in DB
  const { error: updateError } = await supabase
    .from("users")
    .update({
      strava_access_token: refreshed.access_token,
      strava_refresh_token: refreshed.refresh_token,
      strava_token_expires_at: new Date(
        refreshed.expires_at * 1000
      ).toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    throw new Error(`Failed to persist refreshed token: ${updateError.message}`);
  }

  return refreshed.access_token;
}
