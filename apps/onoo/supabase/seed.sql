-- Onoo seed data
-- Fixed UUIDs for stable dev/test links
-- Dev auth users + memberships cannot be seeded portably; T-013 creates them via script

-- Sport
INSERT INTO public.sports (id, key, name_mn, name_en, config) VALUES
('a0000000-0000-0000-0000-000000000001', 'basketball_5x5', 'Сагсан бөмбөг 5x5', 'Basketball 5x5',
 '{"periods": 4, "period_minutes": 10, "overtime_minutes": 5, "fouls_to_bonus": 5, "personal_foul_limit": 5, "players_on_court": 5}')
ON CONFLICT (key) DO NOTHING;

-- Stat event types
INSERT INTO public.stat_event_types (key, sport_key, category, requires_player) VALUES
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
ON CONFLICT (key) DO NOTHING;

-- Organization
INSERT INTO public.organizations (id, name, type) VALUES
('b0000000-0000-0000-0000-000000000001', 'Space League Org', 'league_operator')
ON CONFLICT (id) DO NOTHING;

-- League
INSERT INTO public.leagues (id, organization_id, sport_id, name, slug) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Space League', 'space-league')
ON CONFLICT (id) DO NOTHING;

-- Season
INSERT INTO public.seasons (id, league_id, name, starts_on, ends_on) VALUES
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '2026-2027', '2026-09-01', '2027-06-30')
ON CONFLICT (id) DO NOTHING;

-- Competition
INSERT INTO public.competitions (id, season_id, name, type) VALUES
('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Улирлын тоглолт', 'regular')
ON CONFLICT (id) DO NOTHING;

-- Venue
INSERT INTO public.venues (id, name, city, capacity) VALUES
('f0000000-0000-0000-0000-000000000001', 'БГД Спорт Цогцолбор', 'Улаанбаатар', 5000)
ON CONFLICT (id) DO NOTHING;

-- Teams
INSERT INTO public.teams (id, league_id, name, short_code, slug, primary_color) VALUES
('10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Хасын одод', 'ХАС', 'team-a', '#E63946'),
('20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Тэнгэрийн зүүд', 'ТЭЗ', 'team-b', '#457B9D')
ON CONFLICT (id) DO NOTHING;

-- Team seasons
INSERT INTO public.team_seasons (id, team_id, competition_id) VALUES
('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001'),
('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Players Team A (ХАС)
INSERT INTO public.players (id, canonical_name, name_latin, position, nationality) VALUES
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
ON CONFLICT (id) DO NOTHING;

-- Players Team B (ТЭЗ)
INSERT INTO public.players (id, canonical_name, name_latin, position, nationality) VALUES
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
ON CONFLICT (id) DO NOTHING;

-- Roster entries Team A
INSERT INTO public.roster_entries (team_season_id, player_id, jersey_number, position) VALUES
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
ON CONFLICT (team_season_id, player_id) DO NOTHING;

-- Roster entries Team B
INSERT INTO public.roster_entries (team_season_id, player_id, jersey_number, position) VALUES
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
ON CONFLICT (team_season_id, player_id) DO NOTHING;

-- Games
INSERT INTO public.games (id, competition_id, home_team_season_id, away_team_season_id, venue_id, scheduled_at, status) VALUES
('70000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '2026-09-15T18:00:00+08:00', 'scheduled'),
('70000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '2026-09-20T15:00:00+08:00', 'scheduled'),
('70000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '2026-10-01T19:00:00+08:00', 'scheduled')
ON CONFLICT (id) DO NOTHING;

-- NOTE: Dev auth users (admin@dev.local, scorer@dev.local) + memberships + game_assignments
-- cannot be seeded portably. T-013 creates them via a script using the local service key.
