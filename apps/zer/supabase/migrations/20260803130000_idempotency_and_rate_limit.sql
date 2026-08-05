-- =============================================
-- Offline-replay idempotency + public order flood protection
--
-- 1. sales.dedupe_key — idempotency key for safe offline replay. The
--    offline mutation queue already stamps every queued action with a
--    client-generated UUID; the server actions (createSale, createShopSale)
--    and the public RPCs (submit_shop_order, process_shop_sale) now refuse
--    to create a second sale for a key they already processed, so a process
--    death mid-replay cannot double-sell.
-- 2. Rate limits on submit_shop_order — the public anon checkout RPC is a
--    spam vector (fake pending orders pile up for staff to confirm).
--    PostgREST cannot hand the client IP to the function and the consumer
--    app talks to Supabase directly (not through Vercel), so the limit is
--    enforced in SQL: max pending orders per org and per contact phone in a
--    rolling 1h window. Staff confirmations change the status and remove
--    the order from the window (only status = 'pending' counts), so a legit
--    flash sale where staff keeps confirming is not throttled.
-- =============================================

-- ── sales.dedupe_key ──────────────────────────────────────────
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

-- NULLs are distinct in Postgres unique indexes, so rows without a key
-- are unaffected by the uniqueness.
CREATE UNIQUE INDEX IF NOT EXISTS sales_org_dedupe_key_uniq
  ON public.sales (organization_id, dedupe_key);

-- Window count for the pending-order rate limit (submit_shop_order).
CREATE INDEX IF NOT EXISTS sales_org_pending_created_idx
  ON public.sales (organization_id, created_at)
  WHERE status = 'pending' AND deleted_at IS NULL;

-- ── submit_shop_order: flood protection + idempotent replay ───
DROP FUNCTION IF EXISTS public.submit_shop_order(TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.submit_shop_order(
  p_org_slug TEXT,
  p_items JSONB,
  p_payment_method TEXT DEFAULT 'cash',
  p_currency_code TEXT DEFAULT 'MNT',
  p_contact_name TEXT DEFAULT NULL,
  p_contact_phone TEXT DEFAULT NULL,
  p_branch_slug TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS TABLE(
  order_id UUID,
  total_amount NUMERIC,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
  -- (Columns are qualified: `order_id`/`total_amount`/`status` are also
  -- RETURNS TABLE OUT params, and PL/pgSQL would report them ambiguous.
  -- Lookup targets are dedicated variables — a zero-row SELECT ... INTO
  -- sets its targets to NULL, which must not clobber v_total.)
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
  --    Quantities are AGGREGATED per product/variant first so duplicate lines
  --    for the same product cannot collectively oversell the available stock.
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
      SELECT pv.current_stock INTO v_current_stock
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

  -- Per-line sanity pass (bounds only) — the aggregate loop above already
  -- covers stock; this rejects malformed individual lines like negative or
  -- absurd quantities before any write.
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
    (SELECT p.sale_price FROM public.products p WHERE p.id = (item->>'product_id')::UUID),
    (item->>'quantity')::NUMERIC * (SELECT p.sale_price FROM public.products p WHERE p.id = (item->>'product_id')::UUID),
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
    (SELECT p.cost_price FROM public.products p WHERE p.id = (item->>'product_id')::UUID),
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

    UPDATE public.products
    SET current_stock = current_stock - v_qty
    WHERE id = v_product_id;

    IF v_variant_id IS NOT NULL THEN
      UPDATE public.product_variants
      SET current_stock = current_stock - v_qty
      WHERE id = v_variant_id;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_sale_id, v_total, 'pending'::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_shop_order(TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_shop_order(TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ── process_shop_sale: idempotent replay ──────────────────────
-- A SINGLE superset signature replaces the historical overload zoo
-- (10-param base, 13-param currency, 11-param original_amount, and the
-- short-lived 12-param from this file's first revision). PostgREST matches
-- a function only when EVERY provided argument exists in the signature, so
-- createShopSale (which sends currency + original_amount + dedupe together)
-- previously matched nothing. All optional params carry DEFAULTs, so every
-- existing call pattern resolves to this one function.
DROP FUNCTION IF EXISTS public.process_shop_sale(UUID, UUID, UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID, JSONB, JSONB);
DROP FUNCTION IF EXISTS public.process_shop_sale(UUID, UUID, UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID, JSONB, JSONB, TEXT, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS public.process_shop_sale(UUID, UUID, UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID, JSONB, JSONB, NUMERIC);
DROP FUNCTION IF EXISTS public.process_shop_sale(UUID, UUID, UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID, JSONB, JSONB, NUMERIC, TEXT);

CREATE OR REPLACE FUNCTION public.process_shop_sale(
  p_org_id UUID,
  p_branch_id UUID,
  p_user_id UUID,
  p_contact_id UUID,
  p_total_amount NUMERIC,
  p_paid_amount NUMERIC,
  p_payment_method TEXT,
  p_salesperson_id UUID,
  p_items JSONB,       -- [{product_id, quantity, unit_price, total_price, commission_amount, variant_id}]
  p_movements JSONB,   -- [{product_id, quantity, unit_cost, variant_id}]
  p_currency_code TEXT DEFAULT 'MNT',
  p_currency_symbol TEXT DEFAULT '₮',
  p_exchange_rate NUMERIC DEFAULT 1.0,
  p_original_amount NUMERIC DEFAULT NULL,
  p_dedupe_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_sale_id UUID;
  v_item JSONB;
  v_movement JSONB;
  v_product_id UUID;
  v_variant_id UUID;
  v_qty NUMERIC;
  v_current_stock NUMERIC;
  v_errors TEXT[] := '{}';
BEGIN
  -- Permission check
  IF NOT public.has_permission('sales.create') THEN
    RETURN jsonb_build_object('error', 'Permission denied');
  END IF;

  -- Idempotent replay fast path: a retried offline sale returns the sale
  -- created by the first attempt instead of double-selling.
  IF p_dedupe_key IS NOT NULL AND p_dedupe_key <> '' THEN
    SELECT s.id INTO v_sale_id
    FROM public.sales s
    WHERE s.organization_id = p_org_id AND s.dedupe_key = p_dedupe_key;
    IF FOUND THEN
      RETURN jsonb_build_object('success', true, 'sale_id', v_sale_id, 'duplicate', true);
    END IF;
  END IF;

  -- =============================================
  -- Phase 1: Validate stock (FOR UPDATE locking)
  -- Lock all product rows first (ordered to prevent deadlocks)
  -- =============================================
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) AS item ORDER BY (item->>'product_id')::TEXT
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_variant_id := NULLIF((v_item->>'variant_id')::TEXT, '')::UUID;
    v_qty := (v_item->>'quantity')::NUMERIC;

    -- Lock the product row
    SELECT p.current_stock INTO v_current_stock
    FROM public.products p
    WHERE p.id = v_product_id
      AND p.organization_id = p_org_id
    FOR UPDATE;

    IF v_current_stock IS NULL THEN
      v_errors := array_append(v_errors, 'Бүтээгдэхүүн олдсонгүй: ' || v_product_id::TEXT);
      CONTINUE;
    END IF;

    IF v_current_stock < v_qty THEN
      v_errors := array_append(
        v_errors,
        'Үлдэгдэл хүрэлцэхгүй: ' || v_product_id::TEXT ||
        ' (байгаа: ' || v_current_stock::TEXT || ', хэрэгтэй: ' || v_qty::TEXT || ')'
      );
      CONTINUE;
    END IF;

    -- If variant, lock the variant row too
    IF v_variant_id IS NOT NULL THEN
      SELECT pv.current_stock INTO v_current_stock
      FROM public.product_variants pv
      WHERE pv.id = v_variant_id
      FOR UPDATE;

      IF v_current_stock IS NULL THEN
        v_errors := array_append(v_errors, 'Вариант олдсонгүй: ' || v_variant_id::TEXT);
        CONTINUE;
      END IF;

      IF v_current_stock < v_qty THEN
        v_errors := array_append(
          v_errors,
          'Вариантын үлдэгдэл хүрэлцэхгүй: ' || v_variant_id::TEXT ||
          ' (байгаа: ' || v_current_stock::TEXT || ', хэрэгтэй: ' || v_qty::TEXT || ')'
        );
        CONTINUE;
      END IF;
    END IF;
  END LOOP;

  -- If any validation failed, roll back entirely (no partial update)
  IF array_length(v_errors, 1) > 0 THEN
    RETURN jsonb_build_object(
      'error', 'Үлдэгдэл хүрэлцэхгүй байна',
      'details', v_errors
    );
  END IF;

  -- =============================================
  -- Phase 2: Create sale. Nested block: two replays racing on the same
  -- key resolve to one sale — the loser hits the unique index, returns the
  -- winner's sale, and skips its own stock decrement (the RETURN below
  -- exits before Phase 4).
  -- =============================================
  BEGIN
    INSERT INTO public.sales (
      organization_id, branch_id, contact_id, total_amount,
      paid_amount, payment_method, status, created_by, salesperson_id,
      original_amount, dedupe_key
    ) VALUES (
      p_org_id, p_branch_id, p_contact_id, p_total_amount,
      p_paid_amount, p_payment_method, 'completed', p_user_id, p_salesperson_id,
      COALESCE(p_original_amount, p_total_amount), NULLIF(p_dedupe_key, '')
    ) RETURNING id INTO v_sale_id;
  EXCEPTION WHEN unique_violation THEN
    SELECT s.id INTO v_sale_id
    FROM public.sales s
    WHERE s.organization_id = p_org_id AND s.dedupe_key = p_dedupe_key;
    IF v_sale_id IS NULL THEN
      RETURN jsonb_build_object('error', 'Захиалга үүсгэхэд алдаа гарлаа');
    END IF;
    RETURN jsonb_build_object('success', true, 'sale_id', v_sale_id, 'duplicate', true);
  END;

  -- =============================================
  -- Phase 3: Insert sale_items + stock_movements (independent, same tx)
  -- =============================================
  INSERT INTO public.sale_items (
    sale_id, product_id, quantity, unit_price, total_price, commission_amount, variant_id
  )
  SELECT
    v_sale_id,
    (item->>'product_id')::UUID,
    (item->>'quantity')::NUMERIC,
    (item->>'unit_price')::NUMERIC,
    (item->>'total_price')::NUMERIC,
    (item->>'commission_amount')::NUMERIC,
    NULLIF((item->>'variant_id')::TEXT, '')::UUID
  FROM jsonb_array_elements(p_items) AS item;

  INSERT INTO public.stock_movements (
    organization_id, branch_id, product_id, type, quantity, unit_cost, reference, created_by, variant_id
  )
  SELECT
    p_org_id,
    p_branch_id,
    (m->>'product_id')::UUID,
    'out',
    (m->>'quantity')::NUMERIC,
    (m->>'unit_cost')::NUMERIC,
    'sale:' || v_sale_id::TEXT,
    p_user_id,
    NULLIF((m->>'variant_id')::TEXT, '')::UUID
  FROM jsonb_array_elements(p_movements) AS m;

  -- =============================================
  -- Phase 4: Decrement stock (rows already locked from Phase 1)
  -- =============================================
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) AS item ORDER BY (item->>'product_id')::TEXT
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_variant_id := NULLIF((v_item->>'variant_id')::TEXT, '')::UUID;
    v_qty := (v_item->>'quantity')::NUMERIC;

    UPDATE public.products
    SET current_stock = current_stock - v_qty
    WHERE id = v_product_id;

    IF v_variant_id IS NOT NULL THEN
      UPDATE public.product_variants
      SET current_stock = current_stock - v_qty
      WHERE id = v_variant_id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_shop_sale(UUID, UUID, UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID, JSONB, JSONB, TEXT, TEXT, NUMERIC, NUMERIC, TEXT) TO authenticated;
