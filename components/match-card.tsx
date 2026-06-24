"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { savePrediction } from "@/app/actions/predictions";
import { fetchMatchPredictions, type MatchPred } from "@/app/actions/predictions";
import { cn } from "@/lib/utils";

export type MatchVM = {
  id: number;
  matchday: number;
  group: string;
  kickoff_at: string;
  home: { name: string; flag: string };
  away: { name: string; flag: string };
  prediction: { home: number; away: number } | null;
  result: { home: number; away: number } | null;
  isColombiaMatch?: boolean;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const kickoffFmt = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

// ─── Points helper ──────────────────────────────────────────────────────────

function calcPoints(
  pred: { home: number; away: number },
  result: { home: number; away: number },
  colombia: boolean,
): number {
  const mult = colombia ? 2 : 1;
  const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);
  if (pred.home === result.home && pred.away === result.away) return 3 * mult;
  if (sign(pred.home - pred.away) === sign(result.home - result.away)) return 1 * mult;
  return 0;
}

// ─── Predictions modal ──────────────────────────────────────────────────────

function PredictionsModal({
  match,
  onClose,
}: {
  match: MatchVM;
  onClose: () => void;
}) {
  const [preds, setPreds] = useState<MatchPred[]>([]);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [fetching, startFetch] = useTransition();
  const [search, setSearch] = useState("");

  // Fetch once on mount (useEffect avoids calling during render phase)
  useEffect(() => {
    startFetch(async () => {
      const res = await fetchMatchPredictions(match.id);
      if (res.ok) setPreds(res.data);
      else setFetchErr(res.error);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id]);

  const filtered = preds.filter((p) =>
    (p.nickname ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const hasResult = match.result !== null;

  // Sort: exact first, then outcome, then 0 (only when result is known)
  const sorted = hasResult
    ? [...filtered].sort((a, b) => {
        const pa = calcPoints(
          { home: a.home_score, away: a.away_score },
          match.result!,
          match.isColombiaMatch ?? false,
        );
        const pb = calcPoints(
          { home: b.home_score, away: b.away_score },
          match.result!,
          match.isColombiaMatch ?? false,
        );
        return pb - pa;
      })
    : filtered;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white", borderRadius: 20, width: "100%", maxWidth: 440,
          maxHeight: "85vh", display: "flex", flexDirection: "column",
          overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "20px 20px 0", position: "relative" }}>
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 16,
              background: "#F3F4F6", border: "none", borderRadius: "50%",
              width: 32, height: 32, cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Pronósticos del partido
          </p>

          {/* Teams */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 16 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 32 }}>{match.home.flag}</span>
              <span style={{ fontSize: 13, fontWeight: 700, textAlign: "center" }}>{match.home.name}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              {hasResult ? (
                <span style={{ fontSize: 22, fontWeight: 900, color: "#111" }}>
                  {match.result!.home} – {match.result!.away}
                </span>
              ) : (
                <span style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 600 }}>VS</span>
              )}
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                {kickoffFmt.format(new Date(match.kickoff_at))}
              </span>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 32 }}>{match.away.flag}</span>
              <span style={{ fontSize: 13, fontWeight: 700, textAlign: "center" }}>{match.away.name}</span>
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="🔍 Buscar jugador…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", height: 40, borderRadius: 10, border: "1.5px solid #E5E7EB",
              padding: "0 14px", fontSize: 14, background: "#F9FAFB",
              boxSizing: "border-box", marginBottom: 12,
            }}
          />
        </div>

        {/* Count */}
        <div style={{ padding: "0 20px 8px" }}>
          <p style={{ fontSize: 12, color: "#6B7280" }}>
            {fetching ? "Cargando…" : `${preds.length} jugador${preds.length !== 1 ? "es" : ""} hizo${preds.length !== 1 ? "n" : ""} su pronóstico`}
          </p>
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", padding: "0 12px 16px", flex: 1 }}>
          {fetching && (
            <div style={{ padding: "24px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
              Cargando pronósticos…
            </div>
          )}
          {!fetching && fetchErr && (
            <div style={{ padding: "24px", textAlign: "center", color: "#EF4444", fontSize: 13 }}>
              No se pudieron cargar los pronósticos.<br/>
              <span style={{ color: "#9CA3AF", fontSize: 12 }}>Asegúrate de haber corrido la función SQL en Supabase.</span>
            </div>
          )}
          {!fetching && !fetchErr && sorted.length === 0 && (
            <div style={{ padding: "24px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
              {search ? "Sin resultados para esa búsqueda" : "Nadie ha hecho su pronóstico aún"}
            </div>
          )}
          {sorted.map((p) => {
            const pts = hasResult
              ? calcPoints(
                  { home: p.home_score, away: p.away_score },
                  match.result!,
                  match.isColombiaMatch ?? false,
                )
              : null;
            const maxPts = (match.isColombiaMatch ?? false) ? 6 : 3;
            const ptColor =
              pts === null ? "#9CA3AF"
              : pts >= maxPts ? "#D97706"
              : pts > 0 ? "#059669"
              : "#6B7280";

            return (
              <div
                key={p.user_id}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 8px", borderRadius: 10,
                  borderBottom: "1px solid #F3F4F6",
                }}
              >
                {/* Avatar */}
                {p.avatar_id ? (
                  <Image
                    src={`/avatars/${p.avatar_id}.svg`}
                    alt={p.nickname ?? ""}
                    width={36} height={36}
                    style={{ borderRadius: "50%", flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "#E5E7EB", flexShrink: 0,
                  }} />
                )}

                {/* Nickname */}
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#111" }}>
                  {p.nickname}
                </span>

                {/* Prediction */}
                <span style={{
                  fontSize: 15, fontWeight: 800, fontFamily: "monospace",
                  color: "#111", minWidth: 48, textAlign: "center",
                }}>
                  {p.home_score} – {p.away_score}
                </span>

                {/* Points badge */}
                {pts !== null && (
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: "white",
                    background: ptColor, borderRadius: 8,
                    padding: "2px 8px", minWidth: 36, textAlign: "center",
                  }}>
                    {pts}pt
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main MatchCard ──────────────────────────────────────────────────────────

export function MatchCard({
  match,
  editable,
  onPredictionSaved,
}: {
  match: MatchVM;
  editable: boolean;
  onPredictionSaved?: (matchId: number, prediction: { home: number; away: number }) => void;
}) {
  const router = useRouter();
  const predictionHome = match.prediction?.home;
  const predictionAway = match.prediction?.away;
  const [home, setHome] = useState<string>(
    predictionHome !== undefined ? String(predictionHome) : "",
  );
  const [away, setAway] = useState<string>(
    predictionAway !== undefined ? String(predictionAway) : "",
  );
  const [saveStatus, setSaveStatus] = useState<SaveState>("idle");
  const [modalOpen, setModalOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    setHome(predictionHome !== undefined ? String(predictionHome) : "");
    setAway(predictionAway !== undefined ? String(predictionAway) : "");
    setSaveStatus("idle");
  }, [match.id, predictionHome, predictionAway]);

  function scheduleSave(nextHome: string, nextAway: string) {
    if (!editable) return;
    if (nextHome === "" || nextAway === "") return;
    if (timer.current) clearTimeout(timer.current);
    setSaveStatus("saving");
    timer.current = setTimeout(async () => {
      const res = await savePrediction({
        matchId: match.id,
        home: Number(nextHome),
        away: Number(nextAway),
      });
      if (res.ok) {
        onPredictionSaved?.(match.id, {
          home: Number(nextHome),
          away: Number(nextAway),
        });
        if (mounted.current) {
          setSaveStatus("saved");
          router.refresh();
        }
      } else {
        if (mounted.current) setSaveStatus("error");
        toast.error(res.error);
      }
    }, 600);
  }

  const clamp = (v: string) => v.replace(/\D/g, "").slice(0, 2);

  const isCol = match.isColombiaMatch ?? false;

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-white px-3 py-2.5",
          isCol && "border-yellow-300 bg-yellow-50/40",
        )}
      >
        {/* Colombia badge */}
        {isCol && (
          <span className="hidden sm:inline-flex items-center text-[10px] font-bold text-yellow-700 bg-yellow-100 rounded px-1.5 shrink-0">
            ×2
          </span>
        )}

        <div className="flex flex-1 items-center justify-end gap-2 text-right">
          <span className="truncate text-sm font-medium">{match.home.name}</span>
          <span className="text-lg">{match.home.flag}</span>
        </div>

        <div className="flex items-center gap-1">
          <ScoreBox
            value={home}
            editable={editable}
            onChange={(v) => {
              const c = clamp(v);
              setHome(c);
              scheduleSave(c, away);
            }}
          />
          <span className="text-muted-foreground">–</span>
          <ScoreBox
            value={away}
            editable={editable}
            onChange={(v) => {
              const c = clamp(v);
              setAway(c);
              scheduleSave(home, c);
            }}
          />
        </div>

        <div className="flex flex-1 items-center gap-2">
          <span className="text-lg">{match.away.flag}</span>
          <span className="truncate text-sm font-medium">{match.away.name}</span>
        </div>

        {/* Right side: status + compare button */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className="w-20 text-right text-xs text-muted-foreground">
            {saveStatus === "saving" && "Guardando…"}
            {saveStatus === "saved" && <span className="text-emerald-600">✓ Guardado</span>}
            {saveStatus === "error" && <span className="text-red-600">Error</span>}
            {saveStatus === "idle" && kickoffFmt.format(new Date(match.kickoff_at))}
          </span>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
          >
            Ver
          </button>
        </div>

        {/* Mobile: just the compare button */}
        <button
          onClick={() => setModalOpen(true)}
          className="sm:hidden rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground"
        >
          Ver
        </button>
      </div>

      {modalOpen && (
        <PredictionsModal match={match} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}

function ScoreBox({
  value,
  editable,
  onChange,
}: {
  value: string;
  editable: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      disabled={!editable}
      onChange={(e) => onChange(e.target.value)}
      placeholder="-"
      className={cn(
        "h-10 w-10 rounded-md border text-center text-base font-semibold tabular-nums",
        "focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500",
        !editable && "cursor-not-allowed bg-muted text-muted-foreground",
      )}
    />
  );
}
