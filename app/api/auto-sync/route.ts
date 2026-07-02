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

// Partidos de eliminatoria definidos en alargue/penales: ESPN reporta el
// marcador final (incluyendo goles de tiempo extra) en `score`, pero la
// polla puntúa el resultado de los 90 minutos. Sumamos los dos primeros
// periodos (1er y 2do tiempo) del summary para obtener ese marcador.
async function fetchRegulationScore(
  eventId: string,
): Promise<{ homeScore: number; awayScore: number } | null> {
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${eventId}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const comp = data.header?.competitions?.[0];
    const home = comp?.competitors?.find((c: { homeAway: string }) => c.homeAway === "home");
    const away = comp?.competitors?.find((c: { homeAway: string }) => c.homeAway === "away");
    const homeLines = home?.linescores;
    const awayLines = away?.linescores;
    if (!Array.isArray(homeLines) || !Array.isArray(awayLines) || homeLines.length < 2 || awayLines.length < 2) {
      return null;
    }
    const sum = (lines: { displayValue?: string }[]) =>
      parseInt(lines[0]?.displayValue ?? "0", 10) + parseInt(lines[1]?.displayValue ?? "0", 10);
    return { homeScore: sum(homeLines), awayScore: sum(awayLines) };
  } catch {
    return null;
  }
}

type SyncedScore = { homeScore: number; awayScore: number; penaltyWinnerCode: string | null };

async function fetchESPNScores(dateStr: string): Promise<Map<string, SyncedScore>> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return new Map();

  const data = await res.json();
  const scores = new Map<string, SyncedScore>();

  await Promise.all((data.events ?? []).map(async (event: { id?: string; competitions?: unknown[] }) => {
    const comp = event.competitions?.[0] as {
      status?: { type?: { completed?: boolean; name?: string } };
      competitors?: { homeAway: string; team?: { displayName?: string }; score?: string; winner?: boolean }[];
    } | undefined;
    if (!comp) return;
    // Acepta cualquier estado final: tiempo reglamentario (STATUS_FULL_TIME),
    // tiempo extra (STATUS_FINAL_AET) o penales (STATUS_FINAL_PEN), comunes
    // en la fase de eliminatoria. `completed` cubre estos y futuras variantes.
    if (comp.status?.type?.completed !== true) return;

    const home = comp.competitors?.find((c) => c.homeAway === "home");
    const away = comp.competitors?.find((c) => c.homeAway === "away");
    if (!home || !away) return;

    const homeCode = ESPN_NAME_TO_CODE[home.team?.displayName ?? ""];
    const awayCode = ESPN_NAME_TO_CODE[away.team?.displayName ?? ""];
    if (!homeCode || !awayCode) return;

    let homeScore = parseInt(home.score ?? "0", 10);
    let awayScore = parseInt(away.score ?? "0", 10);

    if (comp.status?.type?.name !== "STATUS_FULL_TIME" && event.id) {
      const regulation = await fetchRegulationScore(event.id);
      if (regulation) {
        homeScore = regulation.homeScore;
        awayScore = regulation.awayScore;
      }
    }

    // Ganador de la tanda de penales (si aplica): ESPN marca `winner: true`
    // en el competitor que avanzó, aunque el marcador haya quedado empatado.
    const penaltyWinnerCode =
      comp.status?.type?.name === "STATUS_FINAL_PEN"
        ? (home.winner ? homeCode : away.winner ? awayCode : null)
        : null;

    scores.set(`${homeCode}-${awayCode}`, { homeScore, awayScore, penaltyWinnerCode });
    scores.set(`${awayCode}-${homeCode}`, { homeScore: awayScore, awayScore: homeScore, penaltyWinnerCode });
  }));
  return scores;
}

async function runSync() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id, home_team_id, away_team_id, kickoff_at, home_team:teams!matches_home_team_id_fkey(code), away_team:teams!matches_away_team_id_fkey(code), match_results(match_id)",
    )
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

  const allScores = new Map<string, SyncedScore>();
  await Promise.all([...extendedDates].map(async (date) => {
    const scores = await fetchESPNScores(date);
    for (const [key, val] of scores) allScores.set(key, val);
  }));

  const upserts: { match_id: number; home_score: number; away_score: number; penalty_winner_team_id: number | null }[] = [];
  for (const match of pending) {
    const home = (match.home_team as unknown as { code: string } | null)?.code;
    const away = (match.away_team as unknown as { code: string } | null)?.code;
    if (!home || !away) continue;
    const score = allScores.get(`${home}-${away}`);
    if (!score) continue;
    const penaltyWinnerTeamId =
      score.penaltyWinnerCode === home
        ? match.home_team_id
        : score.penaltyWinnerCode === away
          ? match.away_team_id
          : null;
    upserts.push({
      match_id: match.id,
      home_score: score.homeScore,
      away_score: score.awayScore,
      penalty_winner_team_id: penaltyWinnerTeamId,
    });
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
