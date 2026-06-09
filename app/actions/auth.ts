"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type AuthState = { error?: string; message?: string };

// Next.js redirect() throws internally — must re-throw so the router handles it
function isRedirectError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as { digest: unknown }).digest === "string" &&
    (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  try {
    const parsed = credentialsSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      return { error: "Email o contraseña incorrectos." };
    }

    revalidatePath("/", "layout");
    redirect("/");
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("[login]", e);
    return { error: "Error de conexión. Verifica tu correo y contraseña." };
  }
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  try {
    const parsed = credentialsSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const supabase = createClient();
    const origin = headers().get("origin") ?? "";
    const { data, error } = await supabase.auth.signUp({
      ...parsed.data,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });

    if (error) {
      return { error: error.message };
    }

    // Si confirmación de email desactivada, ya hay sesión
    if (data.session) {
      revalidatePath("/", "layout");
      redirect("/");
    }

    return {
      message: "Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión.",
    };
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("[signup]", e);
    return { error: "Error al crear la cuenta. Intenta de nuevo." };
  }
}

export async function signOut() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // continue even if signout fails
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
