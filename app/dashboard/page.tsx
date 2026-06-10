import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import DashboardClient from "@/components/DashboardClient";
import { sites, agents } from "@/lib/data";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email, full_name")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const displayEmail = profile?.email ?? user.email ?? "";

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between shadow-lg z-[1000]">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-bold leading-tight">
              Phoenix Sénégal — Portail RH
            </h1>
            <p className="text-xs text-slate-300 leading-tight">
              {sites.length} sites · {agents.length} agents
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline text-slate-300">{displayEmail}</span>
          {isAdmin && (
            <Link
              href="/admin"
              className="bg-phoenix-600 hover:bg-phoenix-700 px-3 py-1.5 rounded-md text-sm font-medium"
            >
              Admin
            </Link>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md text-sm"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <DashboardClient sites={sites} agents={agents} />
      </main>
    </div>
  );
}
