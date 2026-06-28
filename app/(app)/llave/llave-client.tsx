"use client";

import { useState } from "react";
import { MatchCard, type MatchVM } from "@/components/match-card";
import { BracketView, type BracketMatchVM } from "@/components/bracket-view";

const kickoffFmt = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

type StageGroup = {
  stage: string;
  label: string;
  bracket: BracketMatchVM[];
  cards: MatchVM[];
};

export function LlaveClient({
  byStage,
  bracketMatches,
}: {
  byStage: StageGroup[];
  bracketMatches: BracketMatchVM[];
}) {
  const [localStages, setLocalStages] = useState<StageGroup[]>(byStage);

  function updatePrediction(matchId: number, prediction: { home: number; away: number }) {
    setLocalStages((prev) =>
      prev.map((s) => ({
        ...s,
        cards: s.cards.map((m) => (m.id === matchId ? { ...m, prediction } : m)),
      })),
    );
  }

  return (
    <div className="space-y-8">
      {/* Visual bracket (first stage only if R32) */}
      {bracketMatches.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Vista de llave
          </h2>
          <div className="rounded-xl border bg-white p-4 overflow-x-auto">
            <BracketView matches={bracketMatches} />
          </div>
        </section>
      )}

      {/* Match cards by stage — with prediction inputs */}
      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Tus predicciones eliminatoria
        </h2>

        {localStages.map(({ stage, label, cards }) => (
          <div key={stage} className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold">{label}</h3>
              <span
                className={
                  cards.some((m) => !m.locked)
                    ? "rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800"
                    : "rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-bold text-zinc-600"
                }
              >
                {cards.some((m) => !m.locked) ? "Abierta" : "Cerrada"}
              </span>
            </div>

            <div className="space-y-2">
              {cards.map((m) => (
                <div key={m.id} className="space-y-0.5">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs text-muted-foreground">
                      {kickoffFmt.format(new Date(m.kickoff_at))}
                    </span>
                    {m.locked ? (
                      <span className="text-xs text-zinc-400">🔒 Cerrado</span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600">
                        🔓 Abierto — cierra 1h antes
                      </span>
                    )}
                  </div>
                  <MatchCard
                    match={m}
                    editable={!m.locked && !m.result}
                    onPredictionSaved={updatePrediction}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
