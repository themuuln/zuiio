-- Migration: get_work_order_detail — replaces 3 sequential batch rounds
-- with a single Postgres function call. Reduces HTTP round trips from
-- ~15 PostgREST calls to 1 RPC call.
--
-- Returns all work-order data (services, parts, history, customer,
-- vehicle, mechanic, helpers, prior visits) in a single JSONB response.

CREATE OR REPLACE FUNCTION get_work_order_detail(
  p_wo_id uuid,
  p_org_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_wo work_orders%ROWTYPE;
  result jsonb;
BEGIN
  -- Auth: caller must belong to the target organization
  IF p_org_id != get_user_organization_id() THEN
    RAISE EXCEPTION 'Unauthorized: organization mismatch';
  END IF;

  -- Fetch main work order
  SELECT * INTO v_wo
  FROM work_orders
  WHERE id = p_wo_id
    AND organization_id = p_org_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Work order not found';
  END IF;

  -- Build result in a single SELECT with all nested subqueries.
  -- Each subquery runs independently — PostgreSQL optimizes them in
  -- parallel, eliminating the client-side sequential batch problem.
  SELECT jsonb_build_object(
    'id', v_wo.id,
    'organization_id', v_wo.organization_id,
    'branch_id', v_wo.branch_id,
    'customer_id', v_wo.customer_id,
    'vehicle_id', v_wo.vehicle_id,
    'mechanic_id', v_wo.mechanic_id,
    'status', v_wo.status,
    'complaint', v_wo.complaint,
    'diagnosis', v_wo.diagnosis,
    'description', v_wo.description,
    'notes', v_wo.notes,
    'mechanic_notes', v_wo.mechanic_notes,
    'diagnosis_label_id', v_wo.diagnosis_label_id,
    'bay_number', v_wo.bay_number,
    'queue_order', v_wo.queue_order,
    'odometer_at_service', v_wo.odometer_at_service,
    'discount_amount', v_wo.discount_amount,
    'discount_percentage', v_wo.discount_percentage,
    'discount_total', v_wo.discount_total,
    'subtotal', v_wo.subtotal,
    'total', v_wo.total,
    'loss_reason', v_wo.loss_reason,
    'completed_at', v_wo.completed_at,
    'started_at', v_wo.started_at,
    'created_at', v_wo.created_at,
    'updated_at', v_wo.updated_at,
    'created_by', v_wo.created_by,
    'updated_by', v_wo.updated_by,
    'deleted_at', v_wo.deleted_at,
    -- Customer
    'customer', CASE WHEN v_wo.customer_id IS NOT NULL THEN
      (SELECT row_to_json(c)::jsonb FROM customers c WHERE c.id = v_wo.customer_id AND c.deleted_at IS NULL)
    ELSE null END,
    -- Vehicle
    'vehicle', CASE WHEN v_wo.vehicle_id IS NOT NULL THEN
      (SELECT row_to_json(v)::jsonb FROM vehicles v WHERE v.id = v_wo.vehicle_id AND v.deleted_at IS NULL)
    ELSE null END,
    -- Mechanic (profiles join — only id + full_name)
    'mechanic', CASE WHEN v_wo.mechanic_id IS NOT NULL THEN
      (SELECT jsonb_build_object('id', p.id, 'full_name', p.full_name) FROM profiles p WHERE p.id = v_wo.mechanic_id)
    ELSE null END,
    -- Helpers (with profile names resolved)
    'helpers', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', wh.mechanic_id,
        'work_order_id', wh.work_order_id,
        'mechanic_id', wh.mechanic_id,
        'created_at', wh.created_at,
        'created_by', wh.created_by,
        'full_name', hp.full_name
      ) ORDER BY wh.sort_order)
      FROM work_order_helpers wh
      LEFT JOIN profiles hp ON hp.id = wh.mechanic_id
      WHERE wh.work_order_id = v_wo.id),
      '[]'::jsonb
    ),
    -- Services
    'services', COALESCE(
      (SELECT jsonb_agg(row_to_json(wos)::jsonb ORDER BY wos.created_at)
      FROM work_order_services wos WHERE wos.work_order_id = v_wo.id),
      '[]'::jsonb
    ),
    -- Parts
    'parts', COALESCE(
      (SELECT jsonb_agg(row_to_json(wop)::jsonb ORDER BY wop.created_at)
      FROM work_order_parts wop WHERE wop.work_order_id = v_wo.id),
      '[]'::jsonb
    ),
    -- Status history
    'status_history', COALESCE(
      (SELECT jsonb_agg(row_to_json(wosh)::jsonb ORDER BY wosh.created_at DESC)
      FROM work_order_status_history wosh WHERE wosh.work_order_id = v_wo.id),
      '[]'::jsonb
    ),
    -- Invoice public token
    'invoice_public_token', (
      SELECT i.public_token FROM invoices i WHERE i.work_order_id = v_wo.id AND i.deleted_at IS NULL LIMIT 1
    ),
    -- Diagnosis label
    'diagnosis_label', CASE WHEN v_wo.diagnosis_label_id IS NOT NULL THEN
      (SELECT row_to_json(dl)::jsonb FROM diagnosis_labels dl WHERE dl.id = v_wo.diagnosis_label_id)
    ELSE null END,
    -- Service history: prior visits for the same vehicle, with services/parts/helpers
    'service_history', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'work_order_id', pv.id,
          'status', pv.status,
          'created_at', pv.created_at,
          'complaint', pv.complaint,
          'diagnosis', pv.diagnosis,
          'notes', pv.notes,
          'total', pv.total,
          'mechanic_name', (SELECT full_name FROM profiles WHERE id = pv.mechanic_id),
          'services', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object('name', pvs.service_name, 'price', pvs.final_price))
            FROM work_order_services pvs WHERE pvs.work_order_id = pv.id),
            '[]'::jsonb
          ),
          'parts', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object('name', pvp.part_name, 'quantity', pvp.quantity, 'price', pvp.final_price))
            FROM work_order_parts pvp WHERE pvp.work_order_id = pv.id),
            '[]'::jsonb
          ),
          'helpers', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
              'id', pvh.mechanic_id,
              'full_name', (SELECT full_name FROM profiles WHERE id = pvh.mechanic_id)
            ))
            FROM work_order_helpers pvh WHERE pvh.work_order_id = pv.id),
            '[]'::jsonb
          )
        )
        ORDER BY pv.created_at DESC
      )
      FROM work_orders pv
      WHERE pv.vehicle_id = v_wo.vehicle_id
        AND pv.id != v_wo.id
        AND pv.deleted_at IS NULL
        AND v_wo.vehicle_id IS NOT NULL
      LIMIT 10),
      '[]'::jsonb
    )
  ) INTO result;

  RETURN result;
END;
$$;
