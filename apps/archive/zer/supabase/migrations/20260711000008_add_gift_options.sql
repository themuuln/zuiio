-- =============================================
-- Gift Options + Sale Add-ons
--
-- Priced gift packaging as sale add-ons.
-- =============================================

-- 1. Gift Options
CREATE TABLE IF NOT EXISTS public.gift_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Sale Add-ons (for gift packaging revenue tracking)
CREATE TABLE IF NOT EXISTS public.sale_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  addon_type TEXT NOT NULL DEFAULT 'gift_option',
  gift_option_id UUID REFERENCES public.gift_options(id) ON DELETE SET NULL,
  name_snapshot TEXT NOT NULL,
  price_snapshot NUMERIC NOT NULL,
  gift_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_go_org ON public.gift_options(organization_id);
CREATE INDEX IF NOT EXISTS idx_sa_sale ON public.sale_addons(sale_id);

-- 4. RLS
ALTER TABLE public.gift_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "go_select" ON public.gift_options
  FOR SELECT USING (organization_id = (SELECT get_current_organization()) AND public.has_permission('products.read'));
CREATE POLICY "go_insert" ON public.gift_options
  FOR INSERT WITH CHECK (organization_id = (SELECT get_current_organization()) AND public.has_permission('products.create'));
CREATE POLICY "go_update" ON public.gift_options
  FOR UPDATE USING (organization_id = (SELECT get_current_organization()) AND public.has_permission('products.update'))
  WITH CHECK (organization_id = (SELECT get_current_organization()) AND public.has_permission('products.update'));
CREATE POLICY "go_delete" ON public.gift_options
  FOR DELETE USING (organization_id = (SELECT get_current_organization()) AND public.has_permission('products.delete'));

CREATE POLICY "sa_select" ON public.sale_addons
  FOR SELECT USING (organization_id = (SELECT get_current_organization()) AND public.has_permission('sales.read'));
CREATE POLICY "sa_insert" ON public.sale_addons
  FOR INSERT WITH CHECK (organization_id = (SELECT get_current_organization()) AND public.has_permission('sales.create'));

-- 5. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_options TO authenticated;
GRANT SELECT, INSERT ON public.sale_addons TO authenticated;
