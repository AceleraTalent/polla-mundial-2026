/**
 * update-matches.mjs — Railway Cron Job
 * Consulta ESPN API → detecta partidos terminados → actualiza Supabase via REST.
 * Sin dependencias extra. Usa fetch nativo de Node 18+.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Faltan variables: NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates",
};

// ── Mapeo ESPN displayName → código de equipo en DB ──────────────────────
const ESPN_TO_CODE = {
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
  "Côte d'Ivoire": "CIV", "Cote d'Ivoire": "CIV", "Korea Republic": "KOR",
  "Czech Republic": "CZE", "Bosnia and Herzegovina": "BIH", "Bosnia & Herzegovina": "BIH",
  "United States of America": "USA", "Türkiye": "TUR", "IR Iran": "IRN", "Curaçao": "CUW",
};

// ── Supabase REST helpers ─────────────────────────────────────────────────
async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Supabase GET ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sbPost(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase POST ${path} → ${res.status}: ${await res.text()}`);
}

// ── ESPN API ──────────────────────────────────────────────────────────────
async function fetchFinishedFromESPN(dateStr) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`;
  const res = await fetch(url);
  if (!res.ok) return new Map();
  const data = await res.json();
  const scores = new Map();

  for (const event of (data.events ?? [])) {
    const comp = event.competitions?.[0];
    if (!comp || comp.status?.type?.name !== "STATUS_FULL_TIME") continue;

    const home = comp.competitors?.find((c) => c.homeAway === "home");
    const away = comp.competitors?.find((c) => c.homeAway === "away");
    if (!home || !away) continue;

    const homeCode = ESPN_TO_CODE[home.team?.displayName];
    const awayCode = ESPN_TO_CODE[away.team?.displayName];

    if (!homeCode || !awayCode) {
      console.warn(`  ⚠️  Sin mapeo: "${home.team?.displayName}" vs "${away.team?.displayName}"`);
      continue;
    }
    scores.set(`${homeCode}-${awayCode}`, {
      homeScore: parseInt(home.score ?? "0", 10),
      awayScore: parseInt(away.score ?? "0", 10),
    });
  }
  return scores;
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏆 update-matches — ${new Date().toISOString()}`);
  console.log("────────────────────────────────────────");

  // 1. Leer partidos sin resultado cuyo kickoff ya pasó
  const now = new Date().toISOString();
  const matches = await sbGet(
    `matches?select=id,kickoff_at,home_team:teams!matches_home_team_id_fkey(code),away_team:teams!matches_away_team_id_fkey(code)&kickoff_at=lt.${encodeURIComponent(now)}&order=kickoff_at.asc`,
  );
  const results = await sbGet("match_results?select=match_id");
  const doneIds = new Set(results.map((r) => r.match_id));
  const pending = matches.filter((m) => !doneIds.has(m.id));

  console.log(`📋 Partidos sin resultado: ${pending.length}`);
  if (pending.length === 0) {
    console.log("✅ Nada que actualizar.");
    process.exit(0);
  }

  // 2. Calcular fechas a consultar (±1 día para cubrir zonas horarias)
  const datesToFetch = new Set();
  for (const m of pending) {
    const base = new Date(m.kickoff_at);
    for (const offset of [-1, 0, 1]) {
      const d = new Date(base);
      d.setDate(d.getDate() + offset);
      datesToFetch.add(d.toISOString().slice(0, 10).replace(/-/g, ""));
    }
  }
  console.log(`🌐 Consultando ESPN: ${[...datesToFetch].sort().join(", ")}`);

  // 3. Obtener scores de ESPN
  const allScores = new Map();
  await Promise.all(
    [...datesToFetch].map(async (date) => {
      const s = await fetchFinishedFromESPN(date);
      for (const [k, v] of s) allScores.set(k, v);
    }),
  );
  console.log(`⚽ Partidos terminados encontrados en ESPN: ${allScores.size}`);

  // 4. Cruzar con pendientes
  const upserts = [];
  for (const m of pending) {
    const homeCode = m.home_team?.code;
    const awayCode = m.away_team?.code;
    if (!homeCode || !awayCode) continue;
    const score = allScores.get(`${homeCode}-${awayCode}`);
    if (!score) continue;
    console.log(`  ✔ Match #${m.id}: ${homeCode} ${score.homeScore}–${score.awayScore} ${awayCode}`);
    upserts.push({ match_id: m.id, home_score: score.homeScore, away_score: score.awayScore });
  }

  if (upserts.length === 0) {
    console.log("⏳ Ningún partido pendiente tiene resultado final en ESPN aún.");
    process.exit(0);
  }

  // 5. Guardar en Supabase
  await sbPost("match_results", upserts);
  console.log(`\n✅ ${upserts.length} resultado(s) guardado(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error inesperado:", err.message);
  process.exit(1);
});
