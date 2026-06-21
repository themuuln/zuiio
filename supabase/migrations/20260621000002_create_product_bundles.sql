-- Product Bundles (kits): group products together for sale as a single item
CREATE TABLE IF NOT EXISTS public.product_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  sale_price NUMERIC,
  cost_price NUMERIC,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Individual items within a bundle
CREATE TABLE IF NOT EXISTS public.product_bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID REFERENCES public.product_bundles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL DEFAULT 1
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_bundles_org ON public.product_bundles(organization_id);
CREATE INDEX IF NOT EXISTS idx_product_bundle_items_bundle ON public.product_bundle_items(bundle_id);

-- RLS
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_bundle_items ENABLE ROW LEVEL SECURITY;

-- Bundle RLS policies
CREATE POLICY "product_bundles_select" ON public.product_bundles
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.read')
  );

CREATE POLICY "product_bundles_insert" ON public.product_bundles
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.create')
  );

CREATE POLICY "product_bundles_update" ON public.product_bundles
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.update')
  );

CREATE POLICY "product_bundles_delete" ON public.product_bundles
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.delete')
  );

-- Bundle items RLS (rely on parent bundle)
CREATE POLICY "product_bundle_items_select" ON public.product_bundle_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.product_bundles
      WHERE product_bundles.id = product_bundle_items.bundle_id
        AND product_bundles.organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('products.read')
  );

CREATE POLICY "product_bundle_items_insert" ON public.product_bundle_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product_bundles
      WHERE product_bundles.id = product_bundle_items.bundle_id
        AND product_bundles.organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('products.create')
  );

CREATE POLICY "product_bundle_items_update" ON public.product_bundle_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.product_bundles
      WHERE product_bundles.id = product_bundle_items.bundle_id
        AND product_bundles.organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('products.update')
  );

CREATE POLICY "product_bundle_items_delete" ON public.product_bundle_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.product_bundles
      WHERE product_bundles.id = product_bundle_items.bundle_id
        AND product_bundles.organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('products.delete')
  );
