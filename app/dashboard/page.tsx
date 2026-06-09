import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import DashboardClient from "@/components/DashboardClient";
import { sites, agents } from "@/lib/data";

export default function DashboardPage() {
  const session = cookies().get(SESSION_COOKIE);
  if (!session?.value) {
    redirect("/login");
  }
  const userEmail = decodeURIComponent(session.value);

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between shadow-lg z-[1000]">
        <div className="flex items-center gap-3">
          <img
            src="/phoenix-mark.svg"
            alt="Phoenix"
            className="h-9 w-auto"
          />
          <div>
            <h1 className="font-bold leading-tight">
              Phoenix Sénégal — Portail RH
            </h1>
            <p className="text-xs text-slate-300 leading-tight">
              {sites.length} sites · {agents.length} agents
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden sm:inline text-slate-300">{userEmail}</span>
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
