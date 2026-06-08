-- Función para obtener todos los pronósticos de un partido
-- SECURITY DEFINER: puede leer predicciones de todos los usuarios
create or replace function public.get_match_predictions(p_match_id bigint)
returns table(
  user_id   uuid,
  nickname  text,
  avatar_id text,
  home_score int,
  away_score int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pr.user_id,
    p.nickname,
    p.avatar_id,
    pr.home_score,
    pr.away_score
  from public.predictions pr
  join public.profiles p on p.id = pr.user_id
  where pr.match_id = p_match_id
  order by p.nickname;
$$;

grant execute on function public.get_match_predictions(bigint) to authenticated;
