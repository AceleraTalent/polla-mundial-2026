"use client";

// ── Constants ────────────────────────────────────────────────────────────────
const ITEM_H = 80;       // px — height of one R32 match slot
const TOTAL_H = 8 * ITEM_H; // = 640px — full bracket height (left or right half)
const CARD_W = 136;      // px — match card width
const CONN_W = 20;       // px — SVG connector width

// ── Types ─────────────────────────────────────────────────────────────────────
type Team = { name: string; flag: string };

export type BracketMatchVM = {
  id: number | null;
  stage: string;
  bracket_slot: number | null;
  home: Team | null;
  away: Team | null;
  result: { home: number; away: number } | null;
  kickoff_at: string | null;
  isOpen: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildSlotMap(matches: BracketMatchVM[]) {
  const map = new Map<string, Map<number, BracketMatchVM>>();
  for (const m of matches) {
    if (!m.bracket_slot) continue;
    if (!map.has(m.stage)) map.set(m.stage, new Map());
    map.get(m.stage)!.set(m.bracket_slot, m);
  }
  return map;
}

function getMatch(
  slotMap: Map<string, Map<number, BracketMatchVM>>,
  stage: string,
  slot: number,
): BracketMatchVM | null {
  return slotMap.get(stage)?.get(slot) ?? null;
}

// ── Compact match card for bracket ───────────────────────────────────────────
function BracketCard({ match, isFinal = false }: { match: BracketMatchVM | null; isFinal?: boolean }) {
  const home = match?.home;
  const away = match?.away;
  const result = match?.result;
  const homeWin = result && result.home > result.away;
  const awayWin = result && result.away > result.home;

  const kickoffLabel = match?.kickoff_at
    ? new Date(match.kickoff_at).toLocaleDateString("es-CO", {
        month: "short",
        day: "numeric",
        timeZone: "America/Bogota",
      })
    : null;

  return (
    <div
      style={{
        width: CARD_W,
        border: isFinal ? "2px solid #d97706" : "1px solid #e2e8f0",
        borderRadius: 8,
        background: isFinal ? "#fffbeb" : "white",
        padding: "5px 8px",
        boxShadow: isFinal
          ? "0 2px 8px rgba(217,119,6,0.2)"
          : "0 1px 3px rgba(0,0,0,0.06)",
        fontSize: 11,
        userSelect: "none" as const,
      }}
    >
      {/* Home */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, minHeight: 20 }}>
        <span style={{ fontSize: 13, lineHeight: 1, flexShrink: 0 }}>{home?.flag ?? "🏳️"}</span>
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: homeWin ? 800 : 600,
            color: home ? "#111" : "#9ca3af",
          }}
        >
          {home?.name ?? "Por definir"}
        </span>
        {result && (
          <span
            style={{
              fontWeight: 800,
              fontSize: 13,
              minWidth: 16,
              textAlign: "right",
              color: homeWin ? "#059669" : "#374151",
            }}
          >
            {result.home}
          </span>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#f1f5f9", margin: "3px 0" }} />

      {/* Away */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, minHeight: 20 }}>
        <span style={{ fontSize: 13, lineHeight: 1, flexShrink: 0 }}>{away?.flag ?? "🏳️"}</span>
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: awayWin ? 800 : 600,
            color: away ? "#111" : "#9ca3af",
          }}
        >
          {away?.name ?? "Por definir"}
        </span>
        {result && (
          <span
            style={{
              fontWeight: 800,
              fontSize: 13,
              minWidth: 16,
              textAlign: "right",
              color: awayWin ? "#059669" : "#374151",
            }}
          >
            {result.away}
          </span>
        )}
      </div>

      {/* Date (only if no result yet) */}
      {!result && kickoffLabel && (
        <div style={{ color: "#94a3b8", fontSize: 9, marginTop: 2 }}>{kickoffLabel}</div>
      )}
    </div>
  );
}

// ── Slot: fixed-height container that centers the card ────────────────────────
function BracketSlot({
  match,
  slotH,
  isFinal = false,
}: {
  match: BracketMatchVM | null;
  slotH: number;
  isFinal?: boolean;
}) {
  return (
    <div
      style={{
        height: slotH,
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <BracketCard match={match} isFinal={isFinal} />
    </div>
  );
}

// ── SVG connector: connects 2N previous-round matches → N next-round matches ──
// dir="right" : inputs on left, output on right (left half of bracket)
// dir="left"  : inputs on right, output on left (right half, visually mirrored)
function RoundConnector({ pairCount, dir = "right" }: { pairCount: number; dir?: "right" | "left" }) {
  const pairH = TOTAL_H / pairCount;
  const itemH = pairH / 2;
  const midX = CONN_W / 2;

  return (
    <svg
      width={CONN_W}
      height={TOTAL_H}
      style={{ flexShrink: 0, transform: dir === "left" ? "scaleX(-1)" : undefined }}
    >
      {Array.from({ length: pairCount }, (_, i) => {
        const offset = i * pairH;
        const topY = offset + itemH / 2;
        const botY = offset + itemH + itemH / 2;
        const midY = offset + itemH;
        return (
          <g key={i} stroke="#cbd5e1" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={`0,${topY} ${midX},${topY} ${midX},${midY} ${CONN_W},${midY}`} />
            <polyline points={`0,${botY} ${midX},${botY} ${midX},${midY}`} />
          </g>
        );
      })}
    </svg>
  );
}

// Straight horizontal line: SF → Final (or Final → SF on right side)
function StraightConnector() {
  const midY = TOTAL_H / 2;
  return (
    <svg width={CONN_W} height={TOTAL_H} style={{ flexShrink: 0 }}>
      <line x1="0" y1={midY} x2={CONN_W} y2={midY} stroke="#cbd5e1" strokeWidth="1.5" />
    </svg>
  );
}

// ── A bracket column (one round, multiple slots) ──────────────────────────────
function BracketColumn({
  matches,
  slotH,
  isFinal = false,
}: {
  matches: (BracketMatchVM | null)[];
  slotH: number;
  isFinal?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
      {matches.map((m, i) => (
        <BracketSlot key={i} match={m} slotH={slotH} isFinal={isFinal} />
      ))}
    </div>
  );
}

// ── Round label ───────────────────────────────────────────────────────────────
function RoundLabel({ label, width }: { label: string; width: number }) {
  return (
    <div
      style={{
        width,
        textAlign: "center",
        fontSize: 10,
        fontWeight: 700,
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        paddingBottom: 6,
        flexShrink: 0,
      }}
    >
      {label}
    </div>
  );
}

// ── Main BracketView ──────────────────────────────────────────────────────────
export function BracketView({ matches }: { matches: BracketMatchVM[] }) {
  const slotMap = buildSlotMap(matches);

  // Left half: slots 1–8 (R32) → 1–4 (R16) → 1–2 (QF) → 1 (SF)
  const r32Left  = Array.from({ length: 8 }, (_, i) => getMatch(slotMap, "r32", i + 1));
  const r16Left  = Array.from({ length: 4 }, (_, i) => getMatch(slotMap, "r16", i + 1));
  const qfLeft   = Array.from({ length: 2 }, (_, i) => getMatch(slotMap, "qf", i + 1));
  const sfLeft   = [getMatch(slotMap, "sf", 1)];

  // Right half: slots 9–16 (R32) → 5–8 (R16) → 3–4 (QF) → 2 (SF)
  const r32Right = Array.from({ length: 8 }, (_, i) => getMatch(slotMap, "r32", i + 9));
  const r16Right = Array.from({ length: 4 }, (_, i) => getMatch(slotMap, "r16", i + 5));
  const qfRight  = Array.from({ length: 2 }, (_, i) => getMatch(slotMap, "qf", i + 3));
  const sfRight  = [getMatch(slotMap, "sf", 2)];

  const finalMatch = getMatch(slotMap, "final", 1);
  const thirdPlaceMatch = getMatch(slotMap, "third_place", 1);

  return (
    <div style={{ overflowX: "auto", paddingBottom: 16 }}>
      {/* Round labels row */}
      <div style={{ display: "flex", alignItems: "flex-end", paddingLeft: 0 }}>
        <RoundLabel label="32avos" width={CARD_W} />
        <div style={{ width: CONN_W, flexShrink: 0 }} />
        <RoundLabel label="Octavos" width={CARD_W} />
        <div style={{ width: CONN_W, flexShrink: 0 }} />
        <RoundLabel label="Cuartos" width={CARD_W} />
        <div style={{ width: CONN_W, flexShrink: 0 }} />
        <RoundLabel label="Semis" width={CARD_W} />
        <div style={{ width: CONN_W, flexShrink: 0 }} />
        <RoundLabel label="⚽ Final" width={CARD_W} />
        <div style={{ width: CONN_W, flexShrink: 0 }} />
        <RoundLabel label="Semis" width={CARD_W} />
        <div style={{ width: CONN_W, flexShrink: 0 }} />
        <RoundLabel label="Cuartos" width={CARD_W} />
        <div style={{ width: CONN_W, flexShrink: 0 }} />
        <RoundLabel label="Octavos" width={CARD_W} />
        <div style={{ width: CONN_W, flexShrink: 0 }} />
        <RoundLabel label="32avos" width={CARD_W} />
      </div>

      {/* Bracket rows */}
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {/* Left half */}
        <BracketColumn matches={r32Left}  slotH={ITEM_H} />
        <RoundConnector pairCount={4} />
        <BracketColumn matches={r16Left}  slotH={ITEM_H * 2} />
        <RoundConnector pairCount={2} />
        <BracketColumn matches={qfLeft}   slotH={ITEM_H * 4} />
        <RoundConnector pairCount={1} />
        <BracketColumn matches={sfLeft}   slotH={TOTAL_H} />
        <StraightConnector />

        {/* Final */}
        <BracketSlot match={finalMatch} slotH={TOTAL_H} isFinal />

        {/* Right half (SF → QF → R16 → R32) */}
        <StraightConnector />
        <BracketColumn matches={sfRight}  slotH={TOTAL_H} />
        <RoundConnector pairCount={1} dir="left" />
        <BracketColumn matches={qfRight}  slotH={ITEM_H * 4} />
        <RoundConnector pairCount={2} dir="left" />
        <BracketColumn matches={r16Right} slotH={ITEM_H * 2} />
        <RoundConnector pairCount={4} dir="left" />
        <BracketColumn matches={r32Right} slotH={ITEM_H} />
      </div>

      {/* Tercer y cuarto puesto — no forma parte del árbol, se muestra aparte */}
      {thirdPlaceMatch && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
          <RoundLabel label="🥉 3er Puesto" width={CARD_W} />
          <BracketCard match={thirdPlaceMatch} />
        </div>
      )}
    </div>
  );
}
