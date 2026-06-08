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
