-- =====================================================================
-- Polla Mundial 2026 — Desglose de puntos por partido por usuario
-- Devuelve solo partidos con resultado ya cargado.
-- Colombia 2x: marcador exacto 6 pts, resultado correcto 2 pts.
-- =====================================================================

create or replace function public.get_user_match_breakdown(p_user_id uuid)
returns table (
  match_id       int,
  kickoff_at     timestamptz,
  group_letter   text,
  matchday       int,
  home_name      text,
  home_flag      text,
  away_name      text,
  away_flag      text,
  result_home    int,
  result_away    int,
  pred_home      int,
  pred_away      int,
  is_colombia    boolean,
  points         int
)
language sql
stable
security definer
set search_path = public
as $$
  with col_matches as (
    select m.id
    from public.matches m
    join public.teams t on t.id in (m.home_team_id, m.away_team_id)
    where t.code = 'COL'
  )
  select
    m.id                                          as match_id,
    m.kickoff_at,
    m.group_letter,
    m.matchday,
    ht.name                                       as home_name,
    ht.flag_emoji                                 as home_flag,
    at.name                                       as away_name,
    at.flag_emoji                                 as away_flag,
    r.home_score                                  as result_home,
    r.away_score                                  as result_away,
    p.home_score                                  as pred_home,
    p.away_score                                  as pred_away,
    (m.id in (select id from col_matches))        as is_colombia,
    (
      (case
        when p.home_score = r.home_score and p.away_score = r.away_score then 3
        when sign(p.home_score::numeric - p.away_score::numeric)
           = sign(r.home_score::numeric - r.away_score::numeric) then 1
        else 0
      end)
      *
      (case when m.id in (select id from col_matches) then 2 else 1 end)
    )::int                                        as points
  from public.predictions p
  join public.matches m       on m.id = p.match_id
  join public.match_results r on r.match_id = p.match_id
  join public.teams ht        on ht.id = m.home_team_id
  join public.teams at        on at.id = m.away_team_id
  where p.user_id = p_user_id
  order by m.kickoff_at asc;
$$;

grant execute on function public.get_user_match_breakdown(uuid) to authenticated;
