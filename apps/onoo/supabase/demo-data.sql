-- Onoo Demo Data
-- Creates realistic demo games, stats, and standings so the app has
-- content to show instead of empty states.
--
-- Run locally: PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f supabase/demo-data.sql
-- Run remotely: supabase db execute --file supabase/demo-data.sql --db-url <remote-db-url>
--
-- Runs idempotently — safe to re-run. Clears then rebuilds.

-- Ensure seed admin auth user exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '397692e0-915f-4361-9f75-f84d0883ba80') THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (
      '397692e0-915f-4361-9f75-f84d0883ba80',
      'seed-admin@onoo-test.mn',
      '$2a$10$abcdefghijklmnopqrstuvwxyz12345678901234567890abcdefghijkl',
      now(),
      '{"display_name": "Seed Admin"}'
    );
    INSERT INTO auth.identities (id, user_id, provider, identity_data)
    VALUES ('397692e0-915f-4361-9f75-f84d0883ba80', '397692e0-915f-4361-9f75-f84d0883ba80', 'email', jsonb_build_object('sub', '397692e0-915f-4361-9f75-f84d0883ba80'));
  END IF;
END $$;

INSERT INTO public.memberships (user_id, scope_type, scope_id, role)
VALUES ('397692e0-915f-4361-9f75-f84d0883ba80', 'league', 'c0000000-0000-0000-0000-000000000001', 'admin')
ON CONFLICT DO NOTHING;

-- ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
-- DEMO DATA — Main DO block
-- ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
DO $$
DECLARE
  -- Reference IDs
  v_admin_id constant uuid := '397692e0-915f-4361-9f75-f84d0883ba80';
  v_comp_id constant uuid := 'e0000000-0000-0000-0000-000000000001';
  v_ruleset_id constant uuid := '90000000-0000-0000-0000-000000000001';
  v_venue_id constant uuid := 'f0000000-0000-0000-0000-000000000001';

  -- Team season IDs (The League Regular Season)
  v_khu constant uuid := '30000000-0000-0000-0000-000000000001';
  v_ape constant uuid := '30000000-0000-0000-0000-000000000002';
  v_bch constant uuid := '30000000-0000-0000-0000-000000000003';
  v_sel constant uuid := '30000000-0000-0000-0000-000000000004';
  v_min constant uuid := '30000000-0000-0000-0000-000000000005';
  v_kho constant uuid := '30000000-0000-0000-0000-000000000006';
  v_dar constant uuid := '30000000-0000-0000-0000-000000000007';
  v_zav constant uuid := '30000000-0000-0000-0000-000000000008';
  v_mon constant uuid := '30000000-0000-0000-0000-000000000009';
  v_met constant uuid := '30000000-0000-0000-0000-000000000010';

  -- Player IDs (Khuleguud)
  v_p1 constant uuid := '50000000-0000-0000-0000-000000000001'; -- Болор-Эрдэнэ
  v_p2 constant uuid := '50000000-0000-0000-0000-000000000002'; -- Дулгуун
  v_p3 constant uuid := '50000000-0000-0000-0000-000000000003'; -- Билгүүн
  v_p4 constant uuid := '50000000-0000-0000-0000-000000000004'; -- Туяа
  v_p5 constant uuid := '50000000-0000-0000-0000-000000000005'; -- Тэмүүлэн

  -- Player IDs (SG Apes)
  v_a1 constant uuid := '50000000-0000-0000-0000-000000000020'; -- Содном-Очир
  v_a2 constant uuid := '50000000-0000-0000-0000-000000000021'; -- Эрдэнэцогт
  v_a3 constant uuid := '50000000-0000-0000-0000-000000000022'; -- Маргад
  v_a4 constant uuid := '50000000-0000-0000-0000-000000000023'; -- Галбадрахийн

  -- Variables
  v_game_id uuid;
  v_sub_id uuid;
  v_revision_id uuid;
BEGIN
  -- Clear existing demo data (only for this competition, only games with revisions)
  DELETE FROM public.game_player_stats WHERE game_id IN (SELECT g.id FROM public.games g WHERE g.competition_id = v_comp_id AND g.current_revision_number IS NOT NULL);
  DELETE FROM public.game_team_stats WHERE game_id IN (SELECT g.id FROM public.games g WHERE g.competition_id = v_comp_id AND g.current_revision_number IS NOT NULL);
  DELETE FROM public.game_revisions WHERE game_id IN (SELECT g.id FROM public.games g WHERE g.competition_id = v_comp_id);
  DELETE FROM public.source_submissions WHERE game_id IN (SELECT g.id FROM public.games g WHERE g.competition_id = v_comp_id);
  DELETE FROM public.games WHERE competition_id = v_comp_id;

  -- =========================================================================
  -- 1. TODAY'S GAMES
  -- =========================================================================

  -- Game A: KHU vs APE — Just finished (league_verified)
  v_game_id := gen_random_uuid();
  INSERT INTO public.games (id, competition_id, ruleset_id, home_team_season_id, away_team_season_id,
    scheduled_at, venue_id, status, home_score, away_score, published_at, current_revision_number)
  VALUES (v_game_id, v_comp_id, v_ruleset_id, v_khu, v_ape,
    now() - interval '3 hours', v_venue_id, 'league_verified', 87, 76, now(), 1);

  v_sub_id := gen_random_uuid();
  INSERT INTO public.source_submissions (id, game_id, source_type, evidence_url, normalized_payload,
    confidence, submitted_by, status, reviewed_by, reviewed_at)
  VALUES (v_sub_id, v_game_id, 'manual_box_score', null, '{}'::jsonb,
    1.0, v_admin_id, 'approved', v_admin_id, now());

  v_revision_id := gen_random_uuid();
  INSERT INTO public.game_revisions (id, game_id, revision_number, source_submission_id,
    journal, projection, state, created_by, approved_by, approved_at)
  VALUES (v_revision_id, v_game_id, 1, v_sub_id,
    '{}'::jsonb,
    jsonb_build_object(
      'players', jsonb_build_array(
        jsonb_build_object('player_id', v_p1, 'team_season_id', v_khu, 'seconds_played', 960, 'pts', 22, 'fgm', 8, 'fga', 15, 'tpm', 3, 'tpa', 6, 'ftm', 3, 'fta', 4, 'oreb', 1, 'dreb', 4, 'ast', 6, 'stl', 2, 'blk', 0, 'tov', 2, 'pf', 2),
        jsonb_build_object('player_id', v_p2, 'team_season_id', v_khu, 'seconds_played', 840, 'pts', 18, 'fgm', 7, 'fga', 12, 'tpm', 0, 'tpa', 0, 'ftm', 4, 'fta', 6, 'oreb', 3, 'dreb', 7, 'ast', 2, 'stl', 0, 'blk', 1, 'tov', 1, 'pf', 3),
        jsonb_build_object('player_id', v_p3, 'team_season_id', v_khu, 'seconds_played', 720, 'pts', 15, 'fgm', 6, 'fga', 14, 'tpm', 2, 'tpa', 5, 'ftm', 1, 'fta', 2, 'oreb', 2, 'dreb', 3, 'ast', 3, 'stl', 1, 'blk', 0, 'tov', 3, 'pf', 2),
        jsonb_build_object('player_id', v_p4, 'team_season_id', v_khu, 'seconds_played', 600, 'pts', 12, 'fgm', 4, 'fga', 10, 'tpm', 2, 'tpa', 6, 'ftm', 2, 'fta', 2, 'oreb', 0, 'dreb', 2, 'ast', 4, 'stl', 1, 'blk', 0, 'tov', 2, 'pf', 1),
        jsonb_build_object('player_id', v_p5, 'team_season_id', v_khu, 'seconds_played', 540, 'pts', 20, 'fgm', 7, 'fga', 13, 'tpm', 1, 'tpa', 3, 'ftm', 5, 'fta', 6, 'oreb', 6, 'dreb', 8, 'ast', 1, 'stl', 2, 'blk', 1, 'tov', 1, 'pf', 4),
        jsonb_build_object('player_id', v_a1, 'team_season_id', v_ape, 'seconds_played', 900, 'pts', 25, 'fgm', 10, 'fga', 18, 'tpm', 3, 'tpa', 7, 'ftm', 2, 'fta', 2, 'oreb', 1, 'dreb', 3, 'ast', 5, 'stl', 1, 'blk', 0, 'tov', 3, 'pf', 3),
        jsonb_build_object('player_id', v_a2, 'team_season_id', v_ape, 'seconds_played', 780, 'pts', 14, 'fgm', 5, 'fga', 11, 'tpm', 2, 'tpa', 4, 'ftm', 2, 'fta', 4, 'oreb', 2, 'dreb', 5, 'ast', 2, 'stl', 0, 'blk', 1, 'tov', 2, 'pf', 2),
        jsonb_build_object('player_id', v_a3, 'team_season_id', v_ape, 'seconds_played', 660, 'pts', 16, 'fgm', 6, 'fga', 13, 'tpm', 1, 'tpa', 5, 'ftm', 3, 'fta', 4, 'oreb', 0, 'dreb', 2, 'ast', 3, 'stl', 1, 'blk', 0, 'tov', 4, 'pf', 3),
        jsonb_build_object('player_id', v_a4, 'team_season_id', v_ape, 'seconds_played', 540, 'pts', 8, 'fgm', 4, 'fga', 9, 'tpm', 0, 'tpa', 0, 'ftm', 0, 'fta', 0, 'oreb', 4, 'dreb', 6, 'ast', 1, 'stl', 0, 'blk', 2, 'tov', 1, 'pf', 4)
      ),
      'teams', jsonb_build_array(
        jsonb_build_object('team_season_id', v_khu, 'pts', 87, 'fgm', 32, 'fga', 68, 'tpm', 8, 'tpa', 25, 'ftm', 15, 'fta', 20, 'oreb', 12, 'dreb', 28, 'team_reb', 2, 'ast', 18, 'stl', 7, 'blk', 3, 'tov', 10, 'pf', 16),
        jsonb_build_object('team_season_id', v_ape, 'pts', 76, 'fgm', 29, 'fga', 65, 'tpm', 7, 'tpa', 22, 'ftm', 11, 'fta', 16, 'oreb', 10, 'dreb', 24, 'team_reb', 3, 'ast', 15, 'stl', 5, 'blk', 2, 'tov', 14, 'pf', 18)
      )
    ),
    'approved', v_admin_id, v_admin_id, now());

  INSERT INTO public.game_team_stats (game_id, team_season_id, revision_id, pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, team_reb, ast, stl, blk, tov, pf)
  VALUES (v_game_id, v_khu, v_revision_id, 87, 32, 68, 8, 25, 15, 20, 12, 28, 2, 18, 7, 3, 10, 16),
         (v_game_id, v_ape, v_revision_id, 76, 29, 65, 7, 22, 11, 16, 10, 24, 3, 15, 5, 2, 14, 18);

  INSERT INTO public.game_player_stats (game_id, player_id, team_season_id, revision_id, seconds_played, pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, ast, stl, blk, tov, pf)
  VALUES
    (v_game_id, v_p1, v_khu, v_revision_id, 960, 22, 8, 15, 3, 6, 4, 4, 1, 4, 6, 2, 0, 2, 2),
    (v_game_id, v_p2, v_khu, v_revision_id, 840, 18, 7, 12, 0, 0, 4, 6, 3, 7, 2, 0, 1, 1, 3),
    (v_game_id, v_p3, v_khu, v_revision_id, 720, 15, 6, 14, 2, 5, 1, 2, 2, 3, 3, 1, 0, 3, 2),
    (v_game_id, v_p4, v_khu, v_revision_id, 600, 12, 4, 10, 2, 6, 2, 2, 0, 2, 4, 1, 0, 2, 1),
    (v_game_id, v_p5, v_khu, v_revision_id, 540, 20, 7, 13, 1, 3, 5, 6, 6, 8, 1, 2, 1, 1, 4),
    (v_game_id, v_a1, v_ape, v_revision_id, 900, 25, 10, 18, 3, 7, 2, 2, 1, 3, 5, 1, 0, 3, 3),
    (v_game_id, v_a2, v_ape, v_revision_id, 780, 14, 5, 11, 2, 4, 2, 4, 2, 5, 2, 0, 1, 2, 2),
    (v_game_id, v_a3, v_ape, v_revision_id, 660, 16, 6, 13, 1, 5, 3, 4, 0, 2, 3, 1, 0, 4, 3),
    (v_game_id, v_a4, v_ape, v_revision_id, 540, 8, 4, 9, 0, 0, 0, 0, 4, 6, 1, 0, 2, 1, 4);

  -- Game B: BCH vs DAR — Live right now (live_provisional)
  INSERT INTO public.games (competition_id, ruleset_id, home_team_season_id, away_team_season_id,
    scheduled_at, venue_id, status, current_period, home_score, away_score)
  VALUES (v_comp_id, v_ruleset_id, v_bch, v_dar,
    now() - interval '90 minutes', v_venue_id, 'live_provisional', 3, 61, 54);

  -- Game C: MET vs ZAV — Tonight (scheduled)
  INSERT INTO public.games (competition_id, ruleset_id, home_team_season_id, away_team_season_id,
    scheduled_at, venue_id, status)
  VALUES (v_comp_id, v_ruleset_id, v_met, v_zav,
    now() + interval '4 hours', v_venue_id, 'scheduled');

  -- =========================================================================
  -- 2. RECENT GAMES (past 3 days)
  -- =========================================================================

  -- Game D: BCH vs SEL (yesterday)
  INSERT INTO public.games (id, competition_id, ruleset_id, home_team_season_id, away_team_season_id,
    scheduled_at, venue_id, status, home_score, away_score, published_at, current_revision_number)
  VALUES (gen_random_uuid(), v_comp_id, v_ruleset_id, v_bch, v_sel,
    now() - interval '1 day' - interval '2 hours', v_venue_id, 'league_verified', 92, 84, now(), 1);

  INSERT INTO public.source_submissions (id, game_id, source_type, evidence_url, normalized_payload,
    confidence, submitted_by, status, reviewed_by, reviewed_at)
  VALUES (gen_random_uuid(), (SELECT id FROM public.games WHERE home_team_season_id = v_bch AND away_team_season_id = v_sel AND status = 'league_verified'), 'manual_box_score', null, '{}'::jsonb, 1.0, v_admin_id, 'approved', v_admin_id, now());

  INSERT INTO public.game_revisions (id, game_id, revision_number, source_submission_id, journal, projection, state, created_by, approved_by, approved_at)
  SELECT gen_random_uuid(), g.id, 1, ss.id, '{}'::jsonb,
    jsonb_build_object('players', '[]'::jsonb, 'teams', jsonb_build_array(
      jsonb_build_object('team_season_id', v_bch, 'pts', 92, 'fgm', 35, 'fga', 72, 'tpm', 9, 'tpa', 28, 'ftm', 13, 'fta', 18, 'oreb', 11, 'dreb', 26, 'team_reb', 3, 'ast', 20, 'stl', 6, 'blk', 4, 'tov', 12, 'pf', 17),
      jsonb_build_object('team_season_id', v_sel, 'pts', 84, 'fgm', 31, 'fga', 70, 'tpm', 8, 'tpa', 24, 'ftm', 14, 'fta', 19, 'oreb', 13, 'dreb', 25, 'team_reb', 2, 'ast', 17, 'stl', 8, 'blk', 1, 'tov', 15, 'pf', 15)
    )),
    'approved', v_admin_id, v_admin_id, now()
  FROM public.games g, public.source_submissions ss
  WHERE g.home_team_season_id = v_bch AND g.away_team_season_id = v_sel AND g.status = 'league_verified'
    AND ss.game_id = g.id;

  INSERT INTO public.game_team_stats (game_id, team_season_id, revision_id, pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, team_reb, ast, stl, blk, tov, pf)
  SELECT g.id, v_bch, gr.id, 92, 35, 72, 9, 28, 13, 18, 11, 26, 3, 20, 6, 4, 12, 17
  FROM public.games g, public.game_revisions gr
  WHERE g.home_team_season_id = v_bch AND g.away_team_season_id = v_sel AND g.status = 'league_verified'
    AND gr.game_id = g.id AND gr.state = 'approved';
  INSERT INTO public.game_team_stats (game_id, team_season_id, revision_id, pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, team_reb, ast, stl, blk, tov, pf)
  SELECT g.id, v_sel, gr.id, 84, 31, 70, 8, 24, 14, 19, 13, 25, 2, 17, 8, 1, 15, 15
  FROM public.games g, public.game_revisions gr
  WHERE g.home_team_season_id = v_bch AND g.away_team_season_id = v_sel AND g.status = 'league_verified'
    AND gr.game_id = g.id AND gr.state = 'approved';

  -- Game E: MIN vs KHO (yesterday)
  INSERT INTO public.games (id, competition_id, ruleset_id, home_team_season_id, away_team_season_id,
    scheduled_at, venue_id, status, home_score, away_score, published_at, current_revision_number)
  VALUES (gen_random_uuid(), v_comp_id, v_ruleset_id, v_min, v_kho,
    now() - interval '1 day', v_venue_id, 'league_verified', 78, 71, now(), 1);

  INSERT INTO public.source_submissions (id, game_id, source_type, evidence_url, normalized_payload,
    confidence, submitted_by, status, reviewed_by, reviewed_at)
  SELECT gen_random_uuid(), g.id, 'manual_box_score', null, '{}'::jsonb, 1.0, v_admin_id, 'approved', v_admin_id, now()
  FROM public.games g WHERE g.home_team_season_id = v_min AND g.away_team_season_id = v_kho AND g.status = 'league_verified';

  INSERT INTO public.game_revisions (id, game_id, revision_number, source_submission_id, journal, projection, state, created_by, approved_by, approved_at)
  SELECT gen_random_uuid(), g.id, 1, ss.id, '{}'::jsonb,
    jsonb_build_object('players', '[]'::jsonb, 'teams', jsonb_build_array(
      jsonb_build_object('team_season_id', v_min, 'pts', 78, 'fgm', 30, 'fga', 65, 'tpm', 6, 'tpa', 20, 'ftm', 12, 'fta', 16, 'oreb', 13, 'dreb', 27, 'team_reb', 2, 'ast', 16, 'stl', 5, 'blk', 5, 'tov', 14, 'pf', 20),
      jsonb_build_object('team_season_id', v_kho, 'pts', 71, 'fgm', 27, 'fga', 62, 'tpm', 5, 'tpa', 18, 'ftm', 12, 'fta', 17, 'oreb', 9, 'dreb', 22, 'team_reb', 1, 'ast', 14, 'stl', 8, 'blk', 2, 'tov', 16, 'pf', 18)
    )),
    'approved', v_admin_id, v_admin_id, now()
  FROM public.games g, public.source_submissions ss
  WHERE g.home_team_season_id = v_min AND g.away_team_season_id = v_kho AND g.status = 'league_verified'
    AND ss.game_id = g.id;

  INSERT INTO public.game_team_stats (game_id, team_season_id, revision_id, pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, team_reb, ast, stl, blk, tov, pf)
  SELECT g.id, v_min, gr.id, 78, 30, 65, 6, 20, 12, 16, 13, 27, 2, 16, 5, 5, 14, 20
  FROM public.games g, public.game_revisions gr
  WHERE g.home_team_season_id = v_min AND g.away_team_season_id = v_kho AND g.status = 'league_verified'
    AND gr.game_id = g.id AND gr.state = 'approved';
  INSERT INTO public.game_team_stats (game_id, team_season_id, revision_id, pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, team_reb, ast, stl, blk, tov, pf)
  SELECT g.id, v_kho, gr.id, 71, 27, 62, 5, 18, 12, 17, 9, 22, 1, 14, 8, 2, 16, 18
  FROM public.games g, public.game_revisions gr
  WHERE g.home_team_season_id = v_min AND g.away_team_season_id = v_kho AND g.status = 'league_verified'
    AND gr.game_id = g.id AND gr.state = 'approved';

  -- Game F: DAR vs ZAV (2 days ago)
  INSERT INTO public.games (id, competition_id, ruleset_id, home_team_season_id, away_team_season_id,
    scheduled_at, venue_id, status, home_score, away_score, published_at, current_revision_number)
  VALUES (gen_random_uuid(), v_comp_id, v_ruleset_id, v_dar, v_zav,
    now() - interval '2 days', v_venue_id, 'league_verified', 95, 68, now(), 1);

  INSERT INTO public.source_submissions (id, game_id, source_type, evidence_url, normalized_payload,
    confidence, submitted_by, status, reviewed_by, reviewed_at)
  SELECT gen_random_uuid(), g.id, 'manual_box_score', null, '{}'::jsonb, 1.0, v_admin_id, 'approved', v_admin_id, now()
  FROM public.games g WHERE g.home_team_season_id = v_dar AND g.away_team_season_id = v_zav AND g.status = 'league_verified';

  INSERT INTO public.game_revisions (id, game_id, revision_number, source_submission_id, journal, projection, state, created_by, approved_by, approved_at)
  SELECT gen_random_uuid(), g.id, 1, ss.id, '{}'::jsonb,
    jsonb_build_object('players', '[]'::jsonb, 'teams', jsonb_build_array(
      jsonb_build_object('team_season_id', v_dar, 'pts', 95, 'fgm', 37, 'fga', 74, 'tpm', 11, 'tpa', 30, 'ftm', 10, 'fta', 14, 'oreb', 14, 'dreb', 30, 'team_reb', 2, 'ast', 24, 'stl', 9, 'blk', 3, 'tov', 8, 'pf', 15),
      jsonb_build_object('team_season_id', v_zav, 'pts', 68, 'fgm', 25, 'fga', 60, 'tpm', 6, 'tpa', 22, 'ftm', 12, 'fta', 18, 'oreb', 7, 'dreb', 20, 'team_reb', 1, 'ast', 13, 'stl', 4, 'blk', 1, 'tov', 18, 'pf', 19)
    )),
    'approved', v_admin_id, v_admin_id, now()
  FROM public.games g, public.source_submissions ss
  WHERE g.home_team_season_id = v_dar AND g.away_team_season_id = v_zav AND g.status = 'league_verified'
    AND ss.game_id = g.id;

  INSERT INTO public.game_team_stats (game_id, team_season_id, revision_id, pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, team_reb, ast, stl, blk, tov, pf)
  SELECT g.id, v_dar, gr.id, 95, 37, 74, 11, 30, 10, 14, 14, 30, 2, 24, 9, 3, 8, 15
  FROM public.games g, public.game_revisions gr
  WHERE g.home_team_season_id = v_dar AND g.away_team_season_id = v_zav AND g.status = 'league_verified'
    AND gr.game_id = g.id AND gr.state = 'approved';
  INSERT INTO public.game_team_stats (game_id, team_season_id, revision_id, pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, team_reb, ast, stl, blk, tov, pf)
  SELECT g.id, v_zav, gr.id, 68, 25, 60, 6, 22, 12, 18, 7, 20, 1, 13, 4, 1, 18, 19
  FROM public.games g, public.game_revisions gr
  WHERE g.home_team_season_id = v_dar AND g.away_team_season_id = v_zav AND g.status = 'league_verified'
    AND gr.game_id = g.id AND gr.state = 'approved';

  -- Game G: MON vs MET (2 days ago)
  INSERT INTO public.games (id, competition_id, ruleset_id, home_team_season_id, away_team_season_id,
    scheduled_at, venue_id, status, home_score, away_score, published_at, current_revision_number)
  VALUES (gen_random_uuid(), v_comp_id, v_ruleset_id, v_mon, v_met,
    now() - interval '2 days' - interval '2 hours', v_venue_id, 'league_verified', 81, 85, now(), 1);

  INSERT INTO public.source_submissions (id, game_id, source_type, evidence_url, normalized_payload,
    confidence, submitted_by, status, reviewed_by, reviewed_at)
  SELECT gen_random_uuid(), g.id, 'manual_box_score', null, '{}'::jsonb, 1.0, v_admin_id, 'approved', v_admin_id, now()
  FROM public.games g WHERE g.home_team_season_id = v_mon AND g.away_team_season_id = v_met AND g.status = 'league_verified';

  INSERT INTO public.game_revisions (id, game_id, revision_number, source_submission_id, journal, projection, state, created_by, approved_by, approved_at)
  SELECT gen_random_uuid(), g.id, 1, ss.id, '{}'::jsonb,
    jsonb_build_object('players', '[]'::jsonb, 'teams', jsonb_build_array(
      jsonb_build_object('team_season_id', v_mon, 'pts', 81, 'fgm', 30, 'fga', 66, 'tpm', 7, 'tpa', 22, 'ftm', 14, 'fta', 18, 'oreb', 10, 'dreb', 24, 'team_reb', 3, 'ast', 17, 'stl', 6, 'blk', 2, 'tov', 13, 'pf', 19),
      jsonb_build_object('team_season_id', v_met, 'pts', 85, 'fgm', 33, 'fga', 69, 'tpm', 9, 'tpa', 26, 'ftm', 10, 'fta', 14, 'oreb', 12, 'dreb', 27, 'team_reb', 2, 'ast', 19, 'stl', 7, 'blk', 4, 'tov', 11, 'pf', 16)
    )),
    'approved', v_admin_id, v_admin_id, now()
  FROM public.games g, public.source_submissions ss
  WHERE g.home_team_season_id = v_mon AND g.away_team_season_id = v_met AND g.status = 'league_verified'
    AND ss.game_id = g.id;

  INSERT INTO public.game_team_stats (game_id, team_season_id, revision_id, pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, team_reb, ast, stl, blk, tov, pf)
  SELECT g.id, v_mon, gr.id, 81, 30, 66, 7, 22, 14, 18, 10, 24, 3, 17, 6, 2, 13, 19
  FROM public.games g, public.game_revisions gr
  WHERE g.home_team_season_id = v_mon AND g.away_team_season_id = v_met AND g.status = 'league_verified'
    AND gr.game_id = g.id AND gr.state = 'approved';
  INSERT INTO public.game_team_stats (game_id, team_season_id, revision_id, pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, team_reb, ast, stl, blk, tov, pf)
  SELECT g.id, v_met, gr.id, 85, 33, 69, 9, 26, 10, 14, 12, 27, 2, 19, 7, 4, 11, 16
  FROM public.games g, public.game_revisions gr
  WHERE g.home_team_season_id = v_mon AND g.away_team_season_id = v_met AND g.status = 'league_verified'
    AND gr.game_id = g.id AND gr.state = 'approved';

  -- Game H: KHU vs BCH (3 days ago — KHU loses)
  INSERT INTO public.games (id, competition_id, ruleset_id, home_team_season_id, away_team_season_id,
    scheduled_at, venue_id, status, home_score, away_score, published_at, current_revision_number)
  VALUES (gen_random_uuid(), v_comp_id, v_ruleset_id, v_khu, v_bch,
    now() - interval '3 days', v_venue_id, 'official', 74, 80, now(), 1);

  INSERT INTO public.source_submissions (id, game_id, source_type, evidence_url, normalized_payload,
    confidence, submitted_by, status, reviewed_by, reviewed_at)
  SELECT gen_random_uuid(), g.id, 'manual_box_score', null, '{}'::jsonb, 1.0, v_admin_id, 'approved', v_admin_id, now()
  FROM public.games g WHERE g.home_team_season_id = v_khu AND g.away_team_season_id = v_bch AND g.status = 'official';

  INSERT INTO public.game_revisions (id, game_id, revision_number, source_submission_id, journal, projection, state, created_by, approved_by, approved_at)
  SELECT gen_random_uuid(), g.id, 1, ss.id, '{}'::jsonb,
    jsonb_build_object('players', '[]'::jsonb, 'teams', jsonb_build_array(
      jsonb_build_object('team_season_id', v_khu, 'pts', 74, 'fgm', 28, 'fga', 63, 'tpm', 6, 'tpa', 21, 'ftm', 12, 'fta', 16, 'oreb', 9, 'dreb', 23, 'team_reb', 2, 'ast', 15, 'stl', 5, 'blk', 3, 'tov', 16, 'pf', 21),
      jsonb_build_object('team_season_id', v_bch, 'pts', 80, 'fgm', 31, 'fga', 67, 'tpm', 8, 'tpa', 24, 'ftm', 10, 'fta', 14, 'oreb', 11, 'dreb', 26, 'team_reb', 1, 'ast', 18, 'stl', 7, 'blk', 2, 'tov', 12, 'pf', 17)
    )),
    'approved', v_admin_id, v_admin_id, now()
  FROM public.games g, public.source_submissions ss
  WHERE g.home_team_season_id = v_khu AND g.away_team_season_id = v_bch AND g.status = 'official'
    AND ss.game_id = g.id;

  INSERT INTO public.game_team_stats (game_id, team_season_id, revision_id, pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, team_reb, ast, stl, blk, tov, pf)
  SELECT g.id, v_khu, gr.id, 74, 28, 63, 6, 21, 12, 16, 9, 23, 2, 15, 5, 3, 16, 21
  FROM public.games g, public.game_revisions gr
  WHERE g.home_team_season_id = v_khu AND g.away_team_season_id = v_bch AND g.status = 'official'
    AND gr.game_id = g.id AND gr.state = 'approved';
  INSERT INTO public.game_team_stats (game_id, team_season_id, revision_id, pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, team_reb, ast, stl, blk, tov, pf)
  SELECT g.id, v_bch, gr.id, 80, 31, 67, 8, 24, 10, 14, 11, 26, 1, 18, 7, 2, 12, 17
  FROM public.games g, public.game_revisions gr
  WHERE g.home_team_season_id = v_khu AND g.away_team_season_id = v_bch AND g.status = 'official'
    AND gr.game_id = g.id AND gr.state = 'approved';

  -- =========================================================================
  -- 3. UPCOMING GAMES (next 3 days)
  -- =========================================================================
  INSERT INTO public.games (competition_id, ruleset_id, home_team_season_id, away_team_season_id, scheduled_at, venue_id, status)
  VALUES
    (v_comp_id, v_ruleset_id, v_ape, v_sel, now() + interval '1 day' + interval '18 hours', v_venue_id, 'scheduled'),
    (v_comp_id, v_ruleset_id, v_kho, v_dar, now() + interval '2 days' + interval '18 hours', v_venue_id, 'scheduled'),
    (v_comp_id, v_ruleset_id, v_zav, v_mon, now() + interval '3 days' + interval '18 hours', v_venue_id, 'scheduled'),
    (v_comp_id, v_ruleset_id, v_min, v_bch, now() + interval '3 days' + interval '20 hours', v_venue_id, 'scheduled');

  -- =========================================================================
  -- 4. STANDINGS & SEASON PLAYER STATS
  -- =========================================================================
  DELETE FROM public.standings WHERE competition_id = v_comp_id;
  DELETE FROM public.season_player_stats WHERE competition_id = v_comp_id;

  PERFORM public.refresh_standings(v_comp_id);
  -- Note: season_player_stats requires cmd_approve_revision to rebuild;
  -- refresh_season_player_stats handles it
  PERFORM public.refresh_season_player_stats(v_comp_id);

END $$;

-- =========================================================================
-- 5. TOURNAMENTS — Add a playoff competition with bracket structure
-- =========================================================================
INSERT INTO public.competitions (id, season_id, name, type)
VALUES ('e0000000-0000-0000-0000-000000000010',
        'd0000000-0000-0000-0000-000000000001',
        '2025–26 Плэйофф', 'playoff')
ON CONFLICT (id) DO NOTHING;

-- Tournament bracket — semifinal and final games
DO $$
DECLARE
  v_comp_id constant uuid := 'e0000000-0000-0000-0000-000000000010';
  v_ruleset_id constant uuid := '90000000-0000-0000-0000-000000000001';
  v_venue_id constant uuid := 'f0000000-0000-0000-0000-000000000001';
  v_admin_id constant uuid := '397692e0-915f-4361-9f75-f84d0883ba80';
  v_khu constant uuid := '30000000-0000-0000-0000-000000000001';
  v_bch constant uuid := '30000000-0000-0000-0000-000000000003';
  v_dar constant uuid := '30000000-0000-0000-0000-000000000007';
  v_min constant uuid := '30000000-0000-0000-0000-000000000005';
  v_game_id uuid; v_sub_id uuid; v_rev_id uuid;
BEGIN
  -- Semifinal 1: KHU vs BCH (KHU wins 91-85)
  INSERT INTO public.games (id, competition_id, ruleset_id, home_team_season_id, away_team_season_id,
    scheduled_at, venue_id, status, home_score, away_score, published_at, current_revision_number)
  VALUES (gen_random_uuid(), v_comp_id, v_ruleset_id, v_khu, v_bch,
    now() - interval '5 days', v_venue_id, 'league_verified', 91, 85, now(), 1)
  RETURNING id INTO v_game_id;

  INSERT INTO public.source_submissions (id, game_id, source_type, evidence_url, normalized_payload, confidence, submitted_by, status, reviewed_by, reviewed_at)
  VALUES (gen_random_uuid(), v_game_id, 'manual_box_score', null, '{}'::jsonb, 1.0, v_admin_id, 'approved', v_admin_id, now())
  RETURNING id INTO v_sub_id;

  INSERT INTO public.game_revisions (id, game_id, revision_number, source_submission_id, journal, projection, state, created_by, approved_by, approved_at)
  VALUES (gen_random_uuid(), v_game_id, 1, v_sub_id, '{}'::jsonb,
    jsonb_build_object('players', '[]'::jsonb, 'teams', jsonb_build_array(
      jsonb_build_object('team_season_id', v_khu, 'pts', 91, 'fgm', 34, 'fga', 70, 'tpm', 10, 'tpa', 28, 'ftm', 13, 'fta', 17, 'oreb', 10, 'dreb', 25, 'team_reb', 2, 'ast', 21, 'stl', 6, 'blk', 2, 'tov', 11, 'pf', 18),
      jsonb_build_object('team_season_id', v_bch, 'pts', 85, 'fgm', 32, 'fga', 68, 'tpm', 8, 'tpa', 25, 'ftm', 13, 'fta', 18, 'oreb', 12, 'dreb', 23, 'team_reb', 1, 'ast', 17, 'stl', 5, 'blk', 3, 'tov', 14, 'pf', 20)
    )),
    'approved', v_admin_id, v_admin_id, now())
  RETURNING id INTO v_rev_id;

  INSERT INTO public.game_team_stats (game_id, team_season_id, revision_id, pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, team_reb, ast, stl, blk, tov, pf)
  VALUES (v_game_id, v_khu, v_rev_id, 91, 34, 70, 10, 28, 13, 17, 10, 25, 2, 21, 6, 2, 11, 18),
         (v_game_id, v_bch, v_rev_id, 85, 32, 68, 8, 25, 13, 18, 12, 23, 1, 17, 5, 3, 14, 20);

  -- Semifinal 2: DAR vs MIN (DAR wins 88-70)
  INSERT INTO public.games (id, competition_id, ruleset_id, home_team_season_id, away_team_season_id,
    scheduled_at, venue_id, status, home_score, away_score, published_at, current_revision_number)
  VALUES (gen_random_uuid(), v_comp_id, v_ruleset_id, v_dar, v_min,
    now() - interval '4 days', v_venue_id, 'league_verified', 88, 70, now(), 1)
  RETURNING id INTO v_game_id;

  INSERT INTO public.source_submissions (id, game_id, source_type, evidence_url, normalized_payload, confidence, submitted_by, status, reviewed_by, reviewed_at)
  VALUES (gen_random_uuid(), v_game_id, 'manual_box_score', null, '{}'::jsonb, 1.0, v_admin_id, 'approved', v_admin_id, now())
  RETURNING id INTO v_sub_id;

  INSERT INTO public.game_revisions (id, game_id, revision_number, source_submission_id, journal, projection, state, created_by, approved_by, approved_at)
  VALUES (gen_random_uuid(), v_game_id, 1, v_sub_id, '{}'::jsonb,
    jsonb_build_object('players', '[]'::jsonb, 'teams', jsonb_build_array(
      jsonb_build_object('team_season_id', v_dar, 'pts', 88, 'fgm', 33, 'fga', 69, 'tpm', 10, 'tpa', 27, 'ftm', 12, 'fta', 16, 'oreb', 11, 'dreb', 28, 'team_reb', 1, 'ast', 20, 'stl', 7, 'blk', 3, 'tov', 9, 'pf', 16),
      jsonb_build_object('team_season_id', v_min, 'pts', 70, 'fgm', 26, 'fga', 61, 'tpm', 6, 'tpa', 21, 'ftm', 12, 'fta', 17, 'oreb', 8, 'dreb', 20, 'team_reb', 2, 'ast', 13, 'stl', 4, 'blk', 1, 'tov', 17, 'pf', 21)
    )),
    'approved', v_admin_id, v_admin_id, now())
  RETURNING id INTO v_rev_id;

  INSERT INTO public.game_team_stats (game_id, team_season_id, revision_id, pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, team_reb, ast, stl, blk, tov, pf)
  VALUES (v_game_id, v_dar, v_rev_id, 88, 33, 69, 10, 27, 12, 16, 11, 28, 1, 20, 7, 3, 9, 16),
         (v_game_id, v_min, v_rev_id, 70, 26, 61, 6, 21, 12, 17, 8, 20, 2, 13, 4, 1, 17, 21);

  -- Final: KHU vs DAR (KHU wins championship 85-79)
  INSERT INTO public.games (id, competition_id, ruleset_id, home_team_season_id, away_team_season_id,
    scheduled_at, venue_id, status, home_score, away_score, published_at, current_revision_number)
  VALUES (gen_random_uuid(), v_comp_id, v_ruleset_id, v_khu, v_dar,
    now() - interval '3 days', v_venue_id, 'official', 85, 79, now(), 1)
  RETURNING id INTO v_game_id;

  INSERT INTO public.source_submissions (id, game_id, source_type, evidence_url, normalized_payload, confidence, submitted_by, status, reviewed_by, reviewed_at)
  VALUES (gen_random_uuid(), v_game_id, 'manual_box_score', null, '{}'::jsonb, 1.0, v_admin_id, 'approved', v_admin_id, now())
  RETURNING id INTO v_sub_id;

  INSERT INTO public.game_revisions (id, game_id, revision_number, source_submission_id, journal, projection, state, created_by, approved_by, approved_at)
  VALUES (gen_random_uuid(), v_game_id, 1, v_sub_id, '{}'::jsonb,
    jsonb_build_object('players', '[]'::jsonb, 'teams', jsonb_build_array(
      jsonb_build_object('team_season_id', v_khu, 'pts', 85, 'fgm', 32, 'fga', 68, 'tpm', 9, 'tpa', 26, 'ftm', 12, 'fta', 15, 'oreb', 9, 'dreb', 26, 'team_reb', 1, 'ast', 19, 'stl', 8, 'blk', 2, 'tov', 10, 'pf', 17),
      jsonb_build_object('team_season_id', v_dar, 'pts', 79, 'fgm', 30, 'fga', 65, 'tpm', 8, 'tpa', 24, 'ftm', 11, 'fta', 15, 'oreb', 10, 'dreb', 24, 'team_reb', 2, 'ast', 16, 'stl', 5, 'blk', 4, 'tov', 14, 'pf', 20)
    )),
    'approved', v_admin_id, v_admin_id, now())
  RETURNING id INTO v_rev_id;

  INSERT INTO public.game_team_stats (game_id, team_season_id, revision_id, pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, team_reb, ast, stl, blk, tov, pf)
  VALUES (v_game_id, v_khu, v_rev_id, 85, 32, 68, 9, 26, 12, 15, 9, 26, 1, 19, 8, 2, 10, 17),
         (v_game_id, v_dar, v_rev_id, 79, 30, 65, 8, 24, 11, 15, 10, 24, 2, 16, 5, 4, 14, 20);

  -- Also rebuild standings for playoff comp
  DELETE FROM public.standings WHERE competition_id = v_comp_id;
  PERFORM public.refresh_standings(v_comp_id);
END $$;

-- =========================================================================
-- 6. AWARDS — Player awards for the season
-- =========================================================================

-- Ensure admin has a profile (awards.granted_by FK)
INSERT INTO public.profiles (id, display_name)
VALUES ('397692e0-915f-4361-9f75-f84d0883ba80', 'Админ')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.awards (competition_id, award_type, player_id, granted_by, granted_at, note)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'mvp', '50000000-0000-0000-0000-000000000001', '397692e0-915f-4361-9f75-f84d0883ba80', now() - interval '7 days', '2025-26 оны MVP'),
  ('e0000000-0000-0000-0000-000000000001', 'mvp', '50000000-0000-0000-0000-000000000020', '397692e0-915f-4361-9f75-f84d0883ba80', now() - interval '7 days', 'Плэйоффын MVP'),
  ('e0000000-0000-0000-0000-000000000001', 'top_scorer', '50000000-0000-0000-0000-000000000020', '397692e0-915f-4361-9f75-f84d0883ba80', now() - interval '7 days', '2025-26 оны шилдэг довтлогч'),
  ('e0000000-0000-0000-0000-000000000001', 'player_of_week', '50000000-0000-0000-0000-000000000001', '397692e0-915f-4361-9f75-f84d0883ba80', now() - interval '7 days', '7 дугаар сарын 3 дахь долоо хоногийн шилдэг'),
  ('e0000000-0000-0000-0000-000000000001', 'player_of_week', '50000000-0000-0000-0000-000000000005', '397692e0-915f-4361-9f75-f84d0883ba80', now() - interval '7 days', '7 дугаар сарын 2 дахь долоо хоногийн шилдэг')
ON CONFLICT DO NOTHING;
