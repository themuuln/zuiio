-- Migration: Auto-promote first helper to lead when lead mechanic is removed
-- When work_orders.mechanic_id is set to NULL, automatically promote the first
-- helper (by sort_order) from work_order_helpers to be the new lead.
-- This ensures there's always a lead mechanic when helpers are assigned.

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION promote_helper_to_lead()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when mechanic_id transitions from a value to NULL
  IF NEW.mechanic_id IS NULL AND OLD.mechanic_id IS NOT NULL THEN
    -- Find the first helper by sort_order
    SELECT mechanic_id INTO NEW.mechanic_id
    FROM work_order_helpers
    WHERE work_order_id = NEW.id
    ORDER BY sort_order
    LIMIT 1;

    -- Remove the promoted helper from the helpers table
    IF NEW.mechanic_id IS NOT NULL THEN
      DELETE FROM work_order_helpers
      WHERE work_order_id = NEW.id
      AND mechanic_id = NEW.mechanic_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger (BEFORE UPDATE so we can modify NEW.mechanic_id)
DROP TRIGGER IF EXISTS auto_promote_helper ON work_orders;
CREATE TRIGGER auto_promote_helper
  BEFORE UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION promote_helper_to_lead();
