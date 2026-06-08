import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type SessionContext = {
  user: { id: string; email: string | null };
  profile: Profile | null;
  isAdmin: boolean;
};

/** Devuelve la sesión + perfil, o redirige a /login si no hay usuario. */
export async function requireUser(): Promise<SessionContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user: { id: user.id, email: user.email ?? null },
    profile: profile ?? null,
    isAdmin: isAdminEmail(user.email),
  };
}

/** Igual que requireUser pero exige onboarding completo. */
export async function requireOnboarded(): Promise<SessionContext> {
  const ctx = await requireUser();
  if (!ctx.profile?.is_onboarded) redirect("/onboarding");
  return ctx;
}

/** Exige que el usuario sea admin (allowlist de email). */
export async function requireAdmin(): Promise<SessionContext> {
  const ctx = await requireUser();
  if (!ctx.isAdmin) redirect("/");
  return ctx;
}
