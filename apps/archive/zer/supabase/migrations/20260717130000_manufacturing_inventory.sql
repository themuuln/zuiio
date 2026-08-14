-- ============================================================
-- Manufacturing Module: Material Issue & Return (Phase 3)
-- ============================================================
-- Adds production_material_id and operation_id to stock_movements
-- for idempotent material issue/return/usage tracking.
-- V1: stock_movements are an audit trail only; warehouse_products.current_stock
-- is NOT updated from production flows (existing aggregate stock is source of truth).

-- 1. Add production tracking columns to stock_movements
ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS production_material_id uuid REFERENCES public.production_materials(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS operation_id text;

-- 2. Idempotency index: prevent double-issue/return on retry
CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_movements_operation_id
  ON public.stock_movements (operation_id)
  WHERE operation_id IS NOT NULL;

-- Index for production material lookups
CREATE INDEX IF NOT EXISTS idx_stock_movements_production_material_id
  ON public.stock_movements (production_material_id)
  WHERE production_material_id IS NOT NULL;

-- ============================================================
-- 3. issue_production_materials RPC
-- Creates negative stock_movements (out) and increments issued_quantity.
-- ============================================================
CREATE OR REPLACE FUNCTION public.issue_production_materials(
  p_production_order_id uuid,
  p_material_ids uuid[],
  p_quantities numeric[],
  p_operation_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id uuid;
  v_branch_id uuid;
  v_order_status text;
  v_material record;
  v_qty numeric;
  v_idx integer;
BEGIN
  -- Idempotency check
  IF EXISTS (SELECT 1 FROM public.stock_movements WHERE operation_id = p_operation_id) THEN
    RETURN;
  END IF;

  -- Validate order
  SELECT organization_id, branch_id, status INTO v_org_id, v_branch_id, v_order_status
  FROM public.production_orders
  WHERE id = p_production_order_id AND deleted_at IS NULL;

  IF NOT FOUND THEN RAISE EXCEPTION 'Захиалга олдсонгүй.'; END IF;
  IF v_org_id != (SELECT public.get_current_organization()) THEN RAISE EXCEPTION 'Хандах эрхгүй.'; END IF;
  IF v_order_status NOT IN ('in_progress', 'pending') THEN RAISE EXCEPTION 'Захиалгын төлөв тохирохгүй.'; END IF;

  -- Process each material
  FOR v_idx IN 1..array_length(p_material_ids, 1) LOOP
    SELECT * INTO v_material
    FROM public.production_materials
    WHERE id = p_material_ids[v_idx]
      AND production_order_id = p_production_order_id
      AND organization_id = v_org_id;

    IF NOT FOUND THEN RAISE EXCEPTION 'Материал олдсонгүй: %', p_material_ids[v_idx]; END IF;

    v_qty := p_quantities[v_idx];
    IF v_qty <= 0 THEN RAISE EXCEPTION 'Хэмжээ эерэг байх ёстой.'; END IF;
    IF v_qty > (v_material.required_quantity - v_material.issued_quantity) THEN
      RAISE EXCEPTION 'Шаардлагатайгаас их хэмжээ гаргах боломжгүй.';
    END IF;

    -- Create stock movement (out) — negative quantity for stock deduction
    INSERT INTO public.stock_movements (
      organization_id, branch_id, product_id, type, quantity,
      unit_cost, reference, notes, created_by, production_material_id, operation_id
    ) VALUES (
      v_org_id, v_branch_id, v_material.product_id, 'out', -v_qty,
      v_material.estimated_unit_cost_snapshot,
      'PO-' || (SELECT order_number FROM public.production_orders WHERE id = p_production_order_id),
      'Үйлдвэрлэлээр материал гаргах',
      auth.uid(), v_material.id, p_operation_id || '-out-' || v_material.id
    );

    -- Update issued quantity
    UPDATE public.production_materials
    SET issued_quantity = issued_quantity + v_qty, updated_at = now()
    WHERE id = v_material.id;
  END LOOP;
END;
$$;

-- ============================================================
-- 4. return_production_materials RPC
-- Creates positive stock_movements (in) and increments returned_quantity.
-- ============================================================
CREATE OR REPLACE FUNCTION public.return_production_materials(
  p_production_order_id uuid,
  p_material_ids uuid[],
  p_quantities numeric[],
  p_operation_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id uuid;
  v_branch_id uuid;
  v_order_status text;
  v_material record;
  v_qty numeric;
  v_idx integer;
BEGIN
  -- Idempotency check
  IF EXISTS (SELECT 1 FROM public.stock_movements WHERE operation_id = p_operation_id) THEN
    RETURN;
  END IF;

  -- Validate order
  SELECT organization_id, branch_id, status INTO v_org_id, v_branch_id, v_order_status
  FROM public.production_orders
  WHERE id = p_production_order_id AND deleted_at IS NULL;

  IF NOT FOUND THEN RAISE EXCEPTION 'Захиалга олдсонгүй.'; END IF;
  IF v_org_id != (SELECT public.get_current_organization()) THEN RAISE EXCEPTION 'Хандах эрхгүй.'; END IF;
  IF v_order_status NOT IN ('in_progress', 'pending') THEN RAISE EXCEPTION 'Захиалгын төлөв тохирохгүй.'; END IF;

  -- Process each material
  FOR v_idx IN 1..array_length(p_material_ids, 1) LOOP
    SELECT * INTO v_material
    FROM public.production_materials
    WHERE id = p_material_ids[v_idx]
      AND production_order_id = p_production_order_id
      AND organization_id = v_org_id;

    IF NOT FOUND THEN RAISE EXCEPTION 'Материал олдсонгүй: %', p_material_ids[v_idx]; END IF;

    v_qty := p_quantities[v_idx];
    IF v_qty <= 0 THEN RAISE EXCEPTION 'Хэмжээ эерэг байх ёстой.'; END IF;
    IF v_qty > v_material.issued_quantity THEN
      RAISE EXCEPTION 'Гаргасан хэмжээнээс их буцаах боломжгүй.';
    END IF;

    -- Create stock movement (in) — positive quantity for stock return
    INSERT INTO public.stock_movements (
      organization_id, branch_id, product_id, type, quantity,
      unit_cost, reference, notes, created_by, production_material_id, operation_id
    ) VALUES (
      v_org_id, v_branch_id, v_material.product_id, 'in', v_qty,
      v_material.estimated_unit_cost_snapshot,
      'PO-' || (SELECT order_number FROM public.production_orders WHERE id = p_production_order_id),
      'Үйлдвэрлэлээс материал буцаах',
      auth.uid(), v_material.id, p_operation_id || '-in-' || v_material.id
    );

    -- Update returned quantity and decrement issued quantity
    UPDATE public.production_materials
    SET returned_quantity = returned_quantity + v_qty,
        issued_quantity = issued_quantity - v_qty,
        updated_at = now()
    WHERE id = v_material.id;
  END LOOP;
END;
$$;

-- ============================================================
-- 5. record_production_usage RPC
-- Updates used_quantity when materials are consumed during production.
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_production_usage(
  p_production_order_id uuid,
  p_material_ids uuid[],
  p_quantities numeric[],
  p_operation_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id uuid;
  v_order_status text;
  v_material record;
  v_qty numeric;
  v_idx integer;
BEGIN
  -- Idempotency check
  IF EXISTS (SELECT 1 FROM public.stock_movements WHERE operation_id = p_operation_id) THEN
    RETURN;
  END IF;

  -- Validate order
  SELECT organization_id, status INTO v_org_id, v_order_status
  FROM public.production_orders
  WHERE id = p_production_order_id AND deleted_at IS NULL;

  IF NOT FOUND THEN RAISE EXCEPTION 'Захиалга олдсонгүй.'; END IF;
  IF v_org_id != (SELECT public.get_current_organization()) THEN RAISE EXCEPTION 'Хандах эрхгүй.'; END IF;
  IF v_order_status != 'in_progress' THEN RAISE EXCEPTION 'Захиалгын төлөв тохирохгүй. Үйлдвэрлэл явагдаж байх ёстой.'; END IF;

  -- Process each material
  FOR v_idx IN 1..array_length(p_material_ids, 1) LOOP
    SELECT * INTO v_material
    FROM public.production_materials
    WHERE id = p_material_ids[v_idx]
      AND production_order_id = p_production_order_id
      AND organization_id = v_org_id;

    IF NOT FOUND THEN RAISE EXCEPTION 'Материал олдсонгүй: %', p_material_ids[v_idx]; END IF;

    v_qty := p_quantities[v_idx];
    IF v_qty <= 0 THEN RAISE EXCEPTION 'Хэмжээ эерэг байх ёстой.'; END IF;
    IF v_qty > (v_material.issued_quantity - v_material.used_quantity) THEN
      RAISE EXCEPTION 'Ашигласан хэмжээ гаргаснаас их байж болохгүй.';
    END IF;

    -- Record usage — no stock movement needed (already deducted on issue)
    UPDATE public.production_materials
    SET used_quantity = used_quantity + v_qty, updated_at = now()
    WHERE id = v_material.id;
  END LOOP;
END;
$$;

-- ============================================================
-- 6. Grants
-- ============================================================
GRANT EXECUTE ON FUNCTION public.issue_production_materials(uuid, uuid[], numeric[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.return_production_materials(uuid, uuid[], numeric[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_production_usage(uuid, uuid[], numeric[], text) TO authenticated;

-- ============================================================
-- 7. Comments
-- ============================================================
COMMENT ON FUNCTION public.issue_production_materials IS 'Issue materials from stock for production orders. Creates stock_movements with operation_id for idempotency.';
COMMENT ON FUNCTION public.return_production_materials IS 'Return unused materials back to stock. Reverses stock movements and adjusts issued/returned quantities.';
COMMENT ON FUNCTION public.record_production_usage IS 'Record actual material consumption during production stages. Updates used_quantity without stock movements.';
COMMENT ON COLUMN public.stock_movements.production_material_id IS 'Links stock movement to a production_materials row for audit trail.';
COMMENT ON COLUMN public.stock_movements.operation_id IS 'Idempotency key for production material operations. Unique index prevents double processing.';
