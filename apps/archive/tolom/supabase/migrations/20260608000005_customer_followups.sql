-- ── Customer Follow-ups ─────────────────────────────────────────
-- Scheduled follow-up calls/messages for customer relationship
-- management. Tracks promised callbacks, service reminders, etc.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE customer_followups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id     uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id      uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  work_order_id   uuid REFERENCES work_orders(id) ON DELETE SET NULL,
  estimate_id     uuid REFERENCES estimates(id) ON DELETE SET NULL,
  invoice_id      uuid REFERENCES invoices(id) ON DELETE SET NULL,

  -- Follow-up details
  type            text NOT NULL DEFAULT 'call'
                    CHECK (type IN ('call', 'email', 'message', 'visit', 'other')),
  subject         text NOT NULL,           -- short reason: "Callback about brake quote"
  notes           text,                    -- detailed notes

  -- Scheduling
  due_at          timestamp with time zone NOT NULL,
  completed_at    timestamp with time zone,
  cancelled_at    timestamp with time zone,

  -- Status
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'completed', 'cancelled', 'skipped')),

  -- Outcome (filled when completed/cancelled)
  outcome         text,                    -- what happened: "Customer approved quote"
  outcome_notes   text,                    -- additional details

  -- Assignment
  assigned_to     uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Meta
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamp with time zone NOT NULL DEFAULT now(),
  updated_at      timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at      timestamp with time zone
);

COMMENT ON TABLE customer_followups IS 'Scheduled follow-up calls/messages for customer relationship management';
COMMENT ON COLUMN customer_followups.type IS 'Follow-up method: call, email, message, visit, other';
COMMENT ON COLUMN customer_followups.subject IS 'Short reason for the follow-up';
COMMENT ON COLUMN customer_followups.due_at IS 'When the follow-up should happen';
COMMENT ON COLUMN customer_followups.outcome IS 'What happened during the follow-up';
COMMENT ON COLUMN customer_followups.assigned_to IS 'Staff member responsible for this follow-up';

-- ── RLS ────────────────────────────────────────────────────────

ALTER TABLE customer_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "followups_org_select"
  ON customer_followups FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "followups_org_insert"
  ON customer_followups FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "followups_org_update"
  ON customer_followups FOR UPDATE
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "followups_org_delete"
  ON customer_followups FOR DELETE
  USING (organization_id = get_user_organization_id());

-- ── Indexes ────────────────────────────────────────────────────

CREATE INDEX idx_followups_org_status
  ON customer_followups (organization_id, status, due_at)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_followups_customer
  ON customer_followups (customer_id, due_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_followups_assigned
  ON customer_followups (assigned_to, due_at)
  WHERE deleted_at IS NULL AND status = 'pending';

CREATE INDEX idx_followups_due
  ON customer_followups (organization_id, due_at)
  WHERE deleted_at IS NULL AND status = 'pending';

-- ── Auto-update trigger ────────────────────────────────────────
-- set_updated_at() is defined in a later migration (20260610144528);
-- guard creation so a fresh DB does not fail. This trigger is dropped
-- again by 20260710000001 (P1-15) anyway.
DO $$
BEGIN
  IF to_regprocedure('public.set_updated_at()') IS NOT NULL THEN
    CREATE TRIGGER set_customer_followups_updated_at
      BEFORE UPDATE ON customer_followups
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
