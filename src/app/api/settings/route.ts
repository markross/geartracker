import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const VALID_UNITS = ["km", "mi"] as const;

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("distance_unit")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ distance_unit: profile.distance_unit });
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { distance_unit } = body;

  if (!VALID_UNITS.includes(distance_unit)) {
    return NextResponse.json(
      { error: "Invalid distance_unit. Must be 'km' or 'mi'" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("users")
    .update({ distance_unit })
    .eq("id", user.id)
    .select("distance_unit")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }

  return NextResponse.json({ distance_unit: data.distance_unit });
}
