import { requireOnboarded } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/leaderboard-table";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const { user } = await requireOnboarded();
  const supabase = createClient();

  const { data } = await supabase.rpc("get_leaderboard");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Tabla de posiciones</h1>
        <p className="text-sm text-muted-foreground">
          Se actualiza en vivo cuando se cargan resultados.
        </p>
      </div>
      <LeaderboardTable initialRows={data ?? []} currentUserId={user.id} />
    </div>
  );
}
