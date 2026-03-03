import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("distance_unit")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <SettingsForm initialUnit={profile?.distance_unit ?? "km"} />
    </div>
  );
}
