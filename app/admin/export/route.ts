import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/fetch-all";

function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const esc = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const type = new URL(request.url).searchParams.get("type") ?? "leaderboard";

  let csv: string;
  let filename: string;

  if (type === "predictions") {
    const data = await fetchAll((from, to) =>
      supabase
        .from("predictions")
        .select("user_id,match_id,home_score,away_score,updated_at")
        .range(from, to),
    );
    csv = toCsv(
      ["user_id", "match_id", "home_score", "away_score", "updated_at"],
      data.map((p) => [p.user_id, p.match_id, p.home_score, p.away_score, p.updated_at]),
    );
    filename = "predicciones.csv";
  } else {
    const { data } = await supabase.rpc("get_leaderboard");
    csv = toCsv(
      ["posicion", "nickname", "puntos_partidos", "puntos_especiales", "total"],
      (data ?? []).map((r, i) => [i + 1, r.nickname, r.match_points, r.special_points, r.total_points]),
    );
    filename = "tabla_posiciones.csv";
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
