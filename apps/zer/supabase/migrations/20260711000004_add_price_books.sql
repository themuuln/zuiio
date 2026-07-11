-- =============================================
-- Price Books (Server-Authoritative Pricing)
--
-- price_lists: header with validity, currency, priority
-- price_list_segments: links price lists to customer segments
-- price_list_rules: per-product/category pricing rules
-- =============================================

-- 1. Price Lists
CREATE TABLE IF NOT EXISTS public.price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency TEXT DEFAULT 'MNT',
  valid_from DATE,
  valid_until DATE,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Price List ↔ Segment linkage
CREATE TABLE IF NOT EXISTS public.price_list_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id UUID NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
  customer_segment_id UUID NOT NULL REFERENCES public.customer_segments(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT pls_unique UNIQUE (price_list_id, customer_segment_id)
);

-- 3. Price List Rules
CREATE TABLE IF NOT EXISTS public.price_list_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id UUID NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  min_quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC,
  percentage_adjustment NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT plr_target_check CHECK (product_id IS NOT NULL OR category_id IS NOT NULL),
  CONSTRAINT plr_price_check CHECK (unit_price IS NOT NULL OR percentage_adjustment IS NOT NULL),
  CONSTRAINT plr_min_quantity_positive CHECK (min_quantity > 0)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_pl_org ON public.price_lists(organization_id);
CREATE INDEX IF NOT EXISTS idx_pls_pl ON public.price_list_segments(price_list_id);
CREATE INDEX IF NOT EXISTS idx_pls_seg ON public.price_list_segments(customer_segment_id);
CREATE INDEX IF NOT EXISTS idx_plr_pl ON public.price_list_rules(price_list_id);
CREATE INDEX IF NOT EXISTS idx_plr_product ON public.price_list_rules(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_plr_category ON public.price_list_rules(category_id) WHERE category_id IS NOT NULL;

-- 5. RLS
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_list_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_list_rules ENABLE ROW LEVEL SECURITY;

-- price_lists policies
CREATE POLICY "pl_select" ON public.price_lists
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.read')
  );
CREATE POLICY "pl_insert" ON public.price_lists
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.create')
  );
CREATE POLICY "pl_update" ON public.price_lists
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.update')
  )
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.update')
  );
CREATE POLICY "pl_delete" ON public.price_lists
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.delete')
  );

-- price_list_segments policies
CREATE POLICY "pls_select" ON public.price_list_segments
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.read')
  );
CREATE POLICY "pls_insert" ON public.price_list_segments
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.create')
  );
CREATE POLICY "pls_delete" ON public.price_list_segments
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.delete')
  );
CREATE POLICY "pls_update" ON public.price_list_segments
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.update')
  )
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.update')
  );

-- price_list_rules policies
CREATE POLICY "plr_select" ON public.price_list_rules
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.read')
  );
CREATE POLICY "plr_insert" ON public.price_list_rules
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.create')
  );
CREATE POLICY "plr_update" ON public.price_list_rules
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.update')
  )
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.update')
  );
CREATE POLICY "plr_delete" ON public.price_list_rules
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.delete')
  );

-- 6. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_lists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_list_segments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_list_rules TO authenticated;
