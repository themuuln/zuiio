-- Payroll system tables
-- 
-- mechanic_pay_rates: Stores hourly wage per mechanic with effective dating
-- payroll_records: Stores calculated monthly payroll records

-- ── mechanic_pay_rates ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mechanic_pay_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  mechanic_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hourly_rate numeric(10,2) NOT NULL CHECK (hourly_rate > 0),
  effective_from date NOT NULL,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mechanic_pay_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read pay rates"
  ON mechanic_pay_rates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage pay rates"
  ON mechanic_pay_rates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      JOIN roles r ON ou.role_id = r.id
      WHERE ou.user_id = auth.uid()
        AND ou.organization_id = mechanic_pay_rates.organization_id
        AND r.name IN ('Org Owner', 'Manager')
    )
  );

CREATE INDEX IF NOT EXISTS idx_pay_rates_org_mechanic
  ON mechanic_pay_rates(organization_id, mechanic_id);

-- ── payroll_records ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payroll_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  mechanic_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_hours numeric(6,2) NOT NULL DEFAULT 0,
  hourly_rate numeric(10,2) NOT NULL DEFAULT 0,
  gross_pay numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read payroll records"
  ON payroll_records FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage payroll records"
  ON payroll_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      JOIN roles r ON ou.role_id = r.id
      WHERE ou.user_id = auth.uid()
        AND ou.organization_id = payroll_records.organization_id
        AND r.name IN ('Org Owner', 'Manager')
    )
  );

CREATE INDEX IF NOT EXISTS idx_payroll_records_org_period
  ON payroll_records(organization_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_payroll_records_org_mechanic
  ON payroll_records(organization_id, mechanic_id);
