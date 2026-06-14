"use client";

import { useEffect, useRef, useState } from "react";
import type { MatchBreakdownRow } from "@/app/api/user-breakdown/route";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export function PlayerBreakdownModal({
  userId,
  nickname,
  onClose,
}: {
  userId: string;
  nickname: string;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<MatchBreakdownRow[] | null>(null);
  const [error, setError] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/user-breakdown?userId=${encodeURIComponent(userId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setRows)
      .catch(() => setError(true));
  }, [userId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Only show matches where they scored
  const scoringRows = rows?.filter((r) => r.points > 0) ?? [];
  const totalPoints = scoringRows.reduce((s, r) => s + r.points, 0);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-base font-bold">{nickname}</h2>
            <p className="text-xs text-muted-foreground">
              {rows === null
                ? "Cargando…"
                : `${scoringRows.length} partidos con puntos · ${totalPoints} pts`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto">
          {error && (
            <p className="p-6 text-center text-sm text-red-500">Error al cargar los datos.</p>
          )}

          {rows === null && !error && (
            <div className="flex justify-center p-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          )}

          {rows !== null && scoringRows.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Aún no ha sumado puntos en ningún partido.
            </p>
          )}

          {scoringRows.length > 0 && (
            <ul className="divide-y">
              {scoringRows.map((row) => (
                <li key={row.match_id} className="flex items-center gap-4 px-5 py-4">

                  {/* Left: teams + result */}
                  <div className="min-w-0 flex-1">
                    {/* Teams */}
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span>{row.home_flag} {row.home_name}</span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-bold tabular-nums text-gray-700">
                        {row.result_home}–{row.result_away}
                      </span>
                      <span>{row.away_name} {row.away_flag}</span>
                    </div>
                    {/* Prediction + date */}
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Predijo: <span className="font-semibold tabular-nums text-gray-700">{row.pred_home}–{row.pred_away}</span></span>
                      <span>·</span>
                      <span>{fmtDate(row.kickoff_at)}</span>
                      {row.is_colombia && <span className="text-yellow-600">🇨🇴 ×2</span>}
                    </div>
                  </div>

                  {/* Right: points badge */}
                  <div className="shrink-0 text-right">
                    {row.pred_home === row.result_home && row.pred_away === row.result_away ? (
                      <span className="inline-flex flex-col items-center rounded-xl bg-emerald-50 px-3 py-1.5 text-emerald-700">
                        <span className="text-lg font-black leading-none">+{row.points}</span>
                        <span className="text-[10px] font-medium uppercase tracking-wide">Exacto 🎯</span>
                      </span>
                    ) : (
                      <span className="inline-flex flex-col items-center rounded-xl bg-amber-50 px-3 py-1.5 text-amber-700">
                        <span className="text-lg font-black leading-none">+{row.points}</span>
                        <span className="text-[10px] font-medium uppercase tracking-wide">Resultado ✓</span>
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer total */}
        {scoringRows.length > 0 && (
          <div className="border-t bg-gray-50 px-5 py-3 text-right text-sm">
            <span className="text-muted-foreground">Total puntos de partidos: </span>
            <span className="text-base font-black text-gray-900">{totalPoints}</span>
          </div>
        )}
      </div>
    </div>
  );
}
