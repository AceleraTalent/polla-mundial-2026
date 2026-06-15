import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
  "Portugal": "POR", "DR Congo": "COD", "Congo DR": "COD", "Uzbekistan": "UZB", "Colombia": "COL",
  "England": "ENG", "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN",
  "Côte d'Ivoire": "CIV", "Cote d'Ivoire": "CIV", "Korea Republic": "KOR",
  "Czech Republic": "CZE", "Bosnia and Herzegovina": "BIH", "Bosnia & Herzegovina": "BIH",
  "United States of America": "USA", "Türkiye": "TUR", "IR Iran": "IRN", "Curaçao": "CUW",
};

async function fetchESPNScores(dateStr: string): Promise<Map<string, { homeScore: number; awayScore: number }>> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return new Map();

  const data = await res.json();
  const scores = new Map<string, { homeScore: number; awayScore: number }>();

  for (const event of (data.events ?? [])) {
    const comp = event.competitions?.[0];
    if (!comp) continue;
    if (comp.status?.type?.name !== "STATUS_FULL_TIME") continue;

    const home = comp.competitors?.find((c: { homeAway: string }) => c.homeAway === "home");
    const away = comp.competitors?.find((c: { homeAway: string }) => c.homeAway === "away");
    if (!home || !away) continue;

    const homeCode = ESPN_NAME_TO_CODE[home.team?.displayName];
    const awayCode = ESPN_NAME_TO_CODE[away.team?.displayName];
    if (!homeCode || !awayCode) continue;

    const homeScore = parseInt(home.score ?? "0", 10);
    const awayScore = parseInt(away.score ?? "0", 10);
    scores.set(`${homeCode}-${awayCode}`, { homeScore, awayScore });
    scores.set(`${awayCode}-${homeCode}`, { homeScore: awayScore, awayScore: homeScore });
  }
  return scores;
}

async function runSync() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: matches } = await supabase
    .from("matches")
    .select("id, kickoff_at, home_team:teams!matches_home_team_id_fkey(code), away_team:teams!matches_away_team_id_fkey(code), match_results(match_id)")
    .lt("kickoff_at", new Date().toISOString())
    .order("kickoff_at");

  const pending = (matches ?? []).filter(
    (m) => !m.match_results || (m.match_results as unknown[]).length === 0,
  );

  if (pending.length === 0) {
    return { ok: true, updated: 0, message: "No pending matches" };
  }

  // Collect dates ±1 day to handle timezone edge cases
  const extendedDates = new Set<string>();
  for (const m of pending) {
    const base = new Date(m.kickoff_at);
    for (const offset of [-1, 0, 1]) {
      const d = new Date(base);
      d.setDate(d.getDate() + offset);
      extendedDates.add(d.toISOString().slice(0, 10).replace(/-/g, ""));
    }
  }

  const allScores = new Map<string, { homeScore: number; awayScore: number }>();
  await Promise.all([...extendedDates].map(async (date) => {
    const scores = await fetchESPNScores(date);
    for (const [key, val] of scores) allScores.set(key, val);
  }));

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
    return { ok: true, updated: 0, message: "No finished matches found in ESPN yet" };
  }

  const { error } = await supabase
    .from("match_results")
    .upsert(upserts, { onConflict: "match_id" });

  if (error) throw new Error(error.message);

  return { ok: true, updated: upserts.length, matches: upserts };
}

// GET — called by Vercel Cron (no auth header, internal only)
export async function GET() {
  try {
    const result = await runSync();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST — called by external crons (cron-job.org, Railway, etc.) with Bearer token
export async function POST(request: Request) {
  const secret = process.env.SYNC_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runSync();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
