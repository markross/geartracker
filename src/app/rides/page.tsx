import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUnassignedRides, getRides } from "@/lib/rides";
import { getBikes } from "@/lib/bikes";
import { redirect } from "next/navigation";
import Link from "next/link";
import RideTabs from "./RideTabs";
import type { DistanceUnit } from "@/lib/types";

export default async function RidesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const [{ data: unassignedRides }, { data: allRides }, { data: bikes }, { data: profile }] = await Promise.all([
    getUnassignedRides(supabase, user.id),
    getRides(supabase, user.id),
    getBikes(supabase, user.id),
    supabase.from("users").select("distance_unit").eq("id", user.id).single(),
  ]);
  const distanceUnit: DistanceUnit = profile?.distance_unit ?? "km";
  const activeBikes = (bikes ?? []).filter((b) => b.is_active);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rides</h1>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
      <RideTabs
        unassignedRides={unassignedRides ?? []}
        allRides={allRides ?? []}
        bikes={activeBikes}
        distanceUnit={distanceUnit}
      />
    </div>
  );
}
