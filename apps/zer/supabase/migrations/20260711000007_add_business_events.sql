-- =============================================
-- Business Events + Stock Targets
--
-- Dated business events (Цагаан сар, etc.)
-- with advisory stock targets.
-- =============================================

-- 1. Business Events
CREATE TABLE IF NOT EXISTS public.business_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  preparation_lead_days INT DEFAULT 30,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  recurrence_source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Stock Targets per event
CREATE TABLE IF NOT EXISTS public.business_event_stock_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.business_events(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  target_quantity NUMERIC NOT NULL,
  demand_multiplier NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT bst_target_check CHECK (product_id IS NOT NULL OR category_id IS NOT NULL)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_be_org ON public.business_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_be_dates ON public.business_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bst_event ON public.business_event_stock_targets(event_id);

-- 4. RLS
ALTER TABLE public.business_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_event_stock_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "be_select" ON public.business_events
  FOR SELECT USING (organization_id = (SELECT get_current_organization()) AND public.has_permission('products.read'));
CREATE POLICY "be_insert" ON public.business_events
  FOR INSERT WITH CHECK (organization_id = (SELECT get_current_organization()) AND public.has_permission('products.create'));
CREATE POLICY "be_update" ON public.business_events
  FOR UPDATE USING (organization_id = (SELECT get_current_organization()) AND public.has_permission('products.update'))
  WITH CHECK (organization_id = (SELECT get_current_organization()) AND public.has_permission('products.update'));
CREATE POLICY "be_delete" ON public.business_events
  FOR DELETE USING (organization_id = (SELECT get_current_organization()) AND public.has_permission('products.delete'));

CREATE POLICY "bst_select" ON public.business_event_stock_targets
  FOR SELECT USING (organization_id = (SELECT get_current_organization()) AND public.has_permission('products.read'));
CREATE POLICY "bst_insert" ON public.business_event_stock_targets
  FOR INSERT WITH CHECK (organization_id = (SELECT get_current_organization()) AND public.has_permission('products.create'));
CREATE POLICY "bst_update" ON public.business_event_stock_targets
  FOR UPDATE USING (organization_id = (SELECT get_current_organization()) AND public.has_permission('products.update'))
  WITH CHECK (organization_id = (SELECT get_current_organization()) AND public.has_permission('products.update'));
CREATE POLICY "bst_delete" ON public.business_event_stock_targets
  FOR DELETE USING (organization_id = (SELECT get_current_organization()) AND public.has_permission('products.delete'));

-- 5. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_event_stock_targets TO authenticated;
