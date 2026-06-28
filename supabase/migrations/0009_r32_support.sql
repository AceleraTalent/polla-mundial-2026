-- =====================================================================
-- Polla Mundial 2026 — Soporte para eliminatoria (32avos en adelante)
-- =====================================================================
-- 1. bracket_slot: posición visual en la llave (1–16 para r32, 1–8 para r16, etc.)
-- 2. is_knockout_match_open: cierra predicciones 1 hora antes del pitazo
-- =====================================================================

alter table public.matches
  add column if not exists bracket_slot smallint;

-- Abre predicciones para un partido eliminatorio mientras falte más de 1 hora.
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
      and kickoff_at > now() + interval '1 hour'
  );
$$;

grant execute on function public.is_knockout_match_open(bigint) to authenticated;
