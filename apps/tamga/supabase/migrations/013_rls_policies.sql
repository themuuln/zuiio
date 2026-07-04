-- 013_rls_policies.sql
-- Add missing RLS policies for documents, reminder_templates, and lost_horse_reports update.
-- Also adds co_ownerships RLS if not already present.

-- ── Documents: owner CRUD ──
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documents select for owner" ON documents
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Documents insert by owner" ON documents
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Documents update by owner" ON documents
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Documents delete by owner" ON documents
  FOR DELETE USING (owner_id = auth.uid());

-- ── Reminder templates: owner CRUD ──
ALTER TABLE reminder_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reminders select for owner" ON reminder_templates
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Reminders insert by owner" ON reminder_templates
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Reminders update by owner" ON reminder_templates
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Reminders delete by owner" ON reminder_templates
  FOR DELETE USING (owner_id = auth.uid());

-- ── Lost horse reports: owner update + delete ──
-- (SELECT and INSERT already handled in 010_map_features.sql)
ALTER TABLE lost_horse_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lost horse update by owner" ON lost_horse_reports
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Lost horse delete by owner" ON lost_horse_reports
  FOR DELETE USING (owner_id = auth.uid());

-- ── Co-ownerships: owner CRUD ──
-- (May already exist from initial schema, but ensure it's present)
ALTER TABLE co_ownerships ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Co-ownership select for owner'
  ) THEN
    CREATE POLICY "Co-ownership select for owner" ON co_ownerships
      FOR SELECT USING (
        horse_id IN (SELECT id FROM horses WHERE owner_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Co-ownership insert by owner'
  ) THEN
    CREATE POLICY "Co-ownership insert by owner" ON co_ownerships
      FOR INSERT WITH CHECK (
        horse_id IN (SELECT id FROM horses WHERE owner_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Co-ownership update by owner'
  ) THEN
    CREATE POLICY "Co-ownership update by owner" ON co_ownerships
      FOR UPDATE USING (
        horse_id IN (SELECT id FROM horses WHERE owner_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Co-ownership delete by owner'
  ) THEN
    CREATE POLICY "Co-ownership delete by owner" ON co_ownerships
      FOR DELETE USING (
        horse_id IN (SELECT id FROM horses WHERE owner_id = auth.uid())
      );
  END IF;
END $$;

-- ── Geofence alerts: owner CRUD ──
ALTER TABLE geofence_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Geofence alerts select for owner" ON geofence_alerts
  FOR SELECT USING (
    geofence_id IN (SELECT id FROM search_areas WHERE owner_id = auth.uid())
  );

CREATE POLICY "Geofence alerts insert by owner" ON geofence_alerts
  FOR INSERT WITH CHECK (
    geofence_id IN (SELECT id FROM search_areas WHERE owner_id = auth.uid())
  );

CREATE POLICY "Geofence alerts update by owner" ON geofence_alerts
  FOR UPDATE USING (
    geofence_id IN (SELECT id FROM search_areas WHERE owner_id = auth.uid())
  );

-- ── User devices: owner CRUD ──
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User devices select own" ON user_devices
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "User devices insert own" ON user_devices
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "User devices update own" ON user_devices
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "User devices delete own" ON user_devices
  FOR DELETE USING (user_id = auth.uid());

-- ── Payment requests: owner read + insert ──
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payment requests select own" ON payment_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Payment requests insert own" ON payment_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());
