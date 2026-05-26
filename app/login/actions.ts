"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findUser, SESSION_COOKIE } from "@/lib/auth";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const user = findUser(email, password);
  if (!user) {
    redirect("/login?error=1");
  }

  cookies().set(SESSION_COOKIE, encodeURIComponent(user.email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect("/dashboard");
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
  redirect("/login");
}
