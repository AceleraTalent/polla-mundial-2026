import { requireOnboarded } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { type BracketMatchVM } from "@/components/bracket-view";
import { getBracketSlot } from "@/lib/bracket-slots";
import { LlaveClient } from "./llave-client";

export const dynamic = "force-dynamic";

const CUTOFF_MS = 60 * 60 * 1000;

const STAGE_LABELS: Record<string, string> = {
  r32:   "32avos de Final",
  r16:   "Octavos de Final",
  qf:    "Cuartos de Final",
  sf:    "Semifinales",
  final: "Final",
};

export default async function LlavePage() {
  const { user } = await requireOnboarded();
  const supabase = createClient();

  const [{ data: knockoutMatches }, { data: teams }, { data: results }, { data: preds }] =
    await Promise.all([
      supabase
        .from("matches")
        .select("id,stage,home_team_id,away_team_id,kickoff_at,bracket_slot")
        .neq("stage", "group")
        .order("kickoff_at"),
      supabase.from("teams").select("id,name,flag_emoji,code"),
      supabase.from("match_results").select("match_id,home_score,away_score,penalty_winner_team_id"),
      supabase
        .from("predictions")
        .select("match_id,home_score,away_score,penalty_winner_team_id")
        .eq("user_id", user.id),
    ]);

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));
  const resultMap = new Map((results ?? []).map((r) => [r.match_id, r]));
  const predMap = new Map((preds ?? []).map((p) => [p.match_id, p]));
  const now = Date.now();

  // Assign bracket slots: R32 uses hardcoded FIFA bracket positions;
  // later rounds use sequential index within the stage.
  const stageCounters = new Map<string, number>();
  const allMatches = (knockoutMatches ?? []).map((m) => {
    const home = teamMap.get(m.home_team_id);
    const away = teamMap.get(m.away_team_id);
    const result = resultMap.get(m.id);
    const pred = predMap.get(m.id);
    const kickoffMs = new Date(m.kickoff_at).getTime();
    const seqIdx = (stageCounters.get(m.stage) ?? 0) + 1;
    stageCounters.set(m.stage, seqIdx);
    const slot = getBracketSlot(m.id, m.stage, seqIdx, m.bracket_slot);
    return { m, home, away, result, pred, kickoffMs, slot };
  });

  const STAGE_ORDER: Record<string, number> = { r32: 0, r16: 1, qf: 2, sf: 3, final: 4 };

  // Sort: by stage first, then by bracket slot (matches the visual bracket order)
  const sortedMatches = [...allMatches].sort((a, b) => {
    const stageDiff = (STAGE_ORDER[a.m.stage] ?? 99) - (STAGE_ORDER[b.m.stage] ?? 99);
    if (stageDiff !== 0) return stageDiff;
    return a.slot - b.slot;
  });

  const bracketMatches: BracketMatchVM[] = sortedMatches.map(({ m, home, away, result, kickoffMs, slot }) => ({
    id: m.id,
    stage: m.stage,
    bracket_slot: slot,
    home: home ? { name: home.name, flag: home.flag_emoji } : null,
    away: away ? { name: away.name, flag: away.flag_emoji } : null,
    result: result ? { home: result.home_score, away: result.away_score } : null,
    kickoff_at: m.kickoff_at,
    isOpen: kickoffMs - now > CUTOFF_MS,
  }));

  // Build MatchVM list for cards (with prediction inputs), in bracket order for R32
  const matchVMs = sortedMatches.map(({ m, home, away, result, pred, kickoffMs, slot }) => ({
    id: m.id,
    matchday: 0,
    group: "",
    stage: m.stage,
    bracket_slot: slot,
    kickoff_at: m.kickoff_at,
    home: { name: home?.name ?? "Por definir", flag: home?.flag_emoji ?? "🏳️", id: home?.id },
    away: { name: away?.name ?? "Por definir", flag: away?.flag_emoji ?? "🏳️", id: away?.id },
    prediction: pred ? { home: pred.home_score, away: pred.away_score } : null,
    result: result ? { home: result.home_score, away: result.away_score } : null,
    isColombiaMatch: home?.code === "COL" || away?.code === "COL",
    locked: kickoffMs - now <= CUTOFF_MS,
    penaltyWinnerTeamId: pred?.penalty_winner_team_id ?? null,
    actualPenaltyWinnerTeamId: result?.penalty_winner_team_id ?? null,
  }));

  const stages = ["r32", "r16", "qf", "sf", "final"] as const;
  const byStage = stages
    .map((stage) => ({
      stage,
      label: STAGE_LABELS[stage],
      bracket: bracketMatches.filter((m) => m.stage === stage),
      cards: matchVMs.filter((m) => m.stage === stage),
    }))
    .filter((s) => s.cards.length > 0);

  const hasAnyMatches = matchVMs.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Llave del Mundial 2026</h1>
        <p className="text-sm text-muted-foreground">
          Ingresa tu predicción en cada partido antes del pitazo.
        </p>
      </div>

      {!hasAnyMatches ? (
        <div className="rounded-xl border bg-white p-10 text-center text-muted-foreground">
          <p className="text-lg font-semibold">Próximamente…</p>
          <p className="text-sm mt-1">
            Los 32avos de final se publicarán cuando termine la fase de grupos.
          </p>
        </div>
      ) : (
        <LlaveClient byStage={byStage} bracketMatches={bracketMatches} />
      )}
    </div>
  );
}
