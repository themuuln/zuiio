-- ── Customer Communications Log ────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_communications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id     uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('call', 'sms', 'email', 'in_person', 'note')),
  direction       text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  subject         text,
  content         text NOT NULL,
  staff_id        uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view communications in their org"
  ON customer_communications FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create communications in their org"
  ON customer_communications FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete communications in their org"
  ON customer_communications FOR DELETE
  USING (organization_id = get_user_organization_id());

CREATE INDEX IF NOT EXISTS idx_comm_customer
  ON customer_communications (customer_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_comm_org
  ON customer_communications (organization_id)
  WHERE deleted_at IS NULL;
