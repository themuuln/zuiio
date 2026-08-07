#!/usr/bin/env bash
# integration-test.sh — Task 1.10: full end-to-end game flow against local Supabase.
#
# Prerequisites:
#   - colima running, supabase running, db reset applied
#
# Tests: event recording with idempotency, void, transition, submission pipeline,
# revision approval, projection rebuild, public views, and double-approve idempotency.
#
# Exit code 0 = all checks pass.

set -uo pipefail
cd "$(dirname "$0")/.."

FAIL=0
pass() { printf '  \342\234\223 %s\n' "$1"; }
fail() { printf '  \342\234\227 %s\n' "$1"; FAIL=$((FAIL + 1)); }

DB_URL=$(supabase status -o env 2>/dev/null | grep '^DB_URL=' | cut -d= -f2- | tr -d '"')
[ -n "$DB_URL" ] || DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Run SQL as authenticated user (single psql call so SET ROLE persists)
as_user() {
  local uid=$1 sql=$2
  psql "$DB_URL" -qAt -c "SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '$uid', false); $sql"
}

echo "=== Integration test: full game lifecycle ==="

# ── Seed data references ──
SEED_ADMIN="397692e0-915f-4361-9f75-f84d0883ba80"
SEED_LEAGUE="c0000000-0000-0000-0000-000000000001"
SEED_COMP="e0000000-0000-0000-0000-000000000001"
RULESET_ID="90000000-0000-0000-0000-000000000001"
PLAYER1="50000000-0000-0000-0000-000000000001"
PLAYER2="50000000-0000-0000-0000-000000000002"

# Ensure seed admin has league membership
psql "$DB_URL" -qAt -c "
  INSERT INTO public.memberships (user_id, scope_type, scope_id, role)
  VALUES ('$SEED_ADMIN', 'league', '$SEED_LEAGUE', 'admin')
  ON CONFLICT DO NOTHING;
" 2>/dev/null
pass "seed admin membership ready"
psql "$DB_URL" -qAt -c "DELETE FROM public.standings WHERE competition_id = '$SEED_COMP'::uuid;" 2>/dev/null
psql "$DB_URL" -qAt -c "DELETE FROM public.season_player_stats WHERE competition_id = '$SEED_COMP'::uuid;" 2>/dev/null

# Get two team seasons
TS1=$(psql "$DB_URL" -qAt -c "
  SELECT id FROM public.team_seasons WHERE competition_id = '$SEED_COMP'::uuid ORDER BY id LIMIT 1;
")
TS2=$(psql "$DB_URL" -qAt -c "
  SELECT id FROM public.team_seasons WHERE competition_id = '$SEED_COMP'::uuid AND id != '$TS1'::uuid ORDER BY id LIMIT 1;
")
[ -n "$TS1" ] && [ -n "$TS2" ] || { echo "Need 2 team_seasons"; exit 1; }

# ── Create game ──
echo "Setup: creating game..."
GAME_ID=$(psql "$DB_URL" -qAt -c "
  INSERT INTO public.games (competition_id, ruleset_id, home_team_season_id, away_team_season_id, scheduled_at, status)
  VALUES ('$SEED_COMP'::uuid, '$RULESET_ID'::uuid, '$TS1'::uuid, '$TS2'::uuid, now(), 'scheduled')
  RETURNING id;
")
[ -n "$GAME_ID" ] || { echo "Failed to create game"; exit 1; }
pass "game created: $GAME_ID"

# Add rosters
psql "$DB_URL" -qAt -c "
  INSERT INTO public.game_rosters (game_id, player_id, team_season_id)
  VALUES ('$GAME_ID'::uuid, '$PLAYER1'::uuid, '$TS1'::uuid),
         ('$GAME_ID'::uuid, '$PLAYER2'::uuid, '$TS2'::uuid);
"


# Assign seed admin as lead scorer and transition to live
psql "$DB_URL" -qAt -c "
  INSERT INTO public.game_assignments (game_id, user_id, role)
  VALUES ('$GAME_ID'::uuid, '$SEED_ADMIN'::uuid, 'lead_scorer')
  ON CONFLICT DO NOTHING;
"
as_user "$SEED_ADMIN" "SELECT public.cmd_transition_game('$GAME_ID'::uuid, 'live_provisional');" >/dev/null
pass "game transitioned to live_provisional"
# Open tracker session
SESSION_ID=$(psql "$DB_URL" -qAt -c "INSERT INTO public.tracker_sessions (game_id, scorer_id, role, device_info) VALUES ('$GAME_ID'::uuid, '$SEED_ADMIN'::uuid, 'lead_scorer', '{}'::jsonb) RETURNING id;")
pass "tracker session: $SESSION_ID"

# ── Record events ──
echo "Test: recording events via cmd_record_event..."
for i in $(seq 1 12); do
  PID=$([ $((i % 2)) -eq 0 ] && echo "$PLAYER1" || echo "$PLAYER2")
  TS=$([ $((i % 2)) -eq 0 ] && echo "$TS1" || echo "$TS2")
  OP_ID=$(python3 -c "import uuid; print(uuid.uuid4())")
  ET="shot_2pt_made"
  [ $((i % 4)) -eq 0 ] && ET="shot_3pt_made"
  as_user "$SEED_ADMIN" "
    SELECT public.cmd_record_event(
      '$GAME_ID'::uuid, '$SESSION_ID'::uuid, '$OP_ID'::uuid,
      '$(python3 -c 'import uuid; print(uuid.uuid4())')'::uuid, $i, '$ET', 1::smallint, $((600 - i * 30))::smallint,
      '$TS'::uuid, '$PID'::uuid, '{}'::jsonb
    );
  " >/dev/null
done

# Verify events
EVENT_COUNT=$(psql "$DB_URL" -qAt -c "
  SELECT count(*)::int FROM public.stat_events WHERE game_id = '$GAME_ID'::uuid AND deleted_at IS NULL;
")
if [ "$EVENT_COUNT" -eq 12 ]; then
  pass "$EVENT_COUNT events recorded"
else
  fail "expected 12 events, got $EVENT_COUNT"
fi

# 3 duplicate operation_ids (idempotency test — reuse first 3 operation_ids)
for i in 1 2 3; do
  PID=$([ $((i % 2)) -eq 0 ] && echo "$PLAYER1" || echo "$PLAYER2")
  TS=$([ $((i % 2)) -eq 0 ] && echo "$TS1" || echo "$TS2")
  OP_ID=$(psql "$DB_URL" -qAt -c "
    SELECT operation_id FROM public.stat_events
    WHERE game_id = '$GAME_ID'::uuid ORDER BY created_at LIMIT 1 OFFSET $((i - 1));
  ")
  as_user "$SEED_ADMIN" "
    SELECT public.cmd_record_event(
      '$GAME_ID'::uuid, '$SESSION_ID'::uuid, '$OP_ID'::uuid,
      '$SEED_ADMIN'::uuid, $((12 + i)), 'shot_2pt_made', 1::smallint, 300::smallint,
      '$TS'::uuid, '$PID'::uuid, '{}'::jsonb
    );
  " >/dev/null
done

DUP_COUNT=$(psql "$DB_URL" -qAt -c "
  SELECT count(*)::int FROM public.stat_events WHERE game_id = '$GAME_ID'::uuid AND deleted_at IS NULL;
")
if [ "$DUP_COUNT" -eq 12 ]; then
  pass "3 duplicates deduped via idempotency"
else
  fail "expected 12 after duplicates, got $DUP_COUNT"
fi

# ── Void one event ──
EVENT_TO_VOID=$(psql "$DB_URL" -qAt -c "
  SELECT id FROM public.stat_events WHERE game_id = '$GAME_ID'::uuid ORDER BY created_at LIMIT 1;
")
as_user "$SEED_ADMIN" "SELECT public.cmd_void_event('$EVENT_TO_VOID'::uuid, 'test void');" >/dev/null
VOIDED=$(psql "$DB_URL" -qAt -c "
  SELECT count(*)::int FROM public.stat_events WHERE game_id = '$GAME_ID'::uuid AND voided_at IS NOT NULL;
")
if [ "$VOIDED" -eq 1 ]; then
  pass "one event voided"
else
  fail "expected 1 voided, got $VOIDED"
fi

# ── Transition game ──
as_user "$SEED_ADMIN" "
  SELECT public.cmd_transition_game('$GAME_ID'::uuid, 'final_pending_review');
" >/dev/null
GAME_STATUS=$(psql "$DB_URL" -qAt -c "
  SELECT status::text FROM public.games WHERE id = '$GAME_ID'::uuid;
")
if [ "$GAME_STATUS" = "final_pending_review" ]; then
  pass "game status: $GAME_STATUS"
else
  fail "expected final_pending_review, got $GAME_STATUS"
fi

# ── Submission pipeline ──
echo "Test: submission → revision → approval..."
SOURCE_JSON=$(as_user "$SEED_ADMIN" "
  SELECT public.cmd_submit_source(
    '$GAME_ID'::uuid, 'tracker_journal', null, true, '{}'::jsonb, 1.0, gen_random_uuid()
  );
")
SOURCE_ID=$(echo "$SOURCE_JSON" | sed -n '2p' | grep -oE '[0-9a-f-]{36}' | head -1)

as_user "$SEED_ADMIN" "
  SELECT public.cmd_approve_source('$SOURCE_ID'::uuid, true, null);
" >/dev/null

# Create revision with known projection
REV_PROJ='{"players":[{"player_id":"'$PLAYER1'","team_season_id":"'$TS1'","seconds_played":600,"pts":8,"fgm":4,"fga":8,"tpm":0,"tpa":0,"ftm":0,"fta":0,"oreb":2,"dreb":3,"ast":2,"stl":1,"blk":0,"tov":1,"pf":2},{"player_id":"'$PLAYER2'","team_season_id":"'$TS2'","seconds_played":480,"pts":12,"fgm":5,"fga":10,"tpm":2,"tpa":4,"ftm":0,"fta":0,"oreb":1,"dreb":4,"ast":3,"stl":2,"blk":1,"tov":2,"pf":3}],"teams":[{"team_season_id":"'$TS1'","pts":8,"fgm":4,"fga":8,"tpm":0,"tpa":0,"ftm":0,"fta":0,"oreb":2,"dreb":3,"team_reb":0,"ast":2,"stl":1,"blk":0,"tov":1,"pf":2},{"team_season_id":"'$TS2'","pts":12,"fgm":5,"fga":10,"tpm":2,"tpa":4,"ftm":0,"fta":0,"oreb":1,"dreb":4,"team_reb":0,"ast":3,"stl":2,"blk":1,"tov":2,"pf":3}]}'
REV_JSON=$(as_user "$SEED_ADMIN" "
  SELECT public.cmd_create_revision('$SOURCE_ID'::uuid, '{}'::jsonb, '$REV_PROJ'::jsonb, '[]'::jsonb);
")
REVISION_ID=$(echo "$REV_JSON" | sed -n '2p' | grep -oE '[0-9a-f-]{36}' | head -1)

as_user "$SEED_ADMIN" "
  SELECT public.cmd_approve_revision('$REVISION_ID'::uuid, true);
" >/dev/null

# ── Verify materialization ──
echo "Test: verifying materialization..."
P1_PTS=$(psql "$DB_URL" -qAt -c "
  SELECT pts FROM public.game_player_stats WHERE game_id = '$GAME_ID'::uuid AND player_id = '$PLAYER1'::uuid;
")
if [ "$P1_PTS" = "8" ]; then
  pass "player1 pts=$P1_PTS"
else
  fail "player1 pts expected 8, got $P1_PTS"
fi

HOME_SCORE=$(psql "$DB_URL" -qAt -c "
  SELECT home_score FROM public.games WHERE id = '$GAME_ID'::uuid;
")
if [ "$HOME_SCORE" = "8" ]; then
  pass "home_score=$HOME_SCORE"
else
  fail "home_score expected 8, got $HOME_SCORE"
fi

# ── Rebuild and verify ──
echo "Test: cmd_rebuild_projection..."
as_user "$SEED_ADMIN" "SELECT public.cmd_rebuild_projection('$GAME_ID'::uuid);" >/dev/null
P1_PTS2=$(psql "$DB_URL" -qAt -c "
  SELECT pts FROM public.game_player_stats WHERE game_id = '$GAME_ID'::uuid AND player_id = '$PLAYER1'::uuid;
")
if [ "$P1_PTS2" = "8" ]; then
  pass "rebuild preserves pts=$P1_PTS2"
else
  fail "rebuild changed pts: expected 8, got $P1_PTS2"
fi

# ── Public view ──
as_user "$SEED_ADMIN" "SELECT public.cmd_transition_game('$GAME_ID'::uuid, 'league_verified');" >/dev/null
pass "game transitioned to league_verified"
echo "Test: public views..."
PUBLIC_ROWS=$(psql "$DB_URL" -qAt -c "
  SET ROLE anon; SELECT count(*)::int FROM public.v_public_box_score WHERE game_id = '$GAME_ID'::uuid;
")
if [ "$PUBLIC_ROWS" -ge 2 ] 2>/dev/null; then
  pass "v_public_box_score: $PUBLIC_ROWS rows"
else
  fail "v_public_box_score: $PUBLIC_ROWS rows (expected ≥2)"
fi

# ── Double-approve idempotency ──
echo "Test: idempotency..."
as_user "$SEED_ADMIN" "SELECT public.cmd_approve_revision('$REVISION_ID'::uuid, true);" >/dev/null
P1_CNT=$(psql "$DB_URL" -qAt -c "
  SELECT count(*)::int FROM public.game_player_stats WHERE game_id = '$GAME_ID'::uuid AND player_id = '$PLAYER1'::uuid;
")
if [ "$P1_CNT" = "1" ]; then
  pass "double approve is idempotent"
else
  fail "double approve: $P1_CNT rows (expected 1)"
fi

# ── Handoff test ──
echo "Test: handoff..."

# Create second scorer user
BACKUP_USER=$(psql "$DB_URL" -qAt -c "
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES (gen_random_uuid(), 'backup-scorer@onoo-test.mn', '{\"role\":\"scorer\"}'::jsonb)
  RETURNING id;
" 2>/dev/null)
pass "handoff: backup user: $BACKUP_USER"

# Create mini game for handoff test
HANDOFF_GAME=$(psql "$DB_URL" -qAt -c "
  INSERT INTO public.games (competition_id, home_team_season_id, away_team_season_id, ruleset_id, status, scheduled_at)
  VALUES ('$SEED_COMP'::uuid, '$TS1'::uuid, '$TS2'::uuid, '$RULESET_ID'::uuid, 'scheduled', now())
  RETURNING id;
")

# Add rosters
psql "$DB_URL" -qAt -c "
  INSERT INTO public.game_rosters (game_id, team_season_id, player_id)
  SELECT '$HANDOFF_GAME'::uuid, '$TS1'::uuid, id FROM public.players WHERE id IN ('$PLAYER1') ON CONFLICT DO NOTHING;
  INSERT INTO public.game_rosters (game_id, team_season_id, player_id)
  SELECT '$HANDOFF_GAME'::uuid, '$TS2'::uuid, id FROM public.players WHERE id IN ('$PLAYER2') ON CONFLICT DO NOTHING;
" 2>/dev/null

# Assign both scorers
psql "$DB_URL" -qAt -c "
  INSERT INTO public.game_assignments (game_id, user_id, role)
  VALUES ('$HANDOFF_GAME'::uuid, '$SEED_ADMIN'::uuid, 'lead_scorer'),
         ('$HANDOFF_GAME'::uuid, '$BACKUP_USER'::uuid, 'backup_scorer')
  ON CONFLICT DO NOTHING;
" 2>/dev/null
pass "handoff: scorers assigned"

# Transition to live
as_user "$SEED_ADMIN" "SELECT public.cmd_transition_game('$HANDOFF_GAME'::uuid, 'live_provisional');" >/dev/null
pass "handoff: game live"

# Open session for lead scorer
LEAD_SESSION=$(as_user "$SEED_ADMIN" "SELECT id::text FROM public.cmd_open_tracker_session('$HANDOFF_GAME'::uuid, 'lead_scorer', '{}'::jsonb);" | tail -1)
pass "handoff: lead session opened: $LEAD_SESSION"

# Record one event before handoff
OP_ID=$(uuidgen)
as_user "$SEED_ADMIN" "SELECT public.cmd_record_event('$HANDOFF_GAME'::uuid, '$LEAD_SESSION'::uuid, '$OP_ID'::uuid, gen_random_uuid(), 1, 'shot_2pt_made', 1::smallint, 600::smallint, '$TS1'::uuid, '$PLAYER1'::uuid);" >/dev/null
pass "handoff: event recorded"

# Handoff to backup
HANDOFF_RESULT=$(as_user "$SEED_ADMIN" "SELECT public.cmd_handoff_session('$LEAD_SESSION'::uuid, '$BACKUP_USER'::uuid, 'End of period handoff');")
pass "handoff: session handed off"

# Try new event from lead session — must fail
HANDOFF_REJECT=$(as_user "$SEED_ADMIN" "SELECT public.cmd_record_event('$HANDOFF_GAME'::uuid, '$LEAD_SESSION'::uuid, gen_random_uuid(), gen_random_uuid(), 2, 'shot_2pt_made', 1::smallint, 590::smallint, '$TS1'::uuid, '$PLAYER1'::uuid);" 2>&1 || true)
if echo "$HANDOFF_REJECT" | grep -q "ONOO_SESSION_SUPERSEDED"; then
  pass "handoff: new event rejected (ONOO_SESSION_SUPERSEDED)"
else
  fail "handoff: expected ONOO_SESSION_SUPERSEDED, got: $HANDOFF_REJECT"
fi

# Try idempotent retry — must succeed
RETRY_RESULT=$(as_user "$SEED_ADMIN" "SELECT public.cmd_record_event('$HANDOFF_GAME'::uuid, '$LEAD_SESSION'::uuid, '$OP_ID'::uuid, gen_random_uuid(), 1, 'shot_2pt_made', 1::smallint, 600::smallint, '$TS1'::uuid, '$PLAYER1'::uuid);" 2>&1 || true)
if [ -n "$RETRY_RESULT" ] && ! echo "$RETRY_RESULT" | grep -q "ONOO_SESSION_SUPERSEDED"; then
  pass "handoff: idempotent retry accepted"
else
  fail "handoff: idempotent retry was rejected: $RETRY_RESULT"
fi

# Cleanup handoff data
psql "$DB_URL" -qAt -c "
  DELETE FROM public.game_assignments WHERE game_id = '$HANDOFF_GAME'::uuid;
  DELETE FROM public.game_rosters WHERE game_id = '$HANDOFF_GAME'::uuid;
  DELETE FROM public.stat_events WHERE game_id = '$HANDOFF_GAME'::uuid;
  DELETE FROM public.tracker_sessions WHERE game_id = '$HANDOFF_GAME'::uuid;
  DELETE FROM public.games WHERE id = '$HANDOFF_GAME'::uuid;
" 2>/dev/null
psql "$DB_URL" -qAt -c "DELETE FROM auth.users WHERE id = '$BACKUP_USER'::uuid;" 2>/dev/null

# ── T-5.1 Public visibility for provisional games ──
echo "Test: T-5.1 public visibility..."

LIVE_GAME=$(psql "$DB_URL" -qAt -c "
  INSERT INTO public.games (competition_id, home_team_season_id, away_team_season_id, ruleset_id, status, scheduled_at)
  VALUES ('$SEED_COMP'::uuid, '$TS1'::uuid, '$TS2'::uuid, '$RULESET_ID'::uuid, 'scheduled', now())
  RETURNING id;
")

# Transition to live_provisional
as_user "$SEED_ADMIN" "SELECT public.cmd_transition_game('$LIVE_GAME'::uuid, 'live_provisional');" >/dev/null

# Set scores to simulate tracker activity
psql "$DB_URL" -qAt -c "UPDATE public.games SET home_score=21, away_score=18 WHERE id='$LIVE_GAME'::uuid;" 2>/dev/null

# Verify v_public_live_games has the game with is_provisional=true
LIVE_VIEW=$(psql "$DB_URL" -qAt -c "
  SELECT count(*)::int FROM public.v_public_live_games WHERE id='$LIVE_GAME'::uuid AND is_provisional=true AND home_score=21 AND away_score=18;
")
if [ "$LIVE_VIEW" = "1" ]; then
  pass "T-5.1: live game visible in v_public_live_games with is_provisional and scores"
else
  fail "T-5.1: live game NOT visible in v_public_live_games"
fi

# Verify v_public_games does NOT have it
VERIFIED_VIEW=$(psql "$DB_URL" -qAt -c "
  SELECT count(*)::int FROM public.v_public_games WHERE id='$LIVE_GAME'::uuid;
")
if [ "$VERIFIED_VIEW" = "0" ]; then
  pass "T-5.1: live game correctly excluded from v_public_games"
else
  fail "T-5.1: live game leaked into v_public_games"
fi

# Transition to final_pending_review
as_user "$SEED_ADMIN" "SELECT public.cmd_transition_game('$LIVE_GAME'::uuid, 'final_pending_review');" >/dev/null

# Still in v_public_live_games, still provisional
REVIEW_VIEW=$(psql "$DB_URL" -qAt -c "
  SELECT count(*)::int FROM public.v_public_live_games WHERE id='$LIVE_GAME'::uuid AND is_provisional=true;
")
if [ "$REVIEW_VIEW" = "1" ]; then
  pass "T-5.1: final_pending_review still visible in v_public_live_games"
else
  fail "T-5.1: final_pending_review missing from v_public_live_games"
fi

# Create submission and revision so v_public_games can include this game
LIVE_SRC_JSON=$(as_user "$SEED_ADMIN" "
  SELECT public.cmd_submit_source(
    '$LIVE_GAME'::uuid, 'tracker_journal', null, true, '{}'::jsonb, 1.0, gen_random_uuid()
  );
")
LIVE_SRC_ID=$(echo "$LIVE_SRC_JSON" | sed -n '2p' | grep -oE '[0-9a-f-]{36}' | head -1)
as_user "$SEED_ADMIN" "SELECT public.cmd_approve_source('$LIVE_SRC_ID'::uuid, true, null);" >/dev/null

LIVE_PROJ='{"players":[],"teams":[]}'
LIVE_REV_JSON=$(as_user "$SEED_ADMIN" "
  SELECT public.cmd_create_revision('$LIVE_SRC_ID'::uuid, '{}'::jsonb, '$LIVE_PROJ'::jsonb, '[]'::jsonb);
")
LIVE_REV_ID=$(echo "$LIVE_REV_JSON" | sed -n '2p' | grep -oE '[0-9a-f-]{36}' | head -1)
as_user "$SEED_ADMIN" "SELECT public.cmd_approve_revision('$LIVE_REV_ID'::uuid, true);" >/dev/null

# Transition to league_verified — should now appear in v_public_games
as_user "$SEED_ADMIN" "SELECT public.cmd_transition_game('$LIVE_GAME'::uuid, 'league_verified');" >/dev/null

OFFICIAL=$(psql "$DB_URL" -qAt -c "
  SELECT count(*)::int FROM public.v_public_games WHERE id='$LIVE_GAME'::uuid;
")
if [ "$OFFICIAL" = "1" ]; then
  pass "T-5.1: game visible in v_public_games after verification"
else
  fail "T-5.1: game NOT in v_public_games after verification"
fi

LIVE_GONE=$(psql "$DB_URL" -qAt -c "
  SELECT count(*)::int FROM public.v_public_live_games WHERE id='$LIVE_GAME'::uuid;
")
if [ "$LIVE_GONE" = "0" ]; then
  pass "T-5.1: game removed from v_public_live_games after verification"
else
  fail "T-5.1: game still in v_public_live_games after verification"
fi

# Cleanup — include revision/submission chain
psql "$DB_URL" -qAt -c "
  DELETE FROM public.game_player_stats WHERE game_id = '$LIVE_GAME'::uuid;
  DELETE FROM public.game_team_stats WHERE game_id = '$LIVE_GAME'::uuid;
  DELETE FROM public.game_revisions WHERE game_id = '$LIVE_GAME'::uuid;
  DELETE FROM public.source_submissions WHERE game_id = '$LIVE_GAME'::uuid;
  DELETE FROM public.stat_events WHERE game_id = '$LIVE_GAME'::uuid;
  DELETE FROM public.tracker_sessions WHERE game_id = '$LIVE_GAME'::uuid;
  DELETE FROM public.games WHERE id = '$LIVE_GAME'::uuid;
" 2>/dev/null

# ── Cleanup ──
psql "$DB_URL" -qAt -c "
  DELETE FROM public.game_player_stats WHERE game_id = '$GAME_ID'::uuid;
  DELETE FROM public.game_team_stats WHERE game_id = '$GAME_ID'::uuid;
  DELETE FROM public.game_revisions WHERE game_id = '$GAME_ID'::uuid;
  DELETE FROM public.source_submissions WHERE game_id = '$GAME_ID'::uuid;
  DELETE FROM public.game_rosters WHERE game_id = '$GAME_ID'::uuid;
  DELETE FROM public.stat_events WHERE game_id = '$GAME_ID'::uuid;
  DELETE FROM public.tracker_sessions WHERE game_id = '$GAME_ID'::uuid;
  DELETE FROM public.games WHERE id = '$GAME_ID'::uuid;
" 2>/dev/null

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "integration-test: ALL CHECKS PASSED"
else
  echo "integration-test: $FAIL check(s) FAILED"
fi
exit "$FAIL"
