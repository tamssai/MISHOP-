// Auth démo: comptes en dur côté serveur. À remplacer par une vraie source.
export type DemoUser = { email: string; password: string; name: string };

export const DEMO_USERS: DemoUser[] = [
  { email: "rh@phoenix.sn", password: "phoenix2026", name: "Service RH" },
  { email: "admin@phoenix.sn", password: "admin2026", name: "Admin" },
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
