import { createClient as createAdminClient } from "@supabase/supabase-js";

import { requireOnboarded } from "@/lib/auth-helpers";
import { windowStatus } from "@/lib/locks";
import { createClient } from "@/lib/supabase/server";
import { SpecialForm } from "./special-form";
import { AllSpecialsTable, type SpecialRowVM } from "./all-specials-table";

export const dynamic = "force-dynamic";

export default async function EspecialesPage() {
  const { user } = await requireOnboarded();
  const supabase = createClient();

  const [{ data: teams }, { data: special }, { data: windows }] = await Promise.all([
    supabase.from("teams").select("*").order("name"),
    supabase.from("special_predictions").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("phase_windows").select("*").eq("phase_key", "special").maybeSingle(),
  ]);

  const status = windowStatus(windows ?? undefined);

  // Predicciones especiales de todos los jugadores — se usa el cliente admin
  // porque RLS solo deja ver la propia (igual que fetchMatchPredictions con
  // los pronósticos de partidos).
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const [{ data: allSpecials }, { data: tournament }] = await Promise.all([
    admin
      .from("special_predictions")
      .select(
        "user_id,champion_team_id,runner_up_team_id,semifinalist1_id,semifinalist2_id,top_scorer,profiles!inner(nickname,avatar_id,is_onboarded)",
      ),
    admin.from("tournament_results").select("*").eq("id", 1).maybeSingle(),
  ]);

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));
  const teamVM = (id: number | null) => {
    if (!id) return null;
    const t = teamMap.get(id);
    return t ? { name: t.name, flag: t.flag_emoji } : null;
  };

  const rows: SpecialRowVM[] = (allSpecials ?? [])
    .map((s) => {
      const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
      return { s, profile: profile as { nickname: string | null; avatar_id: string | null; is_onboarded: boolean } | null };
    })
    .filter(({ profile }) => profile?.is_onboarded)
    .map(({ s, profile }) => ({
      user_id: s.user_id,
      nickname: profile?.nickname ?? "",
      avatar_id: profile?.avatar_id ?? null,
      champion: teamVM(s.champion_team_id),
      runnerUp: teamVM(s.runner_up_team_id),
      semi1: teamVM(s.semifinalist1_id),
      semi2: teamVM(s.semifinalist2_id),
      topScorer: s.top_scorer,
      championCorrect: !!tournament?.champion_team_id && s.champion_team_id === tournament.champion_team_id,
      runnerUpCorrect: !!tournament?.runner_up_team_id && s.runner_up_team_id === tournament.runner_up_team_id,
      semi1Correct:
        !!s.semifinalist1_id &&
        (s.semifinalist1_id === tournament?.semifinalist1_id || s.semifinalist1_id === tournament?.semifinalist2_id),
      semi2Correct:
        !!s.semifinalist2_id &&
        (s.semifinalist2_id === tournament?.semifinalist1_id || s.semifinalist2_id === tournament?.semifinalist2_id),
      topScorerCorrect:
        !!tournament?.top_scorer &&
        !!s.top_scorer &&
        s.top_scorer.trim().toLowerCase() === tournament.top_scorer.trim().toLowerCase(),
    }))
    .sort((a, b) => a.nickname.localeCompare(b.nickname));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">Predicciones especiales</h1>
        <p className="text-sm text-muted-foreground">
          Campeón (10 pts) · Subcampeón (5) · Semifinalistas (3 c/u) · Goleador (5).
          {status !== "open" && " — Cerradas."}
        </p>
      </div>

      <SpecialForm
        teams={teams ?? []}
        initial={special ?? null}
        editable={status === "open"}
      />

      <div className="space-y-2">
        <h2 className="text-lg font-bold">Lo que puso todo el mundo</h2>
        <AllSpecialsTable rows={rows} />
      </div>
    </div>
  );
}
