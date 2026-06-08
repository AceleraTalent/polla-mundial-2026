import { MatchCard, type MatchVM } from "@/components/match-card";
import { statusLabel, type WindowStatus } from "@/lib/locks";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const badgeStyle: Record<WindowStatus, string> = {
  open: "bg-emerald-100 text-emerald-800",
  upcoming: "bg-amber-100 text-amber-800",
  locked: "bg-zinc-200 text-zinc-700",
};

export function MatchdaySection({
  label,
  status,
  locksAtLabel,
  matches,
}: {
  label: string;
  status: WindowStatus;
  locksAtLabel?: string;
  matches: MatchVM[];
}) {
  const editable = status === "open";
  const groups = [...new Set(matches.map((m) => m.group))].sort();

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold">{label}</h2>
        <Badge className={cn("border-0", badgeStyle[status])}>
          {statusLabel(status)}
        </Badge>
        {locksAtLabel && status === "open" && (
          <span className="text-xs text-muted-foreground">
            Cierra: {locksAtLabel}
          </span>
        )}
      </div>

      {status === "upcoming" ? (
        <p className="rounded-lg border border-dashed bg-white p-6 text-center text-sm text-muted-foreground">
          Esta jornada se habilitará más cerca de la fecha. ¡Vuelve pronto!
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g} className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Grupo {g}
              </h3>
              <div className="space-y-1.5">
                {matches
                  .filter((m) => m.group === g)
                  .map((m) => (
                    <MatchCard key={m.id} match={m} editable={editable} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
