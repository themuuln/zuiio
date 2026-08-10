-- =============================================
-- Fix get_public_products: the shipped 5-arg RPC placed ORDER BY p.name
-- OUTSIDE json_agg on an aggregate-only SELECT, so every call raised
-- 42803 "column p.name must appear in the GROUP BY" — the public catalog
-- list never worked. Move the ORDER BY inside the aggregate.
-- Also drop the superseded 1-arg overload: it bypassed catalog_enabled /
-- is_public and returned stock/sku/barcode (privacy leak surface; reached
-- via SQL even though PostgREST resolves it as ambiguous/300).
-- =============================================

DROP FUNCTION IF EXISTS public.get_public_products(p_slug text);

-- Remote prod drifted to RETURNS json for the 5-arg overload and
-- get_public_product (committed migrations say jsonb). json -> jsonb is a
-- return-type change, so CREATE OR REPLACE alone fails with 42P13; drop both
-- before re-creating. Grants are re-applied below (REVOKE...GRANT).
DROP FUNCTION IF EXISTS public.get_public_products(text, uuid, text, integer, integer);
DROP FUNCTION IF EXISTS public.get_public_product(text, uuid);

CREATE OR REPLACE FUNCTION public.get_public_products(
  p_slug text,
  p_category_id uuid DEFAULT NULL::uuid,
  p_search text DEFAULT NULL::text,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 24
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  -- Paginate FIRST in a subquery, then aggregate: LIMIT/OFFSET must apply to
  -- the underlying rows, not to the single json_agg output row.
  SELECT json_agg(item)
  INTO v_products
  FROM (
    SELECT json_build_object(
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
    ) AS item
    FROM public.products p
    LEFT JOIN public.categories c ON c.id = p.category_id
    WHERE p.organization_id = v_org_id
      AND p.is_public = true
      AND p.deleted_at IS NULL
      AND (p_category_id IS NULL OR p.category_id = p_category_id)
      AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
    ORDER BY p.name
    LIMIT p_page_size OFFSET v_offset
  ) items;

  RETURN json_build_object(
    'organization', v_org,
    'products', COALESCE(v_products, '[]'::json),
    'total', v_total,
    'page', p_page,
    'page_size', p_page_size
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_public_products(text, uuid, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_products(text, uuid, text, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_products(text, uuid, text, integer, integer) TO authenticated;

-- =============================================
-- Fix get_public_product variants + attributes subqueries: the RPC built
-- variant JSON from columns that do not exist on product_variants (name,
-- price, image_url) and attribute JSON from non-existent columns on
-- product_attribute_values (attribute_name, attribute_value). Real data:
-- variants join product_variant_options via product_variant_assignments
-- (option_labels), price is product_variants.sale_price; attributes join
-- product_attribute_definitions. Products WITH variants or attribute
-- values made the RPC throw and the public detail page fail. Verified
-- against the live schema on 2026-08-10 (local + remote).
-- =============================================

CREATE OR REPLACE FUNCTION public.get_public_product(p_slug text, p_product_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        'sku', pv.sku,
        'sale_price', pv.sale_price,
        'current_stock', pv.current_stock,
        'option_labels', (
          SELECT string_agg(vo.value, ' / '
            ORDER BY g.sort_order, vo.sort_order, vo.value)
          FROM public.product_variant_assignments pva
          JOIN public.product_variant_options vo ON vo.id = pva.option_id
          JOIN public.product_variant_groups g ON g.id = vo.group_id
          WHERE pva.variant_id = pv.id
        )
      ) ORDER BY pv.created_at)
      FROM public.product_variants pv
      WHERE pv.product_id = p.id
        AND pv.is_active = true
    ),
    'attributes', (
      SELECT json_agg(json_build_object(
        'name', ad.name,
        'value', COALESCE(
          pav.value_text,
          pav.value_number::text,
          CASE WHEN pav.value_boolean IS NOT NULL
            THEN pav.value_boolean::text END
        )
      ))
      FROM public.product_attribute_values pav
      JOIN public.product_attribute_definitions ad
        ON ad.id = pav.attribute_definition_id
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
$function$;

REVOKE EXECUTE ON FUNCTION public.get_public_product(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_product(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_product(text, uuid) TO authenticated;

-- =============================================
-- Fix sync_product_has_variants trigger: no SET search_path, so it ran with
-- the CALLER's path. The public checkout RPC submit_shop_order sets
-- search_path TO '' (defensive) and decrements variant stock -> the trigger
-- fired with an empty path -> `UPDATE products` (unqualified) raised 42P01
-- "relation products does not exist" and the whole order failed. Pin the
-- trigger's path to public.
-- =============================================

CREATE OR REPLACE FUNCTION public.sync_product_has_variants()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  target_product uuid;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    target_product := NEW.product_id;
  ELSE
    target_product := OLD.product_id;
  END IF;

  UPDATE products p
  SET has_variants = (
    SELECT EXISTS (
      SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
    )
  )
  WHERE p.id = target_product;

  RETURN NULL;
END;
$function$;

-- =============================================
-- Fix submit_shop_order variant handling (found by the variant-order
-- integration test, 2026-08-10):
--   1. PRICING: variant items were charged the BASE product price in both
--      v_total and sale_items (unit_price/total_price read products.sale_price
--      unconditionally). Variant orders now price from product_variants.sale_price
--      (falling back to the base price when unset).
--   2. STOCK: ordering a variant decremented BOTH the base product and the
--      variant (double drain); variant orders now decrement only the variant.
--   3. stock_movements.unit_cost now reflects variant cost when set.
-- =============================================

CREATE OR REPLACE FUNCTION public.submit_shop_order(p_org_slug text, p_items jsonb, p_payment_method text DEFAULT 'cash'::text, p_currency_code text DEFAULT 'MNT'::text, p_contact_name text DEFAULT NULL::text, p_contact_phone text DEFAULT NULL::text, p_branch_slug text DEFAULT NULL::text, p_idempotency_key text DEFAULT NULL::text)
 RETURNS TABLE(order_id uuid, total_amount numeric, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_org_id UUID;
  v_org_name TEXT;
  v_branch_id UUID;
  v_sale_id UUID;
  v_contact_id UUID;
  v_store_account_id UUID;
  v_total NUMERIC := 0;
  v_item JSONB;
  v_product_id UUID;
  v_variant_id UUID;
  v_qty NUMERIC;
  v_unit_price NUMERIC;
  v_current_stock NUMERIC;
  v_agg RECORD;
  v_recent_pending INT;
  v_recent_phone INT;
  -- Dedicated lookup targets for the idempotency pre-check: a zero-row
  -- SELECT ... INTO sets its targets to NULL, which would clobber v_total.
  v_existing_id UUID;
  v_existing_total NUMERIC;
BEGIN
  -- 0. Resolve storefront org by public slug; catalog must be enabled.
  SELECT o.id, o.name INTO v_org_id, v_org_name
  FROM public.organizations o
  JOIN public.organization_public_profiles p ON p.organization_id = o.id
  WHERE o.slug = p_org_slug
    AND p.catalog_enabled = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Дэлгүүр олдсонгүй';
  END IF;

  -- 0.5 Idempotent replay — a retry after a crash must return the order
  -- created by the first attempt, never create a second one.
  -- Lookup targets are dedicated variables: a zero-row SELECT ... INTO
  -- sets its targets to NULL, which must not clobber v_total.
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    SELECT s.id, s.total_amount INTO v_existing_id, v_existing_total
    FROM public.sales s
    WHERE s.organization_id = v_org_id AND s.dedupe_key = p_idempotency_key;
    IF FOUND THEN
      RETURN QUERY SELECT v_existing_id, v_existing_total, 'pending'::TEXT;
      -- RETURN QUERY appends and CONTINUES — exit explicitly so the retry
      -- never falls through into the rate-limit + insert path.
      RETURN;
    END IF;
  END IF;

  -- 0.6 Flood protection — this is the public anon entry point, so both
  -- checks run BEFORE any stock validation work.
  SELECT count(*) INTO v_recent_pending
  FROM public.sales s
  WHERE s.organization_id = v_org_id
    AND s.status = 'pending'
    AND s.deleted_at IS NULL
    AND s.created_at > now() - interval '1 hour';
  IF v_recent_pending >= 20 THEN
    RAISE EXCEPTION 'Хэт олон захиалга ирсэн байна. Түр хүлээгээд дахин оролдоно уу.';
  END IF;

  IF p_contact_phone IS NOT NULL AND p_contact_phone <> '' THEN
    SELECT count(*) INTO v_recent_phone
    FROM public.sales s
    JOIN public.contacts c ON c.id = s.contact_id
    WHERE s.organization_id = v_org_id
      AND s.status = 'pending'
      AND s.deleted_at IS NULL
      AND c.phone = p_contact_phone
      AND s.created_at > now() - interval '1 hour';
    IF v_recent_phone >= 5 THEN
      RAISE EXCEPTION 'Хэт олон захиалга ирсэн байна. Түр хүлээгээд дахин оролдоно уу.';
    END IF;
  END IF;

  -- 1. Resolve branch: given slug, else the org's default branch.
  IF p_branch_slug IS NOT NULL AND p_branch_slug <> '' THEN
    SELECT b.id INTO v_branch_id
    FROM public.branches b
    WHERE b.organization_id = v_org_id
      AND b.slug = p_branch_slug;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Салбар олдсонгүй';
    END IF;
  ELSE
    SELECT b.id INTO v_branch_id
    FROM public.branches b
    WHERE b.organization_id = v_org_id
      AND b.is_default = true
    LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Дэлгүүр салбар тохируулаагүй байна';
    END IF;
  END IF;

  -- 2. Validate item payload shape.
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Захиалгын мэдээлэл буруу байна';
  END IF;
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Захиалга хоосон байна';
  END IF;
  IF jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Хэт олон бараа байна';
  END IF;

  -- 3. Validate stock + compute totals server-side (prices from DB, never client).
  FOR v_agg IN
    SELECT product_id, variant_id, SUM(quantity)::numeric AS total_qty
    FROM (
      SELECT
        (i->>'product_id')::uuid AS product_id,
        NULLIF(i->>'variant_id', '')::uuid AS variant_id,
        (i->>'quantity')::numeric AS quantity
      FROM jsonb_array_elements(p_items) AS i
    ) AS lines
    GROUP BY product_id, variant_id
    ORDER BY product_id::text
  LOOP
    v_product_id := v_agg.product_id;
    v_variant_id := v_agg.variant_id;
    v_qty := v_agg.total_qty;

    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Барааны тоо буруу байна';
    END IF;
    IF v_qty > 999 THEN
      RAISE EXCEPTION 'Барааны тоо хэт их байна';
    END IF;

    SELECT p.sale_price, p.current_stock INTO v_unit_price, v_current_stock
    FROM public.products p
    WHERE p.id = v_product_id
      AND p.organization_id = v_org_id
      AND p.deleted_at IS NULL
    FOR UPDATE;

    IF v_unit_price IS NULL THEN
      RAISE EXCEPTION 'Бүтээгдэхүүн олдсонгүй';
    END IF;

    IF v_variant_id IS NOT NULL THEN
      SELECT pv.current_stock, COALESCE(pv.sale_price, v_unit_price)
      INTO v_current_stock, v_unit_price
      FROM public.product_variants pv
      WHERE pv.id = v_variant_id
        AND pv.product_id = v_product_id
      FOR UPDATE;

      IF v_current_stock IS NULL THEN
        RAISE EXCEPTION 'Вариант олдсонгүй';
      END IF;
    END IF;

    IF v_current_stock IS NULL OR v_current_stock < v_qty THEN
      RAISE EXCEPTION 'Нөөц хүрэлцэхгүй байна';
    END IF;

    v_total := v_total + (v_unit_price * v_qty);
  END LOOP;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) AS item LOOP
    v_qty := (v_item->>'quantity')::numeric;
    IF v_qty IS NULL OR v_qty <= 0 OR v_qty > 999 THEN
      RAISE EXCEPTION 'Барааны тоо буруу байна';
    END IF;
  END LOOP;

  -- 4. Optional contact (staff can reach the buyer).
  v_contact_id := NULL;
  IF p_contact_phone IS NOT NULL AND p_contact_phone <> '' THEN
    SELECT c.id INTO v_contact_id
    FROM public.contacts c
    WHERE c.organization_id = v_org_id
      AND c.phone = p_contact_phone
      AND c.type = 'customer'
    LIMIT 1;
    IF NOT FOUND AND p_contact_name IS NOT NULL AND p_contact_name <> '' THEN
      INSERT INTO public.contacts (organization_id, name, phone, type)
      VALUES (v_org_id, p_contact_name, p_contact_phone, 'customer')
      RETURNING id INTO v_contact_id;
    END IF;
  END IF;

  -- 5. Link the order to a signed-in store account when one exists.
  v_store_account_id := NULL;
  IF auth.uid() IS NOT NULL THEN
    SELECT sa.id INTO v_store_account_id
    FROM public.store_accounts sa
    WHERE sa.id = auth.uid();
  END IF;

  -- 6. Insert the sale (pending — staff confirms and collects payment).
  INSERT INTO public.sales (
    organization_id, branch_id, contact_id, sale_date,
    total_amount, original_amount, paid_amount,
    payment_method, payment_splits, status,
    created_by, salesperson_id, store_account_id, currency_code,
    dedupe_key
  ) VALUES (
    v_org_id, v_branch_id, v_contact_id, now(),
    v_total, v_total, 0,
    p_payment_method, jsonb_build_object(p_payment_method, 0), 'pending',
    NULL, NULL, v_store_account_id, p_currency_code,
    NULLIF(p_idempotency_key, '')
  ) RETURNING id INTO v_sale_id;

  -- 7. Insert sale_items + stock_movements (same transaction).
  INSERT INTO public.sale_items (
    sale_id, product_id, quantity, unit_price, total_price, commission_amount, variant_id
  )
  SELECT
    v_sale_id,
    (item->>'product_id')::UUID,
    (item->>'quantity')::NUMERIC,
    (
      SELECT COALESCE(
        (SELECT pv.sale_price FROM public.product_variants pv WHERE pv.id = NULLIF((item->>'variant_id')::TEXT, '')::UUID),
        (SELECT p.sale_price FROM public.products p WHERE p.id = (item->>'product_id')::UUID)
      )
    ),
    (item->>'quantity')::NUMERIC * (
      SELECT COALESCE(
        (SELECT pv.sale_price FROM public.product_variants pv WHERE pv.id = NULLIF((item->>'variant_id')::TEXT, '')::UUID),
        (SELECT p.sale_price FROM public.products p WHERE p.id = (item->>'product_id')::UUID)
      )
    ),
    0,
    NULLIF((item->>'variant_id')::TEXT, '')::UUID
  FROM jsonb_array_elements(p_items) AS item;

  INSERT INTO public.stock_movements (
    organization_id, branch_id, product_id, type, quantity, unit_cost, reference, created_by, variant_id
  )
  SELECT
    v_org_id,
    v_branch_id,
    (item->>'product_id')::UUID,
    'out',
    (item->>'quantity')::NUMERIC,
    (
      SELECT COALESCE(
        (SELECT pv.cost_price FROM public.product_variants pv WHERE pv.id = NULLIF((item->>'variant_id')::TEXT, '')::UUID),
        (SELECT p.cost_price FROM public.products p WHERE p.id = (item->>'product_id')::UUID)
      )
    ),
    'sale:' || v_sale_id::TEXT,
    NULL,
    NULLIF((item->>'variant_id')::TEXT, '')::UUID
  FROM jsonb_array_elements(p_items) AS item;

  -- 8. Decrement stock (rows locked in step 3).
  FOR v_item IN
    SELECT * FROM jsonb_array_elements(p_items) AS item
    ORDER BY (item->>'product_id')::TEXT
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_variant_id := NULLIF(v_item->>'variant_id', '')::UUID;
    v_qty := (v_item->>'quantity')::NUMERIC;

    IF v_variant_id IS NULL THEN
      UPDATE public.products
      SET current_stock = current_stock - v_qty
      WHERE id = v_product_id;
    ELSE
      UPDATE public.product_variants
      SET current_stock = current_stock - v_qty
      WHERE id = v_variant_id;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_sale_id, v_total, 'pending'::TEXT;
END;
$function$

