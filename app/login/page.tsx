import { login } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const hasError = !!searchParams?.error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-phoenix-900 to-phoenix-700 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/phoenix-logo.png"
            alt="Phoenix Sénégal — securite intelligente"
            className="w-64 h-auto mb-3"
          />
          <p className="text-xs text-slate-400 mt-2">
            Portail Ressources Humaines
          </p>
        </div>

        <form action={login} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email professionnel
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="vous@phoenix.sn"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-phoenix-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mot de passe
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-phoenix-500"
            />
          </div>

          {hasError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              Identifiants incorrects.
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-phoenix-600 hover:bg-phoenix-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
