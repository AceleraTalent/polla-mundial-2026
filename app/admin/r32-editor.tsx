"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createKnockoutMatch, deleteKnockoutMatch, saveMatchResult, clearMatchResult } from "@/app/actions/admin";
import type { Team } from "@/lib/types";
import { Button } from "@/components/ui/button";

const STAGE_LABELS: Record<string, string> = {
  r32: "32avos de Final",
  r16: "Octavos de Final",
  qf: "Cuartos de Final",
  sf: "Semifinales",
  third_place: "Tercer y Cuarto Puesto",
  final: "Final",
};

const SLOT_MAX: Record<string, number> = {
  r32: 16,
  r16: 8,
  qf: 4,
  sf: 2,
  third_place: 1,
  final: 1,
};

export type KnockoutMatchVM = {
  id: number;
  stage: string;
  bracket_slot: number | null;
  home: { name: string; flag: string; id: number };
  away: { name: string; flag: string; id: number };
  kickoff_at: string;
  result: {
    home: number;
    away: number;
    penaltyWinnerTeamId: number | null;
    winnerTeamId: number | null;
  } | null;
};

// ── Result row for each knockout match ──────────────────────────────────────

function ResultRow({ match }: { match: KnockoutMatchVM }) {
  const [home, setHome] = useState(match.result ? String(match.result.home) : "");
  const [away, setAway] = useState(match.result ? String(match.result.away) : "");
  const [winner, setWinner] = useState<string>(
    match.result?.winnerTeamId ? String(match.result.winnerTeamId) : "",
  );
  const [wasPenalties, setWasPenalties] = useState(match.result?.penaltyWinnerTeamId != null);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(match.result != null);
  const [delPending, startDel] = useTransition();

  const clamp = (v: string) => v.replace(/\D/g, "").slice(0, 2);
  const isDraw = home !== "" && away !== "" && Number(home) === Number(away);

  function onSave() {
    if (home === "" || away === "") { toast.error("Completa ambos marcadores."); return; }
    if (isDraw && !winner) { toast.error("Partido empatado: indica quién avanza."); return; }
    startTransition(async () => {
      const res = await saveMatchResult({
        matchId: match.id,
        home: Number(home),
        away: Number(away),
        winnerTeamId: isDraw && winner ? Number(winner) : null,
        penaltyWinnerTeamId: isDraw && winner && wasPenalties ? Number(winner) : null,
      });
      if (res.ok) { setSaved(true); toast.success("Resultado guardado"); }
      else toast.error(res.error);
    });
  }

  function onClear() {
    startTransition(async () => {
      const res = await clearMatchResult(match.id);
      if (res.ok) {
        setHome(""); setAway(""); setWinner(""); setWasPenalties(false); setSaved(false);
        toast.success("Resultado borrado");
      }
      else toast.error(res.error);
    });
  }

  function onDelete() {
    startDel(async () => {
      const res = await deleteKnockoutMatch(match.id);
      if (!res.ok) toast.error(res.error);
      else toast.success("Partido eliminado");
    });
  }

  const slotLabel = match.bracket_slot ? `#${match.bracket_slot}` : "—";

  return (
    <div className="space-y-1.5 rounded-md border bg-white px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="w-8 text-xs text-muted-foreground font-mono">{slotLabel}</span>
        <div className="flex flex-1 items-center justify-end gap-1.5">
          <span className="truncate">{match.home.name}</span>
          <span>{match.home.flag}</span>
        </div>
        <input inputMode="numeric" value={home} onChange={(e) => setHome(clamp(e.target.value))}
          className="h-9 w-9 rounded border text-center tabular-nums" placeholder="-" />
        <span className="text-muted-foreground">–</span>
        <input inputMode="numeric" value={away} onChange={(e) => setAway(clamp(e.target.value))}
          className="h-9 w-9 rounded border text-center tabular-nums" placeholder="-" />
        <div className="flex flex-1 items-center gap-1.5">
          <span>{match.away.flag}</span>
          <span className="truncate">{match.away.name}</span>
        </div>
        <Button size="sm" onClick={onSave} disabled={pending}>
          {saved ? "Actualizar" : "Guardar"}
        </Button>
        {saved && (
          <Button size="sm" variant="ghost" onClick={onClear} disabled={pending}>✕</Button>
        )}
        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700"
          onClick={onDelete} disabled={delPending}>
          🗑
        </Button>
      </div>

      {isDraw && (
        <div className="flex flex-wrap items-center gap-2 pl-10 text-xs">
          <span className="font-semibold text-amber-700">⚠️ Empatado — ¿quién avanza?</span>
          <select
            value={winner}
            onChange={(e) => setWinner(e.target.value)}
            className="h-8 rounded border bg-white px-2 text-xs"
          >
            <option value="">— Selecciona —</option>
            <option value={match.home.id}>{match.home.flag} {match.home.name}</option>
            <option value={match.away.id}>{match.away.flag} {match.away.name}</option>
          </select>
          <label className="flex items-center gap-1 text-muted-foreground">
            <input
              type="checkbox"
              checked={wasPenalties}
              onChange={(e) => setWasPenalties(e.target.checked)}
            />
            🎯 Se definió por penales (+1 bono a quien acertó)
          </label>
        </div>
      )}
    </div>
  );
}

// ── Create form ──────────────────────────────────────────────────────────────

function CreateForm({ teams }: { teams: Team[] }) {
  const [stage, setStage] = useState<string>("r32");
  const [homeId, setHomeId] = useState<string>("");
  const [awayId, setAwayId] = useState<string>("");
  const [kickoff, setKickoff] = useState<string>("");
  const [slot, setSlot] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!homeId || !awayId || !kickoff) { toast.error("Completa todos los campos."); return; }
    if (homeId === awayId) { toast.error("El local y visitante deben ser diferentes."); return; }

    startTransition(async () => {
      const res = await createKnockoutMatch({
        stage,
        home_team_id: Number(homeId),
        away_team_id: Number(awayId),
        kickoff_at: kickoff,
        bracket_slot: slot ? Number(slot) : null,
      });
      if (res.ok) {
        toast.success("Partido creado");
        setHomeId(""); setAwayId(""); setKickoff(""); setSlot("");
      } else {
        toast.error(res.error);
      }
    });
  }

  const maxSlot = SLOT_MAX[stage] ?? 16;

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border bg-slate-50 p-4">
      <h4 className="font-semibold text-sm">Agregar partido eliminatorio</h4>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* Stage */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Fase</label>
          <select value={stage} onChange={(e) => setStage(e.target.value)}
            className="h-9 rounded border bg-white px-2 text-sm">
            {Object.entries(STAGE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Slot */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Slot llave (1–{maxSlot})
          </label>
          <input type="number" min={1} max={maxSlot} value={slot}
            onChange={(e) => setSlot(e.target.value)}
            placeholder="ej. 1"
            className="h-9 rounded border bg-white px-2 text-sm" />
        </div>

        {/* Kickoff */}
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Fecha/hora (local)</label>
          <input type="datetime-local" value={kickoff} onChange={(e) => setKickoff(e.target.value)}
            className="h-9 rounded border bg-white px-2 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Home team */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Local</label>
          <select value={homeId} onChange={(e) => setHomeId(e.target.value)}
            className="h-9 rounded border bg-white px-2 text-sm">
            <option value="">— Selecciona —</option>
            {sortedTeams.map((t) => (
              <option key={t.id} value={t.id}>{t.flag_emoji} {t.name}</option>
            ))}
          </select>
        </div>

        {/* Away team */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Visitante</label>
          <select value={awayId} onChange={(e) => setAwayId(e.target.value)}
            className="h-9 rounded border bg-white px-2 text-sm">
            <option value="">— Selecciona —</option>
            {sortedTeams.map((t) => (
              <option key={t.id} value={t.id}>{t.flag_emoji} {t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Guardando…" : "Crear partido"}
      </Button>
    </form>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export function R32Editor({
  teams,
  matches,
}: {
  teams: Team[];
  matches: KnockoutMatchVM[];
}) {
  const stages = ["r32", "r16", "qf", "sf", "third_place", "final"] as const;

  return (
    <div className="space-y-6">
      <CreateForm teams={teams} />

      {stages.map((stage) => {
        const stageMatches = matches
          .filter((m) => m.stage === stage)
          .sort((a, b) => (a.bracket_slot ?? 99) - (b.bracket_slot ?? 99));

        if (stageMatches.length === 0) return null;

        return (
          <div key={stage} className="space-y-2">
            <h3 className="font-bold text-sm">{STAGE_LABELS[stage]}</h3>
            <div className="space-y-1.5">
              {stageMatches.map((m) => (
                <ResultRow key={m.id} match={m} />
              ))}
            </div>
          </div>
        );
      })}

      {matches.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay partidos eliminatorios aún. Usa el formulario de arriba para agregar los 32avos.
        </p>
      )}
    </div>
  );
}
