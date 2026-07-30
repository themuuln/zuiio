-- ITP (ТЕХНИКИЙН ҮЗЛЭГ) Vehicle Inspection Tracking
-- Mongolia requires annual vehicle safety inspection (ITP).
-- This adds ITP-specific fields to vehicles and creates an ITP
-- reminder system using the existing vehicle_service_schedules pattern.

-- ============================================================
-- 1. Add ITP columns to vehicles table
-- ============================================================

ALTER TABLE vehicles
  ADD COLUMN itp_expiry_date date,
  ADD COLUMN itp_last_passed_date date,
  ADD COLUMN itp_reminder_sent_at timestamp with time zone,
  ADD COLUMN itp_notes text;

COMMENT ON COLUMN vehicles.itp_expiry_date IS 'ITP (техникийн үзлэг) expiry date — annual vehicle safety inspection deadline';
COMMENT ON COLUMN vehicles.itp_last_passed_date IS 'Date when the vehicle last passed ITP inspection';
COMMENT ON COLUMN vehicles.itp_reminder_sent_at IS 'When the last ITP reminder was sent to avoid duplicates';
COMMENT ON COLUMN vehicles.itp_notes IS 'Free-text notes about ITP status, pending repairs, etc.';

-- ============================================================
-- 2. Create vehicle_itp_history table for audit trail
-- ============================================================

CREATE TABLE vehicle_itp_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  previous_expiry_date date,
  new_expiry_date date,
  previous_status text,
  new_status text,
  notes text,
  action_type text NOT NULL CHECK (action_type IN (
    'record_inspection',
    'update_expiry',
    'reminder_sent',
    'system_update'
  )),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE vehicle_itp_history IS 'Audit trail for ITP inspection events — records, updates, reminders';

-- ============================================================
-- 3. RLS policies
-- ============================================================

ALTER TABLE vehicle_itp_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ITP history in their org"
  ON vehicle_itp_history FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert ITP history in their org"
  ON vehicle_itp_history FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_id = auth.uid()
  );

-- ============================================================
-- 4. Indexes
-- ============================================================

CREATE INDEX idx_vehicles_itp_expiry ON vehicles(organization_id, itp_expiry_date)
  WHERE deleted_at IS NULL AND itp_expiry_date IS NOT NULL;

CREATE INDEX idx_vehicles_itp_reminder ON vehicles(organization_id, itp_reminder_sent_at)
  WHERE deleted_at IS NULL AND itp_expiry_date IS NOT NULL;

CREATE INDEX idx_vehicle_itp_history_vehicle ON vehicle_itp_history(vehicle_id, created_at DESC);
CREATE INDEX idx_vehicle_itp_history_org ON vehicle_itp_history(organization_id, created_at DESC);
