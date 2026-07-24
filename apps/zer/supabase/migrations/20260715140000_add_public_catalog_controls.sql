-- =============================================
-- Add public catalog controls
-- - organization_public_profiles table
-- - products publication columns
-- - Catalog RPC functions
-- =============================================

-- ─── Organization Public Profiles ──────────────
CREATE TABLE IF NOT EXISTS public.organization_public_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  catalog_enabled BOOLEAN NOT NULL DEFAULT false,
  display_name TEXT,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  website_url TEXT,
  logo_url TEXT,
  banner_url TEXT,
  business_hours JSONB,
  policies TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.organization_public_profiles ENABLE ROW LEVEL SECURITY;

-- Org members can manage their public profile
CREATE POLICY "org_public_profiles_select_own_org" ON public.organization_public_profiles
  FOR SELECT USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "org_public_profiles_insert_own_org" ON public.organization_public_profiles
  FOR INSERT WITH CHECK (organization_id = (SELECT get_current_organization()));

CREATE POLICY "org_public_profiles_update_own_org" ON public.organization_public_profiles
  FOR UPDATE USING (organization_id = (SELECT get_current_organization()));

-- Allow anon to read published profiles (for public pages)
CREATE POLICY "org_public_profiles_anon_select" ON public.organization_public_profiles
  FOR SELECT USING (catalog_enabled = true);

-- ─── Products Publication Columns ──────────────
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Indexes for public product lookups
CREATE INDEX IF NOT EXISTS idx_products_is_public ON public.products(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_products_org_public ON public.products(organization_id, is_public) WHERE is_public = true;

-- ─── get_public_products ──────────────────────
CREATE OR REPLACE FUNCTION public.get_public_products(
  p_slug TEXT,
  p_category_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 24
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_org JSON;
  v_products JSON;
  v_total INT;
  v_offset INT;
BEGIN
  -- Find organization by slug
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE slug = p_slug;

  IF v_org_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check if catalog is enabled
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_public_profiles
    WHERE organization_id = v_org_id AND catalog_enabled = true
  ) THEN
    RETURN json_build_object('organization', NULL, 'products', '[]'::json, 'total', 0);
  END IF;

  -- Build org info
  SELECT json_build_object(
    'name', o.name,
    'slug', o.slug,
    'currency', o.currency,
    'company_type', o.company_type
  ) INTO v_org
  FROM public.organizations o WHERE o.id = v_org_id;

  -- Count matching products
  SELECT count(*) INTO v_total
  FROM public.products p
  WHERE p.organization_id = v_org_id
    AND p.is_public = true
    AND p.deleted_at IS NULL
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%');

  v_offset := (p_page - 1) * p_page_size;

  -- Fetch products (safe fields only — no stock, min_stock, SKU, barcode, cost_price)
  SELECT json_agg(json_build_object(
    'id', p.id,
    'name', p.name,
    'unit', p.unit,
    'sale_price', p.sale_price,
    'category_name', c.name,
    'category_id', p.category_id,
    'image_url', p.image_url,
    'description', p.description,
    'attribute_count', (
      SELECT count(*) FROM public.product_attribute_values v
      WHERE v.product_id = p.id
    )
  ))
  INTO v_products
  FROM public.products p
  LEFT JOIN public.categories c ON c.id = p.category_id
  WHERE p.organization_id = v_org_id
    AND p.is_public = true
    AND p.deleted_at IS NULL
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
  ORDER BY p.name
  LIMIT p_page_size OFFSET v_offset;

  RETURN json_build_object(
    'organization', v_org,
    'products', COALESCE(v_products, '[]'::json),
    'total', v_total,
    'page', p_page,
    'page_size', p_page_size
  );
END;
$$;

-- ─── get_public_categories ────────────────────
CREATE OR REPLACE FUNCTION public.get_public_categories(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_categories JSON;
BEGIN
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE slug = p_slug;

  IF v_org_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT json_agg(json_build_object(
    'id', c.id,
    'name', c.name,
    'product_count', (
      SELECT count(*) FROM public.products p
      WHERE p.category_id = c.id
        AND p.organization_id = v_org_id
        AND p.is_public = true
        AND p.deleted_at IS NULL
    )
  ) ORDER BY c.name)
  INTO v_categories
  FROM public.categories c
  WHERE c.organization_id = v_org_id
    AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.category_id = c.id
        AND p.organization_id = v_org_id
        AND p.is_public = true
        AND p.deleted_at IS NULL
    );

  RETURN COALESCE(v_categories, '[]'::json);
END;
$$;

-- ─── get_public_product ───────────────────────
CREATE OR REPLACE FUNCTION public.get_public_product(
  p_slug TEXT,
  p_product_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_org JSON;
  v_product JSON;
BEGIN
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE slug = p_slug;

  IF v_org_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Build org info
  SELECT json_build_object(
    'name', o.name,
    'slug', o.slug,
    'currency', o.currency,
    'company_type', o.company_type
  ) INTO v_org
  FROM public.organizations o WHERE o.id = v_org_id;

  -- Fetch product (must be published and belong to this org)
  SELECT json_build_object(
    'id', p.id,
    'name', p.name,
    'sku', p.sku,
    'barcode', p.barcode,
    'unit', p.unit,
    'sale_price', p.sale_price,
    'category_name', cat.name,
    'category_id', p.category_id,
    'image_url', p.image_url,
    'description', p.description,
    'created_at', p.created_at,
    'variants', (
      SELECT json_agg(json_build_object(
        'id', pv.id,
        'name', pv.name,
        'sku', pv.sku,
        'price', pv.price,
        'image_url', pv.image_url
      ))
      FROM public.product_variants pv
      WHERE pv.product_id = p.id
    ),
    'attributes', (
      SELECT json_agg(json_build_object(
        'name', pav.attribute_name,
        'value', pav.attribute_value
      ))
      FROM public.product_attribute_values pav
      WHERE pav.product_id = p.id
    )
  ) INTO v_product
  FROM public.products p
  LEFT JOIN public.categories cat ON cat.id = p.category_id
  WHERE p.id = p_product_id
    AND p.organization_id = v_org_id
    AND p.is_public = true
    AND p.deleted_at IS NULL;

  IF v_product IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object('organization', v_org, 'product', v_product);
END;
$$;

-- ─── Revoke/Grant Execution ───────────────────
REVOKE EXECUTE ON FUNCTION public.get_public_products(TEXT, UUID, TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_products(TEXT, UUID, TEXT, INT, INT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_products(TEXT, UUID, TEXT, INT, INT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_public_categories(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_categories(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_categories(TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_public_product(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_product(TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_product(TEXT, UUID) TO authenticated;
