"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Réservé aux administrateurs");
  return { supabase, user };
}

export type ActionResult = { ok: boolean; message: string };

export async function addAuthorizedEmail(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireAdmin();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const notes = String(formData.get("notes") ?? "").trim();

    if (!email || !email.includes("@")) {
      return { ok: false, message: "Email invalide." };
    }

    const { error } = await supabase.from("authorized_emails").insert({
      email,
      added_by: user.email,
      notes: notes || null,
    });

    if (error) {
      if (error.code === "23505") {
        return { ok: false, message: `${email} est déjà autorisé.` };
      }
      return { ok: false, message: error.message };
    }

    revalidatePath("/admin");
    return { ok: true, message: `${email} ajouté à la liste autorisée.` };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Erreur inconnue",
    };
  }
}

export async function removeAuthorizedEmail(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();

    const { error } = await supabase
      .from("authorized_emails")
      .delete()
      .eq("email", email);

    if (error) return { ok: false, message: error.message };

    revalidatePath("/admin");
    return { ok: true, message: `${email} retiré de la liste autorisée.` };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Erreur inconnue",
    };
  }
}

export async function setUserRole(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const userId = String(formData.get("user_id") ?? "");
    const role = String(formData.get("role") ?? "rh");

    if (!["admin", "rh"].includes(role)) {
      return { ok: false, message: "Rôle invalide" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (error) return { ok: false, message: error.message };

    revalidatePath("/admin");
    return { ok: true, message: "Rôle mis à jour." };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Erreur inconnue",
    };
  }
}
