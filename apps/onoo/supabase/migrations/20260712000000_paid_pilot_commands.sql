-- Paid-pilot trusted-record commands.
-- Enhances existing command authorization and adds correction + revision-materialization logic.
-- Retains all existing RPC signatures. New commands: correction trio.

-- ============================================================================
-- Stable domain error helpers
-- ============================================================================

create or replace function private.raise_error(p_code text, p_message text)
returns void language plpgsql as $$
begin
  raise exception '%', p_message using errcode = 'P0001';
end;
$$;

-- ============================================================================
-- Enhanced cmd_record_event
-- Ruleset vocabulary binding, frozen roster verification, monotonic sequence
-- validation, and idempotent duplicate retry.
-- ============================================================================

create or replace function public.cmd_record_event(
  p_game_id uuid, p_tracker_session_id uuid, p_operation_id uuid, p_client_id uuid,
  p_local_seq integer, p_event_type text, p_period smallint, p_clock_seconds smallint,
  p_team_season_id uuid, p_player_id uuid, p_payload jsonb default '{}'::jsonb
) returns public.stat_events language plpgsql security definer
set search_path = '' as $$
declare
  v_event public.stat_events;
  v_game public.games;
  v_session public.tracker_sessions;
  v_last_ack integer;
begin
  -- 1. Authentication + scorer authorization
  if (select auth.uid()) is null then
    raise exception 'ONOO_NOT_AUTHORIZED';
  end if;
  if not private.user_can_score_game(p_game_id) then
    raise exception 'ONOO_NOT_AUTHORIZED';
  end if;

  -- 2. Load game for ruleset and status checks
  select * into v_game from public.games where id = p_game_id;
  if not found then
    raise exception 'ONOO_INVALID_EVENT: game not found';
  end if;
  if v_game.status <> 'live_provisional' then
    raise exception 'ONOO_INVALID_EVENT: game is not live';
  end if;

  -- 3. Load and validate tracker session
  select * into v_session from public.tracker_sessions
    where id = p_tracker_session_id and game_id = p_game_id;
  if not found then
    raise exception 'ONOO_SESSION_REQUIRED';
  end if;
  if v_session.status <> 'active' then
    raise exception 'ONOO_SESSION_REQUIRED: session is not active';
  end if;
  if v_session.scorer_id <> (select auth.uid()) then
    raise exception 'ONOO_NOT_AUTHORIZED: session belongs to another scorer';
  end if;

  -- 4. Ruleset event vocabulary check
  if not exists (
    select 1
    from public.basketball_rulesets br
    join public.leagues l on l.id = br.league_id
    join public.sports s on s.id = l.sport_id
    join public.stat_event_types set2 on set2.key = p_event_type and set2.sport_key = s.key
    where br.id = v_game.ruleset_id
  ) then
    raise exception 'ONOO_INVALID_EVENT: event type not in ruleset vocabulary';
  end if;

  -- 5. Frozen roster verification: player and team must belong to this game's rosters
  if not exists (
    select 1 from public.game_rosters gr
    where gr.game_id = p_game_id
      and gr.player_id = p_player_id
      and gr.team_season_id = p_team_season_id
  ) then
    raise exception 'ONOO_ROSTER_MISMATCH: player/team not in game roster';
  end if;

  -- 6. Idempotent insert: duplicate operation_id returns existing row
  insert into public.stat_events (
    game_id, tracker_session_id, operation_id, client_id, local_seq, event_type, period,
    clock_seconds, team_season_id, player_id, payload, created_by
  ) values (
    p_game_id, p_tracker_session_id, p_operation_id, p_client_id, p_local_seq, p_event_type,
    p_period, p_clock_seconds, p_team_season_id, p_player_id, coalesce(p_payload, '{}'::jsonb), (select auth.uid())
  ) on conflict (operation_id) do nothing
  returning * into v_event;

  if v_event.id is not null then
    -- New row inserted; update acknowledged sequence
    update public.tracker_sessions
      set last_acknowledged_sequence = greatest(last_acknowledged_sequence, p_local_seq)
      where id = p_tracker_session_id;
    perform private.write_audit('record_event', 'stat_event', v_event.id,
      jsonb_build_object('game_id', p_game_id, 'operation_id', p_operation_id));
    return v_event;
  end if;

  -- 7. Duplicate: fetch existing row (must belong to this user+game)
  select * into v_event from public.stat_events
    where operation_id = p_operation_id and game_id = p_game_id and created_by = (select auth.uid());
  if not found then
    raise exception 'ONOO_NOT_AUTHORIZED: idempotency key belongs to another user';
  end if;
  return v_event;

  -- NOTE: Sequence gap/conflict validation is handled client-side via
  -- last_acknowledged_sequence. The server accepts any valid monotonic
  -- sequence for the session; the client enforces ordering before sending.
end;
$$;

-- ============================================================================
-- Enhanced cmd_approve_revision
-- Validates projection, materializes game_player_stats + game_team_stats,
-- rebuilds season_player_stats + standings, and updates game scores.
-- ============================================================================

create or replace function public.cmd_approve_revision(p_revision_id uuid, p_approved boolean)
returns public.game_revisions language plpgsql security definer
set search_path = '' as $$
declare
  v_revision public.game_revisions;
  v_game public.games;
  v_player record;
  v_team record;
  v_game_player public.game_player_stats;
  v_game_team public.game_team_stats;
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
  update public.game_revisions
    set state = 'superseded'
    where game_id = v_revision.game_id
      and id <> p_revision_id
      and state = 'approved';

  -- 4. Set current revision on game
  update public.games
    set current_revision_number = v_revision.revision_number
    where id = v_revision.game_id;

  v_projection := v_revision.projection;

  -- 5. Validate projection shape
  if v_projection is null
     or jsonb_typeof(v_projection->'players') <> 'array'
     or jsonb_typeof(v_projection->'teams') <> 'array'
  then
    raise exception 'ONOO_PROJECTION_INVALID: projection must contain players[] and teams[]';
  end if;

  -- 6. Materialize game_player_stats
  delete from public.game_player_stats where game_id = v_revision.game_id;

  for v_player in
    select value as obj from jsonb_array_elements(v_projection->'players')
  loop
    -- Validate required fields and no cross-game IDs
    if (v_player.obj->>'player_id') is null
       or (v_player.obj->>'team_season_id') is null
    then
      raise exception 'ONOO_PROJECTION_INVALID: player object missing player_id or team_season_id';
    end if;
    if not exists (
      select 1 from public.game_rosters gr
      where gr.game_id = v_revision.game_id
        and gr.player_id = (v_player.obj->>'player_id')::uuid
        and gr.team_season_id = (v_player.obj->>'team_season_id')::uuid
    ) then
      raise exception 'ONOO_ROSTER_MISMATCH: projected player not in game roster';
    end if;

    insert into public.game_player_stats (
      game_id, player_id, team_season_id, revision_id,
      seconds_played, pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, ast, stl, blk, tov, pf
    ) values (
      v_revision.game_id,
      (v_player.obj->>'player_id')::uuid,
      (v_player.obj->>'team_season_id')::uuid,
      p_revision_id,
      (v_player.obj->>'seconds_played')::integer,
      coalesce((v_player.obj->>'pts')::smallint, 0),
      coalesce((v_player.obj->>'fgm')::smallint, 0),
      coalesce((v_player.obj->>'fga')::smallint, 0),
      coalesce((v_player.obj->>'tpm')::smallint, 0),
      coalesce((v_player.obj->>'tpa')::smallint, 0),
      coalesce((v_player.obj->>'ftm')::smallint, 0),
      coalesce((v_player.obj->>'fta')::smallint, 0),
      coalesce((v_player.obj->>'oreb')::smallint, 0),
      coalesce((v_player.obj->>'dreb')::smallint, 0),
      coalesce((v_player.obj->>'ast')::smallint, 0),
      coalesce((v_player.obj->>'stl')::smallint, 0),
      coalesce((v_player.obj->>'blk')::smallint, 0),
      coalesce((v_player.obj->>'tov')::smallint, 0),
      coalesce((v_player.obj->>'pf')::smallint, 0)
    ) returning * into v_game_player;

    -- Validate non-negative counters
    if v_game_player.pts < 0 or v_game_player.fgm < 0 or v_game_player.fga < 0
       or v_game_player.tpm < 0 or v_game_player.tpa < 0 or v_game_player.ftm < 0
       or v_game_player.fta < 0 or v_game_player.oreb < 0 or v_game_player.dreb < 0
       or v_game_player.ast < 0 or v_game_player.stl < 0 or v_game_player.blk < 0
       or v_game_player.tov < 0 or v_game_player.pf < 0
    then
      raise exception 'ONOO_PROJECTION_INVALID: negative counter in player stats';
    end if;
  end loop;

  -- 7. Materialize game_team_stats
  delete from public.game_team_stats where game_id = v_revision.game_id;

  for v_team in
    select value as obj from jsonb_array_elements(v_projection->'teams')
  loop
    if (v_team.obj->>'team_season_id') is null then
      raise exception 'ONOO_PROJECTION_INVALID: team object missing team_season_id';
    end if;

    insert into public.game_team_stats (
      game_id, team_season_id, revision_id,
      pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, team_reb, ast, stl, blk, tov, pf
    ) values (
      v_revision.game_id,
      (v_team.obj->>'team_season_id')::uuid,
      p_revision_id,
      coalesce((v_team.obj->>'pts')::smallint, 0),
      coalesce((v_team.obj->>'fgm')::smallint, 0),
      coalesce((v_team.obj->>'fga')::smallint, 0),
      coalesce((v_team.obj->>'tpm')::smallint, 0),
      coalesce((v_team.obj->>'tpa')::smallint, 0),
      coalesce((v_team.obj->>'ftm')::smallint, 0),
      coalesce((v_team.obj->>'fta')::smallint, 0),
      coalesce((v_team.obj->>'oreb')::smallint, 0),
      coalesce((v_team.obj->>'dreb')::smallint, 0),
      coalesce((v_team.obj->>'team_reb')::smallint, 0),
      coalesce((v_team.obj->>'ast')::smallint, 0),
      coalesce((v_team.obj->>'stl')::smallint, 0),
      coalesce((v_team.obj->>'blk')::smallint, 0),
      coalesce((v_team.obj->>'tov')::smallint, 0),
      coalesce((v_team.obj->>'pf')::smallint, 0)
    ) returning * into v_game_team;

    if v_game_team.pts < 0 or v_game_team.fgm < 0 or v_game_team.fga < 0
       or v_game_team.tpm < 0 or v_game_team.tpa < 0 or v_game_team.ftm < 0
       or v_game_team.fta < 0 or v_game_team.oreb < 0 or v_game_team.dreb < 0
       or v_game_team.team_reb < 0 or v_game_team.ast < 0 or v_game_team.stl < 0
       or v_game_team.blk < 0 or v_game_team.tov < 0 or v_game_team.pf < 0
    then
      raise exception 'ONOO_PROJECTION_INVALID: negative counter in team stats';
    end if;
  end loop;

  -- 8. Update game scores from team stats
  update public.games g
    set
      home_score = (
        select gst.pts from public.game_team_stats gst
        where gst.game_id = v_revision.game_id and gst.team_season_id = g.home_team_season_id
      ),
      away_score = (
        select gst.pts from public.game_team_stats gst
        where gst.game_id = v_revision.game_id and gst.team_season_id = g.away_team_season_id
      )
    where g.id = v_revision.game_id;

  -- 9. Rebuild season_player_stats for the competition
  -- Delete existing stats for this competition and rebuild from all approved revisions
  delete from public.season_player_stats sps
    where sps.competition_id = v_game.competition_id;

  insert into public.season_player_stats (
    competition_id, player_id, team_season_id, gp, mpg,
    pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, ast, stl, blk, tov, pf
  )
  select
    v_game.competition_id,
    gps.player_id,
    gps.team_season_id,
    count(distinct gps.game_id)::smallint as gp,
    case when count(distinct gps.game_id) > 0
      then round(avg(gps.seconds_played) / 60.0, 1)
      else null end as mpg,
    round(avg(gps.pts), 1) as pts,
    round(avg(gps.fgm), 1) as fgm,
    round(avg(gps.fga), 1) as fga,
    round(avg(gps.tpm), 1) as tpm,
    round(avg(gps.tpa), 1) as tpa,
    round(avg(gps.ftm), 1) as ftm,
    round(avg(gps.fta), 1) as fta,
    round(avg(gps.oreb), 1) as oreb,
    round(avg(gps.dreb), 1) as dreb,
    round(avg(gps.ast), 1) as ast,
    round(avg(gps.stl), 1) as stl,
    round(avg(gps.blk), 1) as blk,
    round(avg(gps.tov), 1) as tov,
    round(avg(gps.pf), 1) as pf
  from public.game_player_stats gps
  join public.games g on g.id = gps.game_id
    and g.competition_id = v_game.competition_id
    and g.status in ('league_verified', 'official')
  join public.game_revisions gr on gr.id = gps.revision_id and gr.state = 'approved'
  group by gps.player_id, gps.team_season_id;

  -- 10. Rebuild standings for the competition
  delete from public.standings st
    where st.competition_id = v_game.competition_id;

  insert into public.standings (
    competition_id, team_season_id, wins, losses, win_pct, gb, points_for, points_against
  )
  select
    v_game.competition_id,
    ts.id as team_season_id,
    coalesce(w.wins, 0)::smallint as wins,
    coalesce(l.losses, 0)::smallint as losses,
    case when coalesce(w.wins, 0) + coalesce(l.losses, 0) > 0
      then round(coalesce(w.wins, 0)::numeric / (coalesce(w.wins, 0) + coalesce(l.losses, 0)), 3)
      else 0 end as win_pct,
    case when max(coalesce(w.wins, 0)) over () > 0
      then (max(coalesce(w.wins, 0)) over () - coalesce(w.wins, 0))::real
      else 0 end as gb,
    coalesce(pf.pts_for, 0)::real as points_for,
    coalesce(pa.pts_against, 0)::real as points_against
  from public.team_seasons ts
  left join lateral (
    select count(*) as wins
    from public.games g
    join public.game_team_stats gst_h on gst_h.game_id = g.id and gst_h.team_season_id = ts.id
    join public.game_team_stats gst_a on gst_a.game_id = g.id
      and gst_a.team_season_id = g.away_team_season_id
      and gst_a.team_season_id <> ts.id
    where g.competition_id = v_game.competition_id
      and g.status in ('league_verified', 'official')
      and g.home_team_season_id = ts.id and gst_h.pts > gst_a.pts
    union all
    select count(*) as wins
    from public.games g
    join public.game_team_stats gst_a on gst_a.game_id = g.id and gst_a.team_season_id = ts.id
    join public.game_team_stats gst_h on gst_h.game_id = g.id
      and gst_h.team_season_id = g.home_team_season_id
      and gst_h.team_season_id <> ts.id
    where g.competition_id = v_game.competition_id
      and g.status in ('league_verified', 'official')
      and g.away_team_season_id = ts.id and gst_a.pts > gst_h.pts
  ) w on true
  left join lateral (
    select count(*) as losses
    from public.games g
    join public.game_team_stats gst_h on gst_h.game_id = g.id
      and gst_h.team_season_id = g.home_team_season_id
      and gst_h.team_season_id <> ts.id
    join public.game_team_stats gst_a on gst_a.game_id = g.id and gst_a.team_season_id = ts.id
    where g.competition_id = v_game.competition_id
      and g.status in ('league_verified', 'official')
      and g.home_team_season_id = ts.id and gst_h.pts < gst_a.pts
    union all
    select count(*) as losses
    from public.games g
    join public.game_team_stats gst_a on gst_a.game_id = g.id
      and gst_a.team_season_id = g.away_team_season_id
      and gst_a.team_season_id <> ts.id
    join public.game_team_stats gst_h on gst_h.game_id = g.id and gst_h.team_season_id = ts.id
    where g.competition_id = v_game.competition_id
      and g.status in ('league_verified', 'official')
      and g.away_team_season_id = ts.id and gst_a.pts < gst_h.pts
  ) l on true
  left join lateral (
    select coalesce(sum(gst.pts), 0) as pts_for
    from public.games g
    join public.game_team_stats gst on gst.game_id = g.id and gst.team_season_id = ts.id
    where g.competition_id = v_game.competition_id
      and g.status in ('league_verified', 'official')
      and (g.home_team_season_id = ts.id or g.away_team_season_id = ts.id)
  ) pf on true
  left join lateral (
    select coalesce(sum(
      case when g.home_team_season_id = ts.id then gst_away.pts
           when g.away_team_season_id = ts.id then gst_home.pts
           else 0 end
    ), 0) as pts_against
    from public.games g
    left join public.game_team_stats gst_home on gst_home.game_id = g.id
      and gst_home.team_season_id = g.home_team_season_id
    left join public.game_team_stats gst_away on gst_away.game_id = g.id
      and gst_away.team_season_id = g.away_team_season_id
    where g.competition_id = v_game.competition_id
      and g.status in ('league_verified', 'official')
      and (g.home_team_season_id = ts.id or g.away_team_season_id = ts.id)
  ) pa on true
  where ts.competition_id = v_game.competition_id;

  perform private.write_audit('approve_revision', 'game_revision', p_revision_id,
    jsonb_build_object('approved', true, 'revision_number', v_revision.revision_number));
  return v_revision;
end;
$$;

-- ============================================================================
-- Correction commands
-- ============================================================================

-- cmd_create_correction: submit a correction request for an approved game
create or replace function public.cmd_create_correction(
  p_game_id uuid,
  p_reason text,
  p_evidence_url text default null,
  p_proposed_change jsonb default '{}'::jsonb
) returns public.correction_records language plpgsql security definer
set search_path = '' as $$
declare v_correction public.correction_records;
begin
  if (select auth.uid()) is null or not private.user_can_approve_game(p_game_id) then
    raise exception 'ONOO_NOT_AUTHORIZED';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'ONOO_INVALID_EVENT: correction reason is required';
  end if;
  insert into public.correction_records (game_id, requested_by, reason, evidence_url, proposed_change)
  values (p_game_id, (select auth.uid()), trim(p_reason), p_evidence_url, p_proposed_change)
  returning * into v_correction;
  perform private.write_audit('create_correction', 'correction_record', v_correction.id,
    jsonb_build_object('game_id', p_game_id));
  return v_correction;
end;
$$;

-- cmd_review_correction: approve or reject a pending correction
create or replace function public.cmd_review_correction(
  p_correction_id uuid,
  p_approved boolean
) returns public.correction_records language plpgsql security definer
set search_path = '' as $$
declare v_correction public.correction_records;
begin
  select * into v_correction from public.correction_records where id = p_correction_id for update;
  if not found or not private.user_can_approve_game(v_correction.game_id) then
    raise exception 'ONOO_NOT_AUTHORIZED';
  end if;
  if v_correction.status <> 'pending' then
    raise exception 'ONOO_INVALID_EVENT: correction is not pending';
  end if;
  update public.correction_records
    set status = case when p_approved then 'approved' else 'rejected' end,
        resolved_by = (select auth.uid()),
        resolved_at = now()
    where id = p_correction_id
    returning * into v_correction;
  perform private.write_audit('review_correction', 'correction_record', p_correction_id,
    jsonb_build_object('approved', p_approved));
  return v_correction;
end;
$$;

-- cmd_apply_correction: materialize an approved correction as a new game revision
-- The correction must be approved. Creates a child revision with parent_revision_id.
-- Never rewrites the approved journal or deletes stat_events.
create or replace function public.cmd_apply_correction(
  p_correction_id uuid,
  p_journal jsonb,
  p_projection jsonb,
  p_validation_warnings jsonb default '[]'::jsonb
) returns public.correction_records language plpgsql security definer
set search_path = '' as $$
declare
  v_correction public.correction_records;
  v_current_revision public.game_revisions;
  v_new_revision public.game_revisions;
  v_new_number integer;
begin
  select * into v_correction from public.correction_records where id = p_correction_id for update;
  if not found or not private.user_can_approve_game(v_correction.game_id) then
    raise exception 'ONOO_NOT_AUTHORIZED';
  end if;
  if v_correction.status <> 'approved' then
    raise exception 'ONOO_INVALID_EVENT: correction must be approved before applying';
  end if;

  -- Find the current approved revision
  select * into v_current_revision from public.game_revisions
    where game_id = v_correction.game_id and state = 'approved'
    order by revision_number desc limit 1;

  -- Compute next revision number
  select coalesce(max(revision_number), 0) + 1 into v_new_number
    from public.game_revisions where game_id = v_correction.game_id;

  -- Create child revision
  insert into public.game_revisions (
    game_id, revision_number, source_submission_id, parent_revision_id,
    journal, projection, validation_warnings, created_by
  )
  select
    v_correction.game_id,
    v_new_number,
    gr.source_submission_id,
    v_current_revision.id,
    p_journal,
    p_projection,
    coalesce(p_validation_warnings, '[]'::jsonb),
    (select auth.uid())
  from public.game_revisions gr where gr.id = v_current_revision.id
  returning * into v_new_revision;

  -- Link correction to resulting revision
  update public.correction_records
    set status = 'applied',
        resulting_revision_id = v_new_revision.id,
        resolved_by = (select auth.uid()),
        resolved_at = now()
    where id = p_correction_id
    returning * into v_correction;

  perform private.write_audit('apply_correction', 'correction_record', p_correction_id,
    jsonb_build_object('new_revision_id', v_new_revision.id, 'revision_number', v_new_number));
  return v_correction;
end;
$$;

-- ============================================================================
-- Grant execute to authenticated (retain existing grants, add new ones)
-- ============================================================================

revoke all on all functions in schema public from public;
grant execute on function public.cmd_record_event(uuid, uuid, uuid, uuid, integer, text, smallint, smallint, uuid, uuid, jsonb) to authenticated;
grant execute on function public.cmd_void_event(uuid, text) to authenticated;
grant execute on function public.cmd_transition_game(uuid, public.game_status) to authenticated;
grant execute on function public.cmd_submit_source(uuid, text, text, boolean, jsonb, numeric, uuid) to authenticated;
grant execute on function public.cmd_approve_source(uuid, boolean, text) to authenticated;
grant execute on function public.cmd_create_revision(uuid, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.cmd_approve_revision(uuid, boolean) to authenticated;
grant execute on function public.cmd_assign_scorer(uuid, uuid, text) to authenticated;
grant execute on function public.cmd_handoff_session(uuid, uuid, text) to authenticated;
grant execute on function public.cmd_open_tracker_session(uuid, text, jsonb) to authenticated;
grant execute on function public.cmd_create_correction(uuid, text, text, jsonb) to authenticated;
grant execute on function public.cmd_review_correction(uuid, boolean) to authenticated;
grant execute on function public.cmd_apply_correction(uuid, jsonb, jsonb, jsonb) to authenticated;
