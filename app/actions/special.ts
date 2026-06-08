"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const teamId = z
  .union([z.coerce.number().int().positive(), z.literal("").transform(() => null), z.null()])
  .nullable();

const schema = z.object({
  champion_team_id: teamId,
  runner_up_team_id: teamId,
  semifinalist1_id: teamId,
  semifinalist2_id: teamId,
  top_scorer: z.string().trim().max(60).optional().nullable(),
});

export type SpecialResult = { ok: true } | { ok: false; error: string };

export async function saveSpecial(input: {
  champion_team_id: string | number | null;
  runner_up_team_id: string | number | null;
  semifinalist1_id: string | number | null;
  semifinalist2_id: string | number | null;
  top_scorer: string | null;
}): Promise<SpecialResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos." };
  }
  const data = parsed.data;

  // Subcampeón y campeón no pueden ser el mismo; semifinalistas distintos entre sí.
  if (
    data.champion_team_id &&
    data.runner_up_team_id &&
    data.champion_team_id === data.runner_up_team_id
  ) {
    return { ok: false, error: "Campeón y subcampeón deben ser distintos." };
  }
  if (
    data.semifinalist1_id &&
    data.semifinalist2_id &&
    data.semifinalist1_id === data.semifinalist2_id
  ) {
    return { ok: false, error: "Los dos semifinalistas deben ser distintos." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada." };

  const { data: open } = await supabase.rpc("is_phase_open", { p_key: "special" });
  if (!open) {
    return { ok: false, error: "Las predicciones especiales están cerradas." };
  }

  const { error } = await supabase.from("special_predictions").upsert(
    {
      user_id: user.id,
      champion_team_id: data.champion_team_id,
      runner_up_team_id: data.runner_up_team_id,
      semifinalist1_id: data.semifinalist1_id,
      semifinalist2_id: data.semifinalist2_id,
      top_scorer: data.top_scorer || null,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { ok: false, error: "No se pudo guardar. Intenta de nuevo." };
  }

  revalidatePath("/especiales");
  return { ok: true };
}
