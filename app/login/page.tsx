"use client";

import { useFormState, useFormStatus } from "react-dom";
import { sendCode, verifyCode, type LoginState } from "./actions";

const initial: LoginState = { step: "email" };

export default function LoginPage() {
  const [state, action] = useFormState(
    async (prev: LoginState, formData: FormData) => {
      if (prev.step === "code" && formData.get("token")) {
        return verifyCode(prev, formData);
      }
      return sendCode(prev, formData);
    },
    initial,
  );

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

        {state.step === "email" ? (
          <EmailForm action={action} state={state} />
        ) : (
          <CodeForm action={action} state={state} />
        )}
      </div>
    </div>
  );
}

function EmailForm({
  action,
  state,
}: {
  action: (formData: FormData) => void;
  state: LoginState;
}) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Email professionnel
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          defaultValue={state.email}
          placeholder="vous@phoenix.sn"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-phoenix-500"
        />
        <p className="text-xs text-slate-500 mt-1">
          Nous t&apos;enverrons un code à 6 chiffres par email.
        </p>
      </div>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <SubmitButton label="Recevoir le code" pendingLabel="Envoi en cours…" />
    </form>
  );
}

function CodeForm({
  action,
  state,
}: {
  action: (formData: FormData) => void;
  state: LoginState;
}) {
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="email" value={state.email ?? ""} />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Code de connexion
        </label>
        <input
          name="token"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          autoFocus
          maxLength={6}
          pattern="[0-9]{6}"
          placeholder="123456"
          className="w-full px-3 py-3 text-center text-2xl font-mono tracking-widest border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-phoenix-500"
        />
        <p className="text-xs text-slate-500 mt-1">
          Code à 6 chiffres envoyé à <strong>{state.email}</strong>
        </p>
      </div>

      {state.info && !state.error && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {state.info}
        </p>
      )}

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <SubmitButton label="Se connecter" pendingLabel="Vérification…" />

      <ResendLink email={state.email ?? ""} />
    </form>
  );
}

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-phoenix-600 hover:bg-phoenix-700 disabled:bg-slate-400 text-white font-semibold py-2.5 rounded-lg transition-colors"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function ResendLink({ email }: { email: string }) {
  return (
    <form action="/login" method="get" className="text-center">
      <input type="hidden" name="email" value={email} />
      <button
        type="submit"
        className="text-xs text-slate-500 hover:text-phoenix-600"
      >
        ← Utiliser un autre email
      </button>
    </form>
  );
}
