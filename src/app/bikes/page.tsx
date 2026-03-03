import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getBikes } from "@/lib/bikes";
import { redirect } from "next/navigation";
import BikeList from "./BikeList";
import SyncButton from "./SyncButton";

export default async function BikesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: bikes } = await getBikes(supabase, user.id);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Bikes</h1>
        <SyncButton />
      </div>
      <BikeList initialBikes={bikes ?? []} />
    </div>
  );
}
