-- =============================================
-- save_product_catalog RPC
--
-- Upserts a product row and its attribute values in a single transaction.
-- Called by createProduct and updateProduct actions.
-- =============================================

CREATE OR REPLACE FUNCTION public.save_product_catalog(
  p_product_id UUID,
  p_product JSONB,
  p_attribute_values JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_product_id UUID;
  attr JSONB;
BEGIN
  -- Resolve org_id from the authenticated user
  v_org_id := (SELECT public.get_current_organization());
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No organization context';
  END IF;

  -- Use provided ID or generate new
  v_product_id := COALESCE(p_product_id, gen_random_uuid());

  -- Upsert product row
  INSERT INTO public.products (
    id, organization_id, name, slug, description,
    sale_price, cost_price, category_id, is_active,
    sku, barcode, unit, min_stock, metadata,
    image_url, image_urls, brand_name, brand_logo_url,
    created_at, updated_at
  ) VALUES (
    v_product_id,
    v_org_id,
    p_product->>'name',
    p_product->>'slug',
    p_product->>'description',
    (p_product->>'sale_price')::NUMERIC,
    (p_product->>'cost_price')::NUMERIC,
    (p_product->>'category_id')::UUID,
    COALESCE((p_product->>'is_active')::BOOLEAN, true),
    p_product->>'sku',
    p_product->>'barcode',
    p_product->>'unit',
    (p_product->>'min_stock')::INT,
    COALESCE(p_product->'metadata', '{}'),
    p_product->>'image_url',
    COALESCE(p_product->'image_urls', '[]'),
    p_product->>'brand_name',
    p_product->>'brand_logo_url',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    sale_price = EXCLUDED.sale_price,
    cost_price = EXCLUDED.cost_price,
    category_id = EXCLUDED.category_id,
    is_active = EXCLUDED.is_active,
    sku = EXCLUDED.sku,
    barcode = EXCLUDED.barcode,
    unit = EXCLUDED.unit,
    min_stock = EXCLUDED.min_stock,
    metadata = EXCLUDED.metadata,
    image_url = EXCLUDED.image_url,
    image_urls = EXCLUDED.image_urls,
    brand_name = EXCLUDED.brand_name,
    brand_logo_url = EXCLUDED.brand_logo_url,
    updated_at = now();

  -- Delete existing attribute values and re-insert
  IF p_attribute_values IS NOT NULL AND jsonb_array_length(p_attribute_values) > 0 THEN
    DELETE FROM public.product_attribute_values
    WHERE product_id = v_product_id
      AND organization_id = v_org_id;

    FOR attr IN SELECT jsonb_array_elements(p_attribute_values)
    LOOP
      INSERT INTO public.product_attribute_values (
        product_id, attribute_definition_id, organization_id,
        value_text, value_number, value_boolean
      ) VALUES (
        v_product_id,
        (attr->>'attribute_definition_id')::UUID,
        v_org_id,
        attr->>'value_text',
        (attr->>'value_number')::NUMERIC,
        (attr->>'value_boolean')::BOOLEAN
      );
    END LOOP;
  END IF;

  RETURN v_product_id;
END;
$$;

-- Grant execute to authenticated
GRANT EXECUTE ON FUNCTION public.save_product_catalog(UUID, JSONB, JSONB) TO authenticated;
