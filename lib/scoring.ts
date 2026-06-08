export const POINTS = {
  EXACT: 3,
  OUTCOME: 1,
  CHAMPION: 10,
  RUNNER_UP: 5,
  SEMIFINALIST: 3,
  TOP_SCORER: 5,
  COLOMBIA_MULTIPLIER: 2,
} as const;

const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);

/**
 * Puntos de una predicción de marcador.
 * Si isColombiaMatch=true, los puntos base se multiplican x2 (regla especial).
 * Devuelve null si aún no hay resultado.
 */
export function matchPoints(
  pred: { home_score: number; away_score: number } | null | undefined,
  result: { home_score: number; away_score: number } | null | undefined,
  isColombiaMatch = false,
): number | null {
  if (!pred || !result) return null;
  const mult = isColombiaMatch ? POINTS.COLOMBIA_MULTIPLIER : 1;
  if (pred.home_score === result.home_score && pred.away_score === result.away_score) {
    return POINTS.EXACT * mult;
  }
  if (sign(pred.home_score - pred.away_score) === sign(result.home_score - result.away_score)) {
    return POINTS.OUTCOME * mult;
  }
  return 0;
}
