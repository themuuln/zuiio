-- Paid-pilot publication views.
-- Adds v_public_player_profiles and v_public_play_by_play.
-- Both use security_invoker and expose only league_verified|official approved revisions.

-- Ensure season_player_stats has ftp column (may be missing on clean schema)
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='season_player_stats' AND column_name='ftp') THEN
    ALTER TABLE public.season_player_stats ADD COLUMN ftp real;
  END IF;
END $$;

-- v_public_player_profiles: aggregate player profile across published games
create or replace view public.v_public_player_profiles
with (security_invoker = true) as
select
  p.id as player_id,
  p.canonical_name as player_name,
  p.name_latin as player_name_latin,
  p.dob,
  p.height_cm,
  p.weight_kg,
  p.position as player_position,
  p.nationality,
  p.photo_url,
  ts.id as team_season_id,
  ts.team_id,
  t.name as team_name,
  t.slug as team_slug,
  t.logo_url as team_logo_url,
  ts.competition_id,
  c.name as competition_name,
  s.id as season_id,
  s.name as season_name,
  l.id as league_id,
  l.name as league_name,
  l.slug as league_slug,
  re.jersey_number,
  coalesce(sps.gp, 0)::integer as games_played,
  sps.mpg as minutes_per_game,
  sps.pts as points_per_game,
  sps.fgm as fgm_per_game,
  sps.fga as fga_per_game,
  sps.tpm as tpm_per_game,
  sps.tpa as tpa_per_game,
  sps.ftm as ftm_per_game,
  sps.ftp as ftp_per_game,
  sps.oreb as oreb_per_game,
  sps.dreb as dreb_per_game,
  sps.ast as ast_per_game,
  sps.stl as stl_per_game,
  sps.blk as blk_per_game,
  sps.tov as tov_per_game,
  sps.pf as pf_per_game
from public.players p
join public.roster_entries re on re.player_id = p.id and re.left_at is null
join public.team_seasons ts on ts.id = re.team_season_id
join public.teams t on t.id = ts.team_id
join public.competitions c on c.id = ts.competition_id
join public.seasons s on s.id = c.season_id
join public.leagues l on l.id = s.league_id
left join public.season_player_stats sps
  on sps.player_id = p.id and sps.competition_id = ts.competition_id
where exists (
  select 1 from public.games g
  where g.competition_id = ts.competition_id
    and g.status in ('league_verified', 'official')
);

-- v_public_play_by_play: game event timeline for published games
-- Exposes event sequence without evidence URLs, user IDs, or audit data
create or replace view public.v_public_play_by_play
with (security_invoker = true) as
select
  se.game_id,
  se.id as event_id,
  se.operation_id,
  se.local_seq,
  se.event_type,
  se.period,
  se.clock_seconds,
  se.team_season_id,
  t.name as team_name,
  se.player_id,
  p.canonical_name as player_name,
  p.name_latin as player_name_latin,
  re.jersey_number,
  se.payload,
  se.created_at
from public.stat_events se
join public.games g on g.id = se.game_id
  and g.status in ('league_verified', 'official')
join public.game_revisions gr on gr.game_id = g.id
  and gr.revision_number = g.current_revision_number
  and gr.state = 'approved'
left join public.team_seasons ts on ts.id = se.team_season_id
left join public.teams t on t.id = ts.team_id
left join public.players p on p.id = se.player_id
left join public.roster_entries re on re.team_season_id = se.team_season_id
  and re.player_id = se.player_id
where se.voided_at is null;

grant select on public.v_public_player_profiles, public.v_public_play_by_play to anon, authenticated;
