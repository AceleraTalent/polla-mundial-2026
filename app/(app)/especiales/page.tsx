import { requireOnboarded } from "@/lib/auth-helpers";
import { windowStatus } from "@/lib/locks";
import { createClient } from "@/lib/supabase/server";
import { SpecialForm } from "./special-form";

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

  return (
    <div className="space-y-5">
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
    </div>
  );
}
