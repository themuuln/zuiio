-- Segment definitions and persistent A/B experiment cohorts.
CREATE TABLE IF NOT EXISTS public.segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  traffic_split jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','running','paused','completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.experiment_assignments (
  experiment_id uuid NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  channel_user_id text NOT NULL,
  variant text NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (experiment_id, channel_user_id)
);
CREATE INDEX IF NOT EXISTS idx_segments_org ON public.segments(organization_id);
CREATE INDEX IF NOT EXISTS idx_experiments_org ON public.experiments(organization_id);
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_assignments FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.segments, public.experiments, public.experiment_assignments FROM anon, authenticated;
