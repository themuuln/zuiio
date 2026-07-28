-- Seed script: set up game 102 with B21.pdf player data
-- Run: PGPASSWORD=postgres psql -h 127.0.0.1 -p 54323 -U postgres -d postgres -f scripts/seed-b21-game.sql

\echo '=== Cleaning old data ==='

-- Clean up any prior failed runs
DELETE FROM game_player_stats WHERE game_id = '70000000-0000-0000-0000-000000000102';
DELETE FROM game_team_stats WHERE game_id = '70000000-0000-0000-0000-000000000102';
DELETE FROM game_summary_stats WHERE game_id = '70000000-0000-0000-0000-000000000102';
DELETE FROM game_period_scores WHERE game_id = '70000000-0000-0000-0000-000000000102';
DELETE FROM game_scoring_checkpoints WHERE game_id = '70000000-0000-0000-0000-000000000102';
DELETE FROM game_rosters WHERE game_id = '70000000-0000-0000-0000-000000000102';
DELETE FROM roster_entries WHERE team_season_id IN ('30000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000006')
  AND player_id LIKE 'b2100000-%';
DELETE FROM players WHERE id LIKE 'b2100000-%';

\echo '=== Creating EAG (home team) players ==='

-- Player #1
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000000', 'Баяржаргал БАТ-ЭРДЭНЭ', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000000', '30000000-0000-0000-0000-000000000005', 1, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 1;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000005', 'b2100000-0000-4000-8000-000000000000', false)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = false;
\echo '  Player #1 done'

-- Player #2
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000001', 'Мейамбек ЕРДАНА', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000001', '30000000-0000-0000-0000-000000000005', 2, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 2;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000005', 'b2100000-0000-4000-8000-000000000001', false)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = false;
\echo '  Player #2 done'

-- Player #7
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000002', 'Кадирхан БАЛГЫН', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000002', '30000000-0000-0000-0000-000000000005', 7, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 7;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000005', 'b2100000-0000-4000-8000-000000000002', true)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = true;
\echo '  Player #7 done'

-- Player #8
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000003', 'Амаржаргал ЗОЛБОО', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000003', '30000000-0000-0000-0000-000000000005', 8, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 8;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000005', 'b2100000-0000-4000-8000-000000000003', true)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = true;
\echo '  Player #8 done'

-- Player #9
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000004', 'Даулетбек МУХАММЕДКАЛИ', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000004', '30000000-0000-0000-0000-000000000005', 9, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 9;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000005', 'b2100000-0000-4000-8000-000000000004', false)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = false;
\echo '  Player #9 done'

-- Player #11
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000005', 'Махсат ЕРГАЛЫМ', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000005', '30000000-0000-0000-0000-000000000005', 11, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 11;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000005', 'b2100000-0000-4000-8000-000000000005', false)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = false;
\echo '  Player #11 done'

-- Player #12
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000006', 'Бекжан ЗАНГАР', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000006', '30000000-0000-0000-0000-000000000005', 12, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 12;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000005', 'b2100000-0000-4000-8000-000000000006', true)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = true;
\echo '  Player #12 done'

-- Player #13
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000007', 'Асхар ЖАНДОС', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000007', '30000000-0000-0000-0000-000000000005', 13, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 13;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000005', 'b2100000-0000-4000-8000-000000000007', false)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = false;
\echo '  Player #13 done'

-- Player #17
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000008', 'Аскер ҮМБЕТАЛИ', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000008', '30000000-0000-0000-0000-000000000005', 17, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 17;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000005', 'b2100000-0000-4000-8000-000000000008', false)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = false;
\echo '  Player #17 done'

-- Player #21
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000009', 'Альбек НУРЖОЛ', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000009', '30000000-0000-0000-0000-000000000005', 21, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 21;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000005', 'b2100000-0000-4000-8000-000000000009', true)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = true;
\echo '  Player #21 done'

-- Player #23
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000010', 'Бүджав ГАНТОГТОХ', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000010', '30000000-0000-0000-0000-000000000005', 23, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 23;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000005', 'b2100000-0000-4000-8000-000000000010', true)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = true;
\echo '  Player #23 done'

\echo '=== Creating KER (away team) players ==='

-- Player #0
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000011', 'Бекнур АНТОН', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000011', '30000000-0000-0000-0000-000000000006', 0, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 0;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000006', 'b2100000-0000-4000-8000-000000000011', false)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = false;
\echo '  Player #0 done'

-- Player #1 (away)
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000012', 'Салтанат АЙБЕК', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000012', '30000000-0000-0000-0000-000000000006', 1, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 1;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000006', 'b2100000-0000-4000-8000-000000000012', true)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = true;
\echo '  Player #1 away done'

-- Player #2 (away)
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000013', 'Мерейхан МУХТАР', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000013', '30000000-0000-0000-0000-000000000006', 2, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 2;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000006', 'b2100000-0000-4000-8000-000000000013', false)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = false;
\echo '  Player #2 away done'

-- Player #3
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000014', 'Совет МУХТАР', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000014', '30000000-0000-0000-0000-000000000006', 3, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 3;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000006', 'b2100000-0000-4000-8000-000000000014', false)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = false;
\echo '  Player #3 done'

-- Player #4
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000015', 'Марат ЕРДОС', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000015', '30000000-0000-0000-0000-000000000006', 4, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 4;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000006', 'b2100000-0000-4000-8000-000000000015', false)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = false;
\echo '  Player #4 done'

-- Player #9 (away)
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000016', 'Биржан ЕСБОЛАТ', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000016', '30000000-0000-0000-0000-000000000006', 9, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 9;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000006', 'b2100000-0000-4000-8000-000000000016', true)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = true;
\echo '  Player #9 away done'

-- Player #10
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000017', 'Манарбек ЕРКЕБУЛАН', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000017', '30000000-0000-0000-0000-000000000006', 10, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 10;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000006', 'b2100000-0000-4000-8000-000000000017', true)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = true;
\echo '  Player #10 done'

-- Player #11 (away)
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000018', 'Хали БЕКНУР', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000018', '30000000-0000-0000-0000-000000000006', 11, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 11;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000006', 'b2100000-0000-4000-8000-000000000018', false)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = false;
\echo '  Player #11 away done'

-- Player #12 (away)
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000019', 'Эрдэнэбилэг СУМЪЯАБАЗАР', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000019', '30000000-0000-0000-0000-000000000006', 12, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 12;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000006', 'b2100000-0000-4000-8000-000000000019', true)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = true;
\echo '  Player #12 away done'

-- Player #13 (away)
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000020', 'Серикжан ТИЛЕКБЕРГЕН', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000020', '30000000-0000-0000-0000-000000000006', 13, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 13;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000006', 'b2100000-0000-4000-8000-000000000020', false)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = false;
\echo '  Player #13 away done'

-- Player #23 (away)
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000021', 'Мейрамбек КАДИРБЕК', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000021', '30000000-0000-0000-0000-000000000006', 23, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 23;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000006', 'b2100000-0000-4000-8000-000000000021', false)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = false;
\echo '  Player #23 away done'

-- Player #94
INSERT INTO players (id, canonical_name, nationality, position) VALUES ('b2100000-0000-4000-8000-000000000022', 'Асхар СЕРИКЖАН', 'MN', 'G');
INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) VALUES ('b2100000-0000-4000-8000-000000000022', '30000000-0000-0000-0000-000000000006', 94, 'G')
  ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = 94;
INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ('70000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000006', 'b2100000-0000-4000-8000-000000000022', true)
  ON CONFLICT (game_id, player_id) DO UPDATE SET is_starter = true;
\echo '  Player #94 done'

\echo '=== Creating game assignment ==='
INSERT INTO game_assignments (game_id, user_id, role)
VALUES ('70000000-0000-0000-0000-000000000102', '02346873-7047-4c27-b1d5-9461301c447f', 'lead_scorer')
ON CONFLICT (game_id, user_id, role) DO UPDATE SET role = 'lead_scorer';
\echo '✓ Game assignment created'
