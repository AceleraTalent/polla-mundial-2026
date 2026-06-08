-- =====================================================================
-- Polla Mundial 2026 — Regla especial: partidos de Colombia valen el doble
-- Marcador exacto: 6 pts (en vez de 3)
-- Acertar resultado: 2 pts (en vez de 1)
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
  with colombia_match_ids as (
    -- Partidos en que juega Colombia (COL)
    select m.id
    from public.matches m
    join public.teams t on t.id in (m.home_team_id, m.away_team_id)
    where t.code = 'COL'
  ),
  match_pts as (
    select
      p.user_id,
      sum(
        (case
          when p.home_score = r.home_score and p.away_score = r.away_score then 3
          when sign(p.home_score - p.away_score) = sign(r.home_score - r.away_score) then 1
          else 0
        end)
        *
        (case when p.match_id in (select id from colombia_match_ids) then 2 else 1 end)
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
        + (case when sp.runner_up_team_id = tr.runner_up_team_id then  5 else 0 end)
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
    pr.id                                        as user_id,
    pr.nickname,
    pr.avatar_id,
    coalesce(mp.pts, 0)                          as match_points,
    coalesce(spp.pts, 0)                         as special_points,
    (coalesce(mp.pts, 0) + coalesce(spp.pts, 0)) as total_points
  from public.profiles pr
  left join match_pts   mp  on mp.user_id  = pr.id
  left join special_pts spp on spp.user_id = pr.id
  where pr.is_onboarded = true
  order by total_points desc, pr.nickname asc;
$$;

grant execute on function public.get_leaderboard() to authenticated;
