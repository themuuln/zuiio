-- V2 authorization boundary: direct writes are denied; audited commands are the only mutation path.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create function private.user_can_manage_game(p_game_id uuid)
returns boolean language sql stable security definer
set search_path = '' as $$
  select exists (
    select 1 from public.games g
    join public.competitions c on c.id = g.competition_id
    join public.seasons s on s.id = c.season_id
    join public.memberships m on (
      (m.scope_type = 'league' and m.scope_id = s.league_id)
      or (m.scope_type = 'org' and m.scope_id = (select l.organization_id from public.leagues l where l.id = s.league_id))
    )
    where g.id = p_game_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager')
  );
$$;

create function private.user_can_score_game(p_game_id uuid)
returns boolean language sql stable security definer
set search_path = '' as $$
  select exists (
    select 1 from public.game_assignments ga
    where ga.game_id = p_game_id
      and ga.user_id = (select auth.uid())
      and ga.role in ('lead_scorer', 'backup_scorer')
  ) or private.user_can_manage_game(p_game_id);
$$;

create function private.user_can_approve_game(p_game_id uuid)
returns boolean language sql stable security definer
set search_path = '' as $$
  select exists (
    select 1 from public.game_assignments ga
    where ga.game_id = p_game_id
      and ga.user_id = (select auth.uid())
      and ga.role = 'approving_official'
  ) or private.user_can_manage_game(p_game_id);
$$;

create function private.write_audit(
  p_action text, p_entity_type text, p_entity_id uuid, p_payload jsonb default '{}'::jsonb
) returns void language plpgsql security definer
set search_path = '' as $$
begin
  insert into public.audit_log (user_id, action, entity_type, entity_id, payload)
  values ((select auth.uid()), p_action, p_entity_type, p_entity_id, p_payload);
end;
$$;

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated, service_role;

alter table public.sports enable row level security;
alter table public.organizations enable row level security;
alter table public.leagues enable row level security;
alter table public.seasons enable row level security;
alter table public.competitions enable row level security;
alter table public.venues enable row level security;
alter table public.teams enable row level security;
alter table public.team_seasons enable row level security;
alter table public.players enable row level security;
alter table public.roster_entries enable row level security;
alter table public.basketball_rulesets enable row level security;
alter table public.games enable row level security;
alter table public.game_rosters enable row level security;
alter table public.game_assignments enable row level security;
alter table public.stat_event_types enable row level security;
alter table public.stat_events enable row level security;
alter table public.tracker_sessions enable row level security;
alter table public.memberships enable row level security;
alter table public.profiles enable row level security;
alter table public.source_submissions enable row level security;
alter table public.game_revisions enable row level security;
alter table public.correction_records enable row level security;
alter table public.player_aliases enable row level security;
alter table public.player_merge_history enable row level security;
alter table public.game_player_stats enable row level security;
alter table public.game_team_stats enable row level security;
alter table public.season_player_stats enable row level security;
alter table public.standings enable row level security;
alter table public.audit_log enable row level security;

-- Public tables are read-only; pending and operational records are never public.
create policy public_read_sports on public.sports for select to anon, authenticated using (true);
create policy public_read_organizations on public.organizations for select to anon, authenticated using (true);
create policy public_read_leagues on public.leagues for select to anon, authenticated using (true);
create policy public_read_seasons on public.seasons for select to anon, authenticated using (true);
create policy public_read_competitions on public.competitions for select to anon, authenticated using (true);
create policy public_read_venues on public.venues for select to anon, authenticated using (true);
create policy public_read_teams on public.teams for select to anon, authenticated using (true);
create policy public_read_team_seasons on public.team_seasons for select to anon, authenticated using (true);
create policy public_read_players on public.players for select to anon, authenticated using (true);
create policy public_read_roster_entries on public.roster_entries for select to anon, authenticated using (true);
create policy public_read_rulesets on public.basketball_rulesets for select to anon, authenticated using (retired_at is null);
create policy public_read_games on public.games for select to anon, authenticated using (status in ('league_verified', 'official'));
create policy public_read_game_rosters on public.game_rosters for select to anon, authenticated using (
  exists (select 1 from public.games g where g.id = game_id and g.status in ('league_verified', 'official'))
);
create policy public_read_event_types on public.stat_event_types for select to anon, authenticated using (true);
create policy public_read_game_player_stats on public.game_player_stats for select to anon, authenticated using (
  exists (select 1 from public.games g where g.id = game_id and g.status in ('league_verified', 'official'))
);
create policy public_read_game_team_stats on public.game_team_stats for select to anon, authenticated using (
  exists (select 1 from public.games g where g.id = game_id and g.status in ('league_verified', 'official'))
);
create policy public_read_season_player_stats on public.season_player_stats for select to anon, authenticated using (true);
create policy public_read_standings on public.standings for select to anon, authenticated using (true);
create policy public_read_player_aliases on public.player_aliases for select to anon, authenticated using (true);
create policy public_read_approved_sources on public.source_submissions for select to anon, authenticated using (
  status = 'approved' and exists (
    select 1 from public.games g where g.id = game_id and g.status in ('league_verified', 'official')
  )
);
create policy public_read_approved_revisions on public.game_revisions for select to anon, authenticated using (
  state = 'approved' and exists (
    select 1 from public.games g
    where g.id = game_id and g.status in ('league_verified', 'official') and g.current_revision_number = revision_number
  )
);

-- Operators can inspect only the records required for assigned games or their own submissions.
create policy operators_read_assignments on public.game_assignments for select to authenticated using (
  user_id = (select auth.uid()) or private.user_can_manage_game(game_id)
);
create policy operators_read_events on public.stat_events for select to authenticated using (
  created_by = (select auth.uid()) or private.user_can_score_game(game_id) or private.user_can_approve_game(game_id)
);
create policy operators_read_sessions on public.tracker_sessions for select to authenticated using (
  scorer_id = (select auth.uid()) or private.user_can_score_game(game_id) or private.user_can_approve_game(game_id)
);
create policy operators_read_submissions on public.source_submissions for select to authenticated using (
  submitted_by = (select auth.uid()) or private.user_can_approve_game(game_id)
);
create policy operators_read_revisions on public.game_revisions for select to authenticated using (
  created_by = (select auth.uid()) or private.user_can_approve_game(game_id)
);
create policy operators_read_corrections on public.correction_records for select to authenticated using (
  requested_by = (select auth.uid()) or private.user_can_approve_game(game_id)
);
create policy users_read_profile on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy users_update_profile on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy users_read_memberships on public.memberships for select to authenticated using (user_id = (select auth.uid()));
create policy operators_read_merges on public.player_merge_history for select to authenticated using (true);
create policy operators_read_audit on public.audit_log for select to authenticated using (
  exists (select 1 from public.games g where g.id = audit_log.entity_id and private.user_can_approve_game(g.id))
);

-- No INSERT/UPDATE/DELETE policy exists for authoritative tables: commands below bypass RLS after authorization.

create function public.cmd_record_event(
  p_game_id uuid, p_tracker_session_id uuid, p_operation_id uuid, p_client_id uuid,
  p_local_seq integer, p_event_type text, p_period smallint, p_clock_seconds smallint,
  p_team_season_id uuid, p_player_id uuid, p_payload jsonb default '{}'::jsonb
) returns public.stat_events language plpgsql security definer
set search_path = '' as $$
declare v_event public.stat_events;
begin
  if (select auth.uid()) is null or not private.user_can_score_game(p_game_id) then
    raise exception 'not authorized to record events';
  end if;
  if not exists (
    select 1 from public.tracker_sessions s where s.id = p_tracker_session_id and s.game_id = p_game_id
      and s.scorer_id = (select auth.uid()) and s.status = 'active'
  ) then raise exception 'active tracker session required'; end if;
  if not exists (select 1 from public.games g where g.id = p_game_id and g.status = 'live_provisional') then
    raise exception 'game is not live provisional';
  end if;
  insert into public.stat_events (
    game_id, tracker_session_id, operation_id, client_id, local_seq, event_type, period,
    clock_seconds, team_season_id, player_id, payload, created_by
  ) values (
    p_game_id, p_tracker_session_id, p_operation_id, p_client_id, p_local_seq, p_event_type,
    p_period, p_clock_seconds, p_team_season_id, p_player_id, coalesce(p_payload, '{}'::jsonb), (select auth.uid())
  ) on conflict (operation_id) do nothing
  returning * into v_event;
  if v_event.id is null then
    select * into v_event from public.stat_events
    where operation_id = p_operation_id and game_id = p_game_id and created_by = (select auth.uid());
    if not found then raise exception 'idempotency key belongs to another command'; end if;
  end if;
  update public.tracker_sessions set last_acknowledged_sequence = greatest(last_acknowledged_sequence, p_local_seq)
    where id = p_tracker_session_id;
  perform private.write_audit('record_event', 'stat_event', v_event.id, jsonb_build_object('game_id', p_game_id));
  return v_event;
end;
$$;

create function public.cmd_void_event(p_event_id uuid, p_reason text)
returns public.stat_events language plpgsql security definer
set search_path = '' as $$
declare v_event public.stat_events;
begin
  select * into v_event from public.stat_events where id = p_event_id for update;
  if not found or not private.user_can_score_game(v_event.game_id) then raise exception 'not authorized to void event'; end if;
  update public.stat_events set voided_at = now(), voided_by = (select auth.uid()), void_reason = nullif(trim(p_reason), '')
    where id = p_event_id returning * into v_event;
  perform private.write_audit('void_event', 'stat_event', p_event_id, jsonb_build_object('reason', p_reason));
  return v_event;
end;
$$;

create function public.cmd_transition_game(p_game_id uuid, p_to_status public.game_status)
returns public.games language plpgsql security definer
set search_path = '' as $$
declare v_game public.games;
begin
  select * into v_game from public.games where id = p_game_id for update;
  if not found then raise exception 'game not found'; end if;
  if p_to_status = 'live_provisional' and not private.user_can_score_game(p_game_id) then raise exception 'not authorized'; end if;
  if p_to_status in ('final_pending_review', 'league_verified', 'official', 'cancelled', 'postponed') and not private.user_can_approve_game(p_game_id) then raise exception 'not authorized'; end if;
  if not ((v_game.status = 'scheduled' and p_to_status in ('live_provisional', 'cancelled', 'postponed'))
       or (v_game.status = 'live_provisional' and p_to_status in ('final_pending_review', 'cancelled'))
       or (v_game.status = 'final_pending_review' and p_to_status in ('league_verified', 'live_provisional'))
       or (v_game.status = 'league_verified' and p_to_status in ('official', 'final_pending_review'))
       or v_game.status = p_to_status) then raise exception 'invalid game status transition'; end if;
  update public.games set status = p_to_status, published_at = case when p_to_status in ('league_verified', 'official') then now() else published_at end
    where id = p_game_id returning * into v_game;
  perform private.write_audit('transition_game', 'game', p_game_id, jsonb_build_object('status', p_to_status));
  return v_game;
end;
$$;

create function public.cmd_submit_source(
  p_game_id uuid, p_source_type text, p_evidence_url text, p_rights_confirmed boolean,
  p_normalized_payload jsonb, p_confidence numeric, p_idempotency_key uuid
) returns public.source_submissions language plpgsql security definer
set search_path = '' as $$
declare v_submission public.source_submissions;
begin
  if (select auth.uid()) is null or not private.user_can_score_game(p_game_id) then raise exception 'not authorized'; end if;
  if p_source_type not in ('tracker_journal', 'official_score_sheet', 'manual_box_score', 'import') then raise exception 'invalid source type'; end if;
  insert into public.source_submissions (game_id, source_type, evidence_url, rights_confirmed_at, submitted_by, normalized_payload, confidence, idempotency_key)
  values (p_game_id, p_source_type, p_evidence_url, case when p_rights_confirmed then now() end, (select auth.uid()), p_normalized_payload, p_confidence, p_idempotency_key)
  on conflict (submitted_by, idempotency_key) do update set idempotency_key = excluded.idempotency_key
  returning * into v_submission;
  perform private.write_audit('submit_source', 'source_submission', v_submission.id, jsonb_build_object('game_id', p_game_id));
  return v_submission;
end;
$$;

create function public.cmd_approve_source(p_submission_id uuid, p_approved boolean, p_note text default null)
returns public.source_submissions language plpgsql security definer
set search_path = '' as $$
declare v_submission public.source_submissions;
begin
  select * into v_submission from public.source_submissions where id = p_submission_id for update;
  if not found or not private.user_can_approve_game(v_submission.game_id) then raise exception 'not authorized'; end if;
  update public.source_submissions set status = case when p_approved then 'approved' else 'rejected' end,
    reviewed_by = (select auth.uid()), reviewed_at = now(), review_note = p_note where id = p_submission_id returning * into v_submission;
  perform private.write_audit('review_source', 'source_submission', p_submission_id, jsonb_build_object('approved', p_approved));
  return v_submission;
end;
$$;

create function public.cmd_create_revision(p_submission_id uuid, p_journal jsonb, p_projection jsonb, p_validation_warnings jsonb default '[]'::jsonb)
returns public.game_revisions language plpgsql security definer
set search_path = '' as $$
declare v_submission public.source_submissions; v_revision public.game_revisions; v_number integer;
begin
  select * into v_submission from public.source_submissions where id = p_submission_id for update;
  if not found or v_submission.status <> 'approved' or not private.user_can_approve_game(v_submission.game_id) then raise exception 'approved source and reviewer required'; end if;
  select coalesce(max(revision_number), 0) + 1 into v_number from public.game_revisions where game_id = v_submission.game_id;
  insert into public.game_revisions (game_id, revision_number, source_submission_id, journal, projection, validation_warnings, created_by)
  values (v_submission.game_id, v_number, p_submission_id, p_journal, p_projection, coalesce(p_validation_warnings, '[]'::jsonb), (select auth.uid())) returning * into v_revision;
  return v_revision;
end;
$$;

create function public.cmd_approve_revision(p_revision_id uuid, p_approved boolean)
returns public.game_revisions language plpgsql security definer
set search_path = '' as $$
declare v_revision public.game_revisions;
begin
  select * into v_revision from public.game_revisions where id = p_revision_id for update;
  if not found or not private.user_can_approve_game(v_revision.game_id) then raise exception 'not authorized'; end if;
  update public.game_revisions set state = case when p_approved then 'approved' else 'rejected' end,
    approved_by = (select auth.uid()), approved_at = now() where id = p_revision_id returning * into v_revision;
  if p_approved then
    update public.game_revisions set state = 'superseded' where game_id = v_revision.game_id and id <> p_revision_id and state = 'approved';
    update public.games set current_revision_number = v_revision.revision_number where id = v_revision.game_id;
  end if;
  perform private.write_audit('review_revision', 'game_revision', p_revision_id, jsonb_build_object('approved', p_approved));
  return v_revision;
end;
$$;

create function public.cmd_assign_scorer(p_game_id uuid, p_user_id uuid, p_role text)
returns public.game_assignments language plpgsql security definer
set search_path = '' as $$
declare v_assignment public.game_assignments;
begin
  if not private.user_can_manage_game(p_game_id) then raise exception 'not authorized'; end if;
  if p_role not in ('lead_scorer', 'backup_scorer', 'approving_official') then raise exception 'invalid assignment role'; end if;
  insert into public.game_assignments (game_id, user_id, role, assigned_by) values (p_game_id, p_user_id, p_role, (select auth.uid()))
  on conflict (game_id, user_id, role) do update set assigned_by = excluded.assigned_by returning * into v_assignment;
  perform private.write_audit('assign_game_role', 'game_assignment', v_assignment.id, jsonb_build_object('game_id', p_game_id, 'role', p_role));
  return v_assignment;
end;
$$;

create function public.cmd_handoff_session(p_session_id uuid, p_to_user_id uuid, p_reason text)
returns public.tracker_sessions language plpgsql security definer
set search_path = '' as $$
declare v_from public.tracker_sessions; v_to public.tracker_sessions;
begin
  select * into v_from from public.tracker_sessions where id = p_session_id for update;
  if not found or v_from.scorer_id <> (select auth.uid()) or v_from.status <> 'active' then raise exception 'active owned session required'; end if;
  if not exists (select 1 from public.game_assignments where game_id = v_from.game_id and user_id = p_to_user_id and role in ('lead_scorer', 'backup_scorer')) then raise exception 'recipient is not an assigned scorer'; end if;
  update public.tracker_sessions
  set status = 'transferred', closed_at = now(), closure_reason = nullif(trim(p_reason), '')
  where id = p_session_id;
  insert into public.tracker_sessions (game_id, scorer_id, role, device_info, status, last_acknowledged_sequence)
  values (v_from.game_id, p_to_user_id, v_from.role, '{}'::jsonb, 'active', v_from.last_acknowledged_sequence)
  returning * into v_to;
  update public.tracker_sessions set handed_off_to_session_id = v_to.id where id = p_session_id;
  perform private.write_audit('handoff_session', 'tracker_session', p_session_id, jsonb_build_object('to_session_id', v_to.id));
  return v_to;
end;
$$;

create function public.cmd_open_tracker_session(p_game_id uuid, p_role text, p_device_info jsonb default '{}'::jsonb)
returns public.tracker_sessions language plpgsql security definer
set search_path = '' as $$
declare v_session public.tracker_sessions;
begin
  if (select auth.uid()) is null or p_role not in ('lead_scorer', 'backup_scorer')
    or not exists (select 1 from public.game_assignments where game_id = p_game_id and user_id = (select auth.uid()) and role = p_role)
  then raise exception 'not authorized to open tracker session'; end if;
  select * into v_session from public.tracker_sessions
    where game_id = p_game_id and scorer_id = (select auth.uid()) and status = 'active';
  if found then return v_session; end if;
  insert into public.tracker_sessions (game_id, scorer_id, role, device_info)
  values (p_game_id, (select auth.uid()), p_role, coalesce(p_device_info, '{}'::jsonb))
  returning * into v_session;
  perform private.write_audit('open_session', 'tracker_session', v_session.id, jsonb_build_object('game_id', p_game_id));
  return v_session;
end;
$$;

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
