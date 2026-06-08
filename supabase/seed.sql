-- =====================================================================
-- Polla Mundial 2026 — Datos iniciales
-- =====================================================================
-- Ejecutar UNA vez después de las migraciones.
-- Las fechas/horas de los partidos son PLACEHOLDERS coherentes (arranque
-- 11 jun 2026); el admin puede ajustarlas al fixture oficial FIFA.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Admin(s)
-- ---------------------------------------------------------------------
insert into public.admins (email) values
  ('admin@joinaceleratalent.com')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Selecciones (48) — orden = posición 1..4 dentro del grupo
-- ---------------------------------------------------------------------
insert into public.teams (code, name, group_letter, flag_emoji) values
  ('MEX','México','A','🇲🇽'), ('RSA','Sudáfrica','A','🇿🇦'), ('KOR','Corea del Sur','A','🇰🇷'), ('CZE','Chequia','A','🇨🇿'),
  ('CAN','Canadá','B','🇨🇦'), ('BIH','Bosnia y Herzegovina','B','🇧🇦'), ('QAT','Catar','B','🇶🇦'), ('SUI','Suiza','B','🇨🇭'),
  ('BRA','Brasil','C','🇧🇷'), ('MAR','Marruecos','C','🇲🇦'), ('HAI','Haití','C','🇭🇹'), ('SCO','Escocia','C','🏴󠁧󠁢󠁳󠁣󠁴󠁿'),
  ('USA','Estados Unidos','D','🇺🇸'), ('PAR','Paraguay','D','🇵🇾'), ('AUS','Australia','D','🇦🇺'), ('TUR','Turquía','D','🇹🇷'),
  ('GER','Alemania','E','🇩🇪'), ('CUW','Curazao','E','🇨🇼'), ('CIV','Costa de Marfil','E','🇨🇮'), ('ECU','Ecuador','E','🇪🇨'),
  ('NED','Países Bajos','F','🇳🇱'), ('JPN','Japón','F','🇯🇵'), ('SWE','Suecia','F','🇸🇪'), ('TUN','Túnez','F','🇹🇳'),
  ('BEL','Bélgica','G','🇧🇪'), ('EGY','Egipto','G','🇪🇬'), ('IRN','Irán','G','🇮🇷'), ('NZL','Nueva Zelanda','G','🇳🇿'),
  ('ESP','España','H','🇪🇸'), ('CPV','Cabo Verde','H','🇨🇻'), ('KSA','Arabia Saudí','H','🇸🇦'), ('URU','Uruguay','H','🇺🇾'),
  ('FRA','Francia','I','🇫🇷'), ('SEN','Senegal','I','🇸🇳'), ('IRQ','Irak','I','🇮🇶'), ('NOR','Noruega','I','🇳🇴'),
  ('ARG','Argentina','J','🇦🇷'), ('ALG','Argelia','J','🇩🇿'), ('AUT','Austria','J','🇦🇹'), ('JOR','Jordania','J','🇯🇴'),
  ('POR','Portugal','K','🇵🇹'), ('COD','RD Congo','K','🇨🇩'), ('UZB','Uzbekistán','K','🇺🇿'), ('COL','Colombia','K','🇨🇴'),
  ('ENG','Inglaterra','L','🏴󠁧󠁢󠁥󠁮󠁧󠁿'), ('CRO','Croacia','L','🇭🇷'), ('GHA','Ghana','L','🇬🇭'), ('PAN','Panamá','L','🇵🇦')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- Partidos (72) — round-robin por grupo, 3 jornadas
--   MD1: 1v2, 3v4 · MD2: 1v3, 2v4 · MD3: 1v4, 2v3
-- ---------------------------------------------------------------------
do $$
declare
  letters text[] := array['A','B','C','D','E','F','G','H','I','J','K','L'];
  -- pares por jornada: {matchday, home_pos, away_pos}
  pairs int[][] := array[
    array[1,1,2], array[1,3,4],
    array[2,1,3], array[2,2,4],
    array[3,1,4], array[3,2,3]
  ];
  md_base timestamptz[] := array[
    timestamptz '2026-06-11 16:00+00',  -- J1
    timestamptz '2026-06-18 16:00+00',  -- J2
    timestamptz '2026-06-24 16:00+00'   -- J3
  ];
  g        int;
  p        int;
  letter   text;
  md       int;
  hp       int;
  ap       int;
  home_id  int;
  away_id  int;
  grp_ids  int[];
begin
  for g in 1 .. array_length(letters, 1) loop
    letter := letters[g];

    -- ids de las 4 selecciones del grupo, en orden de posición
    select array_agg(id order by id) into grp_ids
    from public.teams where group_letter = letter;

    for p in 1 .. array_length(pairs, 1) loop
      md := pairs[p][1];
      hp := pairs[p][2];
      ap := pairs[p][3];
      home_id := grp_ids[hp];
      away_id := grp_ids[ap];

      insert into public.matches (stage, group_letter, matchday, home_team_id, away_team_id, kickoff_at)
      values (
        'group', letter, md, home_id, away_id,
        md_base[md] + make_interval(hours => (g - 1) * 3 + (p % 2) * 2)
      );
    end loop;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Ventanas de predicción (editable por admin desde /admin)
--   J1 y J2 cierran juntas al inicio del torneo (11 jun 16:00 UTC).
--   J3 abre ~3 días antes de terminar J2 y cierra al inicio de J3.
--   Especiales cierran al inicio del torneo.
-- ---------------------------------------------------------------------
insert into public.phase_windows (phase_key, label, opens_at, locks_at) values
  ('md1',     'Jornada 1',  timestamptz '2026-06-01 00:00+00', timestamptz '2026-06-11 16:00+00'),
  ('md2',     'Jornada 2',  timestamptz '2026-06-01 00:00+00', timestamptz '2026-06-11 16:00+00'),
  ('md3',     'Jornada 3',  timestamptz '2026-06-21 00:00+00', timestamptz '2026-06-24 16:00+00'),
  ('special', 'Especiales', timestamptz '2026-06-01 00:00+00', timestamptz '2026-06-11 16:00+00')
on conflict (phase_key) do nothing;
