import { requireOnboarded } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { BracketView, type BracketMatchVM } from "@/components/bracket-view";

export const dynamic = "force-dynamic";

const CUTOFF_MS = 60 * 60 * 1000; // 1 hour

const STAGE_LABELS: Record<string, string> = {
  r32:   "32avos de Final",
  r16:   "Octavos de Final",
  qf:    "Cuartos de Final",
  sf:    "Semifinales",
  final: "Final",
};

export default async function LlavePage() {
  await requireOnboarded();
  const supabase = createClient();

  const [{ data: knockoutMatches }, { data: teams }, { data: results }] =
    await Promise.all([
      supabase
        .from("matches")
        .select("id,stage,home_team_id,away_team_id,kickoff_at")
        .neq("stage", "group")
        .order("kickoff_at"),
      supabase.from("teams").select("id,name,flag_emoji"),
      supabase.from("match_results").select("match_id,home_score,away_score"),
    ]);

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));
  const resultMap = new Map((results ?? []).map((r) => [r.match_id, r]));
  const now = Date.now();

  // Group by stage, then assign slot by position within stage (ordered by kickoff_at)
  const stageCounters = new Map<string, number>();
  const bracketMatches: BracketMatchVM[] = (knockoutMatches ?? []).map((m) => {
    const home = teamMap.get(m.home_team_id);
    const away = teamMap.get(m.away_team_id);
    const result = resultMap.get(m.id);
    const kickoffMs = new Date(m.kickoff_at).getTime();
    const count = (stageCounters.get(m.stage) ?? 0) + 1;
    stageCounters.set(m.stage, count);
    return {
      id: m.id,
      stage: m.stage,
      bracket_slot: count,
      home: home ? { name: home.name, flag: home.flag_emoji } : null,
      away: away ? { name: away.name, flag: away.flag_emoji } : null,
      result: result ? { home: result.home_score, away: result.away_score } : null,
      kickoff_at: m.kickoff_at,
      isOpen: kickoffMs - now > CUTOFF_MS,
    };
  });

  // Group for list view
  const stages = ["r32", "r16", "qf", "sf", "final"] as const;
  const byStage = stages.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    matches: bracketMatches.filter((m) => m.stage === stage),
  })).filter((s) => s.matches.length > 0);

  const hasAnyMatches = bracketMatches.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Llave del Mundial 2026</h1>
        <p className="text-sm text-muted-foreground">
          Cuadro de eliminación directa — 32avos al Final.
        </p>
      </div>

      {hasAnyMatches && (
        <a
          href="/predicciones"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-emerald-700 transition-colors"
        >
          ✏️ Ingresar mis predicciones →
        </a>
      )}

      {!hasAnyMatches ? (
        <div className="rounded-xl border bg-white p-10 text-center text-muted-foreground">
          <p className="text-lg font-semibold">Próximamente…</p>
          <p className="text-sm mt-1">
            Los 32avos de final se publicarán cuando termine la fase de grupos.
          </p>
        </div>
      ) : (
        <>
          {/* Visual bracket */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Vista de llave
            </h2>
            <div className="rounded-xl border bg-white p-4 overflow-x-auto">
              <BracketView matches={bracketMatches} />
            </div>
          </section>

          {/* List view by stage */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Partidos por fase
            </h2>
            {byStage.map(({ stage, label, matches }) => (
              <div key={stage} className="space-y-2">
                <h3 className="font-bold text-base">{label}</h3>
                <div className="space-y-1.5">
                  {matches.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm"
                    >
                      {/* Slot badge */}
                      {m.bracket_slot && (
                        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-500">
                          #{m.bracket_slot}
                        </span>
                      )}

                      {/* Home */}
                      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                        <span className="truncate text-right text-sm font-semibold">
                          {m.home?.name ?? "Por definir"}
                        </span>
                        <span className="text-2xl">{m.home?.flag ?? "🏳️"}</span>
                      </div>

                      {/* Score / VS */}
                      <div className="w-16 shrink-0 text-center">
                        {m.result ? (
                          <span className="text-xl font-extrabold tabular-nums">
                            {m.result.home} – {m.result.away}
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-muted-foreground">
                            {m.kickoff_at
                              ? new Date(m.kickoff_at).toLocaleDateString("es-CO", {
                                  month: "short",
                                  day: "numeric",
                                  timeZone: "America/Bogota",
                                })
                              : "vs"}
                          </span>
                        )}
                      </div>

                      {/* Away */}
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="text-2xl">{m.away?.flag ?? "🏳️"}</span>
                        <span className="truncate text-sm font-semibold">
                          {m.away?.name ?? "Por definir"}
                        </span>
                      </div>

                      {/* Lock status */}
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {m.result
                          ? "✅ Final"
                          : m.isOpen
                          ? "🔓 Abierto"
                          : "🔒 Cerrado"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
