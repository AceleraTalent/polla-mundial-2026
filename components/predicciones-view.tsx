"use client";

import { useEffect, useState } from "react";
import { GroupStandings } from "@/components/group-standings";
import { MatchCard, type MatchVM } from "@/components/match-card";
import { statusLabel, type WindowStatus } from "@/lib/locks";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type WindowInfo = {
  label: string;
  status: WindowStatus;
  locksAtLabel?: string;
};

const badgeStyle: Record<WindowStatus, string> = {
  open:     "bg-emerald-100 text-emerald-800",
  upcoming: "bg-amber-100 text-amber-800",
  locked:   "bg-zinc-200 text-zinc-700",
};

const STAGE_LABELS: Record<string, string> = {
  r32:   "32avos de Final",
  r16:   "Octavos de Final",
  qf:    "Cuartos de Final",
  sf:    "Semifinales",
  final: "Final",
};

const kickoffFmt = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function PrediccionesView({
  matchdayInfo,
  matches,
  knockoutMatches = [],
}: {
  matchdayInfo: Record<number, WindowInfo>;
  matches: MatchVM[];
  knockoutMatches?: MatchVM[];
}) {
  const [groupFilter, setGroupFilter] = useState<string>("Todos");
  const [localMatches, setLocalMatches] = useState<MatchVM[]>(matches);
  const [localKnockout, setLocalKnockout] = useState<MatchVM[]>(knockoutMatches);

  useEffect(() => { setLocalMatches(matches); }, [matches]);
  useEffect(() => { setLocalKnockout(knockoutMatches); }, [knockoutMatches]);

  const groups = [...new Set(localMatches.map((m) => m.group))].sort();
  const tabs = ["Todos", ...groups];

  const filtered =
    groupFilter === "Todos"
      ? localMatches
      : localMatches.filter((m) => m.group === groupFilter);

  function updatePrediction(matchId: number, prediction: { home: number; away: number }) {
    setLocalMatches((current) =>
      current.map((m) => (m.id === matchId ? { ...m, prediction } : m)),
    );
    setLocalKnockout((current) =>
      current.map((m) => (m.id === matchId ? { ...m, prediction } : m)),
    );
  }

  const standingsGroups =
    groupFilter === "Todos" ? groups : groups.filter((g) => g === groupFilter);

  // Group knockout matches by stage (in bracket order)
  const knockoutStages = ["r32", "r16", "qf", "sf", "final"];
  const knockoutByStage = knockoutStages
    .map((stage) => ({
      stage,
      label: STAGE_LABELS[stage],
      matches: localKnockout
        .filter((m) => m.stage === stage)
        .sort((a, b) => (a.bracket_slot ?? 99) - (b.bracket_slot ?? 99)),
    }))
    .filter((s) => s.matches.length > 0);

  const showKnockout = knockoutByStage.length > 0;

  return (
    <div className="space-y-6">

      {/* ── Group filter tabs ── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 4,
          WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
        }}
      >
        {tabs.map((g) => {
          const active = groupFilter === g;
          return (
            <button
              key={g}
              onClick={() => setGroupFilter(g)}
              style={{
                whiteSpace: "nowrap",
                flexShrink: 0,
                padding: "6px 16px",
                borderRadius: 9999,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                transition: "all 0.15s",
                background: active ? "#059669" : "#F3F4F6",
                color: active ? "white" : "#6B7280",
              }}
            >
              {g === "Todos" ? "Todos" : `Grupo ${g}`}
            </button>
          );
        })}
      </div>

      <div
        className={cn(
          "grid gap-3",
          groupFilter === "Todos"
            ? "grid-cols-1 lg:grid-cols-2"
            : "grid-cols-1",
        )}
      >
        {standingsGroups.map((g) => (
          <GroupStandings
            key={g}
            group={g}
            matches={localMatches.filter((m) => m.group === g)}
            compact={groupFilter === "Todos"}
          />
        ))}
      </div>

      {/* ── Matchday sections (grupos) ── */}
      {([1, 2, 3] as const).map((md) => {
        const info = matchdayInfo[md];
        const mdMatches = filtered.filter((m) => m.matchday === md);
        if (mdMatches.length === 0 && info.status === "upcoming") return null;
        if (mdMatches.length === 0) return null;

        const editable = info.status === "open";
        const sectionGroups = [...new Set(mdMatches.map((m) => m.group))].sort();

        return (
          <section key={md} className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold">{info.label}</h2>
              <Badge className={cn("border-0", badgeStyle[info.status])}>
                {statusLabel(info.status)}
              </Badge>
              {info.locksAtLabel && info.status === "open" && (
                <span className="text-xs text-muted-foreground">
                  Cierra: {info.locksAtLabel}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {sectionGroups.map((g) => (
                <div key={g} className="space-y-1.5">
                  {groupFilter === "Todos" && (
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Grupo {g}
                    </h3>
                  )}
                  <div className="space-y-1.5">
                    {mdMatches
                      .filter((m) => m.group === g)
                      .map((m) => (
                        <MatchCard
                          key={m.id}
                          match={m}
                          editable={editable}
                          onPredictionSaved={updatePrediction}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* ── Eliminatoria (knockout) sections ── */}
      {showKnockout && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Eliminatoria
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {knockoutByStage.map(({ stage, label, matches: stageMatches }) => (
            <section key={stage} className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold">{label}</h2>
                <Badge className={cn("border-0",
                  stageMatches.some((m) => !m.locked)
                    ? badgeStyle.open
                    : badgeStyle.locked
                )}>
                  {stageMatches.some((m) => !m.locked) ? "Abierta" : "Cerrada"}
                </Badge>
              </div>

              <div className="space-y-1.5">
                {stageMatches.map((m) => {
                  const editable = !m.locked;
                  const kickoff = new Date(m.kickoff_at);
                  return (
                    <div key={m.id} className="space-y-0.5">
                      {/* Slot / kickoff label */}
                      <div className="flex items-center gap-2 px-1">
                        {m.bracket_slot && (
                          <span className="text-xs font-bold text-slate-400">
                            #{m.bracket_slot}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {kickoffFmt.format(kickoff)}
                        </span>
                        {m.locked && (
                          <span className="text-xs text-zinc-500">🔒 Cerrado</span>
                        )}
                        {!m.locked && (
                          <span className="text-xs text-emerald-600 font-semibold">
                            Abierto — cierra 1h antes
                          </span>
                        )}
                      </div>
                      <MatchCard
                        match={m}
                        editable={editable}
                        onPredictionSaved={updatePrediction}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
