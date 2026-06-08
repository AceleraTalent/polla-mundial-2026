"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AVATARS } from "@/lib/avatars";
import { createClient } from "@/lib/supabase/server";

const avatarIds = AVATARS.map((a) => a.id) as [string, ...string[]];

const schema = z.object({
  nickname: z
    .string()
    .trim()
    .min(3, "El nickname debe tener al menos 3 caracteres")
    .max(20, "Máximo 20 caracteres")
    .regex(/^[\p{L}\p{N}_ .-]+$/u, "Solo letras, números y . _ -"),
  avatar_id: z.enum(avatarIds, { message: "Elige un avatar" }),
});

export type OnboardingState = { error?: string };

export async function saveOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const parsed = schema.safeParse({
    nickname: formData.get("nickname"),
    avatar_id: formData.get("avatar_id"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Vuelve a iniciar sesión." };

  const { error } = await supabase
    .from("profiles")
    .update({
      nickname: parsed.data.nickname,
      avatar_id: parsed.data.avatar_id,
      is_onboarded: true,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ese nickname ya está en uso. Prueba otro." };
    }
    return { error: "No se pudo guardar. Intenta de nuevo." };
  }

  revalidatePath("/", "layout");
  redirect("/predicciones");
}
