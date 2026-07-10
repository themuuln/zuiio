-- Curated public read model. Views use invoker security and expose approved records only.

create view public.v_public_games
with (security_invoker = true) as
select
  g.id,
  g.competition_id,
  g.scheduled_at,
  g.status,
  g.current_period,
  g.home_score,
  g.away_score,
  g.current_revision_number,
  g.published_at,
  g.venue_id,
  v.name as venue_name,
  c.name as competition_name,
  s.id as season_id,
  s.name as season_name,
  l.id as league_id,
  l.name as league_name,
  l.slug as league_slug,
  home.id as home_team_season_id,
  home_team.id as home_team_id,
  home_team.name as home_team_name,
  home_team.slug as home_team_slug,
  home_team.short_code as home_team_short_code,
  home_team.logo_url as home_team_logo_url,
  away.id as away_team_season_id,
  away_team.id as away_team_id,
  away_team.name as away_team_name,
  away_team.slug as away_team_slug,
  away_team.short_code as away_team_short_code,
  away_team.logo_url as away_team_logo_url,
  gr.id as revision_id,
  gr.revision_number,
  gr.approved_at as revision_approved_at,
  ss.id as source_submission_id,
  ss.source_type,
  ss.evidence_url,
  ss.reviewed_by as source_reviewer_id,
  ss.reviewed_at as source_reviewed_at
from public.games g
join public.competitions c on c.id = g.competition_id
join public.seasons s on s.id = c.season_id
join public.leagues l on l.id = s.league_id
left join public.venues v on v.id = g.venue_id
join public.team_seasons home on home.id = g.home_team_season_id
join public.teams home_team on home_team.id = home.team_id
join public.team_seasons away on away.id = g.away_team_season_id
join public.teams away_team on away_team.id = away.team_id
join public.game_revisions gr on gr.game_id = g.id
  and gr.revision_number = g.current_revision_number and gr.state = 'approved'
join public.source_submissions ss on ss.id = gr.source_submission_id and ss.status = 'approved'
where g.status in ('league_verified', 'official');

create view public.v_public_box_score
with (security_invoker = true) as
select
  gps.game_id,
  gps.revision_id,
  gr.revision_number,
  gr.approved_at as revision_approved_at,
  gps.player_id,
  p.canonical_name as player_name,
  p.name_latin as player_name_latin,
  p.position as player_position,
  gps.team_season_id,
  ts.team_id,
  t.name as team_name,
  re.jersey_number,
  gps.seconds_played,
  gps.pts, gps.fgm, gps.fga, gps.tpm, gps.tpa, gps.ftm, gps.fta,
  gps.oreb, gps.dreb, gps.ast, gps.stl, gps.blk, gps.tov, gps.pf,
  ss.source_type,
  ss.evidence_url,
  ss.reviewed_at as source_reviewed_at
from public.game_player_stats gps
join public.games g on g.id = gps.game_id and g.status in ('league_verified', 'official')
join public.game_revisions gr on gr.id = gps.revision_id and gr.state = 'approved'
join public.source_submissions ss on ss.id = gr.source_submission_id and ss.status = 'approved'
join public.players p on p.id = gps.player_id
join public.team_seasons ts on ts.id = gps.team_season_id
join public.teams t on t.id = ts.team_id
left join public.roster_entries re on re.team_season_id = gps.team_season_id and re.player_id = gps.player_id;

create view public.v_public_standings
with (security_invoker = true) as
select
  st.competition_id,
  c.name as competition_name,
  s.id as season_id,
  s.name as season_name,
  l.id as league_id,
  l.slug as league_slug,
  st.team_season_id,
  ts.team_id,
  t.name as team_name,
  t.slug as team_slug,
  t.logo_url as team_logo_url,
  st.wins,
  st.losses,
  st.win_pct,
  st.gb,
  st.streak,
  st.last10,
  st.points_for,
  st.points_against
from public.standings st
join public.competitions c on c.id = st.competition_id
join public.seasons s on s.id = c.season_id
join public.leagues l on l.id = s.league_id
join public.team_seasons ts on ts.id = st.team_season_id
join public.teams t on t.id = ts.team_id
where exists (
  select 1 from public.games g
  where g.competition_id = st.competition_id and g.status in ('league_verified', 'official')
);

create view public.v_public_leaders
with (security_invoker = true) as
select
  sps.competition_id,
  c.name as competition_name,
  s.id as season_id,
  l.id as league_id,
  sps.player_id,
  p.canonical_name as player_name,
  p.name_latin as player_name_latin,
  p.position as player_position,
  sps.team_season_id,
  ts.team_id,
  t.name as team_name,
  sps.gp,
  sps.mpg,
  sps.pts,
  sps.fgm, sps.fga, sps.tpm, sps.tpa, sps.ftm, sps.fta,
  sps.oreb, sps.dreb, sps.ast, sps.stl, sps.blk, sps.tov, sps.pf
from public.season_player_stats sps
join public.competitions c on c.id = sps.competition_id
join public.seasons s on s.id = c.season_id
join public.leagues l on l.id = s.league_id
join public.players p on p.id = sps.player_id
join public.team_seasons ts on ts.id = sps.team_season_id
join public.teams t on t.id = ts.team_id
where exists (
  select 1 from public.games g
  where g.competition_id = sps.competition_id and g.status in ('league_verified', 'official')
);

create view public.v_public_team_roster
with (security_invoker = true) as
select
  ts.id as team_season_id,
  ts.competition_id,
  ts.team_id,
  t.name as team_name,
  t.slug as team_slug,
  re.id as roster_entry_id,
  re.jersey_number,
  re.position as roster_position,
  p.id as player_id,
  p.canonical_name as player_name,
  p.name_latin as player_name_latin,
  p.position as player_position,
  p.photo_url
from public.team_seasons ts
join public.teams t on t.id = ts.team_id
join public.roster_entries re on re.team_season_id = ts.id and re.left_at is null
join public.players p on p.id = re.player_id;

grant select on public.v_public_games, public.v_public_box_score, public.v_public_standings,
  public.v_public_leaders, public.v_public_team_roster to anon, authenticated;
