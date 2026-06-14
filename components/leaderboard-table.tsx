"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { getAvatar } from "@/lib/avatars";
import { createClient } from "@/lib/supabase/client";
import type { LeaderboardRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlayerBreakdownModal } from "@/components/player-breakdown-modal";

const medal = (rank: number) =>
  rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

export function LeaderboardTable({
  initialRows,
  currentUserId,
}: {
  initialRows: LeaderboardRow[];
  currentUserId: string;
}) {
  const [rows, setRows] = useState<LeaderboardRow[]>(initialRows);
  const [selected, setSelected] = useState<{ userId: string; nickname: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const refresh = async () => {
      const { data } = await supabase.rpc("get_leaderboard");
      if (data) setRows(data);
    };

    const channel = supabase
      .channel("leaderboard-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "match_results" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "tournament_results" }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-white p-8 text-center text-sm text-muted-foreground">
        Aún no hay participantes con predicciones.
      </p>
    );
  }

  return (
    <>
    {selected && (
      <PlayerBreakdownModal
        userId={selected.userId}
        nickname={selected.nickname}
        onClose={() => setSelected(null)}
      />
    )}
    <div className="overflow-hidden rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Jugador</TableHead>
            <TableHead className="text-center">Partidos</TableHead>
            <TableHead className="text-center">Especiales</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => {
            const rank = i + 1;
            const avatar = getAvatar(row.avatar_id);
            const isMe = row.user_id === currentUserId;
            return (
              <TableRow key={row.user_id} className={cn(isMe && "bg-emerald-50")}>
                <TableCell className="text-center font-semibold tabular-nums">
                  {medal(rank) ?? rank}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Image
                      src={avatar.file}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full border"
                    />
                    <span className="font-medium">
                      {row.nickname ?? "—"}
                      {isMe && <span className="ml-1 text-xs text-emerald-700">(tú)</span>}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {row.match_points}
                </TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {row.special_points}
                </TableCell>
                <TableCell className="text-right text-lg font-bold tabular-nums">
                  {row.total_points}
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => setSelected({ userId: row.user_id, nickname: row.nickname ?? "—" })}
                    className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                  >
                    Ver
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
    </>
  );
}
