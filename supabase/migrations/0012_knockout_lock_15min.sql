-- =====================================================================
-- Polla Mundial 2026 — Cierre de eliminatoria a 15 minutos del pitazo
-- =====================================================================
-- Antes cerraba 1 hora antes. Se acorta a 15 minutos para dar más
-- tiempo a los usuarios a meter su pronóstico el día del partido.
-- =====================================================================

create or replace function public.is_knockout_match_open(p_match_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.matches
    where id = p_match_id
      and kickoff_at > now() + interval '15 minutes'
  );
$$;

grant execute on function public.is_knockout_match_open(bigint) to authenticated;
