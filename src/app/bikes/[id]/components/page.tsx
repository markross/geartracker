import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getComponents } from "@/lib/components";
import { getComponentWear } from "@/lib/wear";
import { redirect } from "next/navigation";
import Link from "next/link";
import ComponentList from "./ComponentList";
import type { ComponentWearStats } from "@/lib/types";

interface PageProps {
  params: { id: string };
}

export default async function ComponentsPage({ params }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { id: bikeId } = await params;
  const { data: components } = await getComponents(supabase, bikeId);

  const wearMap: Record<string, ComponentWearStats> = {};
  for (const comp of components ?? []) {
    if (!comp.retired_at) {
      wearMap[comp.id] = await getComponentWear(supabase, comp);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Components</h1>
        <div className="flex gap-3">
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Dashboard
          </Link>
          <Link href="/bikes" className="text-blue-600 hover:underline">
            Back to Bikes
          </Link>
        </div>
      </div>
      <ComponentList bikeId={bikeId} initialComponents={components ?? []} initialWear={wearMap} />
    </div>
  );
}