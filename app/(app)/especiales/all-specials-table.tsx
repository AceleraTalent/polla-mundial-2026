import Image from "next/image";

export type SpecialRowVM = {
  user_id: string;
  nickname: string;
  avatar_id: string | null;
  champion: { name: string; flag: string } | null;
  runnerUp: { name: string; flag: string } | null;
  semi1: { name: string; flag: string } | null;
  semi2: { name: string; flag: string } | null;
  topScorer: string | null;
  championCorrect: boolean;
  runnerUpCorrect: boolean;
  semi1Correct: boolean;
  semi2Correct: boolean;
  topScorerCorrect: boolean;
};

function Pick({
  value,
  correct,
}: {
  value: { name: string; flag: string } | string | null;
  correct: boolean;
}) {
  if (!value) return <span className="text-xs italic text-muted-foreground">—</span>;
  const label = typeof value === "string" ? value : `${value.flag} ${value.name}`;
  return (
    <span className={correct ? "font-bold text-emerald-700" : ""}>
      {label}
      {correct && " ✓"}
    </span>
  );
}

export function AllSpecialsTable({ rows }: { rows: SpecialRowVM[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6 text-center text-sm text-muted-foreground">
        Nadie ha guardado sus predicciones especiales todavía.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left text-xs text-muted-foreground">Jugador</th>
            <th className="px-3 py-2 text-left text-xs text-muted-foreground">🏆 Campeón</th>
            <th className="px-3 py-2 text-left text-xs text-muted-foreground">🥈 Subcampeón</th>
            <th className="px-3 py-2 text-left text-xs text-muted-foreground">Semifinalista 1</th>
            <th className="px-3 py-2 text-left text-xs text-muted-foreground">Semifinalista 2</th>
            <th className="px-3 py-2 text-left text-xs text-muted-foreground">⚽ Goleador</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.user_id} className="border-b last:border-0 hover:bg-muted/40">
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  {r.avatar_id ? (
                    <Image
                      src={`/avatars/${r.avatar_id}.svg`}
                      alt={r.nickname}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-muted" />
                  )}
                  <span className="font-semibold">{r.nickname}</span>
                </div>
              </td>
              <td className="px-3 py-2.5"><Pick value={r.champion} correct={r.championCorrect} /></td>
              <td className="px-3 py-2.5"><Pick value={r.runnerUp} correct={r.runnerUpCorrect} /></td>
              <td className="px-3 py-2.5"><Pick value={r.semi1} correct={r.semi1Correct} /></td>
              <td className="px-3 py-2.5"><Pick value={r.semi2} correct={r.semi2Correct} /></td>
              <td className="px-3 py-2.5"><Pick value={r.topScorer} correct={r.topScorerCorrect} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
