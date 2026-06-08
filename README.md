# 🏆 Polla Mundial 2026

App de predicciones para el Mundial FIFA 2026. Los usuarios predicen el
marcador de cada partido de fase de grupos, hacen predicciones especiales
(campeón, subcampeón, semifinalistas, goleador) y compiten en un leaderboard
en tiempo real.

**Stack:** Next.js 14 (App Router) · Supabase (Auth + Postgres + Realtime + RLS) ·
Tailwind v4 + shadcn/ui · Deploy en Vercel.

---

## 1. Requisitos

- Node.js 18.17+ (probado con Node 20)
- Una cuenta de [Supabase](https://supabase.com) (plan free sirve)
- Una cuenta de [Vercel](https://vercel.com) para el deploy

## 2. Configurar Supabase

1. Crea un proyecto nuevo en Supabase.
2. Ve a **SQL Editor** y ejecuta, **en este orden**, el contenido de:
   1. `supabase/migrations/0001_schema.sql`
   2. `supabase/migrations/0002_rls.sql`
   3. `supabase/migrations/0003_leaderboard.sql`
   4. `supabase/migrations/0004_triggers.sql`
   5. `supabase/seed.sql`  ← carga las 48 selecciones, 72 partidos y las ventanas
3. En `supabase/seed.sql` (o en la tabla `admins`) asegúrate de que tu email
   esté en la tabla `admins` — eso te da acceso al panel `/admin`.
4. **Auth → URL Configuration:** agrega tu URL de producción y
   `http://localhost:3000` a *Redirect URLs* (para el enlace de confirmación de
   email). Si prefieres registro sin confirmación, desactiva *Confirm email* en
   **Auth → Providers → Email**.

## 3. Variables de entorno

Copia `.env.local.example` a `.env.local` y completa con los valores de
**Project Settings → API**:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ADMIN_EMAILS=tu-email@correo.com   # mismo email que en la tabla admins
```

> `ADMIN_EMAILS` controla el acceso a `/admin` en la app. La tabla `admins`
> controla los permisos a nivel de base de datos (RLS). **Mantén ambos en
> sync** con el/los mismos emails.

## 4. Correr en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

## 5. Deploy en Vercel

1. Sube el repo a GitHub e impórtalo en Vercel.
2. Define las mismas variables de entorno en Vercel.
3. Deploy. Recuerda agregar la URL de Vercel a los *Redirect URLs* de Supabase.

---

## Cómo funciona

### Puntos (cálculo 100% automático)
- Marcador exacto: **3** · Acertar resultado (1X2): **1**
- Campeón: **10** · Subcampeón: **5** · Semifinalista (c/u): **3** · Goleador: **5**

El admin solo carga los **resultados reales** en `/admin`; los puntos y el
leaderboard se recalculan solos (función SQL `get_leaderboard()`), y la tabla
se actualiza en vivo vía Supabase Realtime.

### Ventanas de predicción (editables en `/admin`)
- **Jornada 1 y 2:** cierran juntas al inicio del torneo (11 jun). Hay que
  cargar ambas antes del primer partido.
- **Jornada 3:** abre ~3 días antes de terminar la J2 y cierra al empezar el
  primer partido de J3.
- **Especiales:** cierran al inicio del torneo.

El bloqueo se valida tanto en el servidor (Server Actions) como en la base de
datos (políticas RLS), así que no se puede saltar desde el cliente.

## Estructura

```
app/                 Páginas (App Router) y Server Actions (app/actions)
components/           UI compartida (match-card, leaderboard-table, nav-bar, ui/)
lib/                 Clientes Supabase, scoring, locks, avatares, tipos, auth-helpers
supabase/migrations/ Esquema, RLS, leaderboard, triggers
supabase/seed.sql    Selecciones, 72 partidos y ventanas
public/avatars/      Avatares ilustrados (generados por scripts/gen-avatars.mjs)
```

## Notas

- Las **fechas/horas de los partidos** en el seed son placeholders (arranque
  11 jun 2026). Ajústalas al fixture oficial FIFA editándolas en la base de
  datos o, para los bloqueos, desde `/admin → Ventanas`.
- v1 cubre **fase de grupos + predicciones especiales**. Las predicciones
  partido-a-partido de eliminatorias quedan para una fase posterior (los
  equipos son TBD hasta que terminen los grupos).
- Para regenerar los avatares: `node scripts/gen-avatars.mjs`.
