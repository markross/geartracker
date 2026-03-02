import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getBikes } from "@/lib/bikes";
import { redirect } from "next/navigation";
import BikeList from "./BikeList";

export default async function BikesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: bikes } = await getBikes(supabase, user.id);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">My Bikes</h1>
      <BikeList initialBikes={bikes ?? []} />
    </div>
  );
}
