import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getBikes } from "@/lib/bikes";
import { getComponents } from "@/lib/components";
import { getUnassignedRides } from "@/lib/rides";
import { getBikeWearStats } from "@/lib/wear";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardView from "./DashboardView";
import type { DistanceUnit } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const [{ data: bikes }, { data: unassignedRides }, { data: profile }] = await Promise.all([
    getBikes(supabase, user.id),
    getUnassignedRides(supabase, user.id),
    supabase.from("users").select("distance_unit").eq("id", user.id).single(),
  ]);
  const distanceUnit: DistanceUnit = profile?.distance_unit ?? "km";
  const activeBikes = (bikes ?? []).filter((b) => b.is_active);

  const wearData = await Promise.all(
    activeBikes.map(async (bike) => {
      const { data: components } = await getComponents(supabase, bike.id);
      const activeComponents = (components ?? []).filter((c) => !c.retired_at);
      return getBikeWearStats(supabase, bike, activeComponents);
    })
  );

  const unassignedCount = unassignedRides?.length ?? 0;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/bikes"
          className="rounded bg-zinc-100 px-3 py-1 text-sm hover:bg-zinc-200"
        >
          Manage Bikes
        </Link>
      </div>
      {unassignedCount > 0 && (
        <Link
          href="/rides"
          className="mb-6 block rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 hover:bg-yellow-100"
        >
          You have {unassignedCount} ride{unassignedCount !== 1 ? "s" : ""} not assigned to a bike &rarr;
        </Link>
      )}
      <DashboardView initialData={wearData} distanceUnit={distanceUnit} />
    </div>
  );
}
