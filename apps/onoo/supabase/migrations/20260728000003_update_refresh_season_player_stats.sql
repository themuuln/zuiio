-- Update refresh_season_player_stats to include new FIBA fields (plus_minus, fouls_committed, fouls_drawn)
-- Also filter DNP (seconds_played IS NULL) from GP counting

create or replace function public.refresh_season_player_stats(p_competition_id uuid)
returns void language plpgsql security definer
set search_path = '' as $$
begin
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
  group by gps.player_id, gps.team_season_id;
end;
$$;
