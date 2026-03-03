import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getBikes } from "@/lib/bikes";
import { getComponents } from "@/lib/components";
import { getBikeWearStats } from "@/lib/wear";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: bikes, error: bikesError } = await getBikes(supabase, user.id);
  if (bikesError) {
    return NextResponse.json({ error: bikesError.message }, { status: 500 });
  }

  const activeBikes = (bikes ?? []).filter((b) => b.is_active);
  const results = await Promise.all(
    activeBikes.map(async (bike) => {
      const { data: components } = await getComponents(supabase, bike.id);
      const activeComponents = (components ?? []).filter((c) => !c.retired_at);
      return getBikeWearStats(supabase, bike, activeComponents);
    })
  );

  return NextResponse.json({ bikes: results });
}
