import Link from "next/link";

import { requireAdmin } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { AdminTabs, type AdminMatchVM } from "./admin-tabs";
import type { KnockoutMatchVM } from "./r32-editor";
import type { PlayerVM } from "./players-tab";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const supabase = createClient();

  const [
    { data: teams },
    { data: matches },
    { data: knockoutRaw },
    { data: results },
    { data: tournament },
    { data: windows },
    { data: leaderboard },
    { data: allPredictions },
    { data: allSpecials },
  ] = await Promise.all([
    supabase.from("teams").select("*").order("name"),
    supabase
      .from("matches")
      .select("id,matchday,group_letter,home_team_id,away_team_id,kickoff_at")
      .eq("stage", "group")
      .order("matchday")
      .order("group_letter")
      .order("kickoff_at"),
    supabase
      .from("matches")
      .select("id,stage,bracket_slot,home_team_id,away_team_id,kickoff_at")
      .neq("stage", "group")
      .order("bracket_slot", { ascending: true, nullsFirst: false })
      .order("kickoff_at"),
    supabase.from("match_results").select("match_id,home_score,away_score"),
    supabase.from("tournament_results").select("*").eq("id", 1).maybeSingle(),
    supabase.from("phase_windows").select("*").order("phase_key"),
    supabase.rpc("get_leaderboard"),
    supabase.from("predictions").select("user_id,match_id,home_score,away_score"),
    supabase
      .from("special_predictions")
      .select(
        "user_id,champion_team_id,runner_up_team_id,semifinalist1_id,semifinalist2_id,top_scorer",
      ),
  ]);

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));
  const resultMap = new Map((results ?? []).map((r) => [r.match_id, r]));

  // Colombia team id
  const colombiaId = teams?.find((t) => t.code === "COL")?.id ?? -1;

  const matchVMs: AdminMatchVM[] = (matches ?? []).map((m) => {
    const home = teamMap.get(m.home_team_id);
    const away = teamMap.get(m.away_team_id);
    const r = resultMap.get(m.id);
    return {
      id: m.id,
      matchday: m.matchday ?? 0,
      group: m.group_letter ?? "",
      home: { name: home?.name ?? "?", flag: home?.flag_emoji ?? "" },
      away: { name: away?.name ?? "?", flag: away?.flag_emoji ?? "" },
      result: r ? { home: r.home_score, away: r.away_score } : null,
    };
  });

  // Build a map: match_id → match info
  const matchInfoMap = new Map(
    (matches ?? []).map((m) => [
      m.id,
      {
        matchday: m.matchday ?? 0,
        group: m.group_letter ?? "",
        home: teamMap.get(m.home_team_id),
        away: teamMap.get(m.away_team_id),
        isColombiaMatch: m.home_team_id === colombiaId || m.away_team_id === colombiaId,
      },
    ]),
  );

  const colombiaMap = new Map(
    (matches ?? []).map((m) => [
      m.id,
      m.home_team_id === colombiaId || m.away_team_id === colombiaId,
    ]),
  );

  const knockoutMatchVMs: KnockoutMatchVM[] = (knockoutRaw ?? []).map((m) => {
    const home = teamMap.get(m.home_team_id);
    const away = teamMap.get(m.away_team_id);
    const r = resultMap.get(m.id);
    return {
      id: m.id,
      stage: m.stage,
      bracket_slot: m.bracket_slot ?? null,
      kickoff_at: m.kickoff_at,
      home: { name: home?.name ?? "?", flag: home?.flag_emoji ?? "", id: m.home_team_id },
      away: { name: away?.name ?? "?", flag: away?.flag_emoji ?? "", id: m.away_team_id },
      result: r ? { home: r.home_score, away: r.away_score } : null,
    };
  });

  // Build a map: match_id → result
  const specialTeamName = (id: number | null) => (id ? (teamMap.get(id)?.name ?? null) : null);

  // Group predictions by user
  const predsByUser = new Map<string, typeof allPredictions>();
  for (const pred of allPredictions ?? []) {
    if (!predsByUser.has(pred.user_id)) predsByUser.set(pred.user_id, []);
    predsByUser.get(pred.user_id)!.push(pred);
  }

  const specialByUser = new Map(
    (allSpecials ?? []).map((s) => [s.user_id, s]),
  );

  const players: PlayerVM[] = (leaderboard ?? []).map((row) => {
    const userPreds = predsByUser.get(row.user_id) ?? [];
    const userSpecial = specialByUser.get(row.user_id) ?? null;

    const predictions = userPreds.map((p) => {
      const info = matchInfoMap.get(p.match_id);
      const r = resultMap.get(p.match_id);
      return {
        matchday: info?.matchday ?? 0,
        group: info?.group ?? "",
        home: { name: info?.home?.name ?? "?", flag: info?.home?.flag_emoji ?? "" },
        away: { name: info?.away?.name ?? "?", flag: info?.away?.flag_emoji ?? "" },
        prediction: { home: p.home_score, away: p.away_score },
        result: r ? { home: r.home_score, away: r.away_score } : null,
        points: null,
        isColombiaMatch: info?.isColombiaMatch ?? false,
      };
    });

    return {
      user_id: row.user_id,
      nickname: row.nickname ?? "",
      avatar_id: row.avatar_id,
      match_points: row.match_points,
      special_points: row.special_points,
      total_points: row.total_points,
      predictions,
      special: userSpecial
        ? {
            champion: specialTeamName(userSpecial.champion_team_id),
            runner_up: specialTeamName(userSpecial.runner_up_team_id),
            semi1: specialTeamName(userSpecial.semifinalist1_id),
            semi2: specialTeamName(userSpecial.semifinalist2_id),
            top_scorer: userSpecial.top_scorer ?? null,
          }
        : null,
    };
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-extrabold">⚙️ Panel de administración</h1>
          <Link href="/predicciones" className="text-sm text-emerald-700 hover:underline">
            ← Volver a la app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <AdminTabs
          teams={teams ?? []}
          matches={matchVMs}
          knockoutMatches={knockoutMatchVMs}
          tournament={tournament ?? null}
          windows={windows ?? []}
          players={players}
          colombiaMap={colombiaMap}
        />
      </main>
    </div>
  );
}
