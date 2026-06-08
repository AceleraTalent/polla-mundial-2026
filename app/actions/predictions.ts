"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  matchId: z.coerce.number().int().positive(),
  home: z.coerce.number().int().min(0).max(99),
  away: z.coerce.number().int().min(0).max(99),
});

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function savePrediction(input: {
  matchId: number;
  home: number;
  away: number;
}): Promise<SaveResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Marcador inválido (0–99)." };
  }
  const { matchId, home, away } = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada." };

  // Validación de ventana (mensaje amigable; RLS es el backstop real).
  const { data: match } = await supabase
    .from("matches")
    .select("matchday")
    .eq("id", matchId)
    .maybeSingle();
  if (!match?.matchday) return { ok: false, error: "Partido no encontrado." };

  const { data: open } = await supabase.rpc("is_phase_open", {
    p_key: `md${match.matchday}`,
  });
  if (!open) {
    return { ok: false, error: "Esta jornada está cerrada." };
  }

  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      home_score: home,
      away_score: away,
    },
    { onConflict: "user_id,match_id" },
  );

  if (error) {
    return { ok: false, error: "No se pudo guardar. Intenta de nuevo." };
  }
  return { ok: true };
}
