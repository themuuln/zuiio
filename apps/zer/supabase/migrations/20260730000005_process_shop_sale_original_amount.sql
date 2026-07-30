-- Add p_original_amount parameter to process_shop_sale RPC.
-- Stores the undiscounted total in sales.original_amount for discount tracking.
-- The discount amount is computable as original_amount - total_amount.

-- Drop old overload (10 params, no original_amount/currency)
DROP FUNCTION IF EXISTS public.process_shop_sale(UUID, UUID, UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID, JSONB, JSONB);

-- Recreate with p_original_amount (default NULL for backward compat)
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
  p_original_amount NUMERIC DEFAULT NULL
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
  -- Phase 2: Create sale (with original_amount for discount tracking)
  -- =============================================
  INSERT INTO public.sales (
    organization_id, branch_id, contact_id, total_amount,
    paid_amount, payment_method, status, created_by, salesperson_id,
    original_amount
  ) VALUES (
    p_org_id, p_branch_id, p_contact_id, p_total_amount,
    p_paid_amount, p_payment_method, 'completed', p_user_id, p_salesperson_id,
    COALESCE(p_original_amount, p_total_amount)
  ) RETURNING id INTO v_sale_id;

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

GRANT EXECUTE ON FUNCTION public.process_shop_sale(UUID, UUID, UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID, JSONB, JSONB, NUMERIC) TO authenticated;
