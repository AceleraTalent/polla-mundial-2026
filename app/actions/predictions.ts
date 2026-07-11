"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  matchId: z.coerce.number().int().positive(),
  home: z.coerce.number().int().min(0).max(99),
  away: z.coerce.number().int().min(0).max(99),
  penaltyWinnerTeamId: z.coerce.number().int().positive().optional().nullable(),
});

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function savePrediction(input: {
  matchId: number;
  home: number;
  away: number;
  penaltyWinnerTeamId?: number | null;
}): Promise<SaveResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Marcador inválido (0–99)." };
  }
  const { matchId, home, away, penaltyWinnerTeamId } = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada." };

  const { data: match } = await supabase
    .from("matches")
    .select("matchday, stage, home_team_id, away_team_id")
    .eq("id", matchId)
    .maybeSingle();
  if (!match) return { ok: false, error: "Partido no encontrado." };

  if (penaltyWinnerTeamId != null) {
    if (match.stage === "group") {
      return { ok: false, error: "El pick de penales solo aplica en eliminatoria." };
    }
    if (penaltyWinnerTeamId !== match.home_team_id && penaltyWinnerTeamId !== match.away_team_id) {
      return { ok: false, error: "Ese equipo no juega este partido." };
    }
  }

  if (match.stage === "group") {
    if (!match.matchday) return { ok: false, error: "Partido no encontrado." };
    const { data: open } = await supabase.rpc("is_phase_open", {
      p_key: `md${match.matchday}`,
    });
    if (!open) return { ok: false, error: "Esta jornada está cerrada." };
  } else {
    // Eliminatoria: cierra 15 minutos antes del pitazo (check en servidor)
    const { data: matchKickoff } = await supabase
      .from("matches")
      .select("kickoff_at")
      .eq("id", matchId)
      .maybeSingle();
    if (!matchKickoff) return { ok: false, error: "Partido no encontrado." };
    const cutoff = new Date(matchKickoff.kickoff_at).getTime() - 15 * 60 * 1000;
    if (Date.now() >= cutoff) {
      return { ok: false, error: "Este partido ya cerró (cierra 15 min antes del pitazo)." };
    }
  }

  // Use service role to bypass RLS (all validation already done above)
  const { createClient: createAdmin } = await import("@supabase/supabase-js");
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Si no viene el pick de penales en este guardado (p.ej. solo cambió el
  // marcador), conserva el que ya tenía guardado en vez de borrarlo.
  let finalPenaltyWinnerTeamId = penaltyWinnerTeamId ?? null;
  if (penaltyWinnerTeamId === undefined) {
    const { data: existing } = await admin
      .from("predictions")
      .select("penalty_winner_team_id")
      .eq("user_id", user.id)
      .eq("match_id", matchId)
      .maybeSingle();
    finalPenaltyWinnerTeamId = existing?.penalty_winner_team_id ?? null;
  }

  const { error } = await admin.from("predictions").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      home_score: home,
      away_score: away,
      penalty_winner_team_id: finalPenaltyWinnerTeamId,
    },
    { onConflict: "user_id,match_id" },
  );

  if (error) {
    return { ok: false, error: "No se pudo guardar. Intenta de nuevo." };
  }
  revalidatePath("/predicciones");
  revalidatePath("/llave");
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const { createClient: createAdmin } = await import("@supabase/supabase-js");
  const admin = createAdmin(url, serviceKey);

  const { data, error } = await admin
    .from("predictions")
    .select("user_id, home_score, away_score, profiles!inner(nickname, avatar_id)")
    .eq("match_id", matchId)
    .order("user_id");

  if (error) return { ok: false, error: error.message };

  const rows = (data ?? []).map((r) => {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      user_id: r.user_id,
      nickname: (profile as { nickname: string; avatar_id: string | null })?.nickname ?? "",
      avatar_id: (profile as { nickname: string; avatar_id: string | null })?.avatar_id ?? null,
      home_score: r.home_score,
      away_score: r.away_score,
    };
  });

  return { ok: true, data: rows };
}
