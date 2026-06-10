import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import { addAuthorizedEmail, removeAuthorizedEmail, setUserRole } from "./actions";

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Accès refusé
          </h1>
          <p className="text-slate-600 mb-6">
            Cette page est réservée aux administrateurs Phoenix.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-phoenix-600 hover:bg-phoenix-700 text-white px-4 py-2 rounded-lg"
          >
            ← Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { data: authorizedEmails } = await supabase
    .from("authorized_emails")
    .select("*")
    .order("added_at", { ascending: false });

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, role, full_name, created_at, last_login_at")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div>
          <h1 className="font-bold leading-tight">Administration Phoenix</h1>
          <p className="text-xs text-slate-300">Gestion des accès au portail</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline text-slate-300">
            {profile.email}
          </span>
          <Link
            href="/dashboard"
            className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md text-sm"
          >
            ← Dashboard
          </Link>
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

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Ajouter un email autorisé */}
        <section className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold mb-1">
            Autoriser un nouvel utilisateur
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Saisis l&apos;email d&apos;une personne autorisée à se connecter.
            Elle pourra ensuite se connecter en recevant un code à 6 chiffres
            par mail.
          </p>
          <form
            action={async (fd) => {
              "use server";
              await addAuthorizedEmail(fd);
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              name="email"
              type="email"
              required
              placeholder="prenom.nom@phoenix.sn"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-phoenix-500"
            />
            <input
              name="notes"
              type="text"
              placeholder="Nom / fonction (optionnel)"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-phoenix-500"
            />
            <button
              type="submit"
              className="bg-phoenix-600 hover:bg-phoenix-700 text-white font-semibold px-4 py-2 rounded-lg"
            >
              + Ajouter
            </button>
          </form>
        </section>

        {/* Liste des emails autorisés */}
        <section className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold mb-1">
            Emails autorisés ({authorizedEmails?.length ?? 0})
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Ces emails peuvent demander un code de connexion. Retire-en un pour
            bloquer l&apos;accès futur (l&apos;utilisateur déjà connecté gardera
            sa session jusqu&apos;à expiration).
          </p>
          {!authorizedEmails || authorizedEmails.length === 0 ? (
            <p className="text-sm text-slate-500 italic">
              Aucun email autorisé pour l&apos;instant.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {authorizedEmails.map((row) => (
                <li
                  key={row.email}
                  className="py-2 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">
                      {row.email}
                    </div>
                    <div className="text-xs text-slate-500">
                      {row.notes ? `${row.notes} · ` : ""}
                      Ajouté{" "}
                      {new Date(row.added_at).toLocaleDateString("fr-FR")} par{" "}
                      {row.added_by ?? "—"}
                    </div>
                  </div>
                  <form
                    action={async (fd) => {
                      "use server";
                      await removeAuthorizedEmail(fd);
                    }}
                  >
                    <input type="hidden" name="email" value={row.email} />
                    <button
                      type="submit"
                      className="text-xs text-red-600 hover:text-red-800 hover:underline"
                    >
                      Retirer
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Utilisateurs connectés au moins une fois */}
        <section className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold mb-1">
            Utilisateurs ({profiles?.length ?? 0})
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Personnes qui se sont déjà connectées au moins une fois. Tu peux
            changer leur rôle (RH ou admin).
          </p>
          {!profiles || profiles.length === 0 ? (
            <p className="text-sm text-slate-500 italic">
              Aucun utilisateur connecté pour l&apos;instant.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {profiles.map((p) => (
                <li
                  key={p.id}
                  className="py-2 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">
                      {p.email}
                    </div>
                    <div className="text-xs text-slate-500">
                      Inscrit{" "}
                      {new Date(p.created_at).toLocaleDateString("fr-FR")}
                      {p.last_login_at &&
                        ` · Dernière connexion ${new Date(p.last_login_at).toLocaleDateString("fr-FR")}`}
                    </div>
                  </div>
                  <form
                    action={async (fd) => {
                      "use server";
                      await setUserRole(fd);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="user_id" value={p.id} />
                    <select
                      name="role"
                      defaultValue={p.role}
                      className="text-xs px-2 py-1 border border-slate-300 rounded-md bg-white"
                    >
                      <option value="rh">RH</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      type="submit"
                      className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md"
                    >
                      Enregistrer
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
