-- =============================================
-- Hybrid RPC: atomic stock receipt for restock
--
-- Called from batchCreatePurchaseOrders after the
-- PO and PO items are created in TypeScript.
-- Runs stock movements, product stock updates, and
-- PO status change in a single transaction.
-- =============================================

CREATE OR REPLACE FUNCTION public.process_restock_stock_movements(
  p_org_id UUID,
  p_branch_id UUID,
  p_user_id UUID,
  p_po_id UUID,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item JSONB;
  v_count INT := 0;
BEGIN
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
$$;

GRANT EXECUTE ON FUNCTION public.process_restock_stock_movements(UUID, UUID, UUID, UUID, JSONB) TO authenticated;
