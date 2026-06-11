"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlayerVM } from "./players-tab";
import type { AdminMatchVM } from "./admin-tabs";

const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);

function calcPoints(
  pred: { home: number; away: number },
  result: { home: number; away: number },
  colombia: boolean,
) {
  const mult = colombia ? 2 : 1;
  if (pred.home === result.home && pred.away === result.away) return 3 * mult;
  if (sign(pred.home - pred.away) === sign(result.home - result.away)) return 1 * mult;
  return 0;
}

type ColombiaMap = Map<number, boolean>;

export function PredictionsMatrix({
  players,
  matches,
  colombiaMap,
}: {
  players: PlayerVM[];
  matches: AdminMatchVM[];
  colombiaMap: ColombiaMap;
}) {
  const [matchday, setMatchday] = useState<1 | 2 | 3>(1);
  const [search, setSearch] = useState("");

  const mdMatches = matches
    .filter((m) => m.matchday === matchday)
    .sort((a, b) => a.group.localeCompare(b.group));

  const filteredPlayers = players
    .filter((p) => p.nickname.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.total_points - a.total_points);

  // Build pred lookup: user_id → "home|away" → prediction
  const predByUserAndMatch = new Map<string, Map<string, { home: number; away: number }>>();
  for (const player of players) {
    const m = new Map<string, { home: number; away: number }>();
    for (const pred of player.predictions) {
      if (pred.prediction) {
        m.set(`${pred.home.name}|${pred.away.name}`, pred.prediction);
      }
    }
    predByUserAndMatch.set(player.user_id, m);
  }

  const totalPredsByMatch = new Map<string, number>();
  for (const match of mdMatches) {
    const key = `${match.home.name}|${match.away.name}`;
    let count = 0;
    for (const player of players) {
      if (predByUserAndMatch.get(player.user_id)?.has(key)) count++;
    }
    totalPredsByMatch.set(key, count);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Matriz de predicciones</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b">
          {/* Matchday tabs */}
          <div className="flex gap-1">
            {([1, 2, 3] as const).map((md) => (
              <button
                key={md}
                onClick={() => setMatchday(md)}
                style={{
                  padding: "4px 14px",
                  borderRadius: 9999,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  background: matchday === md ? "#059669" : "#F3F4F6",
                  color: matchday === md ? "white" : "#6B7280",
                }}
              >
                J{md}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="🔍 Buscar jugador…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              height: 34,
              borderRadius: 8,
              border: "1.5px solid #E5E7EB",
              padding: "0 12px",
              fontSize: 13,
              background: "#F9FAFB",
              minWidth: 180,
            }}
          />

          <span style={{ fontSize: 12, color: "#9CA3AF" }}>
            {filteredPlayers.length} jugador{filteredPlayers.length !== 1 ? "es" : ""}
            {" · "}{mdMatches.length} partidos
          </span>
        </div>

        {/* Matrix table */}
        <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "70vh" }}>
          <table style={{ borderCollapse: "collapse", minWidth: "max-content", width: "100%" }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "white" }}>
              <tr>
                {/* Match header cell */}
                <th
                  style={{
                    position: "sticky", left: 0, zIndex: 20,
                    background: "#F9FAFB",
                    borderBottom: "2px solid #E5E7EB",
                    borderRight: "2px solid #E5E7EB",
                    padding: "10px 16px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#6B7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    minWidth: 200,
                    whiteSpace: "nowrap",
                  }}
                >
                  Partido
                </th>
                {/* Player headers */}
                {filteredPlayers.map((p) => (
                  <th
                    key={p.user_id}
                    style={{
                      borderBottom: "2px solid #E5E7EB",
                      borderRight: "1px solid #F3F4F6",
                      padding: "8px 12px",
                      textAlign: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#374151",
                      whiteSpace: "nowrap",
                      minWidth: 90,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <span>{p.nickname}</span>
                      <span style={{ fontSize: 11, color: "#059669", fontWeight: 800 }}>
                        {p.total_points}pt
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mdMatches.map((match, rowIdx) => {
                const matchKey = `${match.home.name}|${match.away.name}`;
                const isCol = colombiaMap.get(match.id) ?? false;
                const predCount = totalPredsByMatch.get(matchKey) ?? 0;

                return (
                  <tr
                    key={match.id}
                    style={{
                      background: rowIdx % 2 === 0 ? "white" : "#F9FAFB",
                      borderBottom: "1px solid #F3F4F6",
                    }}
                  >
                    {/* Match label — sticky left */}
                    <td
                      style={{
                        position: "sticky",
                        left: 0,
                        background: rowIdx % 2 === 0
                          ? (isCol ? "#FEFCE8" : "white")
                          : (isCol ? "#FEF9C3" : "#F9FAFB"),
                        borderRight: "2px solid #E5E7EB",
                        padding: "8px 16px",
                        whiteSpace: "nowrap",
                        zIndex: 5,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#9CA3AF",
                          background: "#F3F4F6",
                          borderRadius: 4,
                          padding: "1px 5px",
                        }}>
                          {match.group}
                        </span>
                        {isCol && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#B45309",
                            background: "#FEF3C7",
                            borderRadius: 4,
                            padding: "1px 5px",
                          }}>
                            ×2
                          </span>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          {match.home.flag} {match.home.name}
                        </span>
                        <span style={{ color: "#9CA3AF", fontSize: 12 }}>vs</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          {match.away.flag} {match.away.name}
                        </span>
                        {match.result && (
                          <span style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: "#059669",
                            background: "#ECFDF5",
                            borderRadius: 6,
                            padding: "1px 7px",
                            marginLeft: 4,
                          }}>
                            {match.result.home}–{match.result.away}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: "#D1D5DB", marginLeft: 4 }}>
                          {predCount}/{filteredPlayers.length}
                        </span>
                      </div>
                    </td>

                    {/* Each player's prediction */}
                    {filteredPlayers.map((player) => {
                      const pred = predByUserAndMatch.get(player.user_id)?.get(matchKey);
                      const pts =
                        pred && match.result
                          ? calcPoints(pred, match.result, isCol)
                          : null;

                      const cellBg =
                        pts === null
                          ? undefined
                          : pts >= 6 ? "#FEF3C7"
                          : pts >= 3 ? "#D1FAE5"
                          : pts > 0 ? "#ECFDF5"
                          : "#F3F4F6";

                      const textColor =
                        pts === null ? "#111"
                        : pts >= 6 ? "#92400E"
                        : pts >= 3 ? "#065F46"
                        : pts > 0 ? "#059669"
                        : "#9CA3AF";

                      return (
                        <td
                          key={player.user_id}
                          style={{
                            borderRight: "1px solid #F3F4F6",
                            padding: "6px 10px",
                            textAlign: "center",
                            background: cellBg,
                          }}
                        >
                          {pred ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                              <span style={{
                                fontFamily: "monospace",
                                fontWeight: 800,
                                fontSize: 14,
                                color: textColor,
                              }}>
                                {pred.home}–{pred.away}
                              </span>
                              {pts !== null && (
                                <span style={{ fontSize: 10, fontWeight: 700, color: textColor }}>
                                  {pts}pt
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: 16, color: "#E5E7EB" }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
