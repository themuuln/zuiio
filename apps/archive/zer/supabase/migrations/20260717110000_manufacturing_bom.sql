-- =============================================
-- Manufacturing Module: BOM Tables & Functions
-- =============================================
-- Adds material_type column to products,
-- creates product_boms and bom_items tables,
-- RLS policies, indexes, and the activate_bom
-- transactional function.
-- =============================================

-- ═══════════════════════════════════════════════
-- 1. Add material_type to products
-- ═══════════════════════════════════════════════
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS material_type text
  CHECK (material_type IN ('raw_material', 'hardware', 'finished_good'));

-- ═══════════════════════════════════════════════
-- 2. Create product_boms table
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.product_boms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  name text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'retired')),
  notes text,
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT product_boms_org_product_version_unique
    UNIQUE (organization_id, product_id, version),
  CONSTRAINT product_boms_version_positive CHECK (version > 0)
);

-- Partial unique index: exactly one active BOM per product
CREATE UNIQUE INDEX IF NOT EXISTS product_boms_one_active_per_product
  ON public.product_boms (organization_id, product_id)
  WHERE status = 'active' AND deleted_at IS NULL;

-- ═══════════════════════════════════════════════
-- 3. Create bom_items table
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.bom_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  bom_id uuid NOT NULL REFERENCES public.product_boms(id) ON DELETE RESTRICT,
  material_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit text NOT NULL,
  required_width_mm numeric CHECK (required_width_mm IS NULL OR required_width_mm > 0),
  required_length_mm numeric CHECK (required_length_mm IS NULL OR required_length_mm > 0),
  required_thickness_mm numeric CHECK (required_thickness_mm IS NULL OR required_thickness_mm > 0),
  estimated_unit_cost numeric DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ═══════════════════════════════════════════════
-- 4. Indexes
-- ═══════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_product_boms_organization_id
  ON public.product_boms(organization_id);
CREATE INDEX IF NOT EXISTS idx_product_boms_product_id
  ON public.product_boms(product_id);
CREATE INDEX IF NOT EXISTS idx_product_boms_status
  ON public.product_boms(status);
CREATE INDEX IF NOT EXISTS idx_bom_items_bom_id
  ON public.bom_items(bom_id);
CREATE INDEX IF NOT EXISTS idx_bom_items_organization_id
  ON public.bom_items(organization_id);

-- ═══════════════════════════════════════════════
-- 5. new handle_updated_at trigger function & triggers
-- ═══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_product_boms_updated_at
  BEFORE UPDATE ON public.product_boms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_bom_items_updated_at
  BEFORE UPDATE ON public.bom_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ═══════════════════════════════════════════════
-- 6. RLS: product_boms
-- ═══════════════════════════════════════════════
ALTER TABLE public.product_boms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_boms_select" ON public.product_boms
  FOR SELECT
  USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "product_boms_insert" ON public.product_boms
  FOR INSERT
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('boms.create'::public.app_permission)
  );

CREATE POLICY "product_boms_update" ON public.product_boms
  FOR UPDATE
  USING (organization_id = (SELECT get_current_organization()))
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('boms.update'::public.app_permission)
  );

CREATE POLICY "product_boms_delete" ON public.product_boms
  FOR DELETE
  USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('boms.delete'::public.app_permission)
  );

-- ═══════════════════════════════════════════════
-- 7. RLS: bom_items
-- ═══════════════════════════════════════════════
ALTER TABLE public.bom_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bom_items_select" ON public.bom_items
  FOR SELECT
  USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "bom_items_insert" ON public.bom_items
  FOR INSERT
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('boms.create'::public.app_permission)
  );

CREATE POLICY "bom_items_update" ON public.bom_items
  FOR UPDATE
  USING (organization_id = (SELECT get_current_organization()))
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('boms.update'::public.app_permission)
  );

CREATE POLICY "bom_items_delete" ON public.bom_items
  FOR DELETE
  USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('boms.delete'::public.app_permission)
  );

-- ═══════════════════════════════════════════════
-- 8. activate_bom transactional function
-- ═══════════════════════════════════════════════
-- Validates the BOM is in draft state, retires any
-- currently active BOM for the same product, then
-- activates the new BOM — all in a single transaction.
-- ═══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.activate_bom(p_bom_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id uuid;
  v_product_id uuid;
  v_old_active_id uuid;
BEGIN
  -- Get BOM details; only allow activating a draft that isn't soft-deleted
  SELECT organization_id, product_id INTO v_org_id, v_product_id
  FROM public.product_boms
  WHERE id = p_bom_id
    AND status = 'draft'
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft BOM олдсонгүй.' USING ERRCODE = 'P0001';
  END IF;

  -- Authorize: caller must belong to the same organization
  IF v_org_id != (SELECT get_current_organization()) THEN
    RAISE EXCEPTION 'Хандах эрхгүй байна.' USING ERRCODE = 'P0001';
  END IF;

  -- Retire the currently active BOM for this product (if any)
  SELECT id INTO v_old_active_id
  FROM public.product_boms
  WHERE organization_id = v_org_id
    AND product_id = v_product_id
    AND status = 'active'
    AND deleted_at IS NULL;

  IF v_old_active_id IS NOT NULL THEN
    UPDATE public.product_boms
    SET status = 'retired', updated_at = now()
    WHERE id = v_old_active_id;
  END IF;

  -- Activate the new BOM
  UPDATE public.product_boms
  SET status = 'active', activated_at = now(), updated_at = now()
  WHERE id = p_bom_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.activate_bom TO authenticated;

COMMENT ON FUNCTION public.activate_bom IS 'Transactionally activates a draft BOM, retiring any current active BOM for the same product';
COMMENT ON COLUMN public.products.material_type IS 'Product classification for manufacturing: raw_material, hardware, or finished_good';
COMMENT ON TABLE public.product_boms IS 'Bill of Materials — defines the component recipe for a finished product';
COMMENT ON TABLE public.bom_items IS 'Line items within a BOM, specifying each material and its quantity';
