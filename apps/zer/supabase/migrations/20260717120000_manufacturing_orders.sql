-- =============================================
-- Manufacturing Module: Production Orders
-- =============================================
-- Creates production_orders, production_stages,
-- production_materials tables with RLS, indexes,
-- triggers, and RPC functions for order numbering
-- and default stage creation.
-- =============================================

-- ═══════════════════════════════════════════════
-- 1. Create production_orders table
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.production_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  order_number text NOT NULL,
  sale_item_id uuid,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  bom_id uuid NOT NULL REFERENCES public.product_boms(id) ON DELETE RESTRICT,
  bom_version integer NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  planned_start_date date,
  planned_end_date date,
  actual_start_at timestamptz,
  actual_end_at timestamptz,
  estimated_cost_snapshot numeric DEFAULT 0,
  completed_actual_cost numeric DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT production_orders_org_number_unique UNIQUE (organization_id, order_number),
  CONSTRAINT production_orders_dates_check CHECK (planned_end_date IS NULL OR planned_start_date IS NULL OR planned_end_date >= planned_start_date)
);

-- ═══════════════════════════════════════════════
-- 2. Create production_stages table
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.production_stages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  production_order_id uuid NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  stage_name text NOT NULL,
  stage_order integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT production_stages_order_unique UNIQUE (production_order_id, stage_order)
);

-- ═══════════════════════════════════════════════
-- 3. Create production_materials table
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.production_materials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  production_order_id uuid NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  source_bom_item_id uuid REFERENCES public.bom_items(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  required_quantity numeric NOT NULL CHECK (required_quantity > 0),
  issued_quantity numeric NOT NULL DEFAULT 0 CHECK (issued_quantity >= 0),
  used_quantity numeric NOT NULL DEFAULT 0 CHECK (used_quantity >= 0),
  returned_quantity numeric NOT NULL DEFAULT 0 CHECK (returned_quantity >= 0),
  unit text NOT NULL,
  required_width_mm numeric,
  required_length_mm numeric,
  required_thickness_mm numeric,
  estimated_unit_cost_snapshot numeric DEFAULT 0,
  warehouse_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════
-- 4. Indexes
-- ═══════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_production_orders_organization_id
  ON public.production_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_branch_id
  ON public.production_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_status
  ON public.production_orders(status);
CREATE INDEX IF NOT EXISTS idx_production_orders_sale_item_id
  ON public.production_orders(sale_item_id);

CREATE INDEX IF NOT EXISTS idx_production_stages_production_order_id
  ON public.production_stages(production_order_id);

CREATE INDEX IF NOT EXISTS idx_production_materials_production_order_id
  ON public.production_materials(production_order_id);
CREATE INDEX IF NOT EXISTS idx_production_materials_product_id
  ON public.production_materials(product_id);

-- ═══════════════════════════════════════════════
-- 5. updated_at triggers (reuse handle_updated_at from Phase 1)
-- ═══════════════════════════════════════════════
CREATE TRIGGER set_production_orders_updated_at
  BEFORE UPDATE ON public.production_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_production_stages_updated_at
  BEFORE UPDATE ON public.production_stages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_production_materials_updated_at
  BEFORE UPDATE ON public.production_materials
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ═══════════════════════════════════════════════
-- 6. RLS: production_orders
-- ═══════════════════════════════════════════════
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "production_orders_select" ON public.production_orders
  FOR SELECT
  USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "production_orders_insert" ON public.production_orders
  FOR INSERT
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('production_orders.create'::public.app_permission)
  );

CREATE POLICY "production_orders_update" ON public.production_orders
  FOR UPDATE
  USING (organization_id = (SELECT get_current_organization()))
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('production_orders.update'::public.app_permission)
  );

CREATE POLICY "production_orders_delete" ON public.production_orders
  FOR DELETE
  USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('production_orders.delete'::public.app_permission)
  );

-- ═══════════════════════════════════════════════
-- 7. RLS: production_stages
-- ═══════════════════════════════════════════════
ALTER TABLE public.production_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "production_stages_select" ON public.production_stages
  FOR SELECT
  USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "production_stages_insert" ON public.production_stages
  FOR INSERT
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('production_orders.create'::public.app_permission)
  );

CREATE POLICY "production_stages_update" ON public.production_stages
  FOR UPDATE
  USING (organization_id = (SELECT get_current_organization()))
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('production_orders.update'::public.app_permission)
  );

CREATE POLICY "production_stages_delete" ON public.production_stages
  FOR DELETE
  USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('production_orders.delete'::public.app_permission)
  );

-- ═══════════════════════════════════════════════
-- 8. RLS: production_materials
-- ═══════════════════════════════════════════════
ALTER TABLE public.production_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "production_materials_select" ON public.production_materials
  FOR SELECT
  USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "production_materials_insert" ON public.production_materials
  FOR INSERT
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('production_orders.create'::public.app_permission)
  );

CREATE POLICY "production_materials_update" ON public.production_materials
  FOR UPDATE
  USING (organization_id = (SELECT get_current_organization()))
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('production_orders.update'::public.app_permission)
  );

CREATE POLICY "production_materials_delete" ON public.production_materials
  FOR DELETE
  USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('production_orders.delete'::public.app_permission)
  );

-- ═══════════════════════════════════════════════
-- 9. Order number generation RPC
-- ═══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.generate_order_number(p_org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_next integer;
  v_prefix text := 'PO-';
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(order_number FROM 4) AS integer)
  ), 0) + 1 INTO v_next
  FROM public.production_orders
  WHERE organization_id = p_org_id;

  RETURN v_prefix || LPAD(v_next::text, 6, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_order_number TO authenticated;

-- ═══════════════════════════════════════════════
-- 10. Default stages creation function
-- ═══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.create_default_stages(p_order_id uuid, p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.production_stages (organization_id, production_order_id, stage_name, stage_order)
  VALUES
    (p_org_id, p_order_id, 'Хайчлах', 1),
    (p_org_id, p_order_id, 'Ирмэг наах', 2),
    (p_org_id, p_order_id, 'Угсрах', 3),
    (p_org_id, p_order_id, 'Будах', 4),
    (p_org_id, p_order_id, 'Савлах', 5);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_default_stages TO authenticated;

-- ═══════════════════════════════════════════════
-- Comments
-- ═══════════════════════════════════════════════
COMMENT ON TABLE public.production_orders IS 'Production orders tracking manufacturing jobs from BOM recipes';
COMMENT ON TABLE public.production_stages IS 'Workflow stages within a production order (Хайчлах, Ирмэг наах, etc.)';
COMMENT ON TABLE public.production_materials IS 'Material snapshots from BOM at order creation time, tracking issuance and usage';
COMMENT ON COLUMN public.production_orders.order_number IS 'Race-safe generated order number (PO-000001)';
COMMENT ON COLUMN public.production_orders.sale_item_id IS 'Optional link to the sale_items row that triggered this production order';
COMMENT ON COLUMN public.production_orders.estimated_cost_snapshot IS 'Total estimated cost from BOM at order creation';
COMMENT ON COLUMN public.production_orders.completed_actual_cost IS 'Actual cost recorded upon completion';
