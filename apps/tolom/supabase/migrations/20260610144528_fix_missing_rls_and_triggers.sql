-- ── Fix Missing RLS Policies & updated_at Triggers ──────────
-- Audit gap: several newer tables lack full CRUD RLS policies
-- or set_updated_at triggers. This migration patches them.
-- ────────────────────────────────────────────────────────────

-- ── mechanic_time_logs: add INSERT, UPDATE, DELETE ──────────
-- SELECT already exists (20260522000000)

DROP POLICY IF EXISTS "mechanic_time_logs_insert" ON mechanic_time_logs;
CREATE POLICY "mechanic_time_logs_insert"
  ON mechanic_time_logs FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "mechanic_time_logs_update" ON mechanic_time_logs;
CREATE POLICY "mechanic_time_logs_update"
  ON mechanic_time_logs FOR UPDATE
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "mechanic_time_logs_delete" ON mechanic_time_logs;
CREATE POLICY "mechanic_time_logs_delete"
  ON mechanic_time_logs FOR DELETE
  USING (organization_id = get_user_organization_id());

-- ── day_close_logs: add UPDATE, DELETE ──────────────────────
-- SELECT and INSERT already exist (20260530165356)

DROP POLICY IF EXISTS "day_close_logs_update" ON day_close_logs;
CREATE POLICY "day_close_logs_update"
  ON day_close_logs FOR UPDATE
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "day_close_logs_delete" ON day_close_logs;
CREATE POLICY "day_close_logs_delete"
  ON day_close_logs FOR DELETE
  USING (organization_id = get_user_organization_id());

-- ── customer_communications: add UPDATE ─────────────────────
-- SELECT, INSERT, DELETE already exist (20260516130625)

DROP POLICY IF EXISTS "customer_communications_update" ON customer_communications;
CREATE POLICY "customer_communications_update"
  ON customer_communications FOR UPDATE
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- ── car_brands: add UPDATE, DELETE ──────────────────────────
-- SELECT and INSERT already exist (20260528100000, 20260528150211)
-- car_brands are global reference tables — all authenticated users can read/write

DROP POLICY IF EXISTS "car_brands_update_auth" ON car_brands;
CREATE POLICY "car_brands_update_auth"
  ON car_brands FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "car_brands_delete_auth" ON car_brands;
CREATE POLICY "car_brands_delete_auth"
  ON car_brands FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ── car_models: add UPDATE, DELETE ──────────────────────────
-- SELECT and INSERT already exist (20260528100000, 20260528150211)

DROP POLICY IF EXISTS "car_models_update_auth" ON car_models;
CREATE POLICY "car_models_update_auth"
  ON car_models FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "car_models_delete_auth" ON car_models;
CREATE POLICY "car_models_delete_auth"
  ON car_models FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ── set_updated_at triggers ─────────────────────────────────
-- Ensures updated_at is auto-set on row modifications

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Invoice refunds
DROP TRIGGER IF EXISTS set_updated_at ON invoice_refunds;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON invoice_refunds
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Mechanic time logs
DROP TRIGGER IF EXISTS set_updated_at ON mechanic_time_logs;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON mechanic_time_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Day close logs
DROP TRIGGER IF EXISTS set_updated_at ON day_close_logs;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON day_close_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Stock transfers
DROP TRIGGER IF EXISTS set_updated_at ON stock_transfers;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON stock_transfers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Stock transfer items
DROP TRIGGER IF EXISTS set_updated_at ON stock_transfer_items;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON stock_transfer_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Work order helpers
DROP TRIGGER IF EXISTS set_updated_at ON work_order_helpers;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON work_order_helpers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
