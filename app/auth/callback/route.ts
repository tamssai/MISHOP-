// Gère le retour du lien magique envoyé par email.
// Supabase appelle cette URL après que l'utilisateur a cliqué "Se connecter" dans son mail.

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = createClient();

  // Flow PKCE (lien magique moderne)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await updateLastLogin(supabase);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Flow token_hash (OTP / email confirmation legacy)
  if (tokenHash && type) {
    // type peut être: 'magiclink' | 'signup' | 'invite' | 'recovery' | 'email_change' | 'email'
    const { error } = await supabase.auth.verifyOtp({
      type: type as "magiclink" | "signup" | "invite" | "recovery" | "email_change" | "email",
      token_hash: tokenHash,
    });
    if (!error) {
      await updateLastLogin(supabase);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Échec
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Lien invalide ou expiré.")}`,
  );
}

async function updateLastLogin(supabase: ReturnType<typeof createClient>) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", user.id);
    }
  } catch {
    // silencieux
  }
}
