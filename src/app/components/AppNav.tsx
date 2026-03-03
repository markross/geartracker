import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/bikes", label: "Bikes" },
  { href: "/settings", label: "Settings" },
];

export default async function AppNav() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <nav className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-2xl items-center gap-6 px-6 py-3">
        <Link href="/dashboard" className="text-lg font-bold">
          GearTracker
        </Link>
        <div className="flex gap-4 overflow-x-auto">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="whitespace-nowrap text-sm text-zinc-600 hover:text-zinc-900"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
