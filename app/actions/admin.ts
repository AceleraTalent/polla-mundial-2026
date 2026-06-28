"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export type AdminResult = { ok: true } | { ok: false; error: string };

async function getAdminClient() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return { supabase: null as never, error: "No autorizado." as const };
  }
  return { supabase, error: null };
}

// --------------------------------------------------------------------- //
// Resultado real de un partido (gatilla el cálculo automático de puntos) //
// --------------------------------------------------------------------- //
const resultSchema = z.object({
  matchId: z.coerce.number().int().positive(),
  home: z.coerce.number().int().min(0).max(99),
  away: z.coerce.number().int().min(0).max(99),
});

export async function saveMatchResult(input: {
  matchId: number;
  home: number;
  away: number;
}): Promise<AdminResult> {
  const { supabase, error: authErr } = await getAdminClient();
  if (authErr) return { ok: false, error: authErr };

  const parsed = resultSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Marcador inválido (0–99)." };

  const { error } = await supabase.from("match_results").upsert(
    {
      match_id: parsed.data.matchId,
      home_score: parsed.data.home,
      away_score: parsed.data.away,
    },
    { onConflict: "match_id" },
  );
  if (error) return { ok: false, error: "No se pudo guardar el resultado." };

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  return { ok: true };
}

export async function clearMatchResult(matchId: number): Promise<AdminResult> {
  const { supabase, error: authErr } = await getAdminClient();
  if (authErr) return { ok: false, error: authErr };

  const { error } = await supabase.from("match_results").delete().eq("match_id", matchId);
  if (error) return { ok: false, error: "No se pudo borrar el resultado." };

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  return { ok: true };
}

// ----------------------------------------- //
// Resultados reales del torneo (especiales)  //
// ----------------------------------------- //
const teamId = z
  .union([z.coerce.number().int().positive(), z.literal("").transform(() => null), z.null()])
  .nullable();

const tournamentSchema = z.object({
  champion_team_id: teamId,
  runner_up_team_id: teamId,
  semifinalist1_id: teamId,
  semifinalist2_id: teamId,
  top_scorer: z.string().trim().max(60).optional().nullable(),
});

export async function saveTournamentResults(input: {
  champion_team_id: string | number | null;
  runner_up_team_id: string | number | null;
  semifinalist1_id: string | number | null;
  semifinalist2_id: string | number | null;
  top_scorer: string | null;
}): Promise<AdminResult> {
  const { supabase, error: authErr } = await getAdminClient();
  if (authErr) return { ok: false, error: authErr };

  const parsed = tournamentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const { error } = await supabase
    .from("tournament_results")
    .update({ ...parsed.data, top_scorer: parsed.data.top_scorer || null })
    .eq("id", 1);
  if (error) return { ok: false, error: "No se pudo guardar." };

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  return { ok: true };
}

// ------------------------------------------ //
// Partidos eliminatorios (R32, R16, QF…)     //
// ------------------------------------------ //
const knockoutMatchSchema = z.object({
  stage: z.enum(["r32", "r16", "qf", "sf", "final"]),
  home_team_id: z.coerce.number().int().positive(),
  away_team_id: z.coerce.number().int().positive(),
  kickoff_at: z.string().min(1),
  bracket_slot: z.coerce.number().int().positive().optional().nullable(),
});

export async function createKnockoutMatch(input: {
  stage: string;
  home_team_id: number;
  away_team_id: number;
  kickoff_at: string;
  bracket_slot?: number | null;
}): Promise<AdminResult> {
  const { supabase, error: authErr } = await getAdminClient();
  if (authErr) return { ok: false, error: authErr };

  const parsed = knockoutMatchSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const kickoff = new Date(parsed.data.kickoff_at);
  if (Number.isNaN(kickoff.getTime())) return { ok: false, error: "Fecha inválida." };

  const { error } = await supabase.from("matches").insert({
    stage: parsed.data.stage,
    home_team_id: parsed.data.home_team_id,
    away_team_id: parsed.data.away_team_id,
    kickoff_at: kickoff.toISOString(),
  });
  if (error) return { ok: false, error: "No se pudo crear el partido." };

  revalidatePath("/admin");
  revalidatePath("/predicciones");
  revalidatePath("/llave");
  return { ok: true };
}

export async function deleteKnockoutMatch(matchId: number): Promise<AdminResult> {
  const { supabase, error: authErr } = await getAdminClient();
  if (authErr) return { ok: false, error: authErr };

  // Sólo borra partidos de eliminatoria (no fase de grupos)
  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("id", matchId)
    .neq("stage", "group");
  if (error) return { ok: false, error: "No se pudo borrar el partido." };

  revalidatePath("/admin");
  revalidatePath("/predicciones");
  revalidatePath("/llave");
  return { ok: true };
}

// -------------------------- //
// Ventanas de predicción      //
// -------------------------- //
const windowSchema = z.object({
  phase_key: z.string().min(1),
  opens_at: z.string().min(1),
  locks_at: z.string().min(1),
});

export async function savePhaseWindow(input: {
  phase_key: string;
  opens_at: string;
  locks_at: string;
}): Promise<AdminResult> {
  const { supabase, error: authErr } = await getAdminClient();
  if (authErr) return { ok: false, error: authErr };

  const parsed = windowSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Fechas inválidas." };

  const opens = new Date(parsed.data.opens_at);
  const locks = new Date(parsed.data.locks_at);
  if (Number.isNaN(opens.getTime()) || Number.isNaN(locks.getTime())) {
    return { ok: false, error: "Fechas inválidas." };
  }
  if (locks <= opens) {
    return { ok: false, error: "El cierre debe ser posterior a la apertura." };
  }

  const { error } = await supabase
    .from("phase_windows")
    .update({ opens_at: opens.toISOString(), locks_at: locks.toISOString() })
    .eq("phase_key", parsed.data.phase_key);
  if (error) return { ok: false, error: "No se pudo guardar la ventana." };

  revalidatePath("/admin");
  revalidatePath("/predicciones");
  return { ok: true };
}
