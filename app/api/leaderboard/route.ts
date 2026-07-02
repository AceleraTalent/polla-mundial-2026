import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { LeaderboardRow } from "@/lib/types";
import { fetchAll } from "@/lib/fetch-all";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const [matches, results, teams, predictions, profilesRes] = await Promise.all([
    fetchAll((from, to) =>
      admin.from("matches").select("id, home_team_id, away_team_id").range(from, to),
    ),
    fetchAll((from, to) =>
      admin
        .from("match_results")
        .select("match_id, home_score, away_score, penalty_winner_team_id")
        .range(from, to),
    ),
    fetchAll((from, to) => admin.from("teams").select("id, code").range(from, to)),
    fetchAll((from, to) =>
      admin
        .from("predictions")
        .select("user_id, match_id, home_score, away_score, penalty_winner_team_id")
        .range(from, to),
    ),
    admin.from("profiles").select("id, nickname, avatar_id").eq("is_onboarded", true),
  ]);

  const profiles = profilesRes.data ?? [];

  const resultMap = new Map(results.map((r) => [r.match_id, r]));

  // Colombia match IDs (double points)
  const colTeam = teams.find((t) => t.code === "COL");
  const colMatchIds = new Set(
    matches
      .filter((m) => m.home_team_id === colTeam?.id || m.away_team_id === colTeam?.id)
      .map((m) => m.id),
  );

  // Group predictions by user
  const userPreds = new Map<string, typeof predictions>();
  for (const p of predictions) {
    if (!userPreds.has(p.user_id)) userPreds.set(p.user_id, []);
    userPreds.get(p.user_id)!.push(p);
  }

  // Calculate match points per user
  const matchPts = new Map<string, number>();
  for (const [uid, preds] of userPreds) {
    let total = 0;
    for (const p of preds) {
      const r = resultMap.get(p.match_id);
      if (!r) continue;
      let base = 0;
      if (p.home_score === r.home_score && p.away_score === r.away_score) {
        base = 3;
      } else {
        const predSign = Math.sign(p.home_score - p.away_score);
        const resSign = Math.sign(r.home_score - r.away_score);
        if (predSign === resSign) base = 1;
      }
      total += base * (colMatchIds.has(p.match_id) ? 2 : 1);
      if (r.penalty_winner_team_id && p.penalty_winner_team_id === r.penalty_winner_team_id) {
        total += 1;
      }
    }
    matchPts.set(uid, total);
  }

  // Build leaderboard rows
  const rows: LeaderboardRow[] = profiles.map((pr) => {
    const mp = matchPts.get(pr.id) ?? 0;
    return {
      user_id: pr.id,
      nickname: pr.nickname,
      avatar_id: pr.avatar_id,
      match_points: mp,
      special_points: 0,
      total_points: mp,
    };
  });

  rows.sort((a, b) => b.total_points - a.total_points || (a.nickname ?? "").localeCompare(b.nickname ?? ""));

  return NextResponse.json(rows);
}
