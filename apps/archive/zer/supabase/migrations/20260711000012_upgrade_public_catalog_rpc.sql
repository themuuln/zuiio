-- Upgrade public catalog RPCs to include images, descriptions, and attributes.
-- This powers the "product wiki" — a public-facing catalog for each organization.

-- =============================================
-- get_public_products — list all products with images, descriptions, attributes
-- =============================================
CREATE OR REPLACE FUNCTION public.get_public_products(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id UUID;
  v_org_name TEXT;
  v_currency TEXT;
  v_company_type TEXT;
  v_org JSONB;
  v_products JSONB;
BEGIN
  SELECT id, name, currency, company_type
  INTO v_org_id, v_org_name, v_currency, v_company_type
  FROM public.organizations
  WHERE slug = p_slug;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_org := jsonb_build_object(
    'name', v_org_name,
    'slug', p_slug,
    'currency', COALESCE(v_currency, 'MNT'),
    'companyType', v_company_type
  );

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'sku', p.sku,
      'barcode', p.barcode,
      'unit', p.unit,
      'sale_price', p.sale_price,
      'current_stock', p.current_stock,
      'min_stock', p.min_stock,
      'category_name', c.name,
      'category_id', p.category_id,
      'image_url', COALESCE(
        (SELECT image_urls[1] FROM public.products WHERE id = p.id),
        p.image_url
      ),
      'description', p.description,
      'attribute_count', (
        SELECT COUNT(*)::int
        FROM public.product_attribute_values pav
        WHERE pav.product_id = p.id
          AND pav.organization_id = v_org_id
      )
    )
    ORDER BY p.name
  ) INTO v_products
  FROM public.products p
  LEFT JOIN public.categories c ON c.id = p.category_id
  WHERE p.organization_id = v_org_id
    AND p.deleted_at IS NULL;

  RETURN jsonb_build_object(
    'organization', v_org,
    'products', COALESCE(v_products, '[]'::JSONB)
  );
END;
$$;

-- =============================================
-- get_public_product — single product with images, descriptions, attributes
-- =============================================
CREATE OR REPLACE FUNCTION public.get_public_product(p_slug TEXT, p_product_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id UUID;
  v_org_name TEXT;
  v_currency TEXT;
  v_company_type TEXT;
  v_product JSONB;
  v_images JSONB;
  v_attributes JSONB;
BEGIN
  SELECT id, name, currency, company_type
  INTO v_org_id, v_org_name, v_currency, v_company_type
  FROM public.organizations
  WHERE slug = p_slug;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Build image array: image_urls if present, else [image_url]
  SELECT COALESCE(
    to_jsonb(p.image_urls),
    CASE WHEN p.image_url IS NOT NULL
      THEN jsonb_build_array(p.image_url)
      ELSE '[]'::JSONB
    END
  ) INTO v_images
  FROM public.products p
  WHERE p.id = p_product_id AND p.organization_id = v_org_id;

  -- Build attributes array from attribute definitions + values
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'name', pad.name,
      'slug', pad.slug,
      'value_type', pad.value_type,
      'unit', pad.unit,
      'value_text', pav.value_text,
      'value_number', pav.value_number,
      'value_boolean', pav.value_boolean,
      'sort_order', pad.sort_order
    ) ORDER BY pad.sort_order
  ), '[]'::JSONB) INTO v_attributes
  FROM public.product_attribute_values pav
  JOIN public.product_attribute_definitions pad
    ON pad.id = pav.attribute_definition_id
    AND pad.organization_id = v_org_id
  WHERE pav.product_id = p_product_id
    AND pav.organization_id = v_org_id;

  SELECT jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'sku', p.sku,
    'barcode', p.barcode,
    'unit', p.unit,
    'sale_price', p.sale_price,
    'current_stock', p.current_stock,
    'min_stock', p.min_stock,
    'category_name', c.name,
    'category_id', p.category_id,
    'created_at', p.created_at,
    'description', p.description,
    'additional_info', p.additional_info,
    'usage_instructions', p.usage_instructions,
    'care_instructions', p.care_instructions,
    'images', v_images,
    'attributes', v_attributes
  ) INTO v_product
  FROM public.products p
  LEFT JOIN public.categories c ON c.id = p.category_id
  WHERE p.organization_id = v_org_id AND p.id = p_product_id AND p.deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'organization', jsonb_build_object(
      'name', v_org_name,
      'slug', p_slug,
      'currency', COALESCE(v_currency, 'MNT'),
      'companyType', v_company_type
    ),
    'product', v_product
  );
END;
$$;

-- =============================================
-- get_public_categories — list categories with product counts for navigation
-- =============================================
CREATE OR REPLACE FUNCTION public.get_public_categories(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id UUID;
  v_categories JSONB;
BEGIN
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE slug = p_slug;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'product_count', (
        SELECT COUNT(*)::int
        FROM public.products p
        WHERE p.category_id = c.id
          AND p.organization_id = v_org_id
          AND p.deleted_at IS NULL
      )
    ) ORDER BY c.name
  ) INTO v_categories
  FROM public.categories c
  WHERE c.organization_id = v_org_id;

  RETURN COALESCE(v_categories, '[]'::JSONB);
END;
$$;
