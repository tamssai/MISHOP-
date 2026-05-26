import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";

export default function Home() {
  const session = cookies().get(SESSION_COOKIE);
  if (session?.value) {
    redirect("/dashboard");
  }
  redirect("/login");
}
