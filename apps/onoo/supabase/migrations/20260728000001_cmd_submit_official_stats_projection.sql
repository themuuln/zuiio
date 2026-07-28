-- ============================================================================
-- cmd_submit_official_stats (projection variant)
--
-- Replaces the old p_player_stats / p_team_stats parameters with a single
-- p_projection jsonb that carries players[], teams[], summary, period_scores,
-- and scoring_checkpoints. Also materializes the new derived tables and
-- includes the new player/team-level FIBA fields (plus_minus, fouls_committed,
-- fouls_drawn, flow stats, etc.).
-- ============================================================================

-- ── 1. Add new columns to game_player_stats ──────────────────────────────
alter table public.game_player_stats
  add column if not exists plus_minus smallint,
  add column if not exists fouls_committed smallint,
  add column if not exists fouls_drawn smallint;

-- ── 2. Add new columns to game_team_stats ────────────────────────────────
alter table public.game_team_stats
  add column if not exists fouls_committed smallint not null default 0,
  add column if not exists fouls_drawn smallint not null default 0,
  add column if not exists points_from_turnovers smallint,
  add column if not exists points_in_paint smallint,
  add column if not exists second_chance_points smallint,
  add column if not exists fast_break_points smallint,
  add column if not exists bench_points smallint,
  add column if not exists biggest_lead smallint,
  add column if not exists biggest_scoring_run_for smallint,
  add column if not exists biggest_scoring_run_against smallint,
  add column if not exists time_leading_seconds integer;

-- ── 3. Create derived tables for summary, period scores, checkpoints ─────
create table if not exists public.game_summary_stats (
  game_id uuid not null references public.games(id) on delete cascade,
  revision_id uuid not null references public.game_revisions(id) on delete restrict,
  lead_changes smallint,
  times_tied smallint,
  primary key (game_id)
);

create table if not exists public.game_period_scores (
  game_id uuid not null references public.games(id) on delete cascade,
  revision_id uuid not null references public.game_revisions(id) on delete restrict,
  period smallint not null check (period > 0),
  home_points smallint not null check (home_points >= 0),
  away_points smallint not null check (away_points >= 0),
  primary key (game_id, period)
);

create table if not exists public.game_scoring_checkpoints (
  game_id uuid not null references public.games(id) on delete cascade,
  revision_id uuid not null references public.game_revisions(id) on delete restrict,
  elapsed_seconds integer not null check (elapsed_seconds > 0),
  home_score smallint not null check (home_score >= 0),
  away_score smallint not null check (away_score >= 0),
  primary key (game_id, elapsed_seconds)
);

-- ── 4. Enable RLS on new tables ─────────────────────────────────────────
alter table public.game_summary_stats enable row level security;
alter table public.game_period_scores enable row level security;
alter table public.game_scoring_checkpoints enable row level security;

-- Public SELECT for league_verified / official games (same pattern as game_player_stats)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'public_read_game_summary_stats' and tablename = 'game_summary_stats') then
    create policy public_read_game_summary_stats on public.game_summary_stats
      for select using (
        exists (
          select 1 from public.games g
          where g.id = game_id
            and g.status in ('league_verified', 'official')
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'public_read_game_period_scores' and tablename = 'game_period_scores') then
    create policy public_read_game_period_scores on public.game_period_scores
      for select using (
        exists (
          select 1 from public.games g
          where g.id = game_id
            and g.status in ('league_verified', 'official')
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'public_read_game_scoring_checkpoints' and tablename = 'game_scoring_checkpoints') then
    create policy public_read_game_scoring_checkpoints on public.game_scoring_checkpoints
      for select using (
        exists (
          select 1 from public.games g
          where g.id = game_id
            and g.status in ('league_verified', 'official')
        )
      );
  end if;
end $$;

-- ── 5. Create or replace function with new signature ─────────────────────
create or replace function public.cmd_submit_official_stats(
  p_game_id uuid,
  p_evidence_url text,
  p_normalized_payload jsonb,
  p_projection jsonb,
  p_home_score smallint,
  p_away_score smallint
) returns jsonb language plpgsql security definer
set search_path = '' as $$
declare
  v_submission public.source_submissions;
  v_revision public.game_revisions;
  v_revision_number integer;
  v_idempotency_key uuid := gen_random_uuid();
  v_player jsonb;
  v_team jsonb;
begin
  -- 1. Authorize: user must be able to score this game
  if (select auth.uid()) is null then
    raise exception 'ONOO_NOT_AUTHENTICATED';
  end if;
  if not private.user_can_score_game(p_game_id) then
    raise exception 'ONOO_NOT_AUTHORIZED';
  end if;

  -- 2. Validate projection has players and teams arrays
  if p_projection is null or jsonb_typeof(p_projection) <> 'object' then
    raise exception 'ONOO_INVALID_PROJECTION: p_projection must be a JSON object';
  end if;
  if p_projection->'players' is null or jsonb_typeof(p_projection->'players') <> 'array' or jsonb_array_length(p_projection->'players') = 0 then
    raise exception 'ONOO_INVALID_PROJECTION: players must be a non-empty array';
  end if;
  if p_projection->'teams' is null or jsonb_typeof(p_projection->'teams') <> 'array' or jsonb_array_length(p_projection->'teams') = 0 then
    raise exception 'ONOO_INVALID_PROJECTION: teams must be a non-empty array';
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
    p_projection,
    '[]'::jsonb,
    'approved', (select auth.uid()), (select auth.uid()), now()
  )
  returning * into v_revision;

  -- 6. Supersede prior approved revision
  update public.game_revisions
    set state = 'superseded',
        approved_at = null,
        approved_by = null
    where game_id = p_game_id
      and id <> v_revision.id
      and state = 'approved';

  -- 7. Delete existing stats for this game (they'll be replaced)
  delete from public.game_player_stats where game_id = p_game_id;
  delete from public.game_team_stats where game_id = p_game_id;
  delete from public.game_summary_stats where game_id = p_game_id;
  delete from public.game_period_scores where game_id = p_game_id;
  delete from public.game_scoring_checkpoints where game_id = p_game_id;

  -- 8. Materialize game_player_stats
  insert into public.game_player_stats (
    game_id, player_id, team_season_id, revision_id,
    seconds_played, pts, fgm, fga, tpm, tpa, ftm, fta,
    oreb, dreb, ast, stl, blk, tov, pf,
    plus_minus, fouls_committed, fouls_drawn
  )
  select
    p_game_id,
    (value->>'player_id')::uuid,
    (value->>'team_season_id')::uuid,
    v_revision.id,
    (value->>'seconds_played')::integer,
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
    coalesce((value->>'pf')::smallint, 0),
    (value->>'plus_minus')::smallint,
    (value->>'fouls_committed')::smallint,
    (value->>'fouls_drawn')::smallint
  from jsonb_array_elements(p_projection->'players');

  -- 9. Materialize game_team_stats
  insert into public.game_team_stats (
    game_id, team_season_id, revision_id,
    pts, fgm, fga, tpm, tpa, ftm, fta,
    oreb, dreb, team_reb, ast, stl, blk, tov, pf,
    fouls_committed, fouls_drawn,
    points_from_turnovers, points_in_paint, second_chance_points,
    fast_break_points, bench_points,
    biggest_lead, biggest_scoring_run_for, biggest_scoring_run_against,
    time_leading_seconds
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
    coalesce((value->>'pf')::smallint, 0),
    coalesce((value->>'fouls_committed')::smallint, 0),
    coalesce((value->>'fouls_drawn')::smallint, 0),
    (value->>'points_from_turnovers')::smallint,
    (value->>'points_in_paint')::smallint,
    (value->>'second_chance_points')::smallint,
    (value->>'fast_break_points')::smallint,
    (value->>'bench_points')::smallint,
    (value->>'biggest_lead')::smallint,
    (value->>'biggest_scoring_run_for')::smallint,
    (value->>'biggest_scoring_run_against')::smallint,
    (value->>'time_leading_seconds')::integer
  from jsonb_array_elements(p_projection->'teams');

  -- 10. Materialize game_summary_stats
  if p_projection->'summary' is not null and jsonb_typeof(p_projection->'summary') = 'object' then
    insert into public.game_summary_stats (game_id, revision_id, lead_changes, times_tied)
    values (
      p_game_id,
      v_revision.id,
      (p_projection->'summary'->>'lead_changes')::smallint,
      (p_projection->'summary'->>'times_tied')::smallint
    )
    on conflict (game_id) do update set
      revision_id = v_revision.id,
      lead_changes = excluded.lead_changes,
      times_tied = excluded.times_tied;
  end if;

  -- 11. Materialize game_period_scores
  if p_projection->'period_scores' is not null and jsonb_typeof(p_projection->'period_scores') = 'array' then
    insert into public.game_period_scores (game_id, revision_id, period, home_points, away_points)
    select
      p_game_id,
      v_revision.id,
      (value->>'period')::smallint,
      (value->>'home_points')::smallint,
      (value->>'away_points')::smallint
    from jsonb_array_elements(p_projection->'period_scores');
  end if;

  -- 12. Materialize game_scoring_checkpoints
  if p_projection->'scoring_checkpoints' is not null and jsonb_typeof(p_projection->'scoring_checkpoints') = 'array' then
    insert into public.game_scoring_checkpoints (game_id, revision_id, elapsed_seconds, home_score, away_score)
    select
      p_game_id,
      v_revision.id,
      (value->>'elapsed_seconds')::integer,
      (value->>'home_score')::smallint,
      (value->>'away_score')::smallint
    from jsonb_array_elements(p_projection->'scoring_checkpoints');
  end if;

  -- 13. Update game scores, set current revision, publish instantly
  update public.games
    set
      home_score = p_home_score,
      away_score = p_away_score,
      current_revision_number = v_revision_number,
      status = 'league_verified',
      published_at = now()
    where id = p_game_id;

  -- 14. Rebuild season_player_stats + standings for the competition
  perform public.refresh_season_player_stats(
    (select competition_id from public.games where id = p_game_id)
  );
  perform public.refresh_standings(
    (select competition_id from public.games where id = p_game_id)
  );

  -- 15. Write audit log
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

-- ── 6. Revoke old signature, grant new one ───────────────────────────────
revoke execute on function public.cmd_submit_official_stats(uuid, text, jsonb, jsonb, jsonb, smallint, smallint) from authenticated;
grant execute on function public.cmd_submit_official_stats(uuid, text, jsonb, jsonb, smallint, smallint) to authenticated;
