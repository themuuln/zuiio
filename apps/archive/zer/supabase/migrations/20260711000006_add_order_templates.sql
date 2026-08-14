-- =============================================
-- Order Templates
--
-- Reusable draft orders with live repricing.
-- =============================================

-- 1. Order Templates
CREATE TABLE IF NOT EXISTS public.order_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  -- Recurring schedule (Phase 4)
  schedule_interval_days INT,
  next_run_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Order Template Items
CREATE TABLE IF NOT EXISTS public.order_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.order_templates(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_ot_org ON public.order_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_ot_contact ON public.order_templates(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_oti_template ON public.order_template_items(template_id);

-- 4. RLS
ALTER TABLE public.order_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ot_select" ON public.order_templates
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.read')
  );
CREATE POLICY "ot_insert" ON public.order_templates
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.create')
  );
CREATE POLICY "ot_update" ON public.order_templates
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.update')
  )
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.update')
  );
CREATE POLICY "ot_delete" ON public.order_templates
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.delete')
  );

CREATE POLICY "oti_select" ON public.order_template_items
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.read')
  );
CREATE POLICY "oti_insert" ON public.order_template_items
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.create')
  );
CREATE POLICY "oti_update" ON public.order_template_items
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.update')
  )
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.update')
  );
CREATE POLICY "oti_delete" ON public.order_template_items
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.delete')
  );

-- 5. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_template_items TO authenticated;
