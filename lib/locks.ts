import type { PhaseWindow } from "@/lib/types";

export type WindowStatus = "upcoming" | "open" | "locked";

/** Estado actual de una ventana de predicción. */
export function windowStatus(
  w: Pick<PhaseWindow, "opens_at" | "locks_at"> | undefined,
  now: Date = new Date(),
): WindowStatus {
  if (!w) return "locked";
  const opens = new Date(w.opens_at).getTime();
  const locks = new Date(w.locks_at).getTime();
  const t = now.getTime();
  if (t < opens) return "upcoming";
  if (t >= locks) return "locked";
  return "open";
}

export const phaseKeyForMatchday = (matchday: number | null) =>
  matchday ? `md${matchday}` : "";

export function statusLabel(status: WindowStatus): string {
  switch (status) {
    case "upcoming":
      return "Próximamente";
    case "locked":
      return "Cerrada";
    case "open":
      return "Abierta";
  }
}
