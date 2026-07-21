-- Fix cmd_approve_revision: supersede clears approval fields, standings uses
-- coalesced sum subquery to avoid pkey duplicate. Also add helper functions
-- that edge functions depend on (is_league_admin, refresh_season_player_stats,
-- refresh_standings).

-- ============================================================================
-- 1. Fix cmd_approve_revision
--    Bug 1: Supersede didn't clear approved_at/approved_by, violating the
--           game_revisions_check constraint (state='approved' ↔ approved_at IS NOT NULL)
--    Bug 2: Standings INSERT used left join lateral (union all) which returned
--           multiple rows per team_season, causing standings_pkey violation.
--           Fixed by wrapping in coalesce(sum(...), 0) subquery.
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
  --     FIXED: wrap union all in coalesce(sum(...), 0) to avoid multiple rows per team_season
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
    select coalesce(sum(sub.wins), 0) as wins from (
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
    ) sub
  ) w on true
  left join lateral (
    select coalesce(sum(sub.losses), 0) as losses from (
      select count(*) as losses
      from public.games g
      join public.game_team_stats gst_a on gst_a.game_id = g.id
        and gst_a.team_season_id = g.away_team_season_id
        and gst_a.team_season_id <> ts.id
      join public.game_team_stats gst_h on gst_h.game_id = g.id and gst_h.team_season_id = ts.id
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
    ) sub
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
-- 2. Helper functions for edge functions
--    derive-game and manual-box-entry edge functions call these via supabase.rpc()
-- ============================================================================

-- is_league_admin: returns true if the current auth.uid() has admin role in the league
create or replace function public.is_league_admin(p_league_id uuid)
returns boolean language sql security definer
set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = (select auth.uid())
      and m.scope_type = 'league'
      and m.scope_id = p_league_id
      and m.role = 'admin'
  );
$$;

-- refresh_season_player_stats: rebuild season_player_stats for a competition
create or replace function public.refresh_season_player_stats(p_competition_id uuid)
returns void language plpgsql security definer
set search_path = '' as $$
begin
  delete from public.season_player_stats sps
    where sps.competition_id = p_competition_id;

  insert into public.season_player_stats (
    competition_id, player_id, team_season_id, gp, mpg,
    pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, ast, stl, blk, tov, pf
  )
  select
    p_competition_id,
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
    and g.competition_id = p_competition_id
    and g.status in ('league_verified', 'official')
  join public.game_revisions gr on gr.id = gps.revision_id and gr.state = 'approved'
  group by gps.player_id, gps.team_season_id;
end;
$$;

-- refresh_standings: rebuild standings for a competition
create or replace function public.refresh_standings(p_competition_id uuid)
returns void language plpgsql security definer
set search_path = '' as $$
begin
  delete from public.standings st
    where st.competition_id = p_competition_id;

  insert into public.standings (
    competition_id, team_season_id, wins, losses, win_pct, gb, points_for, points_against
  )
  select
    p_competition_id,
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
    select coalesce(sum(sub.wins), 0) as wins from (
      select count(*) as wins
      from public.games g
      join public.game_team_stats gst_h on gst_h.game_id = g.id and gst_h.team_season_id = ts.id
      join public.game_team_stats gst_a on gst_a.game_id = g.id
        and gst_a.team_season_id = g.away_team_season_id
        and gst_a.team_season_id <> ts.id
      where g.competition_id = p_competition_id
        and g.status in ('league_verified', 'official')
        and g.home_team_season_id = ts.id and gst_h.pts > gst_a.pts
      union all
      select count(*) as wins
      from public.games g
      join public.game_team_stats gst_a on gst_a.game_id = g.id and gst_a.team_season_id = ts.id
      join public.game_team_stats gst_h on gst_h.game_id = g.id
        and gst_h.team_season_id = g.home_team_season_id
        and gst_h.team_season_id <> ts.id
      where g.competition_id = p_competition_id
        and g.status in ('league_verified', 'official')
        and g.away_team_season_id = ts.id and gst_a.pts > gst_h.pts
    ) sub
  ) w on true
  left join lateral (
    select coalesce(sum(sub.losses), 0) as losses from (
      select count(*) as losses
      from public.games g
      join public.game_team_stats gst_a on gst_a.game_id = g.id
        and gst_a.team_season_id = g.away_team_season_id
        and gst_a.team_season_id <> ts.id
      join public.game_team_stats gst_h on gst_h.game_id = g.id and gst_h.team_season_id = ts.id
      where g.competition_id = p_competition_id
        and g.status in ('league_verified', 'official')
        and g.home_team_season_id = ts.id and gst_h.pts < gst_a.pts
      union all
      select count(*) as losses
      from public.games g
      join public.game_team_stats gst_a on gst_a.game_id = g.id
        and gst_a.team_season_id = g.away_team_season_id
        and gst_a.team_season_id <> ts.id
      join public.game_team_stats gst_h on gst_h.game_id = g.id and gst_h.team_season_id = ts.id
      where g.competition_id = p_competition_id
        and g.status in ('league_verified', 'official')
        and g.away_team_season_id = ts.id and gst_a.pts < gst_h.pts
    ) sub
  ) l on true
  left join lateral (
    select coalesce(sum(gst.pts), 0) as pts_for
    from public.games g
    join public.game_team_stats gst on gst.game_id = g.id and gst.team_season_id = ts.id
    where g.competition_id = p_competition_id
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
    where g.competition_id = p_competition_id
      and g.status in ('league_verified', 'official')
      and (g.home_team_season_id = ts.id or g.away_team_season_id = ts.id)
  ) pa on true
  where ts.competition_id = p_competition_id;
end;
$$;

-- Grant execute on new functions
grant execute on function public.is_league_admin(uuid) to authenticated;
grant execute on function public.refresh_season_player_stats(uuid) to authenticated;
grant execute on function public.refresh_standings(uuid) to authenticated;

-- ============================================================================
-- 3. apply_derived_stats: legacy RPC called by derive-game edge function
--    Writes game_player_stats, game_team_stats, transitions game status.
--    Edge functions need to be migrated to cmd_* pattern, but this keeps
--    them operational in the meantime.
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
    id, game_id, revision_number, source_submission_id, journal, projection, validation_warnings, state, created_by
  ) values (
    v_revision_id, p_game_id, v_revision_number, v_submission_id,
    jsonb_build_object('type', 'apply_derived_stats', 'player_stats', p_player_stats, 'team_stats', p_team_stats),
    jsonb_build_object('players', p_player_stats, 'teams', p_team_stats),
    '[]'::jsonb,
    'approved',
    (select auth.uid())
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

  -- Update game status and scores
  update public.games
    set status = p_status, home_score = p_home_score, away_score = p_away_score,
        current_revision_number = v_revision_number
    where id = p_game_id;
end;
$$;
grant execute on function public.apply_derived_stats(uuid, jsonb, jsonb, smallint, smallint, public.game_status) to authenticated;
