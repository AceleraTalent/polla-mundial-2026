-- =====================================================================
-- Polla Mundial 2026 — Partido por el tercer y cuarto puesto
-- =====================================================================
-- Nuevo stage 'third_place': lo juegan los dos perdedores de semifinal,
-- el día antes de la final. Antes solo existían 'group','r32','r16',
-- 'qf','sf','final'.
-- =====================================================================

alter table public.matches drop constraint matches_stage_check;
alter table public.matches
  add constraint matches_stage_check
  check (stage in ('group','r32','r16','qf','sf','final','third_place'));
