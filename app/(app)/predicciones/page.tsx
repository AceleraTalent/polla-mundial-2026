import type { MatchVM } from "@/components/match-card";
import { PrediccionesView } from "@/components/predicciones-view";
import { requireOnboarded } from "@/lib/auth-helpers";
import { windowStatus } from "@/lib/locks";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const locksFmt = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const COLOMBIA_CODE = "COL";
const CUTOFF_MS = 60 * 60 * 1000; // 1 hour in ms

export default async function PrediccionesPage() {
  const { user } = await requireOnboarded();
  const supabase = createClient();

  const [
    { data: teams },
    { data: groupMatches },
    { data: knockoutMatches },
    { data: preds },
    { data: windows },
    { data: results },
  ] = await Promise.all([
    supabase.from("teams").select("id,name,flag_emoji,code"),
    supabase
      .from("matches")
      .select("id,matchday,group_letter,kickoff_at,home_team_id,away_team_id,stage")
      .eq("stage", "group")
      .order("matchday")
      .order("group_letter")
      .order("kickoff_at"),
    supabase
      .from("matches")
      .select("id,matchday,group_letter,kickoff_at,home_team_id,away_team_id,stage,bracket_slot")
      .neq("stage", "group")
      .order("bracket_slot", { ascending: true, nullsFirst: false })
      .order("kickoff_at"),
    supabase
      .from("predictions")
      .select("match_id,home_score,away_score")
      .eq("user_id", user.id),
    supabase.from("phase_windows").select("*"),
    supabase.from("match_results").select("match_id,home_score,away_score"),
  ]);

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));
  const predMap = new Map((preds ?? []).map((p) => [p.match_id, p]));
  const windowMap = new Map((windows ?? []).map((w) => [w.phase_key, w]));
  const resultMap = new Map((results ?? []).map((r) => [r.match_id, r]));

  const now = Date.now();

  function buildVM(m: {
    id: number;
    matchday: number | null;
    group_letter: string | null;
    kickoff_at: string;
    home_team_id: number;
    away_team_id: number;
    stage: string;
    bracket_slot?: number | null;
  }, locked: boolean): MatchVM {
    const home = teamMap.get(m.home_team_id);
    const away = teamMap.get(m.away_team_id);
    const pred = predMap.get(m.id);
    const result = resultMap.get(m.id);
    const isColombiaMatch =
      home?.code === COLOMBIA_CODE || away?.code === COLOMBIA_CODE;
    return {
      id: m.id,
      matchday: m.matchday ?? 0,
      group: m.group_letter ?? "",
      stage: m.stage,
      bracket_slot: (m as { bracket_slot?: number | null }).bracket_slot ?? null,
      kickoff_at: m.kickoff_at,
      home: { name: home?.name ?? "?", flag: home?.flag_emoji ?? "" },
      away: { name: away?.name ?? "?", flag: away?.flag_emoji ?? "" },
      prediction: pred ? { home: pred.home_score, away: pred.away_score } : null,
      result: result ? { home: result.home_score, away: result.away_score } : null,
      isColombiaMatch,
      locked,
    };
  }

  const groupVMs: MatchVM[] = (groupMatches ?? []).map((m) => {
    const w = windowMap.get(`md${m.matchday}`);
    const status = windowStatus(w);
    return buildVM(m, status !== "open");
  });

  const knockoutVMs: MatchVM[] = (knockoutMatches ?? []).map((m) => {
    const kickoffMs = new Date(m.kickoff_at).getTime();
    const locked = kickoffMs - now <= CUTOFF_MS;
    return buildVM(m, locked);
  });

  const matchdayInfo = Object.fromEntries(
    [1, 2, 3].map((md) => {
      const w = windowMap.get(`md${md}`);
      const status = windowStatus(w);
      return [
        md,
        {
          label: w?.label ?? `Jornada ${md}`,
          status,
          locksAtLabel: w ? locksFmt.format(new Date(w.locks_at)) : undefined,
        },
      ];
    }),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">Tus predicciones</h1>
        <p className="text-sm text-muted-foreground">
          Ingresa el marcador de cada partido. Toca <b>Ver</b> para comparar con los demás.
        </p>
      </div>

      <PrediccionesView
        matchdayInfo={matchdayInfo}
        matches={groupVMs}
        knockoutMatches={knockoutVMs}
      />
    </div>
  );
}
