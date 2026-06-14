import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ESPN display name → our team code
const ESPN_NAME_TO_CODE: Record<string, string> = {
  "Mexico": "MEX", "South Africa": "RSA", "South Korea": "KOR", "Czechia": "CZE",
  "Canada": "CAN", "Bosnia-Herzegovina": "BIH", "United States": "USA", "Paraguay": "PAR",
  "Qatar": "QAT", "Switzerland": "SUI", "Brazil": "BRA", "Morocco": "MAR",
  "Haiti": "HAI", "Scotland": "SCO", "Australia": "AUS", "Turkey": "TUR",
  "Germany": "GER", "Curacao": "CUW", "Ivory Coast": "CIV", "Ecuador": "ECU",
  "Netherlands": "NED", "Japan": "JPN", "Sweden": "SWE", "Tunisia": "TUN",
  "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN", "New Zealand": "NZL",
  "Spain": "ESP", "Cape Verde": "CPV", "Saudi Arabia": "KSA", "Uruguay": "URU",
  "France": "FRA", "Senegal": "SEN", "Iraq": "IRQ", "Norway": "NOR",
  "Argentina": "ARG", "Algeria": "ALG", "Austria": "AUT", "Jordan": "JOR",
  "Portugal": "POR", "DR Congo": "COD", "Uzbekistan": "UZB", "Colombia": "COL",
  "England": "ENG", "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN",
  // alternate spellings ESPN might use
  "Côte d'Ivoire": "CIV", "Cote d'Ivoire": "CIV", "Korea Republic": "KOR",
  "Czech Republic": "CZE", "Bosnia and Herzegovina": "BIH", "Bosnia & Herzegovina": "BIH",
  "United States of America": "USA", "Türkiye": "TUR", "IR Iran": "IRN",
  "Curaçao": "CUW",
};

async function fetchESPNScores(dateStr: string): Promise<Map<string, { homeCode: string; awayCode: string; homeScore: number; awayScore: number }>> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return new Map();

  const data = await res.json();
  const scores = new Map<string, { homeCode: string; awayCode: string; homeScore: number; awayScore: number }>();

  for (const event of (data.events ?? [])) {
    const comp = event.competitions?.[0];
    if (!comp) continue;
    const status = comp.status?.type?.name;
    if (status !== "STATUS_FULL_TIME") continue;

    const home = comp.competitors?.find((c: { homeAway: string }) => c.homeAway === "home");
    const away = comp.competitors?.find((c: { homeAway: string }) => c.homeAway === "away");
    if (!home || !away) continue;

    const homeCode = ESPN_NAME_TO_CODE[home.team?.displayName];
    const awayCode = ESPN_NAME_TO_CODE[away.team?.displayName];
    if (!homeCode || !awayCode) continue;

    const key = `${homeCode}-${awayCode}`;
    scores.set(key, {
      homeCode,
      awayCode,
      homeScore: parseInt(home.score ?? "0", 10),
      awayScore: parseInt(away.score ?? "0", 10),
    });
  }
  return scores;
}

export async function POST(request: Request) {
  const secret = process.env.SYNC_SECRET;
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Get all pending matches (past kickoff, no result yet)
  const { data: matches } = await supabase
    .from("matches")
    .select("id, kickoff_at, home_team:teams!matches_home_team_id_fkey(code), away_team:teams!matches_away_team_id_fkey(code), match_results(match_id)")
    .lt("kickoff_at", new Date().toISOString())
    .order("kickoff_at");

  const pending = (matches ?? []).filter(
    (m) => !m.match_results || (m.match_results as unknown[]).length === 0,
  );

  if (pending.length === 0) {
    return NextResponse.json({ ok: true, updated: 0, message: "No pending matches" });
  }

  // Collect unique dates (YYYYMMDD in UTC)
  const dates = [...new Set(
    pending.map((m) => new Date(m.kickoff_at).toISOString().slice(0, 10).replace(/-/g, "")),
  )];

  // Also check day before and after to handle timezone edge cases
  const extendedDates = new Set<string>();
  for (const d of dates) {
    const dt = new Date(`${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`);
    const prev = new Date(dt); prev.setDate(prev.getDate() - 1);
    const next = new Date(dt); next.setDate(next.getDate() + 1);
    extendedDates.add(d);
    extendedDates.add(prev.toISOString().slice(0,10).replace(/-/g,""));
    extendedDates.add(next.toISOString().slice(0,10).replace(/-/g,""));
  }

  // Fetch ESPN scores for all relevant dates
  const allScores = new Map<string, { homeCode: string; awayCode: string; homeScore: number; awayScore: number }>();
  await Promise.all([...extendedDates].map(async (date) => {
    const scores = await fetchESPNScores(date);
    for (const [key, val] of scores) allScores.set(key, val);
  }));

  // Match pending games to ESPN results
  const upserts: { match_id: number; home_score: number; away_score: number }[] = [];

  for (const match of pending) {
    const home = (match.home_team as unknown as { code: string } | null)?.code;
    const away = (match.away_team as unknown as { code: string } | null)?.code;
    if (!home || !away) continue;

    const score = allScores.get(`${home}-${away}`);
    if (!score) continue;

    upserts.push({ match_id: match.id, home_score: score.homeScore, away_score: score.awayScore });
  }

  if (upserts.length === 0) {
    return NextResponse.json({ ok: true, updated: 0, message: "No finished matches found in ESPN" });
  }

  const { error } = await supabase
    .from("match_results")
    .upsert(upserts, { onConflict: "match_id" });

  if (error) {
    return NextResponse.json({ error: "DB error", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    updated: upserts.length,
    matches: upserts,
  });
}
