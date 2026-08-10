-- =============================================
-- Online (storefront) order flag for admin visibility.
--
-- The public checkout RPC submit_shop_order and the staff POS flow
-- (process_shop_sale / sales/new) both insert into public.sales, and the
-- admin sales history could not tell online orders apart from POS sales.
--
-- This migration:
--   1. Adds sales.is_online (NOT NULL DEFAULT false) — POS sales and legacy
--      rows are offline by default; only submit_shop_order sets it true.
--   2. Redefines submit_shop_order IDENTICALLY to the current definition
--      (20260810150000) except the inserted sale now carries is_online = true.
--      All other behavior is untouched: SET search_path '', SECURITY DEFINER,
--      validation, rate limits, idempotent replay, variant pricing/stock,
--      stock_movements, grants (CREATE OR REPLACE preserves privileges).
-- =============================================

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS is_online boolean NOT NULL DEFAULT false;

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
    dedupe_key, is_online
  ) VALUES (
    v_org_id, v_branch_id, v_contact_id, now(),
    v_total, v_total, 0,
    p_payment_method, jsonb_build_object(p_payment_method, 0), 'pending',
    NULL, NULL, v_store_account_id, p_currency_code,
    NULLIF(p_idempotency_key, ''), true
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
$function$;
