/**
 * Allowlist de emails de administradores. Se define en la variable de
 * entorno ADMIN_EMAILS como lista separada por comas.
 * Ej: ADMIN_EMAILS="lucianos.ap17@gmail.com,otro@correo.com"
 */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
