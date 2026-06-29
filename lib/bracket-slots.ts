/**
 * Official FIFA 2026 World Cup knockout bracket slot assignments.
 *
 * Left half (slots 1–8):
 *   Slots 1–2 → R16 slot 1 (Philadelphia)   W(GER/PAR) vs W(FRA/SWE)
 *   Slots 3–4 → R16 slot 2 (Houston)         W(RSA/CAN) vs W(NED/MAR)
 *   Slots 5–6 → R16 slot 3 (New Jersey)      W(BRA/JPN) vs W(CIV/NOR)
 *   Slots 7–8 → R16 slot 4 (Mexico City)     W(MEX/ECU) vs W(ENG/COD)
 *
 * Right half (slots 9–16):
 *   Slots  9–10 → R16 slot 5 (Arlington)     W(POR/CRO) vs W(ESP/AUT)
 *   Slots 11–12 → R16 slot 6 (Seattle)       W(USA/BIH) vs W(BEL/SEN)
 *   Slots 13–14 → R16 slot 7 (Atlanta)       W(ARG/CPV) vs W(AUS/EGY)
 *   Slots 15–16 → R16 slot 8 (Vancouver)     W(SUI/ALG) vs W(COL/GHA)
 */
export const R32_BRACKET_SLOT: Record<number, number> = {
  92:  1,  // Alemania vs Paraguay
  93:  2,  // Francia vs Suecia
  89:  3,  // Sudáfrica vs Canadá
  94:  4,  // Países Bajos vs Marruecos
  90:  5,  // Brasil vs Japón
  91:  6,  // Costa de Marfil vs Noruega
  95:  7,  // México vs Ecuador
  96:  8,  // Inglaterra vs R.D. Congo
  100: 9,  // Portugal vs Croacia
  99:  10, // España vs Austria
  98:  11, // Estados Unidos vs Bosnia
  97:  12, // Bélgica vs Senegal
  103: 13, // Argentina vs Cabo Verde
  102: 14, // Australia vs Egipto
  101: 15, // Suiza vs Argelia
  104: 16, // Colombia vs Ghana
};

/** Returns the bracket slot for a knockout match, defaulting to the fallback index. */
export function getBracketSlot(matchId: number, stage: string, fallbackIndex: number): number {
  if (stage === "r32") return R32_BRACKET_SLOT[matchId] ?? fallbackIndex;
  return fallbackIndex;
}
