"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { savePrediction } from "@/app/actions/predictions";
import { cn } from "@/lib/utils";

export type MatchVM = {
  id: number;
  matchday: number;
  group: string;
  kickoff_at: string;
  home: { name: string; flag: string };
  away: { name: string; flag: string };
  prediction: { home: number; away: number } | null;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const kickoffFmt = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function MatchCard({ match, editable }: { match: MatchVM; editable: boolean }) {
  const [home, setHome] = useState<string>(
    match.prediction ? String(match.prediction.home) : "",
  );
  const [away, setAway] = useState<string>(
    match.prediction ? String(match.prediction.away) : "",
  );
  const [status, setStatus] = useState<SaveState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleSave(nextHome: string, nextAway: string) {
    if (!editable) return;
    if (nextHome === "" || nextAway === "") return;
    if (timer.current) clearTimeout(timer.current);
    setStatus("saving");
    timer.current = setTimeout(async () => {
      const res = await savePrediction({
        matchId: match.id,
        home: Number(nextHome),
        away: Number(nextAway),
      });
      if (res.ok) {
        setStatus("saved");
      } else {
        setStatus("error");
        toast.error(res.error);
      }
    }, 600);
  }

  const clamp = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 2);
    return n;
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2.5">
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

      <div className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground sm:block">
        {status === "saving" && <span>Guardando…</span>}
        {status === "saved" && <span className="text-emerald-600">✓ Guardado</span>}
        {status === "error" && <span className="text-red-600">Error</span>}
        {status === "idle" && <span>{kickoffFmt.format(new Date(match.kickoff_at))}</span>}
      </div>
    </div>
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
