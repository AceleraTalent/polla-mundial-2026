"use client";

import type { MatchVM } from "@/components/match-card";
import { cn } from "@/lib/utils";

type TeamStanding = {
  key: string;
  name: string;
  flag: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

function teamKey(team: MatchVM["home"]) {
  return `${team.flag}-${team.name}`;
}

function ensureTeam(map: Map<string, TeamStanding>, team: MatchVM["home"]) {
  const key = teamKey(team);
  if (!map.has(key)) {
    map.set(key, {
      key,
      name: team.name,
      flag: team.flag,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    });
  }
  return map.get(key)!;
}

function buildStandings(matches: MatchVM[]) {
  const rows = new Map<string, TeamStanding>();

  for (const match of matches) {
    const home = ensureTeam(rows, match.home);
    const away = ensureTeam(rows, match.away);

    if (!match.result) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += match.result.home;
    home.goalsAgainst += match.result.away;
    away.goalsFor += match.result.away;
    away.goalsAgainst += match.result.home;

    if (match.result.home > match.result.away) {
      home.won += 1;
      away.lost += 1;
      home.points += 3;
    } else if (match.result.home < match.result.away) {
      away.won += 1;
      home.lost += 1;
      away.points += 3;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  return [...rows.values()]
    .map((row) => ({
      ...row,
      goalDiff: row.goalsFor - row.goalsAgainst,
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDiff - a.goalDiff ||
        b.goalsFor - a.goalsFor ||
        a.name.localeCompare(b.name),
    );
}

export function GroupStandings({
  group,
  matches,
  compact = false,
}: {
  group: string;
  matches: MatchVM[];
  compact?: boolean;
}) {
  const standings = buildStandings(matches);

  if (standings.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b bg-slate-50 px-3 py-2">
        <h3 className="text-sm font-extrabold">Tabla Grupo {group}</h3>
        <span className="text-[11px] font-semibold uppercase text-muted-foreground">
          Actual
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-[11px] uppercase text-muted-foreground">
              <th className="w-8 px-2 py-2 text-right">#</th>
              <th className="min-w-32 px-2 py-2 text-left">Equipo</th>
              <th className="px-2 py-2 text-center">Pts</th>
              <th className="px-2 py-2 text-center">PJ</th>
              <th className="px-2 py-2 text-center">G</th>
              <th className="px-2 py-2 text-center">E</th>
              <th className="px-2 py-2 text-center">P</th>
              <th className="px-2 py-2 text-center">GF</th>
              <th className="px-2 py-2 text-center">GC</th>
              <th className={cn("px-2 py-2 text-center", compact && "hidden sm:table-cell")}>
                DG
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, index) => (
              <tr key={team.key} className="border-b last:border-0">
                <td className="px-2 py-2 text-right font-semibold text-muted-foreground">
                  {index + 1}
                </td>
                <td className="px-2 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-base">{team.flag}</span>
                    <span className="truncate font-semibold">{team.name}</span>
                  </div>
                </td>
                <td className="px-2 py-2 text-center text-sm font-black">{team.points}</td>
                <td className="px-2 py-2 text-center tabular-nums">{team.played}</td>
                <td className="px-2 py-2 text-center tabular-nums">{team.won}</td>
                <td className="px-2 py-2 text-center tabular-nums">{team.drawn}</td>
                <td className="px-2 py-2 text-center tabular-nums">{team.lost}</td>
                <td className="px-2 py-2 text-center tabular-nums">{team.goalsFor}</td>
                <td className="px-2 py-2 text-center tabular-nums">{team.goalsAgainst}</td>
                <td className={cn("px-2 py-2 text-center tabular-nums", compact && "hidden sm:table-cell")}>
                  {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
