-- ============================================================================
-- cmd_submit_historical_stats
--
-- Direct-write path for historical season-level stats import (CSV bootstrap).
-- Unlike the game-level source_submissions pipeline, this SECURITY DEFINER
-- function writes directly to season_player_stats because:
--   1) source_submissions.game_id is NOT NULL and references games(id)
--   2) The entire source_submission→revision→materialization pipeline is
--      game-level only (RLS policies, cmd_approve_source, cmd_create_revision
--      all require a game_id)
--   3) Historical season data has no corresponding game to attach to
--
-- This function does NOT go through the review pipeline — the import route
-- already vets and resolves data (creates teams/players/team_seasons as
-- needed), so this is an authenticated trust path analogous to
-- cmd_submit_official_stats but for aggregated season totals.
--
-- Stats are stored as totals (directly from CSV). They will be overwritten
-- if refresh_season_player_stats runs later for this competition.
-- ============================================================================

create or replace function public.cmd_submit_historical_stats(
  p_competition_id uuid,
  p_season_id uuid,
  p_player_stats jsonb
) returns jsonb language plpgsql security definer
set search_path = '' as $$
declare

  v_count int;
begin
  -- 1. Authorize
  if (select auth.uid()) is null then
    raise exception 'ONOO_NOT_AUTHENTICATED';
  end if;

  -- 2. Validate payload
  if p_player_stats is null or jsonb_typeof(p_player_stats) <> 'array' then
    raise exception 'ONOO_INVALID_PAYLOAD: p_player_stats must be a JSON array';
  end if;

  if jsonb_array_length(p_player_stats) = 0 then
    raise exception 'ONOO_INVALID_PAYLOAD: p_player_stats must not be empty';
  end if;

  -- 3. Upsert each player's season stats
  insert into public.season_player_stats (
    competition_id, player_id, team_season_id,
    gp, mpg, pts, fgm, fga, tpm, tpa,
    ftm, fta, oreb, dreb, ast, stl, blk, tov, pf
  )
  select
    p_competition_id,
    (value->>'player_id')::uuid,
    (value->>'team_season_id')::uuid,
    coalesce((value->>'gp')::smallint, 0),
    case
      when coalesce((value->>'gp')::int, 0) > 0
        then round(coalesce((value->>'minutes')::real, 0) / (value->>'gp')::real, 1)
      else 0
    end,
    coalesce((value->>'pts')::real, 0),
    coalesce((value->>'fgm')::real, 0),
    coalesce((value->>'fga')::real, 0),
    coalesce((value->>'tpm')::real, 0),
    coalesce((value->>'tpa')::real, 0),
    coalesce((value->>'ftm')::real, 0),
    coalesce((value->>'fta')::real, 0),
    coalesce((value->>'oreb')::real, 0),
    coalesce((value->>'dreb')::real, 0),
    coalesce((value->>'ast')::real, 0),
    coalesce((value->>'stl')::real, 0),
    coalesce((value->>'blk')::real, 0),
    coalesce((value->>'tov')::real, 0),
    coalesce((value->>'pf')::real, 0)
  from jsonb_array_elements(p_player_stats)
  on conflict (competition_id, player_id)
  do update set
    team_season_id = excluded.team_season_id,
    gp = excluded.gp,
    mpg = excluded.mpg,
    pts = excluded.pts,
    fgm = excluded.fgm,
    fga = excluded.fga,
    tpm = excluded.tpm,
    tpa = excluded.tpa,
    ftm = excluded.ftm,
    fta = excluded.fta,
    oreb = excluded.oreb,
    dreb = excluded.dreb,
    ast = excluded.ast,
    stl = excluded.stl,
    blk = excluded.blk,
    tov = excluded.tov,
    pf = excluded.pf;

  get diagnostics v_count = row_count;

  -- 4. Write audit log
  perform private.write_audit(
    'submit_historical_stats',
    'season_player_stats',
    null,
    jsonb_build_object(
      'competition_id', p_competition_id,
      'season_id', p_season_id,
      'player_count', v_count
    )
  );

  return jsonb_build_object(
    'submitted_count', v_count
  );
end;
$$;

grant execute on function public.cmd_submit_historical_stats(uuid, uuid, jsonb) to authenticated;
