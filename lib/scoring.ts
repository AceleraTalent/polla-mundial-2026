export const POINTS = {
  EXACT: 3,
  OUTCOME: 1,
  CHAMPION: 10,
  RUNNER_UP: 5,
  SEMIFINALIST: 3,
  TOP_SCORER: 5,
  COLOMBIA_MULTIPLIER: 2,
  PENALTY_WINNER: 1,
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

/**
 * Bono de 1 punto por acertar el ganador de la tanda de penales.
 * Solo aplica si el partido efectivamente se definió por penales
 * (result.penalty_winner_team_id no es null). No resta si el usuario
 * no eligió, si el partido no llegó a penales, o si eligió mal.
 */
export function penaltyWinnerPoints(
  predPenaltyWinnerTeamId: number | null | undefined,
  resultPenaltyWinnerTeamId: number | null | undefined,
): number {
  if (!resultPenaltyWinnerTeamId) return 0;
  if (!predPenaltyWinnerTeamId) return 0;
  return predPenaltyWinnerTeamId === resultPenaltyWinnerTeamId ? POINTS.PENALTY_WINNER : 0;
}
