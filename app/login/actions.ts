"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type LoginState = {
  step: "email" | "code";
  email?: string;
  error?: string;
  info?: string;
};

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Étape 1 — l'utilisateur saisit son email.
 * On vérifie qu'il est dans la whitelist, puis on envoie le code par email.
 */
export async function sendCode(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { step: "email", error: "Email invalide." };
  }

  const supabase = createClient();

  // Vérifie que l'email est dans la whitelist
  const { data: allowed, error: rpcError } = await supabase.rpc(
    "is_email_authorized",
    { p_email: email },
  );

  if (rpcError) {
    return {
      step: "email",
      email,
      error: "Erreur de connexion au serveur. Réessaye plus tard.",
    };
  }

  if (!allowed) {
    return {
      step: "email",
      email,
      error:
        "Cet email n'est pas autorisé à accéder au portail. Contacte l'administrateur.",
    };
  }

  // Envoie le code OTP par email
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    return {
      step: "email",
      email,
      error: error.message,
    };
  }

  return {
    step: "code",
    email,
    info: `Code envoyé à ${email}. Vérifie ta boîte mail (et les spams).`,
  };
}

/**
 * Étape 2 — l'utilisateur saisit le code reçu par email.
 * On valide, on crée la session, on redirige vers le dashboard.
 */
export async function verifyCode(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "").replace(/\s/g, "");

  if (!email || !token) {
    return { step: "code", email, error: "Code manquant." };
  }

  const supabase = createClient();

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    return {
      step: "code",
      email,
      error: "Code invalide ou expiré. Demande un nouveau code.",
    };
  }

  // Met à jour last_login_at
  const { data: userData } = await supabase.auth.getUser();
  if (userData.user) {
    await supabase
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", userData.user.id);
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resendCode(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  return sendCode(_prev, formData);
}
