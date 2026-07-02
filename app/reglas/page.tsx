import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Reglas — Polla Mundial 2026" };

export default function ReglasPage() {
  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">📖 Reglas de la Polla</h1>
          <Link href="/predicciones" className="text-sm text-emerald-700 hover:underline">
            ← Volver
          </Link>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">⚽ Puntos por partido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <p>• <b>Marcador exacto</b> (ej. predices 2–1 y queda 2–1): <b>3 puntos</b></p>
              <p>• <b>Acertar el resultado</b> (ganador o empate, sin el marcador exacto): <b>1 punto</b></p>
              <p>• No acertar: 0 puntos</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-400 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-base text-yellow-800">🇨🇴 Regla especial — Partidos de Colombia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm text-yellow-900">
              <p>Los partidos en que juega <b>Colombia</b> valen el <b>doble de puntos</b>:</p>
              <p>• Marcador exacto: <b>6 puntos</b></p>
              <p>• Acertar el resultado: <b>2 puntos</b></p>
              <p className="text-xs text-yellow-700 mt-2">
                Colombia juega en el Grupo K junto a Portugal, RD Congo y Uzbekistán.
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-300 bg-emerald-50">
            <CardHeader>
              <CardTitle className="text-base text-emerald-800">🎯 Bono — Ganador en penales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm text-emerald-900">
              <p>
                En partidos de eliminatoria (32avos en adelante), además del marcador
                puedes elegir qué equipo crees que gana la tanda de penales.
              </p>
              <p>• Si el partido se define por penales y aciertas: <b>+1 punto extra</b></p>
              <p className="text-xs text-emerald-700 mt-2">
                Si el partido no llega a penales, o eliges mal, no suma ni resta.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">🏆 Predicciones especiales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <p>• Campeón correcto: <b>10 puntos</b></p>
              <p>• Subcampeón correcto: <b>5 puntos</b></p>
              <p>• Cada semifinalista correcto: <b>3 puntos</b></p>
              <p>• Goleador del torneo: <b>5 puntos</b></p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">🔒 Cuándo se cierran las predicciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <p>• <b>Jornada 1 y Jornada 2:</b> debes cargar <b>ambas</b> antes de que empiece el primer partido del Mundial (11 de junio, 2 p.m. Col).</p>
              <p>• <b>Jornada 3:</b> se habilita unos días antes de terminar la Jornada 2 y se cierra cuando empieza el primer partido de la Jornada 3 (24 de junio).</p>
              <p>• <b>Especiales:</b> se cierran al inicio del torneo (11 de junio).</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">📊 Tabla de posiciones</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>
                Los puntos se calculan automáticamente cada vez que se cargan
                resultados. La tabla se actualiza en vivo. ¡Que gane el mejor! 🥇
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
