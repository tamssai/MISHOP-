// Re-export du client Supabase navigateur (pour les composants client).
// Conservé pour rétrocompatibilité avec le code existant.

import { createClient } from "./supabase/client";

export function getSupabase() {
  if (typeof window === "undefined") return null;
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_KEY
  ) {
    return null;
  }
  return createClient();
}

export function isSupabaseConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_KEY
  );
}
