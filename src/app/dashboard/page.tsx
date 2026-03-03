import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getBikes } from "@/lib/bikes";
import { getComponents } from "@/lib/components";
import { getBikeWearStats } from "@/lib/wear";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardView from "./DashboardView";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: bikes } = await getBikes(supabase, user.id);
  const activeBikes = (bikes ?? []).filter((b) => b.is_active);

  const wearData = await Promise.all(
    activeBikes.map(async (bike) => {
      const { data: components } = await getComponents(supabase, bike.id);
      const activeComponents = (components ?? []).filter((c) => !c.retired_at);
      return getBikeWearStats(supabase, bike, activeComponents);
    })
  );

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
      <DashboardView initialData={wearData} />
    </div>
  );
}
