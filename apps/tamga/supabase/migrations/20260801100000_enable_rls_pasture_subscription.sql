-- Бэлчээрийн бүс, морь-бүс холбоос, захиалгын түүхийн хүснэгтүүдэд RLS идэвхжүүлэх.
-- Enable RLS on pasture zones, pasture assignments, and subscription history
-- (all three were created without RLS).

-- ── pasture_zones: owner CRUD ──
ALTER TABLE pasture_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pasture zones select for owner" ON pasture_zones
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Pasture zones insert by owner" ON pasture_zones
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Pasture zones update by owner" ON pasture_zones
  FOR UPDATE USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Pasture zones delete by owner" ON pasture_zones
  FOR DELETE USING (owner_id = auth.uid());

-- ── pasture_assignments: owner via their zone ──
ALTER TABLE pasture_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pasture assignments select for owner" ON pasture_assignments
  FOR SELECT USING (
    zone_id IN (SELECT id FROM pasture_zones WHERE owner_id = auth.uid())
  );

CREATE POLICY "Pasture assignments insert by owner" ON pasture_assignments
  FOR INSERT WITH CHECK (
    zone_id IN (SELECT id FROM pasture_zones WHERE owner_id = auth.uid())
  );

CREATE POLICY "Pasture assignments update by owner" ON pasture_assignments
  FOR UPDATE USING (
    zone_id IN (SELECT id FROM pasture_zones WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    zone_id IN (SELECT id FROM pasture_zones WHERE owner_id = auth.uid())
  );

CREATE POLICY "Pasture assignments delete by owner" ON pasture_assignments
  FOR DELETE USING (
    zone_id IN (SELECT id FROM pasture_zones WHERE owner_id = auth.uid())
  );

-- ── subscription_history: users read own, writes via service role ──
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscription history select own"
  ON subscription_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Subscription history insert service"
  ON subscription_history FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Subscription history update service"
  ON subscription_history FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
