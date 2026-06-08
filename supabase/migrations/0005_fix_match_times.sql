-- =====================================================================
-- Polla Mundial 2026 — Horarios oficiales FIFA World Cup 2026
-- Fuente: Wikipedia / FIFA (horarios en UTC)
-- Colombia = UTC-5 (sin horario de verano)
-- =====================================================================
-- Para corregir la base de datos existente, ejecuta este archivo en
-- el SQL Editor de Supabase.
-- =====================================================================

WITH match_times(code1, code2, kickoff) AS (
  VALUES
    -- Grupo A
    ('MEX','RSA', '2026-06-11 19:00:00+00'::timestamptz),  -- 2pm Col
    ('KOR','CZE', '2026-06-12 02:00:00+00'::timestamptz),  -- 9pm Col jun 11
    ('RSA','CZE', '2026-06-18 16:00:00+00'::timestamptz),  -- 11am Col
    ('MEX','KOR', '2026-06-19 01:00:00+00'::timestamptz),  -- 8pm Col jun 18
    ('MEX','CZE', '2026-06-25 01:00:00+00'::timestamptz),  -- 8pm Col jun 24
    ('RSA','KOR', '2026-06-25 01:00:00+00'::timestamptz),  -- 8pm Col jun 24

    -- Grupo B
    ('CAN','BIH', '2026-06-12 19:00:00+00'::timestamptz),  -- 2pm Col
    ('QAT','SUI', '2026-06-13 19:00:00+00'::timestamptz),  -- 2pm Col
    ('BIH','SUI', '2026-06-18 19:00:00+00'::timestamptz),  -- 2pm Col
    ('CAN','QAT', '2026-06-18 22:00:00+00'::timestamptz),  -- 5pm Col
    ('CAN','SUI', '2026-06-24 19:00:00+00'::timestamptz),  -- 2pm Col
    ('BIH','QAT', '2026-06-24 19:00:00+00'::timestamptz),  -- 2pm Col

    -- Grupo C
    ('BRA','MAR', '2026-06-13 22:00:00+00'::timestamptz),  -- 5pm Col
    ('HAI','SCO', '2026-06-14 01:00:00+00'::timestamptz),  -- 8pm Col jun 13
    ('MAR','SCO', '2026-06-19 22:00:00+00'::timestamptz),  -- 5pm Col
    ('BRA','HAI', '2026-06-20 00:30:00+00'::timestamptz),  -- 7:30pm Col jun 19
    ('BRA','SCO', '2026-06-24 22:00:00+00'::timestamptz),  -- 5pm Col
    ('MAR','HAI', '2026-06-24 22:00:00+00'::timestamptz),  -- 5pm Col

    -- Grupo D
    ('USA','PAR', '2026-06-13 01:00:00+00'::timestamptz),  -- 8pm Col jun 12
    ('AUS','TUR', '2026-06-14 04:00:00+00'::timestamptz),  -- 11pm Col jun 13
    ('USA','AUS', '2026-06-19 19:00:00+00'::timestamptz),  -- 2pm Col
    ('PAR','TUR', '2026-06-20 03:00:00+00'::timestamptz),  -- 10pm Col jun 19
    ('USA','TUR', '2026-06-26 02:00:00+00'::timestamptz),  -- 9pm Col jun 25
    ('PAR','AUS', '2026-06-26 02:00:00+00'::timestamptz),  -- 9pm Col jun 25

    -- Grupo E
    ('GER','CUW', '2026-06-14 17:00:00+00'::timestamptz),  -- 12pm Col
    ('CIV','ECU', '2026-06-14 23:00:00+00'::timestamptz),  -- 6pm Col
    ('GER','CIV', '2026-06-20 20:00:00+00'::timestamptz),  -- 3pm Col
    ('CUW','ECU', '2026-06-21 00:00:00+00'::timestamptz),  -- 7pm Col jun 20
    ('GER','ECU', '2026-06-25 20:00:00+00'::timestamptz),  -- 3pm Col
    ('CUW','CIV', '2026-06-25 20:00:00+00'::timestamptz),  -- 3pm Col

    -- Grupo F
    ('NED','JPN', '2026-06-14 20:00:00+00'::timestamptz),  -- 3pm Col
    ('SWE','TUN', '2026-06-15 02:00:00+00'::timestamptz),  -- 9pm Col jun 14
    ('NED','SWE', '2026-06-20 17:00:00+00'::timestamptz),  -- 12pm Col
    ('JPN','TUN', '2026-06-21 04:00:00+00'::timestamptz),  -- 11pm Col jun 20
    ('NED','TUN', '2026-06-25 23:00:00+00'::timestamptz),  -- 6pm Col
    ('JPN','SWE', '2026-06-25 23:00:00+00'::timestamptz),  -- 6pm Col

    -- Grupo G
    ('BEL','EGY', '2026-06-15 19:00:00+00'::timestamptz),  -- 2pm Col
    ('IRN','NZL', '2026-06-16 01:00:00+00'::timestamptz),  -- 8pm Col jun 15
    ('BEL','IRN', '2026-06-21 19:00:00+00'::timestamptz),  -- 2pm Col
    ('EGY','NZL', '2026-06-22 01:00:00+00'::timestamptz),  -- 8pm Col jun 21
    ('BEL','NZL', '2026-06-27 03:00:00+00'::timestamptz),  -- 10pm Col jun 26
    ('EGY','IRN', '2026-06-27 03:00:00+00'::timestamptz),  -- 10pm Col jun 26

    -- Grupo H
    ('ESP','CPV', '2026-06-15 16:00:00+00'::timestamptz),  -- 11am Col
    ('KSA','URU', '2026-06-15 22:00:00+00'::timestamptz),  -- 5pm Col
    ('ESP','KSA', '2026-06-21 16:00:00+00'::timestamptz),  -- 11am Col
    ('CPV','URU', '2026-06-21 22:00:00+00'::timestamptz),  -- 5pm Col
    ('ESP','URU', '2026-06-27 00:00:00+00'::timestamptz),  -- 7pm Col jun 26
    ('CPV','KSA', '2026-06-27 00:00:00+00'::timestamptz),  -- 7pm Col jun 26

    -- Grupo I
    ('FRA','SEN', '2026-06-16 19:00:00+00'::timestamptz),  -- 2pm Col
    ('IRQ','NOR', '2026-06-16 22:00:00+00'::timestamptz),  -- 5pm Col
    ('FRA','IRQ', '2026-06-22 21:00:00+00'::timestamptz),  -- 4pm Col
    ('SEN','NOR', '2026-06-23 00:00:00+00'::timestamptz),  -- 7pm Col jun 22
    ('FRA','NOR', '2026-06-26 19:00:00+00'::timestamptz),  -- 2pm Col
    ('SEN','IRQ', '2026-06-26 19:00:00+00'::timestamptz),  -- 2pm Col

    -- Grupo J
    ('ARG','ALG', '2026-06-17 01:00:00+00'::timestamptz),  -- 8pm Col jun 16
    ('AUT','JOR', '2026-06-17 04:00:00+00'::timestamptz),  -- 11pm Col jun 16
    ('ARG','AUT', '2026-06-22 17:00:00+00'::timestamptz),  -- 12pm Col
    ('ALG','JOR', '2026-06-23 03:00:00+00'::timestamptz),  -- 10pm Col jun 22
    ('ARG','JOR', '2026-06-28 02:00:00+00'::timestamptz),  -- 9pm Col jun 27
    ('ALG','AUT', '2026-06-28 02:00:00+00'::timestamptz),  -- 9pm Col jun 27

    -- Grupo K
    ('POR','COD', '2026-06-17 17:00:00+00'::timestamptz),  -- 12pm Col
    ('UZB','COL', '2026-06-18 02:00:00+00'::timestamptz),  -- 9pm Col jun 17
    ('POR','UZB', '2026-06-23 17:00:00+00'::timestamptz),  -- 12pm Col
    ('COD','COL', '2026-06-24 02:00:00+00'::timestamptz),  -- 9pm Col jun 23
    ('POR','COL', '2026-06-27 23:30:00+00'::timestamptz),  -- 6:30pm Col
    ('COD','UZB', '2026-06-27 23:30:00+00'::timestamptz),  -- 6:30pm Col

    -- Grupo L
    ('ENG','CRO', '2026-06-17 20:00:00+00'::timestamptz),  -- 3pm Col
    ('GHA','PAN', '2026-06-17 23:00:00+00'::timestamptz),  -- 6pm Col
    ('ENG','GHA', '2026-06-23 20:00:00+00'::timestamptz),  -- 3pm Col
    ('CRO','PAN', '2026-06-23 23:00:00+00'::timestamptz),  -- 6pm Col
    ('ENG','PAN', '2026-06-27 21:00:00+00'::timestamptz),  -- 4pm Col
    ('CRO','GHA', '2026-06-27 21:00:00+00'::timestamptz)   -- 4pm Col
),
resolved AS (
  SELECT t1.id AS tid1, t2.id AS tid2, mt.kickoff
  FROM match_times mt
  JOIN public.teams t1 ON t1.code = mt.code1
  JOIN public.teams t2 ON t2.code = mt.code2
)
UPDATE public.matches m
SET kickoff_at = r.kickoff
FROM resolved r
WHERE (m.home_team_id = r.tid1 AND m.away_team_id = r.tid2)
   OR (m.home_team_id = r.tid2 AND m.away_team_id = r.tid1);
