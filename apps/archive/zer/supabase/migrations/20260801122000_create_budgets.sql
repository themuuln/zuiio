-- Budget records are organization-scoped and consumed by the dashboard budget module.
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  period TEXT NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  alert_threshold NUMERIC NOT NULL DEFAULT 80 CHECK (alert_threshold >= 0),
  spent NUMERIC NOT NULL DEFAULT 0 CHECK (spent >= 0),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT budgets_date_range_check CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_budgets_organization_id
  ON public.budgets(organization_id);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_select_own_org" ON public.budgets
  FOR SELECT USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "budgets_insert_own_org" ON public.budgets
  FOR INSERT WITH CHECK (organization_id = (SELECT get_current_organization()));

CREATE POLICY "budgets_update_own_org" ON public.budgets
  FOR UPDATE USING (organization_id = (SELECT get_current_organization()))
  WITH CHECK (organization_id = (SELECT get_current_organization()));

CREATE POLICY "budgets_delete_own_org" ON public.budgets
  FOR DELETE USING (organization_id = (SELECT get_current_organization()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT ALL PRIVILEGES ON public.budgets TO service_role;
