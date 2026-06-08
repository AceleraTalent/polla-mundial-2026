import { NavBar } from "@/components/nav-bar";
import { requireOnboarded } from "@/lib/auth-helpers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, isAdmin } = await requireOnboarded();

  return (
    <div className="min-h-screen bg-muted/30">
      <NavBar
        nickname={profile?.nickname ?? null}
        avatarId={profile?.avatar_id ?? null}
        isAdmin={isAdmin}
      />
      <main className="mx-auto max-w-5xl px-3 py-5 sm:px-4 sm:py-6">{children}</main>
    </div>
  );
}
