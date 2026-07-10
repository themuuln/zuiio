-- =============================================
-- Composite indexes on sales for report/dashboard
-- query performance.
--
-- The get_public_report_data function and dashboard
-- today-pulse query sales by organization_id + sale_date
-- range + status != 'cancelled'.
-- =============================================

-- Composite index for org-scoped date-range queries on non-cancelled sales
-- Used by: get_public_report_data(), dashboard today-pulse, monthly trend
CREATE INDEX IF NOT EXISTS idx_sales_org_date_status
  ON public.sales (organization_id, sale_date)
  WHERE status != 'cancelled';

-- Composite index for org-scoped date-range queries on ALL sales
-- Used by: accounting reports, commission reports
CREATE INDEX IF NOT EXISTS idx_sales_org_date
  ON public.sales (organization_id, sale_date);
