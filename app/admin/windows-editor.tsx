"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { savePhaseWindow } from "@/app/actions/admin";
import type { PhaseWindow } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/** ISO -> valor para <input type="datetime-local"> en hora local. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function WindowRow({ window: w }: { window: PhaseWindow }) {
  const [opens, setOpens] = useState(toLocalInput(w.opens_at));
  const [locks, setLocks] = useState(toLocalInput(w.locks_at));
  const [pending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const res = await savePhaseWindow({
        phase_key: w.phase_key,
        opens_at: opens,
        locks_at: locks,
      });
      if (res.ok) toast.success(`${w.label} actualizada`);
      else toast.error(res.error);
    });
  }

  return (
    <div className="rounded-md border bg-white p-3">
      <h3 className="mb-2 font-semibold">{w.label}</h3>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-1">
          <Label className="text-xs">Abre</Label>
          <input
            type="datetime-local"
            value={opens}
            onChange={(e) => setOpens(e.target.value)}
            className="h-9 w-full rounded border px-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Cierra</Label>
          <input
            type="datetime-local"
            value={locks}
            onChange={(e) => setLocks(e.target.value)}
            className="h-9 w-full rounded border px-2 text-sm"
          />
        </div>
        <Button size="sm" onClick={onSave} disabled={pending}>
          Guardar
        </Button>
      </div>
    </div>
  );
}

export function WindowsEditor({ windows }: { windows: PhaseWindow[] }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Define cuándo abre y cierra cada jornada. Las horas se interpretan en tu
        zona horaria local.
      </p>
      {windows.map((w) => (
        <WindowRow key={w.phase_key} window={w} />
      ))}
    </div>
  );
}
