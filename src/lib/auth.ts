import type { SupabaseClient } from "@supabase/supabase-js";

export async function requireUser(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function verifyBikeOwnership(
  supabase: SupabaseClient,
  bikeId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("bikes")
    .select("id")
    .eq("id", bikeId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}
