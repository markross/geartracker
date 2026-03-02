import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getComponents } from "@/lib/components";
import { redirect } from "next/navigation";
import Link from "next/link";
import ComponentList from "./ComponentList";

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

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Components</h1>
        <Link href="/bikes" className="text-blue-600 hover:underline">
          Back to Bikes
        </Link>
      </div>
      <ComponentList bikeId={bikeId} initialComponents={components ?? []} />
    </div>
  );
}