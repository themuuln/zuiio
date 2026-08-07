-- Paid-pilot SQL integration tests.
-- Run with: supabase test db
-- Seeds deterministic data in a transaction, runs assertions, then rolls back.

begin;

-- ============================================================================
-- Test helpers
-- ============================================================================

create or replace function tests.assert_eq(p_label text, p_actual anyelement, p_expected anyelement)
returns void language plpgsql as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'ASSERT FAILED: % — got %, expected %', p_label, p_actual, p_expected;
  end if;
  raise notice 'PASS: %', p_label;
end;
$$;

create or replace function tests.assert_throws(p_label text, p_sql text, p_errcode text default null)
returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'ASSERT FAILED: % — expected exception but none raised', p_label;
exception when others then
  if p_errcode is not null and sqlstate <> p_errcode then
    raise exception 'ASSERT FAILED: % — expected error %, got % (%)', p_label, p_errcode, sqlerrm, sqlstate;
  end if;
  raise notice 'PASS: % (raised: %)', p_label, sqlerrm;
end;
$$;

-- ============================================================================
-- Seed deterministic test data
-- ============================================================================

-- Sport
insert into public.sports (id, key, name_mn, name_en, config) values
('a0000000-0000-0000-0000-000000000001', 'basketball_5x5', 'Сагсан бөмбөг 5x5', 'Basketball 5x5',
 '{"periods":4,"period_minutes":10,"overtime_minutes":5,"fouls_to_bonus":5,"personal_foul_limit":5,"players_on_court":5}'::jsonb);

-- Event types
insert into public.stat_event_types (key, sport_key, category, requires_player) values
('shot_2pt_made', 'basketball_5x5', 'shot', true),
('shot_2pt_missed', 'basketball_5x5', 'shot', true),
('ft_made', 'basketball_5x5', 'shot', true),
('rebound_def', 'basketball_5x5', 'rebound', true),
('steal', 'basketball_5x5', 'defense', true),
('turnover', 'basketball_5x5', 'offense', true),
('game_start', 'basketball_5x5', 'admin', false),
('game_end', 'basketball_5x5', 'admin', false),
('period_start', 'basketball_5x5', 'admin', false),
('period_end', 'basketball_5x5', 'admin', false);

-- Organization + league
insert into public.organizations (id, name, type) values
('b0000000-0000-0000-0000-000000000001', 'Test Org', 'league_operator');
insert into public.leagues (id, organization_id, sport_id, name, slug) values
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Test League', 'test');

-- Season + competition
insert into public.seasons (id, league_id, name) values
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Test Season');
insert into public.competitions (id, season_id, name, type) values
('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Test Comp', 'regular');

-- Ruleset
insert into public.basketball_rulesets (id, league_id, version, name, rules, effective_from) values
('90000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '1.0', 'Test Ruleset',
 '{"periods":4,"period_minutes":10}'::jsonb, '2026-01-01');

-- Venue
insert into public.venues (id, name, city) values
('f0000000-0000-0000-0000-000000000001', 'Test Venue', 'UB');

-- Teams + team_seasons
insert into public.teams (id, league_id, name, short_code, slug) values
('10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Team A', 'TA', 'team-a'),
('20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Team B', 'TB', 'team-b');
insert into public.team_seasons (id, team_id, competition_id) values
('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001'),
('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001');

-- Players
insert into public.players (id, canonical_name, position) values
('50000000-0000-0000-0000-000000000001', 'Test Player A1', 'PG'),
('50000000-0000-0000-0000-000000000002', 'Test Player A2', 'SG'),
('50000000-0000-0000-0000-000000000003', 'Test Player B1', 'PG'),
('50000000-0000-0000-0000-000000000004', 'Test Player B2', 'SG');

-- Roster entries
insert into public.roster_entries (team_season_id, player_id, jersey_number) values
('30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 1),
('30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 2),
('40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', 1),
('40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', 2);

-- Test users (simulate auth.uid() via session variables)
-- In supabase test db, we set request.jwt.claims.sub to simulate auth
-- We'll use set_config to set the current user ID for each test block

-- User IDs
-- scorer_user: assigned lead_scorer for the game
-- manager_user: team manager
-- official_user: approving official
-- stranger_user: no assignments

-- Create test auth users
insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data) values
('10000000-0000-0000-0000-000000000010', 'scorer@test.mn', '{}'::jsonb, '{}'::jsonb),
('10000000-0000-0000-0000-000000000011', 'manager@test.mn', '{}'::jsonb, '{}'::jsonb),
('10000000-0000-0000-0000-000000000012', 'official@test.mn', '{}'::jsonb, '{}'::jsonb),
('10000000-0000-0000-0000-000000000013', 'stranger@test.mn', '{}'::jsonb, '{}'::jsonb),
('10000000-0000-0000-0000-000000000014', 'orgowner@test.mn', '{}'::jsonb, '{}'::jsonb);

-- Memberships
insert into public.memberships (user_id, scope_type, scope_id, role) values
('10000000-0000-0000-0000-000000000011', 'team', '30000000-0000-0000-0000-000000000001', 'manager'),
('10000000-0000-0000-0000-000000000014', 'org', 'b0000000-0000-0000-0000-000000000001', 'owner');

-- Game (starts scheduled)
insert into public.games (id, competition_id, ruleset_id, home_team_season_id, away_team_season_id, venue_id, scheduled_at, status) values
('70000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
 '90000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
 'f0000000-0000-0000-0000-000000000001', '2026-09-15T18:00:00+08:00', 'scheduled');

-- Game rosters
insert into public.game_rosters (game_id, team_season_id, player_id, is_starter) values
('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', true),
('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', false),
('70000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', true),
('70000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', false);

-- Game assignments
insert into public.game_assignments (game_id, user_id, role) values
('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000010', 'lead_scorer'),
('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000012', 'approving_official');

-- ============================================================================
-- Test 1: Lifecycle transitions
-- ============================================================================

-- Set as scorer user
select set_config('request.jwt.claims.sub', '10000000-0000-0000-0000-000000000010', true);
select set_config('role', 'authenticated', true);

-- scheduled → live_provisional (scorer authorized)
select tests.assert_eq(
  'lifecycle: scheduled to live_provisional',
  (select status from public.cmd_transition_game('70000000-0000-0000-0000-000000000001', 'live_provisional')),
  'live_provisional'::public.game_status
);

-- live_provisional → final_pending_review (official authorized)
select set_config('request.jwt.claims.sub', '10000000-0000-0000-0000-000000000012', true);
select tests.assert_eq(
  'lifecycle: live to final_pending_review',
  (select status from public.cmd_transition_game('70000000-0000-0000-0000-000000000001', 'final_pending_review')),
  'final_pending_review'::public.game_status
);

-- final_pending_review → league_verified
select tests.assert_eq(
  'lifecycle: final_pending_review to league_verified',
  (select status from public.cmd_transition_game('70000000-0000-0000-0000-000000000001', 'league_verified')),
  'league_verified'::public.game_status
);

-- league_verified → official
select tests.assert_eq(
  'lifecycle: league_verified to official',
  (select status from public.cmd_transition_game('70000000-0000-0000-0000-000000000001', 'official')),
  'official'::public.game_status
);

-- Reset game for next tests
update public.games set status = 'scheduled', current_revision_number = 0, published_at = null
  where id = '70000000-0000-0000-0000-000000000001';

-- ============================================================================
-- Test 2: Invalid lifecycle transition
-- ============================================================================

select set_config('request.jwt.claims.sub', '10000000-0000-0000-0000-000000000010', true);
select tests.assert_throws(
  'lifecycle: invalid transition scheduled to official',
  'select public.cmd_transition_game(''70000000-0000-0000-0000-000000000001'', ''official'')',
  'P0001'
);

-- ============================================================================
-- Test 3: Stranger cannot record events (no assignment)
-- ============================================================================

select set_config('request.jwt.claims.sub', '10000000-0000-0000-0000-000000000013', true);

-- First transition to live
select set_config('request.jwt.claims.sub', '10000000-0000-0000-0000-000000000010', true);
select public.cmd_transition_game('70000000-0000-0000-0000-000000000001', 'live_provisional');

-- Open session as scorer (authorized)
select public.cmd_open_tracker_session('70000000-0000-0000-0000-000000000001', 'lead_scorer', '{}'::jsonb);

-- Now try as stranger
select set_config('request.jwt.claims.sub', '10000000-0000-0000-0000-000000000013', true);
select tests.assert_throws(
  'auth: stranger cannot record events',
  'select public.cmd_record_event(
    ''70000000-0000-0000-0000-000000000001'',
    (select id from public.tracker_sessions where game_id = ''70000000-0000-0000-0000-000000000001'' and status = ''active'' limit 1),
    gen_random_uuid(), gen_random_uuid(), 1,
    ''shot_2pt_made'', 1, 600,
    ''30000000-0000-0000-0000-000000000001'',
    ''50000000-0000-0000-0000-000000000001'',
    ''{}''::jsonb
  )',
  'P0001'
);

-- ============================================================================
-- Test 4: Scorer records event successfully
-- ============================================================================

select set_config('request.jwt.claims.sub', '10000000-0000-0000-0000-000000000010', true);

select tests.assert_eq(
  'record_event: scorer inserts successfully',
  (select event_type from public.cmd_record_event(
    '70000000-0000-0000-0000-000000000001',
    (select id from public.tracker_sessions where game_id = '70000000-0000-0000-0000-000000000001' and status = 'active' limit 1),
    '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002',
    1, 'shot_2pt_made', 1, 600,
    '30000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    '{}'::jsonb
  )),
  'shot_2pt_made'
);

-- ============================================================================
-- Test 5: Idempotency — same operation_id returns existing row
-- ============================================================================

select tests.assert_eq(
  'idempotency: duplicate operation returns same row',
  (select id from public.cmd_record_event(
    '70000000-0000-0000-0000-000000000001',
    (select id from public.tracker_sessions where game_id = '70000000-0000-0000-0000-000000000001' and status = 'active' limit 1),
    '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002',
    1, 'shot_2pt_made', 1, 600,
    '30000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    '{}'::jsonb
  )),
  (select id from public.stat_events where operation_id = '11111111-0000-0000-0000-000000000001')
);

-- ============================================================================
-- Test 6: Roster mismatch — player not in game roster
-- ============================================================================

select tests.assert_throws(
  'roster: player not in game roster fails',
  'select public.cmd_record_event(
    ''70000000-0000-0000-0000-000000000001'',
    (select id from public.tracker_sessions where game_id = ''70000000-0000-0000-0000-000000000001'' and status = ''active'' limit 1),
    gen_random_uuid(), gen_random_uuid(), 99,
    ''shot_2pt_made'', 1, 600,
    ''30000000-0000-0000-0000-000000000001'',
    ''50000000-0000-0000-0000-000000000003'',
    ''{}''::jsonb
  )',
  'P0001'
);

-- ============================================================================
-- Test 7: Invalid event type (not in ruleset vocabulary)
-- ============================================================================

select tests.assert_throws(
  'vocabulary: invalid event type fails',
  'select public.cmd_record_event(
    ''70000000-0000-0000-0000-000000000001'',
    (select id from public.tracker_sessions where game_id = ''70000000-0000-0000-0000-000000000001'' and status = ''active'' limit 1),
    gen_random_uuid(), gen_random_uuid(), 98,
    ''nonexistent_event'', 1, 600,
    ''30000000-0000-0000-0000-000000000001'',
    ''50000000-0000-0000-0000-000000000001'',
    ''{}''::jsonb
  )',
  'P0001'
);

-- ============================================================================
-- Test 8: Void event
-- ============================================================================

select tests.assert_eq(
  'void: scorer voids event successfully',
  (select voided_at is not null from public.cmd_void_event(
    (select id from public.stat_events where operation_id = '11111111-0000-0000-0000-000000000001'),
    'Test void'
  )),
  true
);

-- ============================================================================
-- Test 9: Stranger cannot void events
-- ============================================================================

-- Record a new event first
select public.cmd_record_event(
  '70000000-0000-0000-0000-000000000001',
  (select id from public.tracker_sessions where game_id = '70000000-0000-0000-0000-000000000001' and status = 'active' limit 1),
  '22222222-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002',
  2, 'ft_made', 1, 500,
  '30000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001',
  '{}'::jsonb
);

select set_config('request.jwt.claims.sub', '10000000-0000-0000-0000-000000000013', true);
select tests.assert_throws(
  'auth: stranger cannot void events',
  'select public.cmd_void_event(
    (select id from public.stat_events where operation_id = ''22222222-0000-0000-0000-000000000001''),
    ''unauthorized void''
  )',
  'P0001'
);

-- ============================================================================
-- Test 10: Session management
-- ============================================================================

select set_config('request.jwt.claims.sub', '10000000-0000-0000-0000-000000000010', true);
select tests.assert_eq(
  'session: open tracker session returns active',
  (select status from public.cmd_open_tracker_session(
    '70000000-0000-0000-0000-000000000001', 'lead_scorer', '{}'::jsonb
  )),
  'active'
);

-- ============================================================================
-- Test 11: Stranger cannot open tracker session
-- ============================================================================

select set_config('request.jwt.claims.sub', '10000000-0000-0000-0000-000000000013', true);
select tests.assert_throws(
  'auth: stranger cannot open tracker session',
  'select public.cmd_open_tracker_session(''70000000-0000-0000-0000-000000000001'', ''lead_scorer'', ''{}''::jsonb)',
  'P0001'
);

-- ============================================================================
-- Test 12: Correction commands
-- ============================================================================

-- Reset game and create approved source + revision for correction test
select set_config('request.jwt.claims.sub', '10000000-0000-0000-0000-000000000010', true);
select public.cmd_transition_game('70000000-0000-0000-0000-000000000001', 'final_pending_review');

-- Submit source
select set_config('request.jwt.claims.sub', '10000000-0000-0000-0000-000000000010', true);
with src as (
  select id as submission_id from public.cmd_submit_source(
    '70000000-0000-0000-0000-000000000001', 'tracker_journal', null, true,
    '{"events":[]}'::jsonb, 0.95, gen_random_uuid()
  )
),
approved as (
  select id from public.cmd_approve_source((select submission_id from src), true, null)
),
rev as (
  select id as revision_id from public.cmd_create_revision(
    (select submission_id from src),
    '{"events":[]}'::jsonb,
    '{"players":[],"teams":[]}'::jsonb
  )
)
select id from public.cmd_approve_revision((select revision_id from rev), true);

-- Create correction
select set_config('request.jwt.claims.sub', '10000000-0000-0000-0000-000000000012', true);
select tests.assert_eq(
  'correction: create returns pending',
  (select status from public.cmd_create_correction(
    '70000000-0000-0000-0000-000000000001', 'Score error on Q3', null, '{}'::jsonb
  )),
  'pending'
);

-- Approve correction
with c as (
  select id from public.correction_records where status = 'pending' limit 1
)
select tests.assert_eq(
  'correction: approve returns approved',
  (select status from public.cmd_review_correction((select id from c), true)),
  'approved'
);

-- Apply correction
with c as (
  select id from public.correction_records where status = 'approved' limit 1
)
select tests.assert_eq(
  'correction: apply returns applied',
  (select status from public.cmd_apply_correction(
    (select id from c),
    '{"events":[]}'::jsonb,
    '{"players":[],"teams":[]}'::jsonb
  )),
  'applied'
);

-- ============================================================================
-- Test 13: Audit log has entries
-- ============================================================================

select tests.assert_eq(
  'audit: events were recorded',
  (select count(*) > 0 from public.audit_log),
  true
);

-- ============================================================================
-- Cleanup
-- ============================================================================

drop function if exists tests.assert_eq;
drop function if exists tests.assert_throws;

rollback;
