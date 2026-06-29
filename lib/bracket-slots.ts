/**
 * Official FIFA 2026 World Cup knockout bracket slot assignments.
 * Source: Wikipedia 2026 FIFA World Cup knockout stage (matches 73–88 R32, 89–96 R16)
 *
 * Left half (slots 1–8) → SF1:
 *   Slots 1–2 → R16 M89   W(GER/PAR) vs W(FRA/SWE)         → QF97
 *   Slots 3–4 → R16 M90   W(RSA/CAN) vs W(NED/MAR)         → QF97
 *   Slots 5–6 → R16 M93   W(POR/CRO) vs W(ESP/AUT)         → QF98
 *   Slots 7–8 → R16 M94   W(USA/BIH) vs W(BEL/SEN)         → QF98
 *
 * Right half (slots 9–16) → SF2:
 *   Slots  9–10 → R16 M91  W(BRA/JPN) vs W(CIV/NOR)        → QF99
 *   Slots 11–12 → R16 M92  W(MEX/ECU) vs W(ENG/COD)        → QF99
 *   Slots 13–14 → R16 M95  W(ARG/CPV) vs W(AUS/EGY)        → QF100
 *   Slots 15–16 → R16 M96  W(SUI/ALG) vs W(COL/GHA)        → QF100
 */
export const R32_BRACKET_SLOT: Record<number, number> = {
  92:  1,  // Alemania vs Paraguay     (FIFA M74)
  93:  2,  // Francia vs Suecia        (FIFA M77)
  89:  3,  // Sudáfrica vs Canadá      (FIFA M73)
  94:  4,  // Países Bajos vs Marruecos (FIFA M75)
  100: 5,  // Portugal vs Croacia      (FIFA M83) ← IZQUIERDO
  99:  6,  // España vs Austria        (FIFA M84)
  98:  7,  // Estados Unidos vs Bosnia (FIFA M81)
  97:  8,  // Bélgica vs Senegal       (FIFA M82)
  90:  9,  // Brasil vs Japón          (FIFA M76) ← DERECHO
  91:  10, // Costa de Marfil vs Noruega (FIFA M78)
  95:  11, // México vs Ecuador        (FIFA M79)
  96:  12, // Inglaterra vs R.D. Congo (FIFA M80)
  103: 13, // Argentina vs Cabo Verde  (FIFA M86)
  102: 14, // Australia vs Egipto      (FIFA M88)
  101: 15, // Suiza vs Argelia         (FIFA M85)
  104: 16, // Colombia vs Ghana        (FIFA M87)
};

/** Returns the bracket slot for a knockout match, defaulting to the fallback index. */
export function getBracketSlot(matchId: number, stage: string, fallbackIndex: number): number {
  if (stage === "r32") return R32_BRACKET_SLOT[matchId] ?? fallbackIndex;
  return fallbackIndex;
}
