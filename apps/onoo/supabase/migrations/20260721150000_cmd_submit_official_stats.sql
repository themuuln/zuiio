-- ============================================================================
-- cmd_submit_official_stats
-- Instant-publish path for official score sheet PDF upload: creates a source
-- submission, immediately approves it, materializes the stats into
-- game_player_stats + game_team_stats, updates game scores, sets game status
-- to league_verified (live on public site), and rebuilds season stats + standings.
--
-- The game goes live instantly — no review gate needed when an authorized
-- admin/scorekeeper uploads the official FIBA PDF.
-- ============================================================================

create or replace function public.cmd_submit_official_stats(
  p_game_id uuid,
  p_evidence_url text,
  p_normalized_payload jsonb,
  p_player_stats jsonb,
  p_team_stats jsonb,
  p_home_score smallint,
  p_away_score smallint
) returns jsonb language plpgsql security definer
set search_path = '' as $$
declare
  v_submission public.source_submissions;
  v_revision public.game_revisions;
  v_revision_number integer;
  v_idempotency_key uuid := gen_random_uuid();
begin
  -- 1. Authorize: user must be able to score this game
  if (select auth.uid()) is null then
    raise exception 'ONOO_NOT_AUTHENTICATED';
  end if;
  if not private.user_can_score_game(p_game_id) then
    raise exception 'ONOO_NOT_AUTHORIZED';
  end if;

  -- 2. Validate player_stats is a non-empty array
  if p_player_stats is null or jsonb_typeof(p_player_stats) <> 'array' or jsonb_array_length(p_player_stats) = 0 then
    raise exception 'ONOO_INVALID_PROJECTION: player_stats must be a non-empty array';
  end if;
  if p_team_stats is null or jsonb_typeof(p_team_stats) <> 'array' or jsonb_array_length(p_team_stats) = 0 then
    raise exception 'ONOO_INVALID_PROJECTION: team_stats must be a non-empty array';
  end if;

  -- 3. Create source submission (auto-approved)
  insert into public.source_submissions (
    game_id, source_type, evidence_url, rights_confirmed_at,
    submitted_by, normalized_payload, confidence, status, reviewed_by, reviewed_at,
    idempotency_key
  ) values (
    p_game_id, 'official_score_sheet', p_evidence_url, now(),
    (select auth.uid()), p_normalized_payload, 0.95,
    'approved', (select auth.uid()), now(),
    v_idempotency_key
  )
  returning * into v_submission;

  -- 4. Compute next revision number
  select coalesce(max(revision_number), 0) + 1 into v_revision_number
    from public.game_revisions where game_id = p_game_id;

  -- 5. Create game revision (auto-approved) with the projection
  insert into public.game_revisions (
    game_id, revision_number, source_submission_id,
    journal, projection, validation_warnings,
    state, created_by, approved_by, approved_at
  ) values (
    p_game_id, v_revision_number, v_submission.id,
    jsonb_build_object(
      'type', 'official_score_sheet',
      'submission_id', v_submission.id,
      'normalized_payload', p_normalized_payload
    ),
    jsonb_build_object('players', p_player_stats, 'teams', p_team_stats),
    '[]'::jsonb,
    'approved', (select auth.uid()), (select auth.uid()), now()
  )
  returning * into v_revision;

  -- 6. Supersede prior approved revision
  update public.game_revisions
    set state = 'superseded'
    where game_id = p_game_id
      and id <> v_revision.id
      and state = 'approved';

  -- 7. Delete existing stats for this game (they'll be replaced)
  delete from public.game_player_stats where game_id = p_game_id;
  delete from public.game_team_stats where game_id = p_game_id;

  -- 8. Materialize game_player_stats
  insert into public.game_player_stats (
    game_id, player_id, team_season_id, revision_id,
    seconds_played, pts, fgm, fga, tpm, tpa, ftm, fta,
    oreb, dreb, ast, stl, blk, tov, pf
  )
  select
    p_game_id,
    (value->>'player_id')::uuid,
    (value->>'team_season_id')::uuid,
    v_revision.id,
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

  -- 9. Materialize game_team_stats
  insert into public.game_team_stats (
    game_id, team_season_id, revision_id,
    pts, fgm, fga, tpm, tpa, ftm, fta,
    oreb, dreb, team_reb, ast, stl, blk, tov, pf
  )
  select
    p_game_id,
    (value->>'team_season_id')::uuid,
    v_revision.id,
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

  -- 10. Update game scores, set current revision, publish instantly
  update public.games
    set
      home_score = p_home_score,
      away_score = p_away_score,
      current_revision_number = v_revision_number,
      status = 'league_verified',
      published_at = now()
    where id = p_game_id;

  -- 11. Rebuild season_player_stats + standings for the competition
  --     These only include games with status 'league_verified' or 'official',
  --     so setting status to league_verified above makes this count.
  perform public.refresh_season_player_stats(
    (select competition_id from public.games where id = p_game_id)
  );
  perform public.refresh_standings(
    (select competition_id from public.games where id = p_game_id)
  );


  -- 13. Write audit log
  perform private.write_audit(
    'submit_official_stats',
    'source_submission',
    v_submission.id,
    jsonb_build_object(
      'game_id', p_game_id,
      'revision_id', v_revision.id,
      'evidence_url', p_evidence_url,
      'home_score', p_home_score,
      'away_score', p_away_score
    )
  );

  return jsonb_build_object(
    'submission_id', v_submission.id,
    'revision_id', v_revision.id,
    'revision_number', v_revision_number
  );
end;
$$;

grant execute on function public.cmd_submit_official_stats(uuid, text, jsonb, jsonb, jsonb, smallint, smallint) to authenticated;
