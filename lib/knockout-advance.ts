import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Calendario fijo del Mundial 2026 para cuartos, semis y la final. FIFA
 * publica estos horarios/venues desde antes de saber qué equipos juegan
 * (aparecen como "Round of 16 X Winner" etc. en el fixture oficial), así
 * que podemos crear el partido en cuanto se conocen ambos equipos sin
 * esperar a que alguien lo haga a mano.
 *
 * fromSlots: [slotLocal, slotVisitante] del bracket_slot de la fase
 * anterior — el de menor número siempre es local (mismo patrón que usa
 * el fixture oficial para los cruces ya conocidos).
 */
type BracketEdge = {
  fromStage: string;
  toStage: string;
  toSlot: number;
  fromSlots: [number, number];
  kickoffAt: string;
  /** Qué equipo alimenta el cruce: el que gana (default) o el que pierde
   *  (el partido por el tercer puesto lo juegan los perdedores de semis). */
  feeds?: "winner" | "loser";
};

const BRACKET_EDGES: BracketEdge[] = [
  { fromStage: "r16", toStage: "qf", toSlot: 1, fromSlots: [1, 2], kickoffAt: "2026-07-09T20:00:00Z" },
  { fromStage: "r16", toStage: "qf", toSlot: 2, fromSlots: [3, 4], kickoffAt: "2026-07-11T21:00:00Z" },
  { fromStage: "r16", toStage: "qf", toSlot: 3, fromSlots: [5, 6], kickoffAt: "2026-07-10T19:00:00Z" },
  { fromStage: "r16", toStage: "qf", toSlot: 4, fromSlots: [7, 8], kickoffAt: "2026-07-12T01:00:00Z" },
  { fromStage: "qf", toStage: "sf", toSlot: 1, fromSlots: [1, 2], kickoffAt: "2026-07-14T19:00:00Z" },
  { fromStage: "qf", toStage: "sf", toSlot: 2, fromSlots: [3, 4], kickoffAt: "2026-07-15T19:00:00Z" },
  { fromStage: "sf", toStage: "final", toSlot: 1, fromSlots: [1, 2], kickoffAt: "2026-07-19T19:00:00Z" },
  { fromStage: "sf", toStage: "third_place", toSlot: 1, fromSlots: [1, 2], kickoffAt: "2026-07-18T21:00:00Z", feeds: "loser" },
];

/**
 * Revisa cada cruce de la llave y crea el partido de la siguiente fase
 * en cuanto ambos equipos que lo alimentan ya están definidos (su
 * partido anterior tiene winner_team_id). No hace nada si el partido ya
 * existe o si algún feeder todavía no tiene ganador.
 */
export async function advanceBracket(admin: SupabaseClient): Promise<{ created: number[] }> {
  const stages = [...new Set(BRACKET_EDGES.flatMap((e) => [e.fromStage, e.toStage]))];

  const { data: matches } = await admin
    .from("matches")
    .select("id, stage, bracket_slot, home_team_id, away_team_id")
    .in("stage", stages);

  const { data: results } = await admin.from("match_results").select("match_id, winner_team_id");

  const winnerByMatch = new Map((results ?? []).map((r) => [r.match_id, r.winner_team_id]));
  const matchById = new Map((matches ?? []).map((m) => [m.id, m]));
  const loserByMatch = new Map<number, number | null>();
  for (const [matchId, winnerTeamId] of winnerByMatch) {
    const m = matchById.get(matchId);
    if (!m || winnerTeamId == null) continue;
    loserByMatch.set(
      matchId,
      winnerTeamId === m.home_team_id ? m.away_team_id : m.home_team_id,
    );
  }

  // stage -> slot -> teamId, uno para ganadores y otro para perdedores
  function buildSlotMap(source: Map<number, number | null>) {
    const map = new Map<string, Map<number, number | null>>();
    for (const m of matches ?? []) {
      if (m.bracket_slot == null) continue;
      if (!map.has(m.stage)) map.set(m.stage, new Map());
      map.get(m.stage)!.set(m.bracket_slot, source.get(m.id) ?? null);
    }
    return map;
  }
  const winnerSlotMap = buildSlotMap(winnerByMatch);
  const loserSlotMap = buildSlotMap(loserByMatch);

  // stage -> set of existing bracket_slot (para no duplicar)
  const existingSlots = new Map<string, Set<number>>();
  for (const m of matches ?? []) {
    if (m.bracket_slot == null) continue;
    if (!existingSlots.has(m.stage)) existingSlots.set(m.stage, new Set());
    existingSlots.get(m.stage)!.add(m.bracket_slot);
  }

  const created: number[] = [];

  for (const edge of BRACKET_EDGES) {
    if (existingSlots.get(edge.toStage)?.has(edge.toSlot)) continue;

    const fromSlots = (edge.feeds === "loser" ? loserSlotMap : winnerSlotMap).get(edge.fromStage);
    const homeTeam = fromSlots?.get(edge.fromSlots[0]);
    const awayTeam = fromSlots?.get(edge.fromSlots[1]);
    if (!homeTeam || !awayTeam) continue;

    const { data: inserted, error } = await admin
      .from("matches")
      .insert({
        stage: edge.toStage,
        home_team_id: homeTeam,
        away_team_id: awayTeam,
        kickoff_at: edge.kickoffAt,
        bracket_slot: edge.toSlot,
      })
      .select("id")
      .single();

    if (!error && inserted) created.push(inserted.id);
  }

  return { created };
}
