"use client";

import { useEffect, useRef, useState } from "react";
import type { MatchBreakdownRow } from "@/app/api/user-breakdown/route";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
  });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-CO", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
  });

function PointsBadge({ points, isCol }: { points: number; isCol: boolean }) {
  if (points === 0)
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-400">
        0 pts
      </span>
    );
  if (points >= 6)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
        🎯 {points} pts{isCol ? " 🇨🇴" : ""}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
      ✓ {points} pts{isCol && points > 1 ? " 🇨🇴" : ""}
    </span>
  );
}

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

  const totalPoints = rows?.reduce((s, r) => s + r.points, 0) ?? 0;
  const scored = rows?.filter((r) => r.points > 0).length ?? 0;

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
                : `${scored} aciertos · ${totalPoints} pts de partidos`}
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
          {rows !== null && rows.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Aún no hay partidos con resultado.
            </p>
          )}
          {rows !== null && rows.length > 0 && (
            <ul className="divide-y">
              {rows.map((row) => (
                <li
                  key={row.match_id}
                  className={`flex items-center gap-3 px-5 py-3 ${
                    row.points > 0 ? "bg-white" : "bg-gray-50/60"
                  }`}
                >
                  {/* Date */}
                  <div className="w-14 shrink-0 text-center">
                    <p className="text-xs font-medium text-muted-foreground">{fmt(row.kickoff_at)}</p>
                    <p className="text-[10px] text-muted-foreground/70">{fmtTime(row.kickoff_at)}</p>
                  </div>

                  {/* Match */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {row.home_flag} {row.home_name}
                      </span>
                      <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-bold tabular-nums text-gray-700">
                        {row.result_home}–{row.result_away}
                      </span>
                      <span className="truncate text-right text-sm font-medium">
                        {row.away_name} {row.away_flag}
                      </span>
                    </div>
                    <p className="mt-0.5 text-center text-[11px] text-muted-foreground">
                      Predicción:{" "}
                      <span className="font-semibold tabular-nums">
                        {row.pred_home}–{row.pred_away}
                      </span>
                    </p>
                  </div>

                  {/* Points */}
                  <div className="shrink-0">
                    <PointsBadge points={row.points} isCol={row.is_colombia} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
