import Link from "next/link";
import Image from "next/image";

import { signOut } from "@/app/actions/auth";
import { getAvatar } from "@/lib/avatars";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/predicciones", label: "Partidos" },
  { href: "/especiales", label: "Especiales" },
  { href: "/leaderboard", label: "Tabla" },
  { href: "/reglas", label: "Reglas" },
];

export function NavBar({
  nickname,
  avatarId,
  isAdmin,
}: {
  nickname: string | null;
  avatarId: string | null;
  isAdmin: boolean;
}) {
  const avatar = getAvatar(avatarId);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center gap-1 px-3 py-2 sm:gap-3">
        <Link href="/predicciones" className="mr-1 text-xl font-extrabold">
          🏆<span className="hidden sm:inline"> Polla 2026</span>
        </Link>

        <div className="flex flex-1 items-center gap-0.5 overflow-x-auto sm:gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:px-3"
            >
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="whitespace-nowrap rounded-md px-2 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50 sm:px-3"
            >
              Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-sm font-medium sm:inline">{nickname}</span>
          <Image
            src={avatar.file}
            alt={nickname ?? "avatar"}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full border"
          />
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Salir
            </Button>
          </form>
        </div>
      </nav>
    </header>
  );
}
