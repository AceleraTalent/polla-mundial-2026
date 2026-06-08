/**
 * Registro de avatares ilustrados (estilo caricatura, sin fotos reales).
 * Cada archivo vive en /public/avatars/<file>. El `id` es lo que se guarda
 * en profiles.avatar_id.
 */
export type AvatarDef = {
  id: string;
  /** Nombre de referencia del estilo (jugador que inspira el avatar). */
  displayName: string;
  file: string;
  /** Color de acento para el fondo del avatar en la UI. */
  color: string;
};

export const AVATARS: AvatarDef[] = [
  { id: "messi", displayName: "Messi", file: "/avatars/messi.svg", color: "#75AADB" },
  { id: "ronaldo", displayName: "Ronaldo", file: "/avatars/ronaldo.svg", color: "#C8102E" },
  { id: "mbappe", displayName: "Mbappé", file: "/avatars/mbappe.svg", color: "#1A2B5F" },
  { id: "vinicius", displayName: "Vinicius", file: "/avatars/vinicius.svg", color: "#009C3B" },
  { id: "haaland", displayName: "Haaland", file: "/avatars/haaland.svg", color: "#BA0C2F" },
  { id: "bellingham", displayName: "Bellingham", file: "/avatars/bellingham.svg", color: "#CF142B" },
  { id: "pedri", displayName: "Pedri", file: "/avatars/pedri.svg", color: "#C60B1E" },
  { id: "lewandowski", displayName: "Lewandowski", file: "/avatars/lewandowski.svg", color: "#DC143C" },
  { id: "salah", displayName: "Salah", file: "/avatars/salah.svg", color: "#CE1126" },
  { id: "neymar", displayName: "Neymar", file: "/avatars/neymar.svg", color: "#FFDF00" },
];

const AVATAR_MAP = new Map(AVATARS.map((a) => [a.id, a]));

export function getAvatar(id: string | null | undefined): AvatarDef {
  return (id && AVATAR_MAP.get(id)) || AVATARS[0];
}
