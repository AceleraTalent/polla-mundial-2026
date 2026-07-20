import { requireOnboarded } from "@/lib/auth-helpers";
import { createClient } from "@supabase/supabase-js";
import { LeaderboardTable } from "@/components/leaderboard-table";
import type { LeaderboardRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const { user } = await requireOnboarded();

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data } = await admin.rpc("get_leaderboard");
  const rows: LeaderboardRow[] = data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Tabla de posiciones</h1>
        <p className="text-sm text-muted-foreground">
          Se actualiza en vivo cuando se cargan resultados.
        </p>
      </div>
      <LeaderboardTable initialRows={rows} currentUserId={user.id} />
    </div>
  );
}
