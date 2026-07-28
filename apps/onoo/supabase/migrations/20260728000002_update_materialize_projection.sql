-- ============================================================================
-- Update private.materialize_projection to handle FIBA official stat fields
--
-- Changes from the previous version:
-- 1. game_player_stats INSERT: added plus_minus, fouls_committed, fouls_drawn
--    (nullable, direct cast without coalesce)
-- 2. game_team_stats INSERT: added fouls_committed, fouls_drawn (coalesce 0),
--    plus points_from_turnovers, points_in_paint, second_chance_points,
--    fast_break_points, bench_points, biggest_lead, biggest_scoring_run_for,
--    biggest_scoring_run_against, time_leading_seconds (nullable, direct cast)
-- 3. After game_team_stats: derived table materialization for
--    game_summary_stats, game_period_scores, game_scoring_checkpoints
-- 4. season_player_stats aggregate: added plus_minus, fouls_committed,
--    fouls_drawn columns; GP now excludes DNP rows (seconds_played IS NOT NULL)
-- 5. Validation checks unchanged — new nullable fields are not checked for
--    negativity (plus_minus legitimately negative; stat-flow fields nullable)
-- ============================================================================
create or replace function private.materialize_projection(
  p_game_id uuid,
  p_revision_id uuid,
  p_projection jsonb,
  p_competition_id uuid
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player record;
  v_team record;
  v_game_player public.game_player_stats;
  v_game_team public.game_team_stats;
begin
  -- Validate projection shape
  if p_projection is null
     or jsonb_typeof(p_projection->'players') <> 'array'
     or jsonb_typeof(p_projection->'teams') <> 'array'
  then
    raise exception 'ONOO_PROJECTION_INVALID: projection must contain players[] and teams[]';
  end if;

  -- 1. Materialize game_player_stats
  delete from public.game_player_stats where game_id = p_game_id;

  for v_player in
    select value as obj from jsonb_array_elements(p_projection->'players')
  loop
    if (v_player.obj->>'player_id') is null
       or (v_player.obj->>'team_season_id') is null
    then
      raise exception 'ONOO_PROJECTION_INVALID: player object missing player_id or team_season_id';
    end if;
    if not exists (
      select 1 from public.game_rosters gr
      where gr.game_id = p_game_id
        and gr.player_id = (v_player.obj->>'player_id')::uuid
        and gr.team_season_id = (v_player.obj->>'team_season_id')::uuid
    ) then
      raise exception 'ONOO_ROSTER_MISMATCH: projected player not in game roster';
    end if;

    insert into public.game_player_stats (
      game_id, player_id, team_season_id, revision_id,
      seconds_played, pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, ast, stl, blk, tov, pf,
      plus_minus, fouls_committed, fouls_drawn
    ) values (
      p_game_id,
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
      coalesce((v_player.obj->>'pf')::smallint, 0),
      (v_player.obj->>'plus_minus')::smallint,
      (v_player.obj->>'fouls_committed')::smallint,
      (v_player.obj->>'fouls_drawn')::smallint
    ) returning * into v_game_player;

    -- Validate non-negative counters (nullable fields excluded)
    if v_game_player.pts < 0 or v_game_player.fgm < 0 or v_game_player.fga < 0
       or v_game_player.tpm < 0 or v_game_player.tpa < 0 or v_game_player.ftm < 0
       or v_game_player.fta < 0 or v_game_player.oreb < 0 or v_game_player.dreb < 0
       or v_game_player.ast < 0 or v_game_player.stl < 0 or v_game_player.blk < 0
       or v_game_player.tov < 0 or v_game_player.pf < 0
    then
      raise exception 'ONOO_PROJECTION_INVALID: negative counter in player stats';
    end if;
  end loop;

  -- 2. Materialize game_team_stats
  delete from public.game_team_stats where game_id = p_game_id;

  for v_team in
    select value as obj from jsonb_array_elements(p_projection->'teams')
  loop
    if (v_team.obj->>'team_season_id') is null then
      raise exception 'ONOO_PROJECTION_INVALID: team object missing team_season_id';
    end if;

    insert into public.game_team_stats (
      game_id, team_season_id, revision_id,
      pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, team_reb, ast, stl, blk, tov, pf,
      fouls_committed, fouls_drawn,
      points_from_turnovers, points_in_paint, second_chance_points,
      fast_break_points, bench_points,
      biggest_lead, biggest_scoring_run_for, biggest_scoring_run_against,
      time_leading_seconds
    ) values (
      p_game_id,
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
      coalesce((v_team.obj->>'pf')::smallint, 0),
      coalesce((v_team.obj->>'fouls_committed')::smallint, 0),
      coalesce((v_team.obj->>'fouls_drawn')::smallint, 0),
      (v_team.obj->>'points_from_turnovers')::smallint,
      (v_team.obj->>'points_in_paint')::smallint,
      (v_team.obj->>'second_chance_points')::smallint,
      (v_team.obj->>'fast_break_points')::smallint,
      (v_team.obj->>'bench_points')::smallint,
      (v_team.obj->>'biggest_lead')::smallint,
      (v_team.obj->>'biggest_scoring_run_for')::smallint,
      (v_team.obj->>'biggest_scoring_run_against')::smallint,
      (v_team.obj->>'time_leading_seconds')::integer
    ) returning * into v_game_team;

    -- Validate non-negative counters (nullable flow fields excluded)
    if v_game_team.pts < 0 or v_game_team.fgm < 0 or v_game_team.fga < 0
       or v_game_team.tpm < 0 or v_game_team.tpa < 0 or v_game_team.ftm < 0
       or v_game_team.fta < 0 or v_game_team.oreb < 0 or v_game_team.dreb < 0
       or v_game_team.team_reb < 0 or v_game_team.ast < 0 or v_game_team.stl < 0
       or v_game_team.blk < 0 or v_game_team.tov < 0 or v_game_team.pf < 0
    then
      raise exception 'ONOO_PROJECTION_INVALID: negative counter in team stats';
    end if;
  end loop;

  -- 3. Materialize derived tables (summary, period scores, scoring checkpoints)
  delete from public.game_summary_stats where game_id = p_game_id;
  delete from public.game_period_scores where game_id = p_game_id;
  delete from public.game_scoring_checkpoints where game_id = p_game_id;

  if p_projection->'summary' is not null and jsonb_typeof(p_projection->'summary') = 'object' then
    insert into public.game_summary_stats (game_id, revision_id, lead_changes, times_tied)
    values (
      p_game_id,
      p_revision_id,
      (p_projection->'summary'->>'lead_changes')::smallint,
      (p_projection->'summary'->>'times_tied')::smallint
    );
  end if;

  if p_projection->'period_scores' is not null and jsonb_typeof(p_projection->'period_scores') = 'array' then
    insert into public.game_period_scores (game_id, revision_id, period, home_points, away_points)
    select
      p_game_id,
      p_revision_id,
      (value->>'period')::smallint,
      (value->>'home_points')::smallint,
      (value->>'away_points')::smallint
    from jsonb_array_elements(p_projection->'period_scores');
  end if;

  if p_projection->'scoring_checkpoints' is not null and jsonb_typeof(p_projection->'scoring_checkpoints') = 'array' then
    insert into public.game_scoring_checkpoints (game_id, revision_id, elapsed_seconds, home_score, away_score)
    select
      p_game_id,
      p_revision_id,
      (value->>'elapsed_seconds')::integer,
      (value->>'home_score')::smallint,
      (value->>'away_score')::smallint
    from jsonb_array_elements(p_projection->'scoring_checkpoints');
  end if;

  -- 4. Update game scores from team stats
  update public.games g
    set
      home_score = (
        select gst.pts from public.game_team_stats gst
        where gst.game_id = p_game_id and gst.team_season_id = g.home_team_season_id
      ),
      away_score = (
        select gst.pts from public.game_team_stats gst
        where gst.game_id = p_game_id and gst.team_season_id = g.away_team_season_id
      )
    where g.id = p_game_id;

  -- 5. Rebuild season_player_stats for the competition
  delete from public.season_player_stats sps
    where sps.competition_id = p_competition_id;

  insert into public.season_player_stats (
    competition_id, player_id, team_season_id, gp, mpg,
    pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, ast, stl, blk, tov, pf,
    plus_minus, fouls_committed, fouls_drawn
  )
  select
    p_competition_id,
    gps.player_id,
    gps.team_season_id,
    count(distinct gps.game_id) filter (where gps.seconds_played is not null)::smallint as gp,
    case when count(distinct gps.game_id) filter (where gps.seconds_played is not null) > 0
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
    round(avg(gps.pf), 1) as pf,
    round(avg(gps.plus_minus), 1) as plus_minus,
    round(avg(gps.fouls_committed), 1) as fouls_committed,
    round(avg(gps.fouls_drawn), 1) as fouls_drawn
  from public.game_player_stats gps
  join public.games g on g.id = gps.game_id
    and g.competition_id = p_competition_id
    and g.status in ('league_verified', 'official')
  join public.game_revisions gr on gr.id = gps.revision_id and gr.state = 'approved'
  group by gps.player_id, gps.team_season_id
  on conflict (competition_id, player_id) do nothing;

  -- 6. Rebuild standings for the competition
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
  ) w on true
  left join lateral (
    select count(*) as losses
    from public.games g
    join public.game_team_stats gst_h on gst_h.game_id = g.id
      and gst_h.team_season_id = g.home_team_season_id
      and gst_h.team_season_id <> ts.id
    join public.game_team_stats gst_a on gst_a.game_id = g.id and gst_a.team_season_id = ts.id
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
  where ts.competition_id = p_competition_id
  on conflict (competition_id, team_season_id) do nothing;
end;
$$;
