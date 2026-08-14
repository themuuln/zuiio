-- ============================================================================
-- SECURITY DEFINER authorization audit (advisor follow-up, 2026-08-12)
--
-- Audit of all 71 SECURITY DEFINER functions executable by anon/authenticated:
--   * 3 functions were service-role-only in the app -> revoked authenticated.
--   * 16 function definitions accepted an org/resource id without tying it to the
--     CALLER's org (cross-tenant writes: sales, stock, POs, roles, number
--     sequences, daily-spend counter) -> added caller-org guards.
--   * process_batch_adjustment additionally scoped the variant-stock UPDATE
--     through products (was unscoped by org entirely).
--
-- Guard pattern: `IF auth.uid() IS NOT NULL AND caller_org IS DISTINCT FROM
-- p_org_id THEN reject` — service role (uid NULL) and internal calls keep
-- working; authenticated callers must operate on their own org.
--
-- NOT changed (intentional, verified in audit):
--   * anon storefront contract (get_public_*, submit_shop_order,
--     submit_product_review, cancel_my_order) — org resolved by public slug,
--     read-only or heavily validated writes
--   * RLS-policy helpers (get_current_organization, has_permission) and
--     trigger functions (handle_new_user, handle_updated_at)
--   * already-validated functions: activate_bom, approve_stock_transfer,
--     evaluate_promotions, redeem_gift_card, issue/record/return_production_*
--   * increment_smtp_count — global config (no org), called via user-session
--     client from api/email/test; no meaningful org scope possible
-- ============================================================================


-- ─── 1. Caller-org guards ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.process_batch_adjustment(p_org_id uuid, p_branch_id uuid, p_user_id uuid, p_items jsonb, p_reference text, p_notes text DEFAULT 'Бөөнөөр тохируулга'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_count INT := 0;
BEGIN
  -- Authorization: caller must belong to the target org (service role bypasses)
  IF auth.uid() IS NOT NULL
     AND public.get_current_organization() IS DISTINCT FROM p_org_id THEN
    RETURN jsonb_build_object('error', 'Хандах эрхгүй байна');
  END IF;
  -- Permission check
  IF NOT public.has_permission('stock_movements.create') THEN
    RETURN jsonb_build_object('error', 'Permission denied');
  END IF;

  -- 1. Update variant stock levels
  UPDATE public.product_variants
  SET current_stock = GREATEST(0, COALESCE(current_stock, 0) + item.qty)
  FROM (
    SELECT
      NULLIF(item->>'variant_id', '')::UUID AS id,
      (item->>'quantity')::NUMERIC AS qty
    FROM jsonb_array_elements(p_items) AS item
    WHERE item->>'variant_id' IS NOT NULL AND item->>'variant_id' <> ''
  ) AS item
  WHERE product_variants.id = item.id
    AND EXISTS (
      SELECT 1 FROM public.products pr
      WHERE pr.id = product_variants.product_id AND pr.organization_id = p_org_id
    );

  -- 2. Update product stock levels atomically
  UPDATE public.products
  SET current_stock = GREATEST(0, COALESCE(current_stock, 0) + item.qty)
  FROM (
    SELECT
      (item->>'product_id')::UUID AS id,
      (item->>'quantity')::NUMERIC AS qty
    FROM jsonb_array_elements(p_items) AS item
  ) AS item
  WHERE products.id = item.id
    AND products.organization_id = p_org_id;

  -- 3. Insert stock movements in one batch
  INSERT INTO public.stock_movements (
    organization_id, branch_id, product_id, variant_id, type, quantity, unit_cost,
    notes, reference, created_by
  )
  SELECT
    p_org_id,
    p_branch_id,
    (item->>'product_id')::UUID,
    NULLIF(item->>'variant_id', '')::UUID,
    'adjustment',
    (item->>'quantity')::NUMERIC,
    NULLIF(item->>'unit_cost', '')::NUMERIC,
    p_notes,
    p_reference,
    p_user_id
  FROM jsonb_array_elements(p_items) AS item
  WHERE (item->>'quantity')::NUMERIC != 0;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'movements_created', v_count
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_sale_stock_decrement(p_org_id uuid, p_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_item JSONB;
  v_product_id UUID;
  v_variant_id UUID;
  v_qty NUMERIC;
  v_current_stock NUMERIC;
  v_errors TEXT[] := '{}';
  v_updated_products TEXT[] := '{}';
  v_updated_variants TEXT[] := '{}';
BEGIN
  -- Authorization: caller must belong to the target org (service role bypasses)
  IF auth.uid() IS NOT NULL
     AND public.get_current_organization() IS DISTINCT FROM p_org_id THEN
    RETURN jsonb_build_object('error', 'Хандах эрхгүй байна');
  END IF;
  -- Permission check
  IF NOT public.has_permission('sales.create') THEN
    RETURN jsonb_build_object('error', 'Permission denied');
  END IF;

  -- Lock all product rows first (prevents deadlocks by ordering)
  -- Then validate stock for every item before making any changes
  -- NOTE: validation-pass locks (FOR UPDATE) persist until transaction end,
  -- even if an item later fails validation. This is inherent to the
  -- two-phase pattern: lock all, validate all, then update or rollback.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) AS item ORDER BY (item->>'product_id')::TEXT
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_variant_id := NULLIF(v_item->>'variant_id', '')::UUID;
    v_qty := (v_item->>'quantity')::NUMERIC;

    -- Lock the product row
    SELECT p.current_stock INTO v_current_stock
    FROM public.products p
    WHERE p.id = v_product_id
      AND p.organization_id = p_org_id
    FOR UPDATE;

    IF v_current_stock IS NULL THEN
      v_errors := array_append(v_errors, 'Product not found: ' || v_product_id::TEXT);
      CONTINUE;
    END IF;

    IF v_current_stock < v_qty THEN
      v_errors := array_append(
        v_errors,
        'Insufficient stock for product ' || v_product_id::TEXT ||
        ': have ' || v_current_stock::TEXT || ', need ' || v_qty::TEXT
      );
      CONTINUE;
    END IF;

    -- If variant, lock the variant row too
    IF v_variant_id IS NOT NULL THEN
      SELECT pv.current_stock INTO v_current_stock
      FROM public.product_variants pv
      WHERE pv.id = v_variant_id
        AND pv.product_id = v_product_id
      FOR UPDATE;

      IF v_current_stock IS NULL THEN
        v_errors := array_append(v_errors, 'Variant not found: ' || v_variant_id::TEXT);
        CONTINUE;
      END IF;

      IF v_current_stock < v_qty THEN
        v_errors := array_append(
          v_errors,
          'Insufficient stock for variant ' || v_variant_id::TEXT ||
          ': have ' || v_current_stock::TEXT || ', need ' || v_qty::TEXT
        );
        CONTINUE;
      END IF;
    END IF;
  END LOOP;

  -- If any validation failed, roll back entirely (no partial update)
  IF array_length(v_errors, 1) > 0 THEN
    RETURN jsonb_build_object(
      'error', 'Stock validation failed',
      'details', v_errors
    );
  END IF;

  -- All items validated — now update
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) AS item ORDER BY (item->>'product_id')::TEXT
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_variant_id := NULLIF(v_item->>'variant_id', '')::UUID;
    v_qty := (v_item->>'quantity')::NUMERIC;

    UPDATE public.products
    SET current_stock = current_stock - v_qty
    WHERE id = v_product_id;

    v_updated_products := array_append(v_updated_products, v_product_id::TEXT);

    IF v_variant_id IS NOT NULL THEN
      UPDATE public.product_variants
      SET current_stock = current_stock - v_qty
      WHERE id = v_variant_id
        AND product_id = v_product_id;

      v_updated_variants := array_append(v_updated_variants, v_variant_id::TEXT);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'products_updated', v_updated_products,
    'variants_updated', v_updated_variants
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_shop_sale(p_org_id uuid, p_branch_id uuid, p_user_id uuid, p_contact_id uuid, p_total_amount numeric, p_paid_amount numeric, p_payment_method text, p_salesperson_id uuid, p_items jsonb, p_movements jsonb, p_currency_code text DEFAULT 'MNT'::text, p_currency_symbol text DEFAULT '₮'::text, p_exchange_rate numeric DEFAULT 1.0, p_original_amount numeric DEFAULT NULL::numeric, p_dedupe_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  -- Authorization: caller must belong to the target org (service role bypasses)
  IF auth.uid() IS NOT NULL
     AND public.get_current_organization() IS DISTINCT FROM p_org_id THEN
    RETURN jsonb_build_object('error', 'Хандах эрхгүй байна');
  END IF;
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

  -- Phase 1: Validate stock (FOR UPDATE locking), ordered to prevent deadlocks.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) AS item ORDER BY (item->>'product_id')::TEXT
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_variant_id := NULLIF((v_item->>'variant_id')::TEXT, '')::UUID;
    v_qty := (v_item->>'quantity')::NUMERIC;

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

  IF array_length(v_errors, 1) > 0 THEN
    RETURN jsonb_build_object(
      'error', 'Үлдэгдэл хүрэлцэхгүй байна',
      'details', v_errors
    );
  END IF;

  -- Phase 2: Create sale. Nested block: two replays racing on the same key
  -- resolve to one sale — the loser hits the unique index, returns the
  -- winner's sale, and skips its own stock decrement (RETURN exits before
  -- Phase 4).
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

  -- Phase 3: Insert sale_items + stock_movements (same tx).
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

  -- Phase 4: Decrement stock (rows already locked from Phase 1).
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
$function$;

CREATE OR REPLACE FUNCTION public.process_receive_purchase_items(p_org_id uuid, p_branch_id uuid, p_user_id uuid, p_order_id uuid, p_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_item JSONB;
  v_existing_qty NUMERIC;
  v_existing_received NUMERIC;
  v_new_received NUMERIC;
  v_all_received BOOLEAN := true;
  v_any_received BOOLEAN := false;
  v_new_status TEXT;
  v_movement_count INT := 0;
BEGIN
  -- Authorization: caller must belong to the target org (service role bypasses)
  IF auth.uid() IS NOT NULL
     AND public.get_current_organization() IS DISTINCT FROM p_org_id THEN
    RETURN jsonb_build_object('error', 'Хандах эрхгүй байна');
  END IF;
  -- Permission check
  IF NOT public.has_permission('purchases.update') THEN
    RETURN jsonb_build_object('error', 'Permission denied');
  END IF;

  -- Verify PO exists and belongs to the org
  IF NOT EXISTS (
    SELECT 1 FROM public.purchase_orders
    WHERE id = p_order_id
      AND organization_id = p_org_id
  ) THEN
    RETURN jsonb_build_object('error', 'Худалдан авалтын захиалга олдсонгүй.');
  END IF;

  -- Validate each item: check received_quantity does not exceed ordered quantity
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT poi.quantity, poi.received_quantity
    INTO v_existing_qty, v_existing_received
    FROM public.purchase_order_items poi
    WHERE poi.id = (v_item->>'item_id')::UUID
      AND poi.purchase_order_id = p_order_id;

    IF v_existing_qty IS NULL THEN
      RETURN jsonb_build_object('error', 'Бараа олдсонгүй: ' || (v_item->>'item_id')::TEXT);
    END IF;

    v_new_received := COALESCE(v_existing_received, 0) + (v_item->>'received_quantity')::NUMERIC;

    IF v_new_received > v_existing_qty THEN
      RETURN jsonb_build_object(
        'error', 'Хүлээн авсан тоо хэмжээ захиалсан хэмжээнээс хэтэрсэн байна.'
      );
    END IF;
  END LOOP;

  -- 1. Update received_quantities
  UPDATE public.purchase_order_items poi
  SET received_quantity = COALESCE(poi.received_quantity, 0) + item.received_qty
  FROM (
    SELECT
      (item->>'item_id')::UUID AS id,
      (item->>'received_quantity')::NUMERIC AS received_qty
    FROM jsonb_array_elements(p_items) AS item
  ) AS item
  WHERE poi.id = item.id;

  -- 2. Insert stock movements
  INSERT INTO public.stock_movements (
    organization_id, branch_id, product_id, variant_id, type, quantity, unit_cost,
    reference, notes, created_by
  )
  SELECT
    p_org_id,
    p_branch_id,
    poi.product_id,
    poi.variant_id,
    'in',
    item.received_qty,
    poi.unit_cost,
    'PO-' || p_order_id,
    'Худалдан авалтын захиалгаар хүлээн авсан',
    p_user_id
  FROM (
    SELECT
      (item->>'item_id')::UUID AS id,
      (item->>'received_quantity')::NUMERIC AS received_qty
    FROM jsonb_array_elements(p_items) AS item
  ) AS item
  JOIN public.purchase_order_items poi ON poi.id = item.id;

  GET DIAGNOSTICS v_movement_count = ROW_COUNT;

  -- 3. Update product stock levels atomically
  UPDATE public.products
  SET current_stock = COALESCE(current_stock, 0) + item.received_qty
  FROM (
    SELECT
      poi.product_id AS id,
      item.received_qty
    FROM (
      SELECT
        (item->>'item_id')::UUID AS id,
        (item->>'received_quantity')::NUMERIC AS received_qty
      FROM jsonb_array_elements(p_items) AS item
    ) AS item
    JOIN public.purchase_order_items poi ON poi.id = item.id
  ) AS item
  WHERE products.id = item.id
    AND products.organization_id = p_org_id;

  -- 4. Update variant stock levels
  UPDATE public.product_variants
  SET current_stock = COALESCE(current_stock, 0) + item.received_qty
  FROM (
    SELECT
      poi.variant_id AS id,
      item.received_qty
    FROM (
      SELECT
        (item->>'item_id')::UUID AS id,
        (item->>'received_quantity')::NUMERIC AS received_qty
      FROM jsonb_array_elements(p_items) AS item
    ) AS item
    JOIN public.purchase_order_items poi ON poi.id = item.id
    WHERE poi.variant_id IS NOT NULL
  ) AS item
  WHERE product_variants.id = item.id;

  -- 5. Determine new PO status
  SELECT
    COALESCE(BOOL_AND(COALESCE(poi.received_quantity, 0) >= poi.quantity), false) AS all_done,
    COALESCE(BOOL_OR(COALESCE(poi.received_quantity, 0) > 0), false) AS any_done
  INTO v_all_received, v_any_received
  FROM public.purchase_order_items poi
  WHERE poi.purchase_order_id = p_order_id;

  IF v_all_received THEN
    v_new_status := 'received';
  ELSIF v_any_received THEN
    v_new_status := 'partially_received';
  ELSE
    v_new_status := 'sent';
  END IF;

  UPDATE public.purchase_orders
  SET status = v_new_status
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'movements_created', v_movement_count,
    'new_status', v_new_status
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_restock_stock_movements(p_org_id uuid, p_branch_id uuid, p_user_id uuid, p_po_id uuid, p_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_item JSONB;
  v_count INT := 0;
BEGIN
  -- Authorization: caller must belong to the target org (service role bypasses)
  IF auth.uid() IS NOT NULL
     AND public.get_current_organization() IS DISTINCT FROM p_org_id THEN
    RETURN jsonb_build_object('error', 'Хандах эрхгүй байна');
  END IF;
  -- Permission check
  IF NOT public.has_permission('purchases.create') THEN
    RETURN jsonb_build_object('error', 'Permission denied');
  END IF;

  -- Verify the PO exists, is in draft status, and belongs to the org
  IF NOT EXISTS (
    SELECT 1 FROM public.purchase_orders
    WHERE id = p_po_id
      AND organization_id = p_org_id
      AND status = 'draft'
  ) THEN
    RETURN jsonb_build_object('error', 'Худалдан авалтын захиалга олдсонгүй эсвэл буруу төлөвтэй байна.');
  END IF;

  -- 1. Insert stock movements in one batch
  INSERT INTO public.stock_movements (
    organization_id, branch_id, product_id, type, quantity, unit_cost,
    reference, notes, created_by
  )
  SELECT
    p_org_id,
    p_branch_id,
    (item->>'product_id')::UUID,
    'in',
    (item->>'quantity')::NUMERIC,
    (item->>'unit_cost')::NUMERIC,
    'PO-' || p_po_id,
    'Худалдан авалтын захиалгаар хүлээн авсан',
    p_user_id
  FROM jsonb_array_elements(p_items) AS item;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- 2. Update product stock levels atomically
  UPDATE public.products
  SET current_stock = COALESCE(current_stock, 0) + item.qty
  FROM (
    SELECT
      (item->>'product_id')::UUID AS id,
      (item->>'quantity')::NUMERIC AS qty
    FROM jsonb_array_elements(p_items) AS item
  ) AS item
  WHERE products.id = item.id
    AND products.organization_id = p_org_id;

  -- 3. Mark PO as received
  UPDATE public.purchase_orders
  SET status = 'received'
  WHERE id = p_po_id;

  RETURN jsonb_build_object(
    'success', true,
    'movements_created', v_count
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_restock_stock_movements(p_org_id uuid, p_branch_id uuid, p_user_id uuid, p_po_id uuid, p_items jsonb, p_mark_received boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_count INT := 0;
BEGIN
  -- Authorization: caller must belong to the target org (service role bypasses)
  IF auth.uid() IS NOT NULL
     AND public.get_current_organization() IS DISTINCT FROM p_org_id THEN
    RETURN jsonb_build_object('error', 'Хандах эрхгүй байна');
  END IF;
  -- Permission check
  IF NOT public.has_permission('purchases.create') THEN
    RETURN jsonb_build_object('error', 'Permission denied');
  END IF;

  -- Verify the PO exists and belongs to the org
  -- Allow draft, sent, or partially_received for partial receive scenarios
  IF NOT EXISTS (
    SELECT 1 FROM public.purchase_orders
    WHERE id = p_po_id
      AND organization_id = p_org_id
      AND status IN ('draft', 'sent', 'partially_received')
  ) THEN
    RETURN jsonb_build_object('error', 'Худалдан авалтын захиалга олдсонгүй эсвэл буруу төлөвтэй байна.');
  END IF;

  -- 1. Insert stock movements in one batch
  INSERT INTO public.stock_movements (
    organization_id, branch_id, product_id, variant_id, type, quantity, unit_cost,
    reference, notes, created_by
  )
  SELECT
    p_org_id,
    p_branch_id,
    (item->>'product_id')::UUID,
    NULLIF(item->>'variant_id', '')::UUID,
    'in',
    (item->>'quantity')::NUMERIC,
    (item->>'unit_cost')::NUMERIC,
    'PO-' || p_po_id,
    'Худалдан авалтын захиалгаар хүлээн авсан',
    p_user_id
  FROM jsonb_array_elements(p_items) AS item;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- 2. Update received_quantity on purchase_order_items
  UPDATE public.purchase_order_items poi
  SET received_quantity = COALESCE(poi.received_quantity, 0) + item.qty
  FROM (
    SELECT
      (item->>'product_id')::UUID AS product_id,
      NULLIF(item->>'variant_id', '')::UUID AS variant_id,
      (item->>'quantity')::NUMERIC AS qty
    FROM jsonb_array_elements(p_items) AS item
  ) AS item
  WHERE poi.purchase_order_id = p_po_id
    AND poi.product_id = item.product_id
    AND poi.variant_id IS NOT DISTINCT FROM item.variant_id;

  -- 3. Update product stock levels atomically
  UPDATE public.products
  SET current_stock = COALESCE(current_stock, 0) + item.qty
  FROM (
    SELECT
      (item->>'product_id')::UUID AS id,
      (item->>'quantity')::NUMERIC AS qty
    FROM jsonb_array_elements(p_items) AS item
  ) AS item
  WHERE products.id = item.id
    AND products.organization_id = p_org_id;

  -- 4. Update variant stock levels (for items with a variant_id)
  UPDATE public.product_variants
  SET current_stock = COALESCE(current_stock, 0) + item.qty
  FROM (
    SELECT
      NULLIF(item->>'variant_id', '')::UUID AS id,
      (item->>'quantity')::NUMERIC AS qty
    FROM jsonb_array_elements(p_items) AS item
  ) AS item
  WHERE product_variants.id = item.id
    AND item.id IS NOT NULL;

  -- 5. Mark PO as received if requested
  IF p_mark_received THEN
    UPDATE public.purchase_orders
    SET status = 'received'
    WHERE id = p_po_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'movements_created', v_count
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_role_permissions(p_role_id uuid, p_permissions app_permission[])
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Authorization: role must belong to the caller's org (service role bypasses)
  IF auth.uid() IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.roles
       WHERE id = p_role_id AND organization_id = public.get_current_organization()
     ) THEN
    RETURN json_build_object('error', 'Хандах эрхгүй байна');
  END IF;
  -- Must have roles.manage permission to change any role's permissions
  IF NOT public.has_permission('roles.manage') THEN
    RETURN json_build_object('error', 'Permission denied');
  END IF;

  DELETE FROM public.role_permissions WHERE role_id = p_role_id;

  IF array_length(p_permissions, 1) > 0 THEN
    INSERT INTO public.role_permissions (role_id, permission)
    SELECT p_role_id, unnest(p_permissions);
  END IF;

  RETURN json_build_object('success', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_org_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_prefix TEXT;
  v_year TEXT;
  v_seq INT;
BEGIN
  -- Authorization: caller must belong to the target org (service role bypasses)
  IF auth.uid() IS NOT NULL
     AND public.get_current_organization() IS DISTINCT FROM p_org_id THEN
    RAISE EXCEPTION 'Хандах эрхгүй байна';
  END IF;
  SELECT COALESCE(invoice_number_prefix, 'INV') INTO v_prefix
  FROM public.organizations WHERE id = p_org_id;

  v_year := to_char(now(), 'YYYY');
  v_seq := nextval('public.invoice_number_seq'::regclass);

  RETURN v_prefix || '-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_journal_entry_number(p_org_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_prefix TEXT;
  v_year TEXT;
  v_seq INT;
BEGIN
  -- Authorization: caller must belong to the target org (service role bypasses)
  IF auth.uid() IS NOT NULL
     AND public.get_current_organization() IS DISTINCT FROM p_org_id THEN
    RAISE EXCEPTION 'Хандах эрхгүй байна';
  END IF;
  SELECT COALESCE(je_number_prefix, 'JE') INTO v_prefix
  FROM public.organizations WHERE id = p_org_id;

  v_year := to_char(now(), 'YYYY');
  v_seq := nextval('public.je_number_seq'::regclass);

  RETURN v_prefix || '-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_order_number(p_org_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_next integer;
  v_prefix text := 'PO-';
BEGIN
  -- Authorization: caller must belong to the target org (service role bypasses)
  IF auth.uid() IS NOT NULL
     AND public.get_current_organization() IS DISTINCT FROM p_org_id THEN
    RAISE EXCEPTION 'Хандах эрхгүй байна';
  END IF;
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(order_number FROM 4) AS integer)
  ), 0) + 1 INTO v_next
  FROM public.production_orders
  WHERE organization_id = p_org_id;

  RETURN v_prefix || LPAD(v_next::text, 6, '0');
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_purchase_order_number(p_org_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_prefix TEXT;
  v_year TEXT;
  v_seq INT;
BEGIN
  -- Authorization: caller must belong to the target org (service role bypasses)
  IF auth.uid() IS NOT NULL
     AND public.get_current_organization() IS DISTINCT FROM p_org_id THEN
    RAISE EXCEPTION 'Хандах эрхгүй байна';
  END IF;
  SELECT COALESCE(po_number_prefix, 'PO') INTO v_prefix
  FROM public.organizations WHERE id = p_org_id;

  v_year := to_char(now(), 'YYYY');
  v_seq := nextval('public.po_number_seq'::regclass);

  RETURN v_prefix || '-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_quote_number(p_org_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_prefix TEXT;
  v_year TEXT;
  v_seq INT;
BEGIN
  -- Authorization: caller must belong to the target org (service role bypasses)
  IF auth.uid() IS NOT NULL
     AND public.get_current_organization() IS DISTINCT FROM p_org_id THEN
    RAISE EXCEPTION 'Хандах эрхгүй байна';
  END IF;
  SELECT COALESCE(quote_number_prefix, 'Q') INTO v_prefix
  FROM public.organizations WHERE id = p_org_id;

  v_year := to_char(now(), 'YYYY');
  v_seq := nextval('public.quote_number_seq'::regclass);

  RETURN v_prefix || '-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_return_number(p_org_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_prefix TEXT;
  v_year TEXT;
  v_seq INT;
BEGIN
  -- Authorization: caller must belong to the target org (service role bypasses)
  IF auth.uid() IS NOT NULL
     AND public.get_current_organization() IS DISTINCT FROM p_org_id THEN
    RAISE EXCEPTION 'Хандах эрхгүй байна';
  END IF;
  SELECT COALESCE(return_number_prefix, 'R') INTO v_prefix
  FROM public.organizations WHERE id = p_org_id;

  v_year := to_char(now(), 'YYYY');
  v_seq := nextval('public.return_number_seq'::regclass);

  RETURN v_prefix || '-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrement_product_stock_safe(p_product_id uuid, p_org_id uuid, p_quantity numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_current_stock NUMERIC;
  v_result RECORD;
BEGIN
  -- Authorization: caller must belong to the target org (service role bypasses)
  IF auth.uid() IS NOT NULL
     AND public.get_current_organization() IS DISTINCT FROM p_org_id THEN
    RETURN jsonb_build_object('error', 'Хандах эрхгүй байна');
  END IF;
  -- Lock the product row
  SELECT current_stock INTO v_current_stock
  FROM public.products
  WHERE id = p_product_id AND organization_id = p_org_id
  FOR UPDATE;

  IF v_current_stock IS NULL THEN
    RETURN jsonb_build_object('error', 'Product not found');
  END IF;

  IF v_current_stock < p_quantity THEN
    RETURN jsonb_build_object(
      'error', 'Insufficient stock',
      'available', v_current_stock,
      'requested', p_quantity
    );
  END IF;

  UPDATE public.products
  SET current_stock = current_stock - p_quantity
  WHERE id = p_product_id
  RETURNING id, current_stock, name INTO v_result;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_result.id,
    'current_stock', v_result.current_stock,
    'name', v_result.name
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_daily_spend(p_org_id uuid, p_date date, p_tokens bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Authorization: caller must belong to the target org (service role bypasses)
  IF auth.uid() IS NOT NULL
     AND public.get_current_organization() IS DISTINCT FROM p_org_id THEN
    RAISE EXCEPTION 'Хандах эрхгүй байна';
  END IF;
  INSERT INTO public.agent_daily_spend (organization_id, date, tokens_used, api_calls)
  VALUES (p_org_id, p_date, p_tokens, 1)
  ON CONFLICT (organization_id, date)
  DO UPDATE SET
    tokens_used = public.agent_daily_spend.tokens_used + p_tokens,
    api_calls = public.agent_daily_spend.api_calls + 1,
    updated_at = now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_default_stages(p_order_id uuid, p_org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Authorization: caller must belong to the target org (service role bypasses)
  IF auth.uid() IS NOT NULL
     AND public.get_current_organization() IS DISTINCT FROM p_org_id THEN
    RAISE EXCEPTION 'Хандах эрхгүй байна';
  END IF;
  INSERT INTO public.production_stages (organization_id, production_order_id, stage_name, stage_order)
  VALUES
    (p_org_id, p_order_id, 'Хайчлах', 1),
    (p_org_id, p_order_id, 'Ирмэг наах', 2),
    (p_org_id, p_order_id, 'Угсрах', 3),
    (p_org_id, p_order_id, 'Будах', 4),
    (p_org_id, p_order_id, 'Савлах', 5);
END;
$function$;

-- ─── 2. Revoke authenticated (service-role-only) ───────────────────

REVOKE EXECUTE ON FUNCTION public.schedule_daily_report_cron(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.unschedule_daily_report_cron() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.user_has_permission(uuid, public.app_permission) FROM authenticated;
