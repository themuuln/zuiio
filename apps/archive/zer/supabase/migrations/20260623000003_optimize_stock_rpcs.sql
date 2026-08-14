-- =============================================
-- Optimized RPCs to eliminate N+1 round trips.
--
-- 1. process_restock_stock_movements (enhanced)
--    - Added variant_id support
--    - Added received_quantity update on purchase_order_items
--    - Added mark_received flag for partial receives
--
-- 2. process_batch_adjustment (new)
--    - Updates product_variants + products + stock_movements atomically
--
-- 3. process_receive_purchase_items (new)
--    - Validates, updates received_quantity, creates movements,
--      updates stocks, determines PO status in one call
-- =============================================

-- =============================================
-- 1. Enhanced version of process_restock_stock_movements
-- =============================================
CREATE OR REPLACE FUNCTION public.process_restock_stock_movements(
  p_org_id UUID,
  p_branch_id UUID,
  p_user_id UUID,
  p_po_id UUID,
  p_items JSONB,
  p_mark_received BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INT := 0;
BEGIN
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
$$;

GRANT EXECUTE ON FUNCTION public.process_restock_stock_movements(UUID, UUID, UUID, UUID, JSONB, BOOLEAN) TO authenticated;

-- =============================================
-- 2. Batch adjustment RPC
-- =============================================
CREATE OR REPLACE FUNCTION public.process_batch_adjustment(
  p_org_id UUID,
  p_branch_id UUID,
  p_user_id UUID,
  p_items JSONB,
  p_reference TEXT,
  p_notes TEXT DEFAULT 'Бөөнөөр тохируулга'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INT := 0;
BEGIN
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
  WHERE product_variants.id = item.id;

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
$$;

GRANT EXECUTE ON FUNCTION public.process_batch_adjustment(UUID, UUID, UUID, JSONB, TEXT, TEXT) TO authenticated;

-- =============================================
-- 3. Partial purchase receive RPC
-- =============================================
CREATE OR REPLACE FUNCTION public.process_receive_purchase_items(
  p_org_id UUID,
  p_branch_id UUID,
  p_user_id UUID,
  p_order_id UUID,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

GRANT EXECUTE ON FUNCTION public.process_receive_purchase_items(UUID, UUID, UUID, UUID, JSONB) TO authenticated;
