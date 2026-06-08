"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { saveTournamentResults } from "@/app/actions/admin";
import type { Team, TournamentResults } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function TeamSelect({
  label,
  teams,
  value,
  onChange,
}: {
  label: string;
  teams: Team[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger>
          <SelectValue placeholder="Sin definir…" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((t) => (
            <SelectItem key={t.id} value={String(t.id)}>
              {t.flag_emoji} {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function TournamentEditor({
  teams,
  initial,
}: {
  teams: Team[];
  initial: TournamentResults | null;
}) {
  const [champion, setChampion] = useState(initial?.champion_team_id ? String(initial.champion_team_id) : "");
  const [runnerUp, setRunnerUp] = useState(initial?.runner_up_team_id ? String(initial.runner_up_team_id) : "");
  const [semi1, setSemi1] = useState(initial?.semifinalist1_id ? String(initial.semifinalist1_id) : "");
  const [semi2, setSemi2] = useState(initial?.semifinalist2_id ? String(initial.semifinalist2_id) : "");
  const [topScorer, setTopScorer] = useState(initial?.top_scorer ?? "");
  const [pending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const res = await saveTournamentResults({
        champion_team_id: champion || null,
        runner_up_team_id: runnerUp || null,
        semifinalist1_id: semi1 || null,
        semifinalist2_id: semi2 || null,
        top_scorer: topScorer || null,
      });
      if (res.ok) toast.success("Resultados del torneo guardados");
      else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Define los resultados reales que puntúan las predicciones especiales.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TeamSelect label="🏆 Campeón" teams={teams} value={champion} onChange={setChampion} />
        <TeamSelect label="🥈 Subcampeón" teams={teams} value={runnerUp} onChange={setRunnerUp} />
        <TeamSelect label="Semifinalista 1" teams={teams} value={semi1} onChange={setSemi1} />
        <TeamSelect label="Semifinalista 2" teams={teams} value={semi2} onChange={setSemi2} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ts">⚽ Goleador del torneo</Label>
        <Input
          id="ts"
          value={topScorer}
          onChange={(e) => setTopScorer(e.target.value)}
          placeholder="Nombre del jugador"
          maxLength={60}
        />
      </div>
      <Button onClick={onSave} disabled={pending}>
        {pending ? "Guardando…" : "Guardar resultados del torneo"}
      </Button>
    </div>
  );
}
