-- ============================================================
-- Polla Mundial 2026 — SETUP COMPLETO (pega TODO esto en el
-- SQL Editor de Supabase y dale RUN, una sola vez).
-- ============================================================


-- >>>>>>>>>>>>>>>>>>>> supabase/migrations/0001_schema.sql <<<<<<<<<<<<<<<<<<<<

-- =====================================================================
-- Polla Mundial 2026 — Esquema base
-- =====================================================================

-- Helper para mantener updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- admins: fuente de verdad para permisos de administrador (usada por RLS)
-- ---------------------------------------------------------------------
create table public.admins (
  email text primary key
);

-- ---------------------------------------------------------------------
-- profiles: extiende auth.users
-- ---------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  nickname     text unique,
  avatar_id    text,
  is_onboarded boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- teams: 48 selecciones, agrupadas A..L
-- ---------------------------------------------------------------------
create table public.teams (
  id           serial primary key,
  code         text not null unique,
  name         text not null,
  group_letter char(1) not null check (group_letter between 'A' and 'L'),
  flag_emoji   text not null default ''
);

-- ---------------------------------------------------------------------
-- matches: partidos (en v1, solo fase de grupos -> stage = 'group')
-- ---------------------------------------------------------------------
create table public.matches (
  id           bigserial primary key,
  stage        text not null default 'group'
                 check (stage in ('group','r32','r16','qf','sf','final')),
  group_letter char(1) check (group_letter between 'A' and 'L'),
  matchday     int check (matchday between 1 and 3),
  home_team_id int not null references public.teams (id),
  away_team_id int not null references public.teams (id),
  kickoff_at   timestamptz not null,
  created_at   timestamptz not null default now()
);

create index matches_matchday_idx on public.matches (matchday);
create index matches_group_idx on public.matches (group_letter);

-- ---------------------------------------------------------------------
-- phase_windows: ventana abrir/cerrar por jornada (editable por admin)
--   phase_key: 'md1','md2','md3','special'
-- ---------------------------------------------------------------------
create table public.phase_windows (
  phase_key  text primary key,
  label      text not null,
  opens_at   timestamptz not null,
  locks_at   timestamptz not null,
  updated_at timestamptz not null default now()
);

create trigger phase_windows_updated_at
  before update on public.phase_windows
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- predictions: predicción de marcador del usuario por partido
-- ---------------------------------------------------------------------
create table public.predictions (
  id         bigserial primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  match_id   bigint not null references public.matches (id) on delete cascade,
  home_score int not null check (home_score between 0 and 99),
  away_score int not null check (away_score between 0 and 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

create index predictions_user_idx on public.predictions (user_id);

create trigger predictions_updated_at
  before update on public.predictions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- match_results: resultado real (ingresado por admin)
-- ---------------------------------------------------------------------
create table public.match_results (
  match_id   bigint primary key references public.matches (id) on delete cascade,
  home_score int not null check (home_score between 0 and 99),
  away_score int not null check (away_score between 0 and 99),
  updated_at timestamptz not null default now()
);

create trigger match_results_updated_at
  before update on public.match_results
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- special_predictions: predicciones especiales del usuario (1 por usuario)
-- ---------------------------------------------------------------------
create table public.special_predictions (
  user_id           uuid primary key references public.profiles (id) on delete cascade,
  champion_team_id  int references public.teams (id),
  runner_up_team_id int references public.teams (id),
  semifinalist1_id  int references public.teams (id),
  semifinalist2_id  int references public.teams (id),
  top_scorer        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger special_predictions_updated_at
  before update on public.special_predictions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- tournament_results: resultados reales del torneo (singleton id=1)
-- ---------------------------------------------------------------------
create table public.tournament_results (
  id                int primary key default 1 check (id = 1),
  champion_team_id  int references public.teams (id),
  runner_up_team_id int references public.teams (id),
  semifinalist1_id  int references public.teams (id),
  semifinalist2_id  int references public.teams (id),
  top_scorer        text,
  updated_at        timestamptz not null default now()
);

create trigger tournament_results_updated_at
  before update on public.tournament_results
  for each row execute function public.set_updated_at();

-- Fila singleton inicial (vacía)
insert into public.tournament_results (id) values (1);


-- >>>>>>>>>>>>>>>>>>>> supabase/migrations/0002_rls.sql <<<<<<<<<<<<<<<<<<<<

-- =====================================================================
-- Polla Mundial 2026 — Funciones helper + Row Level Security
-- =====================================================================

-- ¿El email del JWT actual está en la tabla admins?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ¿La ventana de una jornada (phase_key) está abierta ahora?
create or replace function public.is_phase_open(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.phase_windows
    where phase_key = p_key
      and now() >= opens_at
      and now() < locks_at
  );
$$;

-- ¿La ventana del partido (según su jornada) está abierta?
create or replace function public.is_match_open(p_match_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_phase_open('md' || m.matchday::text)
  from public.matches m
  where m.id = p_match_id;
$$;

-- ---------------------------------------------------------------------
-- Activar RLS
-- ---------------------------------------------------------------------
alter table public.admins              enable row level security;
alter table public.profiles            enable row level security;
alter table public.teams               enable row level security;
alter table public.matches             enable row level security;
alter table public.phase_windows       enable row level security;
alter table public.predictions         enable row level security;
alter table public.match_results       enable row level security;
alter table public.special_predictions enable row level security;
alter table public.tournament_results  enable row level security;

-- admins: nadie lo lee/escribe desde el cliente (solo service role / SQL).
-- (Sin políticas => acceso denegado salvo service role.)

-- profiles: lectura para autenticados (leaderboard muestra nick/avatar);
-- cada quien edita el suyo.
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- teams / matches / phase_windows: lectura pública para autenticados.
create policy "teams_select" on public.teams
  for select to authenticated using (true);
create policy "matches_select" on public.matches
  for select to authenticated using (true);
create policy "phase_windows_select" on public.phase_windows
  for select to authenticated using (true);

-- phase_windows: solo admin escribe.
create policy "phase_windows_admin_write" on public.phase_windows
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- predictions: cada usuario ve/gestiona las suyas; insertar/editar solo
-- si la ventana de la jornada está abierta (backstop a la validación server).
create policy "predictions_select_own" on public.predictions
  for select to authenticated using (user_id = auth.uid());
-- El admin puede leer todas las predicciones (export / respaldo).
create policy "predictions_select_admin" on public.predictions
  for select to authenticated using (public.is_admin());
create policy "predictions_insert_own_open" on public.predictions
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_match_open(match_id));
create policy "predictions_update_own_open" on public.predictions
  for update to authenticated
  using (user_id = auth.uid() and public.is_match_open(match_id))
  with check (user_id = auth.uid() and public.is_match_open(match_id));
create policy "predictions_delete_own_open" on public.predictions
  for delete to authenticated
  using (user_id = auth.uid() and public.is_match_open(match_id));

-- match_results: lectura pública (resultados reales); solo admin escribe.
create policy "match_results_select" on public.match_results
  for select to authenticated using (true);
create policy "match_results_admin_write" on public.match_results
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- special_predictions: cada usuario gestiona la suya; abierta solo si la
-- ventana 'special' está abierta.
create policy "special_select_own" on public.special_predictions
  for select to authenticated using (user_id = auth.uid());
create policy "special_insert_own_open" on public.special_predictions
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_phase_open('special'));
create policy "special_update_own_open" on public.special_predictions
  for update to authenticated
  using (user_id = auth.uid() and public.is_phase_open('special'))
  with check (user_id = auth.uid() and public.is_phase_open('special'));

-- tournament_results: lectura pública; solo admin escribe.
create policy "tournament_results_select" on public.tournament_results
  for select to authenticated using (true);
create policy "tournament_results_admin_write" on public.tournament_results
  for all to authenticated using (public.is_admin()) with check (public.is_admin());


-- >>>>>>>>>>>>>>>>>>>> supabase/migrations/0003_leaderboard.sql <<<<<<<<<<<<<<<<<<<<

-- =====================================================================
-- Polla Mundial 2026 — Cálculo automático de puntos (leaderboard)
-- =====================================================================
-- Las predicciones son privadas (RLS). El leaderboard se calcula con una
-- función SECURITY DEFINER que agrega los puntos de TODOS los usuarios y
-- devuelve solo los totales (nunca las predicciones individuales ajenas).
--
-- Puntos:
--   Marcador exacto: 3 · Acierto de resultado (1X2): 1
--   Campeón: 10 · Subcampeón: 5 · Cada semifinalista: 3 · Goleador: 5
-- =====================================================================

create or replace function public.get_leaderboard()
returns table (
  user_id        uuid,
  nickname       text,
  avatar_id      text,
  match_points   int,
  special_points int,
  total_points   int
)
language sql
stable
security definer
set search_path = public
as $$
  with match_pts as (
    select
      p.user_id,
      sum(
        case
          when p.home_score = r.home_score and p.away_score = r.away_score then 3
          when sign(p.home_score - p.away_score) = sign(r.home_score - r.away_score) then 1
          else 0
        end
      )::int as pts
    from public.predictions p
    join public.match_results r on r.match_id = p.match_id
    group by p.user_id
  ),
  special_pts as (
    select
      sp.user_id,
      (
          (case when sp.champion_team_id  = tr.champion_team_id  then 10 else 0 end)
        + (case when sp.runner_up_team_id = tr.runner_up_team_id then 5  else 0 end)
        + (case when sp.semifinalist1_id in (tr.semifinalist1_id, tr.semifinalist2_id) then 3 else 0 end)
        + (case when sp.semifinalist2_id in (tr.semifinalist1_id, tr.semifinalist2_id) then 3 else 0 end)
        + (case when tr.top_scorer is not null and tr.top_scorer <> ''
                 and lower(trim(sp.top_scorer)) = lower(trim(tr.top_scorer)) then 5 else 0 end)
      )::int as pts
    from public.special_predictions sp
    cross join public.tournament_results tr
    where tr.id = 1
  )
  select
    pr.id as user_id,
    pr.nickname,
    pr.avatar_id,
    coalesce(mp.pts, 0)  as match_points,
    coalesce(spp.pts, 0) as special_points,
    (coalesce(mp.pts, 0) + coalesce(spp.pts, 0)) as total_points
  from public.profiles pr
  left join match_pts   mp  on mp.user_id  = pr.id
  left join special_pts spp on spp.user_id = pr.id
  where pr.is_onboarded = true
  order by total_points desc, pr.nickname asc;
$$;

grant execute on function public.get_leaderboard() to authenticated;

-- ---------------------------------------------------------------------
-- Realtime: el cliente se suscribe a cambios en estos resultados para
-- refrescar el leaderboard en vivo cuando el admin carga datos.
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.match_results;
alter publication supabase_realtime add table public.tournament_results;


-- >>>>>>>>>>>>>>>>>>>> supabase/migrations/0004_triggers.sql <<<<<<<<<<<<<<<<<<<<

-- =====================================================================
-- Polla Mundial 2026 — Auto-creación de profile al registrarse
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- >>>>>>>>>>>>>>>>>>>> supabase/seed.sql <<<<<<<<<<<<<<<<<<<<

-- =====================================================================
-- Polla Mundial 2026 — Datos iniciales
-- =====================================================================
-- Ejecutar UNA vez después de las migraciones.
-- Las fechas/horas de los partidos son PLACEHOLDERS coherentes (arranque
-- 11 jun 2026); el admin puede ajustarlas al fixture oficial FIFA.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Admin(s)
-- ---------------------------------------------------------------------
insert into public.admins (email) values
  ('admin@joinaceleratalent.com')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Selecciones (48) — orden = posición 1..4 dentro del grupo
-- ---------------------------------------------------------------------
insert into public.teams (code, name, group_letter, flag_emoji) values
  ('MEX','México','A','🇲🇽'), ('RSA','Sudáfrica','A','🇿🇦'), ('KOR','Corea del Sur','A','🇰🇷'), ('CZE','Chequia','A','🇨🇿'),
  ('CAN','Canadá','B','🇨🇦'), ('BIH','Bosnia y Herzegovina','B','🇧🇦'), ('QAT','Catar','B','🇶🇦'), ('SUI','Suiza','B','🇨🇭'),
  ('BRA','Brasil','C','🇧🇷'), ('MAR','Marruecos','C','🇲🇦'), ('HAI','Haití','C','🇭🇹'), ('SCO','Escocia','C','🏴󠁧󠁢󠁳󠁣󠁴󠁿'),
  ('USA','Estados Unidos','D','🇺🇸'), ('PAR','Paraguay','D','🇵🇾'), ('AUS','Australia','D','🇦🇺'), ('TUR','Turquía','D','🇹🇷'),
  ('GER','Alemania','E','🇩🇪'), ('CUW','Curazao','E','🇨🇼'), ('CIV','Costa de Marfil','E','🇨🇮'), ('ECU','Ecuador','E','🇪🇨'),
  ('NED','Países Bajos','F','🇳🇱'), ('JPN','Japón','F','🇯🇵'), ('SWE','Suecia','F','🇸🇪'), ('TUN','Túnez','F','🇹🇳'),
  ('BEL','Bélgica','G','🇧🇪'), ('EGY','Egipto','G','🇪🇬'), ('IRN','Irán','G','🇮🇷'), ('NZL','Nueva Zelanda','G','🇳🇿'),
  ('ESP','España','H','🇪🇸'), ('CPV','Cabo Verde','H','🇨🇻'), ('KSA','Arabia Saudí','H','🇸🇦'), ('URU','Uruguay','H','🇺🇾'),
  ('FRA','Francia','I','🇫🇷'), ('SEN','Senegal','I','🇸🇳'), ('IRQ','Irak','I','🇮🇶'), ('NOR','Noruega','I','🇳🇴'),
  ('ARG','Argentina','J','🇦🇷'), ('ALG','Argelia','J','🇩🇿'), ('AUT','Austria','J','🇦🇹'), ('JOR','Jordania','J','🇯🇴'),
  ('POR','Portugal','K','🇵🇹'), ('COD','RD Congo','K','🇨🇩'), ('UZB','Uzbekistán','K','🇺🇿'), ('COL','Colombia','K','🇨🇴'),
  ('ENG','Inglaterra','L','🏴󠁧󠁢󠁥󠁮󠁧󠁿'), ('CRO','Croacia','L','🇭🇷'), ('GHA','Ghana','L','🇬🇭'), ('PAN','Panamá','L','🇵🇦')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- Partidos (72) — round-robin por grupo, 3 jornadas
--   MD1: 1v2, 3v4 · MD2: 1v3, 2v4 · MD3: 1v4, 2v3
-- ---------------------------------------------------------------------
do $$
declare
  letters text[] := array['A','B','C','D','E','F','G','H','I','J','K','L'];
  -- pares por jornada: {matchday, home_pos, away_pos}
  pairs int[][] := array[
    array[1,1,2], array[1,3,4],
    array[2,1,3], array[2,2,4],
    array[3,1,4], array[3,2,3]
  ];
  md_base timestamptz[] := array[
    timestamptz '2026-06-11 16:00+00',  -- J1
    timestamptz '2026-06-18 16:00+00',  -- J2
    timestamptz '2026-06-24 16:00+00'   -- J3
  ];
  g        int;
  p        int;
  letter   text;
  md       int;
  hp       int;
  ap       int;
  home_id  int;
  away_id  int;
  grp_ids  int[];
begin
  for g in 1 .. array_length(letters, 1) loop
    letter := letters[g];

    -- ids de las 4 selecciones del grupo, en orden de posición
    select array_agg(id order by id) into grp_ids
    from public.teams where group_letter = letter;

    for p in 1 .. array_length(pairs, 1) loop
      md := pairs[p][1];
      hp := pairs[p][2];
      ap := pairs[p][3];
      home_id := grp_ids[hp];
      away_id := grp_ids[ap];

      insert into public.matches (stage, group_letter, matchday, home_team_id, away_team_id, kickoff_at)
      values (
        'group', letter, md, home_id, away_id,
        md_base[md] + make_interval(hours => (g - 1) * 3 + (p % 2) * 2)
      );
    end loop;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Ventanas de predicción (editable por admin desde /admin)
--   J1 y J2 cierran juntas al inicio del torneo (11 jun 16:00 UTC).
--   J3 abre ~3 días antes de terminar J2 y cierra al inicio de J3.
--   Especiales cierran al inicio del torneo.
-- ---------------------------------------------------------------------
insert into public.phase_windows (phase_key, label, opens_at, locks_at) values
  ('md1',     'Jornada 1',  timestamptz '2026-06-01 00:00+00', timestamptz '2026-06-11 16:00+00'),
  ('md2',     'Jornada 2',  timestamptz '2026-06-01 00:00+00', timestamptz '2026-06-11 16:00+00'),
  ('md3',     'Jornada 3',  timestamptz '2026-06-21 00:00+00', timestamptz '2026-06-24 16:00+00'),
  ('special', 'Especiales', timestamptz '2026-06-01 00:00+00', timestamptz '2026-06-11 16:00+00')
on conflict (phase_key) do nothing;

