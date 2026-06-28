import { requireOnboarded } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { FixtureView } from "@/components/fixture-view";

export const dynamic = "force-dynamic";

export default async function PartidosPage() {
  await requireOnboarded();
  const supabase = createClient();

  const [{ data: matches }, { data: teams }, { data: results }] = await Promise.all([
    supabase
      .from("matches")
      .select("id,stage,group_letter,matchday,kickoff_at,home_team_id,away_team_id")
      .order("kickoff_at", { ascending: true }),
    supabase.from("teams").select("id,name,flag_emoji,code"),
    supabase.from("match_results").select("match_id,home_score,away_score"),
  ]);

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));
  const resultMap = new Map(
    (results ?? []).map((r) => [r.match_id, { home: r.home_score, away: r.away_score }]),
  );

  const vms = (matches ?? []).map((m) => {
    const home = teamMap.get(m.home_team_id)!;
    const away = teamMap.get(m.away_team_id)!;
    return {
      id: m.id,
      stage: m.stage,
      group: m.group_letter ?? "",
      matchday: m.matchday ?? 1,
      bracket_slot: null,
      kickoff_at: m.kickoff_at,
      home: { name: home?.name ?? "?", flag_emoji: home?.flag_emoji ?? "", code: home?.code ?? "" },
      away: { name: away?.name ?? "?", flag_emoji: away?.flag_emoji ?? "", code: away?.code ?? "" },
      result: resultMap.get(m.id) ?? null,
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Horarios Mundial 2026</h1>
        <p className="text-sm text-muted-foreground">
          Todos los partidos — hora Colombia (UTC−5).
        </p>
      </div>
      <FixtureView matches={vms} />
    </div>
  );
}
