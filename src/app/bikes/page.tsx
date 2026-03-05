import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getBikes } from "@/lib/bikes";
import { getBikeTotalDistances } from "@/lib/rides";
import { redirect } from "next/navigation";
import BikeList from "./BikeList";
import SyncButton from "./SyncButton";
import type { DistanceUnit } from "@/lib/types";

export default async function BikesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const [{ data: bikes }, { data: profile }, bikeTotals] = await Promise.all([
    getBikes(supabase, user.id),
    supabase.from("users").select("distance_unit").eq("id", user.id).single(),
    getBikeTotalDistances(supabase, user.id),
  ]);
  const distanceUnit: DistanceUnit = profile?.distance_unit ?? "km";

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Bikes</h1>
        <SyncButton />
      </div>
      <BikeList initialBikes={bikes ?? []} bikeTotals={bikeTotals} distanceUnit={distanceUnit} />
    </div>
  );
}
