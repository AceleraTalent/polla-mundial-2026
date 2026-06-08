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

// ── Ver pronósticos de todos para un partido ────────────────────────────────

export type MatchPred = {
  user_id: string;
  nickname: string;
  avatar_id: string | null;
  home_score: number;
  away_score: number;
};

export type FetchPredsResult =
  | { ok: true; data: MatchPred[] }
  | { ok: false; error: string };

export async function fetchMatchPredictions(matchId: number): Promise<FetchPredsResult> {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("get_match_predictions", {
    p_match_id: matchId,
  });
  if (error) return { ok: false, error: (error as { message: string }).message };
  return { ok: true, data: ((data as unknown) ?? []) as MatchPred[] };
}
