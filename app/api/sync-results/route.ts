import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const resultsSchema = z.array(
  z.object({
    matchId: z.coerce.number().int().positive(),
    home: z.coerce.number().int().min(0).max(99),
    away: z.coerce.number().int().min(0).max(99),
  }),
);

export async function POST(request: Request) {
  const secret = process.env.SYNC_SECRET;
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = resultsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const rows = parsed.data.map((r) => ({
    match_id: r.matchId,
    home_score: r.home,
    away_score: r.away,
  }));

  const { error } = await supabase
    .from("match_results")
    .upsert(rows, { onConflict: "match_id" });

  if (error) {
    return NextResponse.json({ error: "DB error", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, updated: rows.length });
}

// GET: returns all matches with their current result status (used by the sync agent)
export async function GET(request: Request) {
  const secret = process.env.SYNC_SECRET;
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: matches } = await supabase
    .from("matches")
    .select(`
      id,
      group_letter,
      matchday,
      kickoff_at,
      home_team:teams!matches_home_team_id_fkey(name, code),
      away_team:teams!matches_away_team_id_fkey(name, code),
      match_results(home_score, away_score)
    `)
    .order("kickoff_at", { ascending: true });

  const now = new Date().toISOString();
  const pending = (matches ?? []).filter(
    (m) =>
      m.kickoff_at < now &&
      (!m.match_results || (m.match_results as { home_score: number; away_score: number }[]).length === 0),
  );

  return NextResponse.json({ pending });
}
