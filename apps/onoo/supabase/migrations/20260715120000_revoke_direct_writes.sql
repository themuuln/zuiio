-- Task 1.5: Шууд бичлэг хийх эрхийг хүчингүй болгох
-- Бүх нэмэлт/засвар/устгалт cmd_* тушаалуудаар дамждаг болно
REVOKE INSERT, UPDATE, DELETE ON public.stat_events FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.game_player_stats FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.game_team_stats FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.season_player_stats FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.standings FROM authenticated, anon;
-- Games status is controlled via cmd_transition_game (SECURITY DEFINER)
REVOKE UPDATE ON public.games FROM authenticated, anon;
