-- =============================================
-- Safe stock decrement RPC using SELECT ... FOR UPDATE
--
-- Unlike the client-side .gte() guard, this RPC
-- explicitly locks the product (or variant) row,
-- preventing any concurrent read or write until
-- the transaction completes.
--
-- Use for sale workflows where multiple products
-- must be decremented atomically.
-- =============================================

-- =============================================
-- 1. Batch sale stock decrement
--    Locks ALL products first, then updates.
--    If ANY product has insufficient stock, the
--    entire batch is rejected (no partial update).
-- =============================================
CREATE OR REPLACE FUNCTION public.process_sale_stock_decrement(
  p_org_id UUID,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
  -- Permission check
  IF NOT public.has_permission('sales.create') THEN
    RETURN jsonb_build_object('error', 'Permission denied');
  END IF;

  -- Lock all product rows first (prevents deadlocks by ordering)
  -- Then validate stock for every item before making any changes
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) ORDER BY (item->>'product_id')::TEXT
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
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) ORDER BY (item->>'product_id')::TEXT
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
      WHERE id = v_variant_id;

      v_updated_variants := array_append(v_updated_variants, v_variant_id::TEXT);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'products_updated', v_updated_products,
    'variants_updated', v_updated_variants
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_sale_stock_decrement(UUID, JSONB) TO authenticated;

-- =============================================
-- 2. Safe single product stock decrement with FOR UPDATE
--    Simpler alternative for single-item operations
--    (returns the updated row)
-- =============================================
CREATE OR REPLACE FUNCTION public.decrement_product_stock_safe(
  p_product_id UUID,
  p_org_id UUID,
  p_quantity NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_stock NUMERIC;
  v_result RECORD;
BEGIN
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
$$;

GRANT EXECUTE ON FUNCTION public.decrement_product_stock_safe(UUID, UUID, NUMERIC) TO authenticated;
