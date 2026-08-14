-- Dashboard layout preset for the organization's dashboard page.
-- Valid presets: default | retail | financial | inventory
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS dashboard_template TEXT NOT NULL DEFAULT 'default'
  CHECK (dashboard_template IN ('default', 'retail', 'financial', 'inventory'));

COMMENT ON COLUMN public.organizations.dashboard_template IS 'Dashboard layout preset: default | retail | financial | inventory';
