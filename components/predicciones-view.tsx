"use client";

import { useState } from "react";
import { MatchCard, type MatchVM } from "@/components/match-card";
import { statusLabel, type WindowStatus } from "@/lib/locks";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type WindowInfo = {
  label: string;
  status: WindowStatus;
  locksAtLabel?: string;
};

const badgeStyle: Record<WindowStatus, string> = {
  open:     "bg-emerald-100 text-emerald-800",
  upcoming: "bg-amber-100 text-amber-800",
  locked:   "bg-zinc-200 text-zinc-700",
};

export function PrediccionesView({
  matchdayInfo,
  matches,
}: {
  matchdayInfo: Record<number, WindowInfo>;
  matches: MatchVM[];
}) {
  const [groupFilter, setGroupFilter] = useState<string>("Todos");

  const groups = [...new Set(matches.map((m) => m.group))].sort();
  const tabs = ["Todos", ...groups];

  const filtered =
    groupFilter === "Todos"
      ? matches
      : matches.filter((m) => m.group === groupFilter);

  return (
    <div className="space-y-6">

      {/* ── Group filter tabs ── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 4,
          WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
        }}
      >
        {tabs.map((g) => {
          const active = groupFilter === g;
          return (
            <button
              key={g}
              onClick={() => setGroupFilter(g)}
              style={{
                whiteSpace: "nowrap",
                flexShrink: 0,
                padding: "6px 16px",
                borderRadius: 9999,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                transition: "all 0.15s",
                background: active ? "#059669" : "#F3F4F6",
                color: active ? "white" : "#6B7280",
              }}
            >
              {g === "Todos" ? "Todos" : `Grupo ${g}`}
            </button>
          );
        })}
      </div>

      {/* ── Matchday sections ── */}
      {([1, 2, 3] as const).map((md) => {
        const info = matchdayInfo[md];
        const mdMatches = filtered.filter((m) => m.matchday === md);
        if (mdMatches.length === 0 && info.status === "upcoming") return null;
        if (mdMatches.length === 0) return null;

        const editable = info.status === "open";
        const sectionGroups = [...new Set(mdMatches.map((m) => m.group))].sort();

        return (
          <section key={md} className="space-y-3">
            {/* Section header */}
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold">{info.label}</h2>
              <Badge className={cn("border-0", badgeStyle[info.status])}>
                {statusLabel(info.status)}
              </Badge>
              {info.locksAtLabel && info.status === "open" && (
                <span className="text-xs text-muted-foreground">
                  Cierra: {info.locksAtLabel}
                </span>
              )}
            </div>

            {/* Matches */}
            <div className="space-y-4">
              {sectionGroups.map((g) => (
                <div key={g} className="space-y-1.5">
                  {/* Only show group label when "Todos" filter is active */}
                  {groupFilter === "Todos" && (
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Grupo {g}
                    </h3>
                  )}
                  <div className="space-y-1.5">
                    {mdMatches
                      .filter((m) => m.group === g)
                      .map((m) => (
                        <MatchCard key={m.id} match={m} editable={editable} />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
