"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { clearMatchResult, saveMatchResult } from "@/app/actions/admin";
import type { AdminMatchVM } from "./admin-tabs";
import { Button } from "@/components/ui/button";

function ResultRow({ match }: { match: AdminMatchVM }) {
  const [home, setHome] = useState(match.result ? String(match.result.home) : "");
  const [away, setAway] = useState(match.result ? String(match.result.away) : "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(match.result != null);

  const clamp = (v: string) => v.replace(/\D/g, "").slice(0, 2);

  function onSave() {
    if (home === "" || away === "") {
      toast.error("Completa ambos marcadores.");
      return;
    }
    startTransition(async () => {
      const res = await saveMatchResult({
        matchId: match.id,
        home: Number(home),
        away: Number(away),
      });
      if (res.ok) {
        setSaved(true);
        toast.success("Resultado guardado");
      } else toast.error(res.error);
    });
  }

  function onClear() {
    startTransition(async () => {
      const res = await clearMatchResult(match.id);
      if (res.ok) {
        setHome("");
        setAway("");
        setSaved(false);
        toast.success("Resultado borrado");
      } else toast.error(res.error);
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-2">
      <div className="flex flex-1 items-center justify-end gap-1.5 text-right text-sm">
        <span className="truncate">{match.home.name}</span>
        <span>{match.home.flag}</span>
      </div>
      <input
        inputMode="numeric"
        value={home}
        onChange={(e) => setHome(clamp(e.target.value))}
        className="h-9 w-9 rounded border text-center tabular-nums"
        placeholder="-"
      />
      <span className="text-muted-foreground">–</span>
      <input
        inputMode="numeric"
        value={away}
        onChange={(e) => setAway(clamp(e.target.value))}
        className="h-9 w-9 rounded border text-center tabular-nums"
        placeholder="-"
      />
      <div className="flex flex-1 items-center gap-1.5 text-sm">
        <span>{match.away.flag}</span>
        <span className="truncate">{match.away.name}</span>
      </div>
      <Button size="sm" onClick={onSave} disabled={pending}>
        {saved ? "Actualizar" : "Guardar"}
      </Button>
      {saved && (
        <Button size="sm" variant="ghost" onClick={onClear} disabled={pending}>
          ✕
        </Button>
      )}
    </div>
  );
}

export function ResultsEditor({ matches }: { matches: AdminMatchVM[] }) {
  const matchdays = [...new Set(matches.map((m) => m.matchday))].sort();

  return (
    <div className="space-y-6">
      {matchdays.map((md) => (
        <div key={md} className="space-y-2">
          <h3 className="font-bold">Jornada {md}</h3>
          <div className="space-y-1.5">
            {matches
              .filter((m) => m.matchday === md)
              .map((m) => (
                <ResultRow key={m.id} match={m} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
