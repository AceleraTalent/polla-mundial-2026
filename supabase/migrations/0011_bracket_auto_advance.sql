-- =====================================================================
-- Polla Mundial 2026 — Avance automático de la llave
-- =====================================================================
-- 1. matches.bracket_slot: posición fija de cada partido dentro de su fase
--    (1-16 en 32avos, 1-8 en octavos, 1-4 en cuartos, 1-2 en semis, 1 en
--    la final). Antes se calculaba con mapas hardcodeados en el código;
--    ahora vive en la base de datos para que el backend pueda crear
--    automáticamente el siguiente partido sin necesitar un deploy.
-- 2. match_results.winner_team_id: quién avanza en un partido de
--    eliminatoria. Para marcadores distintos es obvio; en empates (que
--    solo pueden pasar en eliminatoria si se define por penales o gol de
--    oro en tiempo extra) hay que indicarlo explícitamente.
-- =====================================================================

alter table public.matches
  add column if not exists bracket_slot smallint;

alter table public.match_results
  add column if not exists winner_team_id int references public.teams(id);

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

-- ---------------------------------------------------------------------
-- Backfill: winner_team_id para resultados de eliminatoria ya cargados.
-- Marcador distinto → obvio. Empatado → usa penalty_winner_team_id si
-- se definió por penales.
-- ---------------------------------------------------------------------
update public.match_results r
set winner_team_id = case
  when r.home_score <> r.away_score then (
    select case when r.home_score > r.away_score then m.home_team_id else m.away_team_id end
    from public.matches m where m.id = r.match_id
  )
  else r.penalty_winner_team_id
end
from public.matches m
where m.id = r.match_id
  and m.stage <> 'group'
  and r.winner_team_id is null;

-- Empates decididos en tiempo extra (sin penales) — no hay forma
-- automática de saberlo, se marca a mano con el resultado real:
update public.match_results set winner_team_id = 25 where match_id = 97;  -- Bélgica 3-2 Senegal (AET)
update public.match_results set winner_team_id = 37 where match_id = 103; -- Argentina 3-2 Cabo Verde (AET)

-- ---------------------------------------------------------------------
-- Backfill: bracket_slot para los partidos de eliminatoria ya creados.
-- ---------------------------------------------------------------------
-- 32avos (slots 1-16)
update public.matches set bracket_slot = 1  where id = 92;
update public.matches set bracket_slot = 2  where id = 93;
update public.matches set bracket_slot = 3  where id = 89;
update public.matches set bracket_slot = 4  where id = 94;
update public.matches set bracket_slot = 5  where id = 100;
update public.matches set bracket_slot = 6  where id = 99;
update public.matches set bracket_slot = 7  where id = 98;
update public.matches set bracket_slot = 8  where id = 97;
update public.matches set bracket_slot = 9  where id = 90;
update public.matches set bracket_slot = 10 where id = 91;
update public.matches set bracket_slot = 11 where id = 95;
update public.matches set bracket_slot = 12 where id = 96;
update public.matches set bracket_slot = 13 where id = 103;
update public.matches set bracket_slot = 14 where id = 102;
update public.matches set bracket_slot = 15 where id = 101;
update public.matches set bracket_slot = 16 where id = 104;

-- Octavos (slots 1-8)
update public.matches set bracket_slot = 1 where id = 106;
update public.matches set bracket_slot = 2 where id = 105;
update public.matches set bracket_slot = 3 where id = 110;
update public.matches set bracket_slot = 4 where id = 109;
update public.matches set bracket_slot = 5 where id = 107;
update public.matches set bracket_slot = 6 where id = 108;
update public.matches set bracket_slot = 7 where id = 111;
update public.matches set bracket_slot = 8 where id = 112;
