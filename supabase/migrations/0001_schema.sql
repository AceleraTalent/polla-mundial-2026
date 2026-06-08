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
