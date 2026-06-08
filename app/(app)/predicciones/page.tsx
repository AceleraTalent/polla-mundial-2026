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

export default async function PrediccionesPage() {
  const { user } = await requireOnboarded();
  const supabase = createClient();

  const [
    { data: teams },
    { data: matches },
    { data: preds },
    { data: windows },
    { data: results },
  ] = await Promise.all([
    supabase.from("teams").select("id,name,flag_emoji,code"),
    supabase
      .from("matches")
      .select("id,matchday,group_letter,kickoff_at,home_team_id,away_team_id")
      .eq("stage", "group")
      .order("matchday")
      .order("group_letter")
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

  const vms: MatchVM[] = (matches ?? []).map((m) => {
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
      kickoff_at: m.kickoff_at,
      home: { name: home?.name ?? "?", flag: home?.flag_emoji ?? "" },
      away: { name: away?.name ?? "?", flag: away?.flag_emoji ?? "" },
      prediction: pred ? { home: pred.home_score, away: pred.away_score } : null,
      result: result ? { home: result.home_score, away: result.away_score } : null,
      isColombiaMatch,
    };
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

      <PrediccionesView matchdayInfo={matchdayInfo} matches={vms} />
    </div>
  );
}
