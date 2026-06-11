"use client";

import type { PhaseWindow, Team, TournamentResults } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ResultsEditor } from "./results-editor";
import { TournamentEditor } from "./tournament-editor";
import { WindowsEditor } from "./windows-editor";
import { PlayersTab, type PlayerVM } from "./players-tab";
import { PredictionsMatrix } from "./predictions-matrix";

export type AdminMatchVM = {
  id: number;
  matchday: number;
  group: string;
  home: { name: string; flag: string };
  away: { name: string; flag: string };
  result: { home: number; away: number } | null;
};

export function AdminTabs({
  teams,
  matches,
  tournament,
  windows,
  players,
  colombiaMap,
}: {
  teams: Team[];
  matches: AdminMatchVM[];
  tournament: TournamentResults | null;
  windows: PhaseWindow[];
  players: PlayerVM[];
  colombiaMap: Map<number, boolean>;
}) {
  return (
    <Tabs defaultValue="results">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="results">Resultados</TabsTrigger>
        <TabsTrigger value="matrix">Predicciones</TabsTrigger>
        <TabsTrigger value="players">Jugadores</TabsTrigger>
        <TabsTrigger value="tournament">Torneo</TabsTrigger>
        <TabsTrigger value="windows">Ventanas</TabsTrigger>
        <TabsTrigger value="export">Export</TabsTrigger>
      </TabsList>

      <TabsContent value="results" className="mt-4">
        <ResultsEditor matches={matches} />
      </TabsContent>

      <TabsContent value="tournament" className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <TournamentEditor teams={teams} initial={tournament} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="windows" className="mt-4">
        <WindowsEditor windows={windows} />
      </TabsContent>

      <TabsContent value="matrix" className="mt-4">
        <PredictionsMatrix players={players} matches={matches} colombiaMap={colombiaMap} />
      </TabsContent>

      <TabsContent value="players" className="mt-4">
        <PlayersTab players={players} />
      </TabsContent>

      <TabsContent value="export" className="mt-4">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm text-muted-foreground">
              Descarga copias de respaldo en CSV.
            </p>
            <div className="flex flex-wrap gap-2">
              <a className={buttonVariants({ variant: "outline" })} href="/admin/export?type=leaderboard">
                Exportar tabla de posiciones
              </a>
              <a className={buttonVariants({ variant: "outline" })} href="/admin/export?type=predictions">
                Exportar predicciones
              </a>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
