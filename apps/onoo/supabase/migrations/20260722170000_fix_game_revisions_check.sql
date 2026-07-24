-- Fix game_revisions CHECK constraint violations.
--
-- Bug 1: apply_derived_stats inserts game_revisions with state='approved' but
--        omits approved_at, violating (state = 'approved') = (approved_at IS NOT NULL).
-- Bug 2: cmd_approve_revision (from 20260722100057) supersedes prior approved
--        revisions without clearing approved_at/approved_by, also violating the
--        CHECK constraint. The fix from 20260721000000 was dropped when the
--        function was overwritten.

-- ============================================================================
-- 1. Fix apply_derived_stats — include approved_at when inserting approved revision
-- ============================================================================

create or replace function public.apply_derived_stats(
  p_game_id uuid,
  p_player_stats jsonb,
  p_team_stats jsonb,
  p_home_score smallint,
  p_away_score smallint,
  p_status public.game_status
) returns void language plpgsql security definer
set search_path = '' as $$
declare
  v_revision_id uuid;
  v_revision_number integer;
  v_submission_id uuid;
begin
  -- Create a source submission for traceability
  v_submission_id := gen_random_uuid();
  insert into public.source_submissions (
    id, game_id, source_type, evidence_url, normalized_payload, confidence, submitted_by
  ) values (
    v_submission_id, p_game_id, 'manual_box_score',
    'https://onoo.mn/auto-derived',
    jsonb_build_object('type', 'apply_derived_stats'),
    0.5,
    (select auth.uid())
  );

  -- Create a revision
  select coalesce(max(revision_number), 0) + 1 into v_revision_number
    from public.game_revisions where game_id = p_game_id;

  v_revision_id := gen_random_uuid();

  insert into public.game_revisions (
    id, game_id, revision_number, source_submission_id, journal, projection,
    validation_warnings, state, created_by, approved_at
  ) values (
    v_revision_id, p_game_id, v_revision_number, v_submission_id,
    jsonb_build_object('type', 'apply_derived_stats', 'player_stats', p_player_stats, 'team_stats', p_team_stats),
    jsonb_build_object('players', p_player_stats, 'teams', p_team_stats),
    '[]'::jsonb,
    'approved',
    (select auth.uid()),
    now()
  );

  -- Delete existing stats
  delete from public.game_player_stats where game_id = p_game_id;
  delete from public.game_team_stats where game_id = p_game_id;

  -- Insert player stats
  insert into public.game_player_stats (
    game_id, player_id, team_season_id, revision_id,
    seconds_played, pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, ast, stl, blk, tov, pf
  )
  select
    p_game_id,
    (value->>'player_id')::uuid,
    (value->>'team_season_id')::uuid,
    v_revision_id,
    coalesce((value->>'seconds_played')::integer, 0),
    coalesce((value->>'pts')::smallint, 0),
    coalesce((value->>'fgm')::smallint, 0),
    coalesce((value->>'fga')::smallint, 0),
    coalesce((value->>'tpm')::smallint, 0),
    coalesce((value->>'tpa')::smallint, 0),
    coalesce((value->>'ftm')::smallint, 0),
    coalesce((value->>'fta')::smallint, 0),
    coalesce((value->>'oreb')::smallint, 0),
    coalesce((value->>'dreb')::smallint, 0),
    coalesce((value->>'ast')::smallint, 0),
    coalesce((value->>'stl')::smallint, 0),
    coalesce((value->>'blk')::smallint, 0),
    coalesce((value->>'tov')::smallint, 0),
    coalesce((value->>'pf')::smallint, 0)
  from jsonb_array_elements(p_player_stats);

  -- Insert team stats
  insert into public.game_team_stats (
    game_id, team_season_id, revision_id,
    pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, team_reb, ast, stl, blk, tov, pf
  )
  select
    p_game_id,
    (value->>'team_season_id')::uuid,
    v_revision_id,
    coalesce((value->>'pts')::smallint, 0),
    coalesce((value->>'fgm')::smallint, 0),
    coalesce((value->>'fga')::smallint, 0),
    coalesce((value->>'tpm')::smallint, 0),
    coalesce((value->>'tpa')::smallint, 0),
    coalesce((value->>'ftm')::smallint, 0),
    coalesce((value->>'fta')::smallint, 0),
    coalesce((value->>'oreb')::smallint, 0),
    coalesce((value->>'dreb')::smallint, 0),
    coalesce((value->>'team_reb')::smallint, 0),
    coalesce((value->>'ast')::smallint, 0),
    coalesce((value->>'stl')::smallint, 0),
    coalesce((value->>'blk')::smallint, 0),
    coalesce((value->>'tov')::smallint, 0),
    coalesce((value->>'pf')::smallint, 0)
  from jsonb_array_elements(p_team_stats);

  -- Update game status/score
  update public.games
    set
      status = p_status,
      home_score = p_home_score,
      away_score = p_away_score,
      current_revision_number = v_revision_number
    where id = p_game_id;
end;
$$;

-- ============================================================================
-- 2. Fix cmd_approve_revision — clear approved_at/approved_by when superseding
-- ============================================================================

create or replace function public.cmd_approve_revision(p_revision_id uuid, p_approved boolean)
returns public.game_revisions language plpgsql security definer
set search_path = '' as $$
declare
  v_revision public.game_revisions;
  v_game public.games;
  v_projection jsonb;
begin
  -- 1. Load revision and authorize
  select * into v_revision from public.game_revisions where id = p_revision_id for update;
  if not found or not private.user_can_approve_game(v_revision.game_id) then
    raise exception 'ONOO_NOT_AUTHORIZED';
  end if;

  select * into v_game from public.games where id = v_revision.game_id for update;

  -- 2. Update revision state
  update public.game_revisions
    set state = case when p_approved then 'approved' else 'rejected' end,
        approved_by = (select auth.uid()),
        approved_at = now()
    where id = p_revision_id
    returning * into v_revision;

  if not p_approved then
    perform private.write_audit('review_revision', 'game_revision', p_revision_id,
      jsonb_build_object('approved', false));
    return v_revision;
  end if;

  -- 3. Supersede prior approved revision
  -- IMPORTANT: must clear approved_at/by to satisfy game_revisions_check
  update public.game_revisions
    set state = 'superseded', approved_at = NULL, approved_by = NULL
    where game_id = v_revision.game_id
      and id <> p_revision_id
      and state = 'approved';

  -- 4. Set current revision on game
  update public.games
    set current_revision_number = v_revision.revision_number
    where id = v_revision.game_id;

  v_projection := v_revision.projection;

  -- 5. Materialize projection (delegated to shared helper)
  perform private.materialize_projection(
    p_game_id := v_revision.game_id,
    p_revision_id := p_revision_id,
    p_projection := v_projection,
    p_competition_id := v_game.competition_id
  );

  perform private.write_audit('approve_revision', 'game_revision', p_revision_id,
    jsonb_build_object('approved', true, 'revision_number', v_revision.revision_number));
  return v_revision;
end;
$$;
