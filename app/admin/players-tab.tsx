"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type PlayerVM = {
  user_id: string;
  nickname: string;
  avatar_id: string | null;
  match_points: number;
  special_points: number;
  total_points: number;
  predictions: PredictionVM[];
  special: SpecialVM | null;
};

export type PredictionVM = {
  matchday: number;
  group: string;
  home: { name: string; flag: string };
  away: { name: string; flag: string };
  prediction: { home: number; away: number } | null;
  result: { home: number; away: number } | null;
  points: number | null;
  isColombiaMatch: boolean;
};

export type SpecialVM = {
  champion: string | null;
  runner_up: string | null;
  semi1: string | null;
  semi2: string | null;
  top_scorer: string | null;
};

const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);

function calcPoints(pred: { home: number; away: number }, result: { home: number; away: number }, colombia: boolean) {
  const mult = colombia ? 2 : 1;
  if (pred.home === result.home && pred.away === result.away) return 3 * mult;
  if (sign(pred.home - pred.away) === sign(result.home - result.away)) return 1 * mult;
  return 0;
}

function PointsBadge({ pts, colombia }: { pts: number | null; colombia: boolean }) {
  if (pts === null) return <span className="text-xs text-muted-foreground">—</span>;
  const color = pts > 0 ? (pts >= 6 ? "bg-yellow-100 text-yellow-800" : "bg-emerald-100 text-emerald-800") : "bg-gray-100 text-gray-500";
  return (
    <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-bold ${color}`}>
      {pts}pt{colombia && pts > 0 ? " ×2" : ""}
    </span>
  );
}

function PlayerRow({ player, rank }: { player: PlayerVM; rank: number }) {
  const [open, setOpen] = useState(false);

  const byMatchday = [1, 2, 3].map((md) => ({
    md,
    preds: player.predictions.filter((p) => p.matchday === md),
  }));

  return (
    <>
      <tr
        className="border-b hover:bg-muted/40 cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <td className="px-3 py-2.5 text-sm font-bold text-muted-foreground w-8">{rank}</td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            {player.avatar_id ? (
              <Image
                src={`/avatars/${player.avatar_id}.svg`}
                alt={player.nickname ?? ""}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted" />
            )}
            <span className="text-sm font-semibold">{player.nickname}</span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-center text-sm">{player.match_points}</td>
        <td className="px-3 py-2.5 text-center text-sm">{player.special_points}</td>
        <td className="px-3 py-2.5 text-center">
          <span className="text-base font-black text-emerald-700">{player.total_points}</span>
        </td>
        <td className="px-3 py-2.5 text-right text-muted-foreground">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={6} className="bg-muted/20 px-4 py-4">
            <div className="space-y-4">
              {/* Predicciones por jornada */}
              {byMatchday.map(({ md, preds }) => (
                <div key={md}>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                    Jornada {md}
                  </p>
                  {preds.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Sin predicciones</p>
                  ) : (
                    <div className="grid gap-1">
                      {preds.map((p, i) => {
                        const pts = p.prediction && p.result
                          ? calcPoints(p.prediction, p.result, p.isColombiaMatch)
                          : null;
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-xs bg-white rounded px-2.5 py-1.5 border"
                          >
                            <span className="w-4 font-bold text-muted-foreground text-center">{p.group}</span>
                            <span className="w-28 truncate text-right">{p.home.flag} {p.home.name}</span>
                            <span className="font-mono font-bold w-12 text-center">
                              {p.prediction ? `${p.prediction.home}–${p.prediction.away}` : "—"}
                            </span>
                            <span className="w-28 truncate">{p.away.flag} {p.away.name}</span>
                            {p.result ? (
                              <span className="font-mono text-muted-foreground ml-auto">
                                (real: {p.result.home}–{p.result.away})
                              </span>
                            ) : (
                              <span className="text-muted-foreground ml-auto italic">sin resultado</span>
                            )}
                            <PointsBadge pts={pts} colombia={p.isColombiaMatch} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Especiales */}
              {player.special && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                    Predicciones especiales
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { label: "Campeón", value: player.special.champion },
                      { label: "Subcampeón", value: player.special.runner_up },
                      { label: "Semifinalista 1", value: player.special.semi1 },
                      { label: "Semifinalista 2", value: player.special.semi2 },
                      { label: "Goleador", value: player.special.top_scorer },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white rounded px-2.5 py-1.5 border text-xs">
                        <p className="text-muted-foreground">{label}</p>
                        <p className="font-semibold">{value ?? <span className="italic text-muted-foreground">—</span>}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function PlayersTab({ players }: { players: PlayerVM[] }) {
  const sorted = [...players].sort((a, b) => b.total_points - a.total_points || (a.nickname ?? "").localeCompare(b.nickname ?? ""));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Jugadores ({players.length}) — haz clic para ver sus predicciones
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left text-xs text-muted-foreground w-8">#</th>
                <th className="px-3 py-2 text-left text-xs text-muted-foreground">Jugador</th>
                <th className="px-3 py-2 text-center text-xs text-muted-foreground">Partidos</th>
                <th className="px-3 py-2 text-center text-xs text-muted-foreground">Especiales</th>
                <th className="px-3 py-2 text-center text-xs text-muted-foreground">Total</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Aún no hay jugadores registrados.
                  </td>
                </tr>
              ) : (
                sorted.map((p, i) => <PlayerRow key={p.user_id} player={p} rank={i + 1} />)
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
