-- Allows cmd_record_event to accept idempotent retries from superseded tracker
-- sessions so that pending IndexedDB queue ops on the old device can flush
-- before the tracker locks. Truly new ops from a superseded session are rejected.

-- ============================================================================
-- Update cmd_record_event — relax session check for superseded idempotency
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

  -- 3a. For superseded sessions: allow idempotent retry only (existing op)
  if v_session.status = 'transferred' then
    select * into v_event from public.stat_events
      where operation_id = p_operation_id and game_id = p_game_id
        and created_by = v_session.scorer_id;
    if not found then
      raise exception 'ONOO_SESSION_SUPERSEDED: session has been handed off — new events rejected';
    end if;
    return v_event;
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
