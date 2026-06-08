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
