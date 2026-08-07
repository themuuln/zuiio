-- Performance indexes for standings page and team drawer queries
--
-- These indexes address three bottlenecks identified during the standings page audit:
-- 1. v_public_standings EXISTS subquery scanning games table
-- 2. getTeamQuickView queries filtering v_public_games by team
-- 3. v_public_leaders and getTeamTopScorers filtering by team_season_id

-- ── 1. Partial index for standings EXISTS subquery ─────────────────────────
-- v_public_standings filters: WHERE EXISTS (SELECT 1 FROM games g
--   WHERE g.competition_id = st.competition_id
--   AND g.status IN ('league_verified', 'official'))
-- A partial index matching this exact filter makes it a cheap index-only scan.
CREATE INDEX IF NOT EXISTS games_public_standings_idx
  ON public.games (competition_id)
  WHERE status IN ('league_verified', 'official');

-- ── 2. Team-specific game queries ──────────────────────────────────────────
-- getTeamQuickView queries games by home/away team_season_id ordered by
-- scheduled_at DESC with LIMIT 5/1. Composite indexes enable efficient
-- index-only scans for these patterns.
CREATE INDEX IF NOT EXISTS games_home_team_scheduled_idx
  ON public.games (home_team_season_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS games_away_team_scheduled_idx
  ON public.games (away_team_season_id, scheduled_at DESC);

-- ── 3. Team-specific leader queries ────────────────────────────────────────
-- v_public_leaders joins season_player_stats -> team_seasons ON ts.id = sps.team_season_id.
-- getTeamTopScorers filters v_public_leaders by team_season_id.
-- season_player_stats PK is (competition_id, player_id), no index on team_season_id.
CREATE INDEX IF NOT EXISTS season_player_stats_team_idx
  ON public.season_player_stats (team_season_id);

-- ── 4. Analytics queries on game_player_stats ──────────────────────────────
-- getTeamQuickView's leaders query filters by team_id (resolved through
-- team_seasons). game_player_stats PK is (game_id, player_id), no team index.
-- While not directly used in the current query (it uses v_public_leaders),
-- this covers team-specific stat lookups on the raw table.
CREATE INDEX IF NOT EXISTS game_player_stats_team_idx
  ON public.game_player_stats (team_season_id);
