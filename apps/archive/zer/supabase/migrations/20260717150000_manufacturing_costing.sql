-- ============================================================
-- Manufacturing Module: Job Costing (Phase 4)
-- ============================================================
-- Creates production_stage_labor table for tracking labor hours
-- and costs per production stage.

-- 1. Create production_stage_labor table
CREATE TABLE IF NOT EXISTS public.production_stage_labor (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  production_stage_id uuid NOT NULL REFERENCES public.production_stages(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  hours numeric NOT NULL CHECK (hours > 0),
  hourly_rate_snapshot numeric NOT NULL CHECK (hourly_rate_snapshot >= 0),
  labor_cost numeric GENERATED ALWAYS AS (hours * hourly_rate_snapshot) STORED,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_production_stage_labor_stage_id
  ON public.production_stage_labor (production_stage_id);
CREATE INDEX IF NOT EXISTS idx_production_stage_labor_organization_id
  ON public.production_stage_labor (organization_id);

-- 3. updated_at trigger (reuse handle_updated_at from Phase 1)
CREATE TRIGGER set_production_stage_labor_updated_at
  BEFORE UPDATE ON public.production_stage_labor
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. RLS policies
ALTER TABLE public.production_stage_labor ENABLE ROW LEVEL SECURITY;

-- SELECT: org members can read
CREATE POLICY "production_stage_labor_select" ON public.production_stage_labor
  FOR SELECT USING (organization_id = (SELECT public.get_current_organization()));

-- INSERT: requires production_orders.create permission
CREATE POLICY "production_stage_labor_insert" ON public.production_stage_labor
  FOR INSERT WITH CHECK (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('production_orders.create'::public.app_permission)
  );

-- DELETE: requires production_orders.update permission (remove labor records)
CREATE POLICY "production_stage_labor_delete" ON public.production_stage_labor
  FOR DELETE USING (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('production_orders.update'::public.app_permission)
  );

-- 5. Grants
GRANT SELECT, INSERT, DELETE ON public.production_stage_labor TO authenticated;

-- 6. Comments
COMMENT ON TABLE public.production_stage_labor IS 'Labor hours and cost tracking per production stage';
COMMENT ON COLUMN public.production_stage_labor.hourly_rate_snapshot IS 'Hourly rate captured at time of recording — never read from employee record later';
COMMENT ON COLUMN public.production_stage_labor.labor_cost IS 'PostgreSQL generated column: hours × hourly_rate_snapshot. Do not compute in application code.';
