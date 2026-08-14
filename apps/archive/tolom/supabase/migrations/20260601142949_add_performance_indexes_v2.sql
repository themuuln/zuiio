-- Performance indexes v2 — target slow queries on mechanic page
-- 
-- Slow endpoints (from runtime logs):
--   mechanic-trend:   1500-1700ms → missing created_at in composite index
--   eod:              1650-2000ms → no index on completed_at at all
--   work-orders:       850-900ms → missing sort-covering index
--   me/time/status:    479-540ms → missing lookup index, sequential sub-calls

-- ── 1. EOD: work_orders completed_at lookup (PRIMARY BOTTLENECK) ──
-- The EOD query filters: org_id + status = Completed + completed_at IN date range
-- No existing index covers completed_at at all.
CREATE INDEX IF NOT EXISTS idx_wo_org_status_completed
  ON work_orders(organization_id, status, completed_at)
  WHERE deleted_at IS NULL;

-- ── 2. mechanic-trend: per-mechanic completed WO + date range ──
-- Query filters: org_id + mechanic_id + status = Completed + created_at IN date range
-- Existing idx_wo_org_mechanic covers (org, mechanic, status) but NOT created_at.
DROP INDEX IF EXISTS idx_wo_org_mechanic;
CREATE INDEX IF NOT EXISTS idx_wo_org_mechanic_created
  ON work_orders(organization_id, mechanic_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

-- ── 3. work-orders list: sort-covering index ──
-- Query: org_id + optional status IN (...) ORDER BY created_at DESC LIMIT 51
-- Existing indexes filter OR sort but not both.
CREATE INDEX IF NOT EXISTS idx_wo_org_status_created
  ON work_orders(organization_id, status, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wo_org_mechanic_created_list
  ON work_orders(organization_id, mechanic_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- ── 4. me/time/status: mechanic_time_logs lookup ──
-- Query: mechanic_id + org_id + date + clock_out IS NULL ORDER BY clock_in DESC LIMIT 1
-- Existing idx_time_logs_mechanic_date covers (mechanic_id, date desc) but not org_id or clock_out IS NULL.
DROP INDEX IF EXISTS idx_time_logs_mechanic_date;
CREATE INDEX IF NOT EXISTS idx_time_logs_lookup
  ON mechanic_time_logs(mechanic_id, organization_id, date DESC)
  WHERE clock_out IS NULL;

-- ── 5. EOD branch-filtered queries ──
-- Open WOs count + biggest issue with branch_id filter
CREATE INDEX IF NOT EXISTS idx_wo_org_branch_active
  ON work_orders(organization_id, branch_id, status)
  WHERE deleted_at IS NULL AND status NOT IN ('Completed', 'Cancelled');

-- Unpaid invoices with branch_id filter
CREATE INDEX IF NOT EXISTS idx_invoices_org_branch_status
  ON invoices(organization_id, branch_id, status)
  WHERE deleted_at IS NULL AND status IN ('sent', 'overdue', 'partial');

-- ── 6. Fix missing UNIQUE constraint on mechanic_daily_reports ──
-- The upsertDailyHours function uses onConflict: "mechanic_id, report_date"
-- but there is no unique constraint on (mechanic_id, report_date).
DROP INDEX IF EXISTS idx_mechanic_daily_reports_mechanic_date;
CREATE UNIQUE INDEX IF NOT EXISTS idx_mechanic_daily_reports_mechanic_date
  ON mechanic_daily_reports(mechanic_id, report_date);
