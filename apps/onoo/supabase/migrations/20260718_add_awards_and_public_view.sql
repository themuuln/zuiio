-- Awards table
CREATE TABLE IF NOT EXISTS public.awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id),
  award_type text NOT NULL CHECK (award_type IN ('player_of_week', 'mvp', 'top_scorer')),
  period_start date,
  period_end date,
  player_id uuid NOT NULL REFERENCES public.players(id),
  granted_by uuid NOT NULL REFERENCES public.profiles(id),
  granted_at timestamptz DEFAULT now(),
  note text
);

-- RLS: no public read access (admin-only writes)
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;

-- Public view
CREATE OR REPLACE VIEW public.v_public_awards AS
SELECT
  a.id,
  a.award_type,
  a.period_start,
  a.period_end,
  a.granted_at,
  a.note,
  p.canonical_name AS player_name,
  p.id AS player_id,
  c.name AS competition_name,
  c.id AS competition_id
FROM awards a
JOIN players p ON p.id = a.player_id
JOIN competitions c ON c.id = a.competition_id
WHERE p.visibility = 'public';

-- Seed-compat columns: baseline migrations don't have these but seed.sql expects them
ALTER TABLE public.season_player_stats ADD COLUMN IF NOT EXISTS seconds_played integer;
ALTER TABLE public.standings ADD COLUMN IF NOT EXISTS w smallint, ADD COLUMN IF NOT EXISTS l smallint;

-- Grant table access to authenticated role for RLS testing
GRANT USAGE ON SCHEMA public, auth TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;

-- Seed auth user: seed.sql references this hardcoded UUID for source submissions
INSERT INTO auth.users (id, email) VALUES ('397692e0-915f-4361-9f75-f84d0883ba80', 'seed-admin@onoo-test.mn')
ON CONFLICT (id) DO NOTHING;
