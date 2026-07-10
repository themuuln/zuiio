-- Onoo V2 dev seed data.
-- Contains registry, dev players, rosters, and sample games for local development.
-- Auth users and memberships cannot be seeded portably — created via script with service key.

insert into public.sports (id, key, name_mn, name_en, config) values
('a0000000-0000-0000-0000-000000000001', 'basketball_5x5', 'Сагсан бөмбөг 5x5', 'Basketball 5x5',
 '{"periods":4,"period_minutes":10,"overtime_minutes":5,"fouls_to_bonus":5,"personal_foul_limit":5,"players_on_court":5}'::jsonb)
on conflict (key) do nothing;

insert into public.stat_event_types (key, sport_key, category, requires_player) values
('shot_2pt_made', 'basketball_5x5', 'shot', true),
('shot_2pt_missed', 'basketball_5x5', 'shot', true),
('shot_3pt_made', 'basketball_5x5', 'shot', true),
('shot_3pt_missed', 'basketball_5x5', 'shot', true),
('ft_made', 'basketball_5x5', 'shot', true),
('ft_missed', 'basketball_5x5', 'shot', true),
('rebound_off', 'basketball_5x5', 'rebound', true),
('rebound_def', 'basketball_5x5', 'rebound', true),
('rebound_team', 'basketball_5x5', 'rebound', false),
('steal', 'basketball_5x5', 'defense', true),
('block', 'basketball_5x5', 'defense', true),
('turnover', 'basketball_5x5', 'offense', true),
('foul_personal', 'basketball_5x5', 'foul', true),
('foul_technical', 'basketball_5x5', 'foul', true),
('substitution', 'basketball_5x5', 'admin', false),
('timeout', 'basketball_5x5', 'admin', false),
('period_start', 'basketball_5x5', 'admin', false),
('period_end', 'basketball_5x5', 'admin', false),
('game_start', 'basketball_5x5', 'admin', false),
('game_end', 'basketball_5x5', 'admin', false)
on conflict (key) do nothing;

insert into public.organizations (id, name, type) values
('b0000000-0000-0000-0000-000000000001', 'Onoo Pilot Operator', 'league_operator')
on conflict (id) do nothing;

insert into public.leagues (id, organization_id, sport_id, name, slug) values
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Onoo Pilot League', 'onoo-pilot')
on conflict (id) do nothing;

insert into public.seasons (id, league_id, name, starts_on, ends_on) values
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '2026 Pilot', '2026-09-01', '2026-12-31')
on conflict (id) do nothing;

insert into public.competitions (id, season_id, name, type) values
('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Туршилтын улирал', 'regular')
on conflict (id) do nothing;

insert into public.venues (id, name, city, capacity) values
('f0000000-0000-0000-0000-000000000001', 'Onoo Pilot Court', 'Улаанбаатар', 500)
on conflict (id) do nothing;

insert into public.teams (id, league_id, name, short_code, slug) values
('10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Pilot A', 'PA', 'pilot-a'),
('20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Pilot B', 'PB', 'pilot-b')
on conflict (id) do nothing;

insert into public.team_seasons (id, team_id, competition_id) values
('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001'),
('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;
-- Dev players (Team A: Хасын одод)
insert into public.players (id, canonical_name, name_latin, position, nationality) values
('50000000-0000-0000-0000-000000000001', 'Бат-Эрдэнэ', 'Bat-Erdene', 'PG', 'MN'),
('50000000-0000-0000-0000-000000000002', 'Мөнх-Түвшин', 'Munkh-Tuvshin', 'SG', 'MN'),
('50000000-0000-0000-0000-000000000003', 'Оюун-Эрдэнэ', 'Oyun-Erdene', 'SF', 'MN'),
('50000000-0000-0000-0000-000000000004', 'Баярсайхан', 'Bayarsaikhan', 'PF', 'MN'),
('50000000-0000-0000-0000-000000000005', 'Ганбаатар', 'Ganbaatar', 'C', 'MN'),
('50000000-0000-0000-0000-000000000006', 'Түмэнбаяр', 'Tumenbayar', 'PG', 'MN'),
('50000000-0000-0000-0000-000000000007', 'Эрдэнэ-Бат', 'Erdene-Bat', 'SG', 'MN'),
('50000000-0000-0000-0000-000000000008', 'Сүрэнжав', 'Surenjav', 'SF', 'MN'),
('50000000-0000-0000-0000-000000000009', 'Дорж', 'Dorj', 'PF', 'MN'),
('50000000-0000-0000-0000-000000000010', 'Хүрэлбат', 'Khurelbat', 'C', 'MN')
on conflict (id) do nothing;

-- Dev players (Team B: Тэнгэрийн зүүд)
insert into public.players (id, canonical_name, name_latin, position, nationality) values
('60000000-0000-0000-0000-000000000001', 'Тэмүүлэн', 'Temuulen', 'PG', 'MN'),
('60000000-0000-0000-0000-000000000002', 'Алтанцэцэг', 'Altantsetseg', 'SG', 'MN'),
('60000000-0000-0000-0000-000000000003', 'Болд', 'Bold', 'SF', 'MN'),
('60000000-0000-0000-0000-000000000004', 'Наран', 'Naran', 'PF', 'MN'),
('60000000-0000-0000-0000-000000000005', 'Цогт', 'Tsogt', 'C', 'MN'),
('60000000-0000-0000-0000-000000000006', 'Батбаяр', 'Batbayar', 'PG', 'MN'),
('60000000-0000-0000-0000-000000000007', 'Мэндбаяр', 'Mendbayar', 'SG', 'MN'),
('60000000-0000-0000-0000-000000000008', 'Одбаяр', 'Odbayar', 'SF', 'MN'),
('60000000-0000-0000-0000-000000000009', 'Энхбаяр', 'Enkhbayar', 'PF', 'MN'),
('60000000-0000-0000-0000-000000000010', 'Хасбаяр', 'Khasbayar', 'C', 'MN')
on conflict (id) do nothing;

-- Dev roster entries (Team A)
insert into public.roster_entries (team_season_id, player_id, jersey_number, position) values
('30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 1, 'PG'),
('30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 2, 'SG'),
('30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', 3, 'SF'),
('30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', 4, 'PF'),
('30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000005', 5, 'C'),
('30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000006', 6, 'PG'),
('30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000007', 7, 'SG'),
('30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000008', 8, 'SF'),
('30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000009', 9, 'PF'),
('30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000010', 10, 'C')
on conflict (team_season_id, player_id) do nothing;

-- Dev roster entries (Team B)
insert into public.roster_entries (team_season_id, player_id, jersey_number, position) values
('40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 1, 'PG'),
('40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002', 2, 'SG'),
('40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000003', 3, 'SF'),
('40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000004', 4, 'PF'),
('40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000005', 5, 'C'),
('40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000006', 6, 'PG'),
('40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000007', 7, 'SG'),
('40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000008', 8, 'SF'),
('40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000009', 9, 'PF'),
('40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000010', 10, 'C')
on conflict (team_season_id, player_id) do nothing;

-- Dev games (scheduled, live, and final for testing)
insert into public.games (id, competition_id, home_team_season_id, away_team_season_id, venue_id, scheduled_at, status, ruleset_id) values
('70000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '2026-09-15T18:00:00+08:00', 'scheduled', '90000000-0000-0000-0000-000000000001'),
('70000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '2026-09-20T15:00:00+08:00', 'final_pending_review', '90000000-0000-0000-0000-000000000001'),
('70000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '2026-10-01T19:00:00+08:00', 'live_provisional', '90000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

insert into public.basketball_rulesets (id, league_id, version, name, rules, effective_from) values
('90000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '2026-pilot.1', 'Onoo Pilot 5x5',
 '{"periods":4,"period_minutes":10,"overtime_minutes":5,"personal_foul_limit":5,"players_on_court":5}'::jsonb, '2026-09-01')
on conflict (id) do nothing;
