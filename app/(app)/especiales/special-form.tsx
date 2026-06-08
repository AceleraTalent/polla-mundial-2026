"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { saveSpecial } from "@/app/actions/special";
import type { SpecialPrediction, Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Lista de candidatos a goleador ────────────────────────────────────────
// Ordenados por grupo/país para facilitar la búsqueda
const TOP_SCORER_CANDIDATES = [
  // Francia (Grupo I)
  { name: "Kylian Mbappé",       country: "Francia 🇫🇷",    tier: "⭐ Favoritos" },
  { name: "Antoine Griezmann",   country: "Francia 🇫🇷",    tier: "⭐ Favoritos" },
  // Noruega (Grupo I)
  { name: "Erling Haaland",      country: "Noruega 🇳🇴",    tier: "⭐ Favoritos" },
  // Brasil (Grupo C)
  { name: "Vinicius Jr",         country: "Brasil 🇧🇷",     tier: "⭐ Favoritos" },
  { name: "Rodrygo",             country: "Brasil 🇧🇷",     tier: "⭐ Favoritos" },
  { name: "Richarlison",         country: "Brasil 🇧🇷",     tier: "⭐ Favoritos" },
  // Argentina (Grupo J)
  { name: "Lionel Messi",        country: "Argentina 🇦🇷",  tier: "⭐ Favoritos" },
  { name: "Lautaro Martínez",    country: "Argentina 🇦🇷",  tier: "⭐ Favoritos" },
  // Inglaterra (Grupo L)
  { name: "Harry Kane",          country: "Inglaterra 🏴󠁧󠁢󠁥󠁮󠁧󠁿", tier: "⭐ Favoritos" },
  { name: "Bukayo Saka",         country: "Inglaterra 🏴󠁧󠁢󠁥󠁮󠁧󠁿", tier: "⭐ Favoritos" },
  { name: "Phil Foden",          country: "Inglaterra 🏴󠁧󠁢󠁥󠁮󠁧󠁿", tier: "⭐ Favoritos" },
  // Portugal (Grupo K)
  { name: "Cristiano Ronaldo",   country: "Portugal 🇵🇹",   tier: "⭐ Favoritos" },
  { name: "Rafael Leão",         country: "Portugal 🇵🇹",   tier: "⭐ Favoritos" },
  { name: "Gonçalo Ramos",       country: "Portugal 🇵🇹",   tier: "⭐ Favoritos" },
  // Colombia 🇨🇴 (Grupo K — partidos valen DOBLE)
  { name: "Luis Díaz",           country: "Colombia 🇨🇴",   tier: "🇨🇴 Colombia (×2)" },
  { name: "Jhon Durán",          country: "Colombia 🇨🇴",   tier: "🇨🇴 Colombia (×2)" },
  { name: "Radamel Falcao",      country: "Colombia 🇨🇴",   tier: "🇨🇴 Colombia (×2)" },
  // Alemania (Grupo E)
  { name: "Florian Wirtz",       country: "Alemania 🇩🇪",   tier: "🔥 Otros candidatos" },
  { name: "Kai Havertz",         country: "Alemania 🇩🇪",   tier: "🔥 Otros candidatos" },
  { name: "Leroy Sané",          country: "Alemania 🇩🇪",   tier: "🔥 Otros candidatos" },
  // Países Bajos (Grupo F)
  { name: "Cody Gakpo",          country: "Países Bajos 🇳🇱","tier": "🔥 Otros candidatos" },
  { name: "Memphis Depay",       country: "Países Bajos 🇳🇱","tier": "🔥 Otros candidatos" },
  // Bélgica (Grupo G)
  { name: "Romelu Lukaku",       country: "Bélgica 🇧🇪",    tier: "🔥 Otros candidatos" },
  // Uruguay (Grupo H)
  { name: "Darwin Núñez",        country: "Uruguay 🇺🇾",    tier: "🔥 Otros candidatos" },
  // España (Grupo H)
  { name: "Lamine Yamal",        country: "España 🇪🇸",     tier: "🔥 Otros candidatos" },
  { name: "Álvaro Morata",       country: "España 🇪🇸",     tier: "🔥 Otros candidatos" },
  // Canadá (Grupo B)
  { name: "Jonathan David",      country: "Canadá 🇨🇦",     tier: "🔥 Otros candidatos" },
  // EE.UU. (Grupo D)
  { name: "Christian Pulisic",   country: "Estados Unidos 🇺🇸","tier":"🔥 Otros candidatos" },
  // Senegal (Grupo I)
  { name: "Sadio Mané",          country: "Senegal 🇸🇳",    tier: "🔥 Otros candidatos" },
  // México (Grupo A)
  { name: "Hirving Lozano",      country: "México 🇲🇽",     tier: "🔥 Otros candidatos" },
  { name: "Santiago Giménez",    country: "México 🇲🇽",     tier: "🔥 Otros candidatos" },
];

const OTRO_VALUE = "__otro__";

// ─── Componente selector de goleador ───────────────────────────────────────

function TopScorerSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const knownNames = TOP_SCORER_CANDIDATES.map((c) => c.name);
  const isCustom = value !== "" && !knownNames.includes(value);
  const [showCustom, setShowCustom] = useState(isCustom);
  const [selectVal, setSelectVal] = useState(isCustom ? OTRO_VALUE : value);

  const tiers = [...new Set(TOP_SCORER_CANDIDATES.map((c) => c.tier))];

  function handleSelect(v: string) {
    setSelectVal(v);
    if (v === OTRO_VALUE) {
      setShowCustom(true);
      onChange("");
    } else {
      setShowCustom(false);
      onChange(v);
    }
  }

  return (
    <div className="space-y-2">
      <Select value={selectVal} onValueChange={(v) => handleSelect(v ?? "")} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Elige un goleador…" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {tiers.map((tier) => (
            <SelectGroup key={tier}>
              <SelectLabel className="text-xs">{tier}</SelectLabel>
              {TOP_SCORER_CANDIDATES.filter((c) => c.tier === tier).map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  <span className="font-medium">{c.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{c.country}</span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
          <SelectGroup>
            <SelectLabel className="text-xs">Otro</SelectLabel>
            <SelectItem value={OTRO_VALUE}>✏️ Otro jugador…</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {showCustom && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe el nombre del jugador"
          disabled={disabled}
          maxLength={60}
          autoFocus
        />
      )}
    </div>
  );
}

// ─── Selector de equipo ─────────────────────────────────────────────────────

function TeamSelect({
  label,
  teams,
  value,
  onChange,
  disabled,
}: {
  label: string;
  teams: Team[];
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Elegir selección…" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
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

// ─── Formulario principal ───────────────────────────────────────────────────

export function SpecialForm({
  teams,
  initial,
  editable,
}: {
  teams: Team[];
  initial: SpecialPrediction | null;
  editable: boolean;
}) {
  const [champion, setChampion] = useState(initial?.champion_team_id ? String(initial.champion_team_id) : "");
  const [runnerUp, setRunnerUp] = useState(initial?.runner_up_team_id ? String(initial.runner_up_team_id) : "");
  const [semi1, setSemi1] = useState(initial?.semifinalist1_id ? String(initial.semifinalist1_id) : "");
  const [semi2, setSemi2] = useState(initial?.semifinalist2_id ? String(initial.semifinalist2_id) : "");
  const [topScorer, setTopScorer] = useState(initial?.top_scorer ?? "");
  const [pending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const res = await saveSpecial({
        champion_team_id: champion || null,
        runner_up_team_id: runnerUp || null,
        semifinalist1_id: semi1 || null,
        semifinalist2_id: semi2 || null,
        top_scorer: topScorer || null,
      });
      if (res.ok) toast.success("Predicciones especiales guardadas ✓");
      else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tu pronóstico del torneo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TeamSelect label="🏆 Campeón" teams={teams} value={champion} onChange={setChampion} disabled={!editable} />
          <TeamSelect label="🥈 Subcampeón" teams={teams} value={runnerUp} onChange={setRunnerUp} disabled={!editable} />
          <TeamSelect label="4️⃣ Semifinalista 1" teams={teams} value={semi1} onChange={setSemi1} disabled={!editable} />
          <TeamSelect label="4️⃣ Semifinalista 2" teams={teams} value={semi2} onChange={setSemi2} disabled={!editable} />
        </div>

        <div className="space-y-1.5">
          <Label>
            ⚽ Goleador del torneo
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (partidos de Colombia valen ×2)
            </span>
          </Label>
          <TopScorerSelect value={topScorer} onChange={setTopScorer} disabled={!editable} />
        </div>

        {!editable && (
          <p className="text-sm text-muted-foreground">
            🔒 Las predicciones especiales están cerradas.
          </p>
        )}

        {editable && (
          <Button onClick={onSave} disabled={pending} className="w-full sm:w-auto">
            {pending ? "Guardando…" : "Guardar predicciones"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
