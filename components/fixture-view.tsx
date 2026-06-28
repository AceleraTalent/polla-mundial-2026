"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type MatchVM = {
  id: number;
  stage: string;
  group: string;
  matchday: number;
  bracket_slot: number | null;
  kickoff_at: string;
  home: { name: string; flag_emoji: string; code: string };
  away: { name: string; flag_emoji: string; code: string };
  result: { home: number; away: number } | null;
};

// FIFA World Cup 2026 venues per group
const GROUP_VENUES: Record<string, [string, string]> = {
  A: ["Estadio Azteca, Ciudad de México", "Estadio Akron, Guadalajara"],
  B: ["BMO Field, Toronto", "BC Place, Vancouver"],
  C: ["Arrowhead Stadium, Kansas City", "Gillette Stadium, Foxborough"],
  D: ["AT&T Stadium, Dallas", "SoFi Stadium, Los Angeles"],
  E: ["Hard Rock Stadium, Miami", "Lincoln Financial Field, Filadelfia"],
  F: ["MetLife Stadium, Nueva York", "Lumen Field, Seattle"],
  G: ["Levi's Stadium, San Francisco", "Lumen Field, Seattle"],
  H: ["Estadio BBVA, Monterrey", "AT&T Stadium, Dallas"],
  I: ["Caesars Superdome, Nueva Orleans", "NRG Stadium, Houston"],
  J: ["Soldier Field, Chicago", "Rose Bowl, Pasadena"],
  K: ["Mercedes-Benz Stadium, Atlanta", "Bank of America Stadium, Charlotte"],
  L: ["NRG Stadium, Houston", "AT&T Stadium, Dallas"],
};

const STAGE_LABELS: Record<string, string> = {
  r32:   "32avos de Final",
  r16:   "Octavos de Final",
  qf:    "Cuartos de Final",
  sf:    "Semifinales",
  final: "Final",
};

function getVenue(group: string, matchday: number, isFirstOfDay: boolean): string {
  const venues = GROUP_VENUES[group];
  if (!venues) return "Por confirmar";
  return isFirstOfDay ? venues[0] : venues[1];
}

const dateFmt = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "America/Bogota",
});

const timeFmt = new Intl.DateTimeFormat("es-CO", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Bogota",
  hour12: true,
});

function groupByDate(matches: MatchVM[]) {
  const map = new Map<string, MatchVM[]>();
  for (const m of matches) {
    const day = new Date(m.kickoff_at).toLocaleDateString("en-CA", {
      timeZone: "America/Bogota",
    });
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(m);
  }
  return map;
}

function MatchRow({ match, isFirst }: { match: MatchVM; isFirst: boolean }) {
  const kickoff = new Date(match.kickoff_at);
  const venue = match.stage === "group"
    ? getVenue(match.group, match.matchday, isFirst)
    : "Por confirmar";
  const isPlayed = match.result !== null;

  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 flex-wrap">
        {match.stage === "group" ? (
          <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-500">
            Grupo {match.group}
          </span>
        ) : (
          <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-700">
            {STAGE_LABELS[match.stage] ?? match.stage}
            {match.bracket_slot ? ` #${match.bracket_slot}` : ""}
          </span>
        )}
        <span className="text-xs text-muted-foreground">{timeFmt.format(kickoff)}</span>
        {isPlayed && (
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
            Finalizado
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="truncate text-right text-sm font-semibold">{match.home.name}</span>
          <span className="text-2xl">{match.home.flag_emoji}</span>
        </div>

        <div className="shrink-0 w-20 text-center">
          {match.result ? (
            <span className="text-xl font-extrabold tabular-nums">
              {match.result.home} – {match.result.away}
            </span>
          ) : (
            <span className="text-sm font-bold text-muted-foreground">vs</span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-2xl">{match.away.flag_emoji}</span>
          <span className="truncate text-sm font-semibold">{match.away.name}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd"
            d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.013 3.5-4.649 3.5-7.877a8 8 0 10-16 0c0 3.228 1.556 5.864 3.5 7.877a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742z"
            clipRule="evenodd"
          />
        </svg>
        {venue}
      </div>
    </div>
  );
}

type Tab = { id: string; label: string };

export function FixtureView({ matches }: { matches: MatchVM[] }) {
  const groupMatches = matches.filter((m) => m.stage === "group");
  const knockoutMatches = matches.filter((m) => m.stage !== "group");
  const hasKnockout = knockoutMatches.length > 0;

  const [activeTab, setActiveTab] = useState<string>("md1");
  const [activeKnockoutStage, setActiveKnockoutStage] = useState<string>("r32");

  const tabs: Tab[] = [
    { id: "md1", label: "Jornada 1" },
    { id: "md2", label: "Jornada 2" },
    { id: "md3", label: "Jornada 3" },
    ...(hasKnockout ? [{ id: "knockout", label: "Eliminatoria" }] : []),
  ];

  // Group knockout stages present
  const knockoutStages = ["r32", "r16", "qf", "sf", "final"].filter((s) =>
    knockoutMatches.some((m) => m.stage === s),
  );

  const activeMatchday = activeTab.startsWith("md")
    ? Number(activeTab.replace("md", ""))
    : null;

  const filteredGroup = activeMatchday
    ? groupMatches.filter((m) => m.matchday === activeMatchday)
    : [];

  const filteredKnockout = activeTab === "knockout"
    ? knockoutMatches.filter((m) => m.stage === activeKnockoutStage)
    : [];

  const activeList = activeTab === "knockout" ? filteredKnockout : filteredGroup;
  const byDate = groupByDate(activeList);
  const sortedDates = [...byDate.keys()].sort();

  return (
    <div className="space-y-6">
      {/* Main tabs */}
      <div className="flex gap-1 rounded-lg border bg-white p-1 w-fit flex-wrap">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-semibold transition-colors",
              activeTab === id
                ? "bg-slate-900 text-white"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Knockout sub-tabs */}
      {activeTab === "knockout" && knockoutStages.length > 1 && (
        <div className="flex gap-1 flex-wrap">
          {knockoutStages.map((s) => (
            <button
              key={s}
              onClick={() => setActiveKnockoutStage(s)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                activeKnockoutStage === s
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {STAGE_LABELS[s] ?? s}
            </button>
          ))}
        </div>
      )}

      {/* Matches grouped by date */}
      {sortedDates.map((dateKey) => {
        const dayMatches = byDate.get(dateKey)!;
        const firstKickoff = new Date(dayMatches[0].kickoff_at);
        return (
          <div key={dateKey} className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground capitalize">
              {dateFmt.format(firstKickoff)}
            </h2>
            <div className="space-y-2">
              {dayMatches.map((m, i) => (
                <MatchRow key={m.id} match={m} isFirst={i % 2 === 0} />
              ))}
            </div>
          </div>
        );
      })}

      {activeList.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {activeTab === "knockout"
            ? "No hay partidos para esta fase aún."
            : "No hay partidos para esta jornada."}
        </p>
      )}
    </div>
  );
}
