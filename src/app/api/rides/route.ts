import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getRides, getUnassignedRides } from "@/lib/rides";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unassigned = request.nextUrl.searchParams.get("unassigned") === "true";

  const { data, error } = unassigned
    ? await getUnassignedRides(supabase, user.id)
    : await getRides(supabase, user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rides: data ?? [] });
}
