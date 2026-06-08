import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../public/avatars");
mkdirSync(outDir, { recursive: true });

const players = [
  { id: "messi",       num: "10", jersey: "#6BAED6", jerseyDark: "#3182BD", skin: "#E8B98A", skinShadow: "#C9874A", hair: "#2C1A0E", hairHigh: "#4A2C14", style: "wavy",  beard: true,  eyeColor: "#5B3A1A" },
  { id: "ronaldo",     num: "7",  jersey: "#CB1A2E", jerseyDark: "#8B0000", skin: "#D4956A", skinShadow: "#A8663A", hair: "#1A0A04", hairHigh: "#3A1A08", style: "short",  beard: false, eyeColor: "#3D2008" },
  { id: "mbappe",      num: "10", jersey: "#1E3A8A", jerseyDark: "#0F1F5A", skin: "#8B5A2B", skinShadow: "#5C3010", hair: "#0E0804", hairHigh: "#201408", style: "buzz",   beard: false, eyeColor: "#2A1500" },
  { id: "vinicius",    num: "7",  jersey: "#00843D", jerseyDark: "#004D25", skin: "#7A4420", skinShadow: "#4A2508", hair: "#0A0602", hairHigh: "#180E04", style: "curly",  beard: false, eyeColor: "#1A0C00" },
  { id: "haaland",     num: "9",  jersey: "#C8102E", jerseyDark: "#880010", skin: "#F2C8A0", skinShadow: "#D4956A", hair: "#D4AA5A", hairHigh: "#F0CC80", style: "long",   beard: false, eyeColor: "#4A7AB5" },
  { id: "bellingham",  num: "22", jersey: "#CF142B", jerseyDark: "#8B0010", skin: "#C08050", skinShadow: "#885020", hair: "#1A0C06", hairHigh: "#2E1808", style: "short",  beard: false, eyeColor: "#2A1500" },
  { id: "pedri",       num: "8",  jersey: "#B22222", jerseyDark: "#800000", skin: "#DCA870", skinShadow: "#B07840", hair: "#1E1008", hairHigh: "#3A2010", style: "curly",  beard: false, eyeColor: "#3D2510" },
  { id: "lewandowski", num: "9",  jersey: "#DC143C", jerseyDark: "#9B0020", skin: "#E8BB8C", skinShadow: "#C48A50", hair: "#2A1A0C", hairHigh: "#4A3018", style: "short",  beard: true,  eyeColor: "#5A8AB0" },
  { id: "salah",       num: "11", jersey: "#CC0000", jerseyDark: "#880000", skin: "#A06030", skinShadow: "#6A3A10", hair: "#0C0804", hairHigh: "#1C1008", style: "curly",  beard: true,  eyeColor: "#2A1800" },
  { id: "neymar",      num: "10", jersey: "#F4C430", jerseyDark: "#C49820", skin: "#C8956A", skinShadow: "#9A6035", hair: "#140C06", hairHigh: "#2A1A0A", style: "styled", beard: false, eyeColor: "#2A1500" },
];

// ─── Hair styles ────────────────────────────────────────────────────────────

function hairBack(style, color, dark) {
  switch (style) {
    case "buzz":
      return `<path d="M32 50 Q34 22 60 20 Q86 22 88 50 Q88 38 60 35 Q32 38 32 50Z" fill="${dark}"/>`;
    case "curly":
      return `<g>
        <circle cx="33" cy="46" r="12" fill="${dark}"/>
        <circle cx="43" cy="34" r="13" fill="${dark}"/>
        <circle cx="60" cy="28" r="14" fill="${dark}"/>
        <circle cx="77" cy="34" r="13" fill="${dark}"/>
        <circle cx="87" cy="46" r="12" fill="${dark}"/>
      </g>`;
    case "long":
      return `<path d="M30 48 Q28 20 60 18 Q92 20 90 48 L92 80 Q86 65 82 52 Q60 44 38 52 Q34 65 28 80Z" fill="${dark}"/>`;
    case "wavy":
      return `<path d="M31 50 Q32 22 60 20 Q88 22 89 50 Q82 36 60 36 Q38 36 31 50Z" fill="${dark}"/>`;
    case "styled":
      return `<path d="M30 52 Q28 18 60 16 Q92 18 90 52 Q84 30 60 32 Q36 30 30 52Z" fill="${dark}"/>`;
    default:
      return `<path d="M31 50 Q32 22 60 20 Q88 22 89 50 Q82 36 60 36 Q38 36 31 50Z" fill="${dark}"/>`;
  }
}

function hairFront(style, color, dark) {
  switch (style) {
    case "buzz":
      return `<path d="M33 50 Q36 24 60 22 Q84 24 87 50 Q82 40 60 38 Q38 40 33 50Z" fill="${color}"/>`;
    case "curly":
      return `<g>
        <circle cx="34" cy="45" r="11" fill="${color}"/>
        <circle cx="44" cy="33" r="12" fill="${color}"/>
        <circle cx="60" cy="27" r="13" fill="${color}"/>
        <circle cx="76" cy="33" r="12" fill="${color}"/>
        <circle cx="86" cy="45" r="11" fill="${color}"/>
        <ellipse cx="60" cy="38" rx="8" ry="5" fill="${color}"/>
      </g>`;
    case "long":
      return `<path d="M32 50 Q30 22 60 20 Q90 22 88 50 L90 78 Q84 63 80 50 Q60 42 40 50 Q36 63 30 78Z" fill="${color}"/>
      <path d="M32 50 Q34 30 60 28 Q86 30 88 50 Q80 40 60 40 Q40 40 32 50Z" fill="${dark}" opacity="0.4"/>`;
    case "wavy":
      return `<path d="M33 50 Q34 24 60 22 Q86 24 87 50 Q78 38 60 38 Q42 38 33 50Z" fill="${color}"/>
      <path d="M42 28 Q52 22 60 22 Q68 22 78 28 Q68 26 60 26 Q52 26 42 28Z" fill="${dark}" opacity="0.3"/>`;
    case "styled":
      return `<path d="M32 50 Q30 20 60 18 Q90 20 88 50 Q84 26 70 24 Q56 22 44 28 Q36 32 32 50Z" fill="${color}"/>
      <path d="M60 18 Q48 20 40 26 Q52 22 60 22 Q68 22 80 26 Q72 20 60 18Z" fill="${dark}" opacity="0.5"/>`;
    default:
      return `<path d="M33 50 Q34 24 60 22 Q86 24 87 50 Q78 38 60 38 Q42 38 33 50Z" fill="${color}"/>`;
  }
}

// ─── Beard ───────────────────────────────────────────────────────────────────

function beard(show, color) {
  if (!show) return "";
  return `
    <path d="M39 68 Q44 88 60 90 Q76 88 81 68 Q76 82 60 84 Q44 82 39 68Z" fill="${color}" opacity="0.75"/>
    <path d="M43 64 Q42 72 44 78 Q52 84 60 84 Q68 84 76 78 Q78 72 77 64 Q70 74 60 74 Q50 74 43 64Z" fill="${color}" opacity="0.5"/>`;
}

// ─── Eye ─────────────────────────────────────────────────────────────────────

function eye(cx, cy, irisColor) {
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="7" ry="5.5" fill="white"/>
    <circle cx="${cx}" cy="${cy}" r="4" fill="${irisColor}"/>
    <circle cx="${cx}" cy="${cy}" r="2.4" fill="#111"/>
    <circle cx="${cx + 1.5}" cy="${cy - 1.5}" r="1.2" fill="white" opacity="0.9"/>
    <ellipse cx="${cx}" cy="${cy}" rx="7" ry="5.5" fill="none" stroke="#33333340" stroke-width="0.6"/>`;
}

// ─── Nose ────────────────────────────────────────────────────────────────────

function nose(skin) {
  return `
    <path d="M56 60 Q58 70 56 74 Q59 77 60 77 Q61 77 64 74 Q62 70 64 60" fill="${skin}" stroke="#00000018" stroke-width="0.8" stroke-linejoin="round" fill-rule="evenodd"/>
    <ellipse cx="57" cy="73.5" rx="3" ry="2" fill="${skin}" stroke="#00000025" stroke-width="0.6"/>
    <ellipse cx="63" cy="73.5" rx="3" ry="2" fill="${skin}" stroke="#00000025" stroke-width="0.6"/>`;
}

// ─── Main SVG ────────────────────────────────────────────────────────────────

function svg(p) {
  const gradId = `sg_${p.id}`;
  const bgId   = `bg_${p.id}`;
  const skinId = `sk_${p.id}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="${p.id}">
  <defs>
    <clipPath id="cp_${p.id}"><circle cx="60" cy="60" r="59"/></clipPath>
    <!-- Jersey gradient -->
    <linearGradient id="${bgId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.jersey}"/>
      <stop offset="100%" stop-color="${p.jerseyDark}"/>
    </linearGradient>
    <!-- Skin gradient for depth -->
    <radialGradient id="${skinId}" cx="50%" cy="38%" r="55%">
      <stop offset="0%" stop-color="${p.skin}"/>
      <stop offset="75%" stop-color="${p.skin}"/>
      <stop offset="100%" stop-color="${p.skinShadow}"/>
    </radialGradient>
    <!-- Jersey highlight -->
    <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.08"/>
    </linearGradient>
  </defs>

  <g clip-path="url(#cp_${p.id})">
    <!-- Jersey background -->
    <rect width="120" height="120" fill="url(#${bgId})"/>
    <rect width="120" height="120" fill="url(#${gradId})"/>

    <!-- Jersey body bottom half -->
    <path d="M0 80 L0 120 L120 120 L120 80 Q100 74 85 72 L60 76 L35 72 Q20 74 0 80Z" fill="${p.jerseyDark}" opacity="0.6"/>

    <!-- Jersey collar -->
    <path d="M44 86 Q52 95 60 96 Q68 95 76 86 L72 84 Q66 92 60 93 Q54 92 48 84Z" fill="${p.jerseyDark}"/>
    <path d="M48 84 Q54 90 60 91 Q66 90 72 84" fill="none" stroke="white" stroke-width="1.2" opacity="0.5"/>

    <!-- Jersey number -->
    <text x="60" y="114" text-anchor="middle" font-family="Arial Black, sans-serif"
          font-size="11" font-weight="900" fill="white" opacity="0.85">${p.num}</text>

    <!-- Hair back layer -->
    ${hairBack(p.style, p.hair, p.hairHigh)}

    <!-- Neck shadow -->
    <ellipse cx="60" cy="84" rx="12" ry="5" fill="${p.skinShadow}" opacity="0.5"/>

    <!-- Neck -->
    <rect x="52" y="74" width="16" height="18" rx="5" fill="url(#${skinId})"/>

    <!-- Ear left -->
    <ellipse cx="33" cy="60" rx="5.5" ry="7" fill="url(#${skinId})"/>
    <ellipse cx="34" cy="60" rx="2.5" ry="4" fill="${p.skinShadow}" opacity="0.3"/>

    <!-- Ear right -->
    <ellipse cx="87" cy="60" rx="5.5" ry="7" fill="url(#${skinId})"/>
    <ellipse cx="86" cy="60" rx="2.5" ry="4" fill="${p.skinShadow}" opacity="0.3"/>

    <!-- Face -->
    <ellipse cx="60" cy="57" rx="27" ry="31" fill="url(#${skinId})"/>

    <!-- Face shadow (chin/jaw) -->
    <ellipse cx="60" cy="80" rx="20" ry="8" fill="${p.skinShadow}" opacity="0.25"/>

    <!-- Hair front layer -->
    ${hairFront(p.style, p.hair, p.hairHigh)}

    <!-- Eyebrow left -->
    <path d="M42 48 Q48 44 54 46" stroke="${p.hair}" stroke-width="2.2" fill="none" stroke-linecap="round"/>

    <!-- Eyebrow right -->
    <path d="M66 46 Q72 44 78 48" stroke="${p.hair}" stroke-width="2.2" fill="none" stroke-linecap="round"/>

    <!-- Eyes -->
    ${eye(48, 57, p.eyeColor)}
    ${eye(72, 57, p.eyeColor)}

    <!-- Nose -->
    ${nose(p.skinShadow)}

    <!-- Mouth -->
    <path d="M50 80 Q56 85 60 85 Q64 85 70 80" stroke="#8B4A3A" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M54 80 Q60 83 66 80" stroke="#C07060" stroke-width="0.8" fill="none" stroke-linecap="round" opacity="0.6"/>

    <!-- Beard -->
    ${beard(p.beard, p.hair)}

    <!-- Subtle face highlight (forehead) -->
    <ellipse cx="60" cy="40" rx="14" ry="8" fill="white" opacity="0.06"/>
  </g>

  <!-- Rim -->
  <circle cx="60" cy="60" r="57" fill="none" stroke="white" stroke-width="2.5" opacity="0.7"/>
  <circle cx="60" cy="60" r="57" fill="none" stroke="${p.jerseyDark}" stroke-width="1" opacity="0.3"/>
</svg>`;
}

for (const p of players) {
  writeFileSync(resolve(outDir, `${p.id}.svg`), svg(p), "utf8");
}
console.log(`Generados ${players.length} avatares en public/avatars/`);
