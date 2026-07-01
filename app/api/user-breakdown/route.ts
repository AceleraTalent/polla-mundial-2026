import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/fetch-all";

export type MatchBreakdownRow = {
  match_id: number;
  kickoff_at: string;
  group_letter: string;
  matchday: number;
  home_name: string;
  home_flag: string;
  away_name: string;
  away_flag: string;
  result_home: number;
  result_away: number;
  pred_home: number;
  pred_away: number;
  is_colombia: boolean;
  points: number;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  // Verify the caller is authenticated
  const serverClient = createServerClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Use service role to read any user's predictions (bypasses RLS)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const [predictions, matches, results, teams] = await Promise.all([
    fetchAll((from, to) =>
      admin
        .from("predictions")
        .select("match_id, home_score, away_score")
        .eq("user_id", userId)
        .range(from, to),
    ),
    fetchAll((from, to) =>
      admin
        .from("matches")
        .select("id, kickoff_at, group_letter, matchday, home_team_id, away_team_id")
        .range(from, to),
    ),
    fetchAll((from, to) =>
      admin.from("match_results").select("match_id, home_score, away_score").range(from, to),
    ),
    fetchAll((from, to) => admin.from("teams").select("id, name, flag_emoji, code").range(from, to)),
  ]);

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const resultMap = new Map(results.map((r) => [r.match_id, r]));
  const predMap = new Map(predictions.map((p) => [p.match_id, p]));

  // Colombia match IDs
  const colombiaTeam = teams.find((t) => t.code === "COL");
  const colombiaMatchIds = new Set(
    matches
      .filter((m) => m.home_team_id === colombiaTeam?.id || m.away_team_id === colombiaTeam?.id)
      .map((m) => m.id),
  );

  const rows: MatchBreakdownRow[] = [];

  for (const match of matches) {
    const result = resultMap.get(match.id);
    const pred = predMap.get(match.id);
    if (!result || !pred) continue; // only completed matches where user predicted

    const home = teamMap.get(match.home_team_id);
    const away = teamMap.get(match.away_team_id);
    if (!home || !away) continue;

    const isCol = colombiaMatchIds.has(match.id);
    const multiplier = isCol ? 2 : 1;

    let basePoints = 0;
    if (pred.home_score === result.home_score && pred.away_score === result.away_score) {
      basePoints = 3;
    } else {
      const predSign = Math.sign(pred.home_score - pred.away_score);
      const resSign = Math.sign(result.home_score - result.away_score);
      if (predSign === resSign) basePoints = 1;
    }

    rows.push({
      match_id: match.id,
      kickoff_at: match.kickoff_at,
      group_letter: match.group_letter ?? "",
      matchday: match.matchday ?? 1,
      home_name: home.name,
      home_flag: home.flag_emoji ?? "",
      away_name: away.name,
      away_flag: away.flag_emoji ?? "",
      result_home: result.home_score,
      result_away: result.away_score,
      pred_home: pred.home_score,
      pred_away: pred.away_score,
      is_colombia: isCol,
      points: basePoints * multiplier,
    });
  }

  rows.sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime());

  return NextResponse.json(rows);
}
