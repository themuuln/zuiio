-- Enable Realtime for stat_events and games
alter publication supabase_realtime add table public.stat_events;
alter publication supabase_realtime add table public.games;
