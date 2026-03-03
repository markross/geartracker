import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUnassignedRides } from "@/lib/rides";
import { getBikes } from "@/lib/bikes";
import { redirect } from "next/navigation";
import Link from "next/link";
import UnassignedRideList from "./UnassignedRideList";

export default async function RidesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const [{ data: rides }, { data: bikes }] = await Promise.all([
    getUnassignedRides(supabase, user.id),
    getBikes(supabase, user.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Unassigned Rides</h1>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
      <UnassignedRideList
        initialRides={rides ?? []}
        bikes={(bikes ?? []).filter((b) => b.is_active)}
      />
    </div>
  );
}
