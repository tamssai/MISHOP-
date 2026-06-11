// Auth simple temporaire : comptes en dur côté serveur.
// La vraie auth Supabase (OTP / magic link + rôles admin/rh) est archivée
// dans _archive/ et sera réactivée plus tard.

export type DemoUser = { email: string; password: string; name: string };

export const DEMO_USERS: DemoUser[] = [
  { email: "rh@phoenix.sn", password: "phoenix2026", name: "Service RH" },
];

export const SESSION_COOKIE = "phoenix_session";

export function findUser(email: string, password: string): DemoUser | null {
  return (
    DEMO_USERS.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password,
    ) ?? null
  );
}
