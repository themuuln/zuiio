-- Fix: jsonb_array_elements() output column is named 'value', not 'item'
-- The ORDER BY clauses referenced nonexistent column 'item', causing:
--   ERROR: column "item" does not exist
-- Fix: alias the subquery output as 'item'
--
-- Also: variant SELECT and UPDATE now verify product_id matches the validated
-- product, preventing cross-org stock manipulation via foreign variant_id.

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
$$;

GRANT EXECUTE ON FUNCTION public.process_sale_stock_decrement(UUID, JSONB) TO authenticated;
