-- =============================================
-- Cross-location stock transfers
--
-- 1. stock_transfers: org-scoped transfer headers.
--    status: pending -> completed (via approve_stock_transfer RPC)
--            pending -> cancelled (via app-side cancel action)
-- 2. stock_transfer_items: line items (product + positive quantity).
-- 3. stock_movements.type is a plain free-text column — NO CHECK constraint
--    exists (confirmed in 20260613000000_create_core_tables.sql), so
--    'transfer' values are accepted as-is; no constraint ALTER required.
-- 4. Transfer movements reuse the existing stock_movements.warehouse_id
--    column (added by 20260616000001_create_warehouses.sql). Warehouses map
--    1:1 to branches via warehouses.branch_id (UNIQUE constraint added in
--    20260618133041_add_branches.sql), so stock_movements.branch_id (NOT
--    NULL) is derived from the warehouse's branch — no new column needed.
-- 5. approve_stock_transfer(): SECURITY DEFINER RPC — validates org + pending
--    status, checks from-warehouse availability, decrements from / upserts
--    to warehouse_products, writes 'transfer' movements, and completes the
--    transfer in ONE transaction.
-- =============================================

-- =============================================
-- 1. Tables
-- =============================================
CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_warehouse_id uuid NOT NULL REFERENCES public.warehouses(id),
  to_warehouse_id uuid NOT NULL REFERENCES public.warehouses(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity numeric NOT NULL CHECK (quantity > 0),
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 2. RLS (org-scoped via get_current_organization(),
--    mirroring the warehouses migration policies)
-- =============================================
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stock_transfers_select_own_org ON public.stock_transfers;
CREATE POLICY stock_transfers_select_own_org ON public.stock_transfers
  FOR SELECT USING (organization_id = (SELECT get_current_organization()));

DROP POLICY IF EXISTS stock_transfers_insert_own_org ON public.stock_transfers;
CREATE POLICY stock_transfers_insert_own_org ON public.stock_transfers
  FOR INSERT WITH CHECK (organization_id = (SELECT get_current_organization()));

DROP POLICY IF EXISTS stock_transfers_update_own_org ON public.stock_transfers;
CREATE POLICY stock_transfers_update_own_org ON public.stock_transfers
  FOR UPDATE USING (organization_id = (SELECT get_current_organization()))
  WITH CHECK (organization_id = (SELECT get_current_organization()));

DROP POLICY IF EXISTS stock_transfers_delete_own_org ON public.stock_transfers;
CREATE POLICY stock_transfers_delete_own_org ON public.stock_transfers
  FOR DELETE USING (organization_id = (SELECT get_current_organization()));

DROP POLICY IF EXISTS stock_transfer_items_select_own_org ON public.stock_transfer_items;
CREATE POLICY stock_transfer_items_select_own_org ON public.stock_transfer_items
  FOR SELECT USING (
    transfer_id IN (
      SELECT id FROM public.stock_transfers
      WHERE organization_id = (SELECT get_current_organization())
    )
  );

DROP POLICY IF EXISTS stock_transfer_items_insert_own_org ON public.stock_transfer_items;
CREATE POLICY stock_transfer_items_insert_own_org ON public.stock_transfer_items
  FOR INSERT WITH CHECK (
    transfer_id IN (
      SELECT id FROM public.stock_transfers
      WHERE organization_id = (SELECT get_current_organization())
    )
  );

DROP POLICY IF EXISTS stock_transfer_items_update_own_org ON public.stock_transfer_items;
CREATE POLICY stock_transfer_items_update_own_org ON public.stock_transfer_items
  FOR UPDATE USING (
    transfer_id IN (
      SELECT id FROM public.stock_transfers
      WHERE organization_id = (SELECT get_current_organization())
    )
  );

DROP POLICY IF EXISTS stock_transfer_items_delete_own_org ON public.stock_transfer_items;
CREATE POLICY stock_transfer_items_delete_own_org ON public.stock_transfer_items
  FOR DELETE USING (
    transfer_id IN (
      SELECT id FROM public.stock_transfers
      WHERE organization_id = (SELECT get_current_organization())
    )
  );

-- =============================================
-- 3. Grants
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_transfers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_transfer_items TO authenticated;
GRANT ALL PRIVILEGES ON public.stock_transfers TO service_role;
GRANT ALL PRIVILEGES ON public.stock_transfer_items TO service_role;

-- =============================================
-- 4. Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_stock_transfers_org_created
  ON public.stock_transfers (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_transfer_id
  ON public.stock_transfer_items (transfer_id);

-- =============================================
-- 5. approve_stock_transfer RPC
--    SECURITY DEFINER so the stock mutations + movements are atomic.
--    Search path is pinned; every table reference is schema-qualified.
-- =============================================
CREATE OR REPLACE FUNCTION public.approve_stock_transfer(p_transfer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id uuid;
  v_from_wh uuid;
  v_to_wh uuid;
  v_from_branch uuid;
  v_to_branch uuid;
  v_item record;
  v_available numeric;
  v_movements int := 0;
  v_user_id uuid := auth.uid();
BEGIN
  IF NOT public.has_permission('inventory.update') THEN
    RETURN jsonb_build_object('error', 'Зөвшөөрөл хүрэлцэхгүй байна.');
  END IF;

  v_org_id := public.get_current_organization();
  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Байгууллага тодорхойгүй байна.');
  END IF;

  -- Lock the transfer row; only a pending transfer of the current org qualifies.
  SELECT from_warehouse_id, to_warehouse_id
    INTO v_from_wh, v_to_wh
  FROM public.stock_transfers
  WHERE id = p_transfer_id
    AND organization_id = v_org_id
    AND status = 'pending'
  FOR UPDATE;

  IF v_from_wh IS NULL THEN
    RETURN jsonb_build_object('error', 'Шилжүүлэг олдсонгүй эсвэл аль хэдийн боловсруулагдсан байна.');
  END IF;

  IF v_from_wh = v_to_wh THEN
    RETURN jsonb_build_object('error', 'Эхлэх болон очих агуулах ижил байж болохгүй.');
  END IF;

  -- Warehouses map 1:1 to branches (warehouses.branch_id UNIQUE); derive the
  -- NOT NULL stock_movements.branch_id from each warehouse. Both warehouses
  -- must belong to the CURRENT org (tenant isolation — a transfer may never
  -- touch another org's stock).
  SELECT branch_id INTO v_from_branch
  FROM public.warehouses
  WHERE id = v_from_wh AND organization_id = v_org_id;
  SELECT branch_id INTO v_to_branch
  FROM public.warehouses
  WHERE id = v_to_wh AND organization_id = v_org_id;

  IF v_from_branch IS NULL OR v_to_branch IS NULL THEN
    RETURN jsonb_build_object('error', 'Агуулах олдсонгүй эсвэл өөр байгууллагад харьяалагдана.');
  END IF;

  -- =============================================
  -- Phase A: validate EVERY item's availability WITHOUT writing anything.
  -- Locks the from-warehouse rows (FOR UPDATE) so no concurrent approval can
  -- double-spend the same stock; rows stay locked until commit.
  -- Any shortfall aborts the whole transaction (RAISE EXCEPTION) — no
  -- partial movement, the transfer stays 'pending', and a retry is safe.
  -- =============================================
  FOR v_item IN
    SELECT product_id, quantity
    FROM public.stock_transfer_items
    WHERE transfer_id = p_transfer_id
  LOOP
    SELECT COALESCE(current_stock, 0) INTO v_available
    FROM public.warehouse_products
    WHERE warehouse_id = v_from_wh AND product_id = v_item.product_id
    FOR UPDATE;

    IF v_available < v_item.quantity THEN
      RAISE EXCEPTION 'Агуулахын нөөц хүрэлцэхгүй байна: бараа % (байгаа: %, шаардлагатай: %)',
        v_item.product_id::text, v_available::text, v_item.quantity::text;
    END IF;
  END LOOP;

  -- =============================================
  -- Phase B: perform the moves (all validated, rows locked).
  -- =============================================
  FOR v_item IN
    SELECT product_id, quantity
    FROM public.stock_transfer_items
    WHERE transfer_id = p_transfer_id
  LOOP
    -- Decrement the from-warehouse.
    UPDATE public.warehouse_products
    SET current_stock = current_stock - v_item.quantity, updated_at = now()
    WHERE warehouse_id = v_from_wh AND product_id = v_item.product_id;

    -- Upsert the to-warehouse.
    INSERT INTO public.warehouse_products (warehouse_id, product_id, current_stock, updated_at)
    VALUES (v_to_wh, v_item.product_id, v_item.quantity, now())
    ON CONFLICT (warehouse_id, product_id)
    DO UPDATE SET
      current_stock = warehouse_products.current_stock + EXCLUDED.current_stock,
      updated_at = now();

    -- Movement pair (type 'transfer' — free-text column, no CHECK to alter).
    INSERT INTO public.stock_movements (
      organization_id, branch_id, warehouse_id, product_id, type, quantity,
      reference, notes, created_by
    )
    VALUES (
      v_org_id, v_from_branch, v_from_wh, v_item.product_id, 'transfer',
      -v_item.quantity, 'TRANSFER-' || p_transfer_id,
      'Агуулах хооронд шилжүүлэг', v_user_id
    );

    INSERT INTO public.stock_movements (
      organization_id, branch_id, warehouse_id, product_id, type, quantity,
      reference, notes, created_by
    )
    VALUES (
      v_org_id, v_to_branch, v_to_wh, v_item.product_id, 'transfer',
      v_item.quantity, 'TRANSFER-' || p_transfer_id,
      'Агуулах хооронд шилжүүлэг', v_user_id
    );

    v_movements := v_movements + 2;
  END LOOP;

  UPDATE public.stock_transfers
  SET status = 'completed', completed_at = now()
  WHERE id = p_transfer_id;

  RETURN jsonb_build_object('success', true, 'movements_created', v_movements);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_stock_transfer(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_stock_transfer(uuid) TO authenticated;

COMMENT ON FUNCTION public.approve_stock_transfer IS
  'Atomically executes a pending stock transfer: validates availability, moves warehouse_products stock, writes transfer stock_movements, completes the transfer.';
