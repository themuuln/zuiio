-- Migration: P1 Materialized Views + pgvector
-- Creates 4 materialized views for expensive queries + enables pgvector for semantic search

-- ============================================================
-- 1. Enable pgvector extension
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;


-- ============================================================
-- 2. mv_work_order_summary — replaces the 44.7ms LATERAL join query
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS mv_work_order_summary;
CREATE MATERIALIZED VIEW mv_work_order_summary AS
SELECT
  wo.id AS work_order_id,
  wo.organization_id,
  wo.status,
  wo.bay_number,
  wo.queue_order,
  wo.created_at,
  wo.completed_at,
  wo.started_at,
  p_mechanic.full_name AS mechanic_name,
  p_mechanic.id AS mechanic_id,
  c.full_name AS customer_name,
  c.id AS customer_id,
  c.phone AS customer_phone,
  v.plate_number,
  v.make AS vehicle_make,
  v.model AS vehicle_model,
  v.year AS vehicle_year,
  COALESCE(svc.total_services, 0) AS services_count,
  COALESCE(svc.total_services_price, 0) AS services_total,
  COALESCE(pts.total_parts, 0) AS parts_count,
  COALESCE(pts.total_parts_price, 0) AS parts_total,
  COALESCE(svc.total_services_price, 0) + COALESCE(pts.total_parts_price, 0) AS grand_total
FROM work_orders wo
LEFT JOIN profiles p_mechanic ON p_mechanic.id = wo.mechanic_id
LEFT JOIN customers c ON c.id = wo.customer_id
LEFT JOIN vehicles v ON v.id = wo.vehicle_id
LEFT JOIN LATERAL (
  SELECT
    count(*) AS total_services,
    COALESCE(sum(wos.final_price), 0) AS total_services_price
  FROM work_order_services wos
  WHERE wos.work_order_id = wo.id
) svc ON true
LEFT JOIN LATERAL (
  SELECT
    count(*) AS total_parts,
    COALESCE(sum(wop.final_price), 0) AS total_parts_price
  FROM work_order_parts wop
  WHERE wop.work_order_id = wo.id
) pts ON true
WHERE wo.deleted_at IS NULL;

CREATE UNIQUE INDEX idx_mv_work_order_summary_id ON mv_work_order_summary (work_order_id);
CREATE INDEX idx_mv_work_order_summary_org ON mv_work_order_summary (organization_id, status);


-- ============================================================
-- 3. mv_mechanic_performance — productivity metrics
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS mv_mechanic_performance;
CREATE MATERIALIZED VIEW mv_mechanic_performance AS
SELECT
  wo.organization_id,
  wo.mechanic_id,
  p.full_name AS mechanic_name,
  count(DISTINCT wo.id) AS total_orders,
  count(DISTINCT wo.id) FILTER (WHERE wo.status IN ('Completed', 'Ready for Pickup')) AS completed_orders,
  COALESCE(sum(svc.total_price), 0) AS total_revenue,
  COALESCE(sum(pts.total_price), 0) AS parts_revenue,
  CASE
    WHEN count(DISTINCT wo.id) FILTER (WHERE wo.completed_at IS NOT NULL) > 0
    THEN round(
      extract(epoch FROM (
        avg(wo.completed_at - wo.created_at)
      )) / 3600.0, 1
    )
    ELSE 0
  END AS avg_completion_time_hours,
  count(DISTINCT wo.id) FILTER (WHERE wo.created_at >= now() - interval '7 days') AS orders_last_7_days,
  COALESCE(sum(svc.total_price) FILTER (WHERE wo.created_at >= now() - interval '30 days'), 0) AS revenue_last_30_days
FROM work_orders wo
JOIN profiles p ON p.id = wo.mechanic_id
LEFT JOIN LATERAL (
  SELECT COALESCE(sum(wos2.final_price), 0) AS total_price
  FROM work_order_services wos2
  WHERE wos2.work_order_id = wo.id
) wos_svc ON true
LEFT JOIN LATERAL (
  SELECT COALESCE(sum(wop2.final_price), 0) AS total_price
  FROM work_order_parts wop2
  WHERE wop2.work_order_id = wo.id
) wop_pts ON true
WHERE wo.deleted_at IS NULL
  AND wo.mechanic_id IS NOT NULL
GROUP BY wo.organization_id, wo.mechanic_id, p.full_name;

CREATE UNIQUE INDEX idx_mv_mechanic_performance_id ON mv_mechanic_performance (organization_id, mechanic_id);
CREATE INDEX idx_mv_mechanic_performance_org ON mv_mechanic_performance (organization_id);


-- ============================================================
-- 4. mv_customer_lifetime_value — customer value aggregation
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS mv_customer_lifetime_value;
CREATE MATERIALIZED VIEW mv_customer_lifetime_value AS
SELECT
  c.organization_id,
  c.id AS customer_id,
  c.full_name AS customer_name,
  c.phone AS customer_phone,
  count(DISTINCT wo.id) AS total_visits,
  COALESCE(sum(pay.total_paid), 0) AS total_spent,
  CASE
    WHEN count(DISTINCT wo.id) > 0
    THEN round(COALESCE(sum(pay.total_paid), 0) / count(DISTINCT wo.id), 2)
    ELSE 0
  END AS avg_order_value,
  min(wo.created_at) AS first_visit,
  max(wo.created_at) AS last_visit,
  count(DISTINCT v.id) AS vehicles_count
FROM customers c
LEFT JOIN work_orders wo ON wo.customer_id = c.id AND wo.deleted_at IS NULL
LEFT JOIN payments py ON py.work_order_id = wo.id AND py.deleted_at IS NULL
LEFT JOIN LATERAL (
  SELECT COALESCE(sum(py.amount), 0) AS total_paid
  FROM payments py
  WHERE py.work_order_id = wo.id AND py.deleted_at IS NULL
) pay ON true
LEFT JOIN vehicles v ON v.customer_id = c.id AND v.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.organization_id, c.id, c.full_name, c.phone;

CREATE UNIQUE INDEX idx_mv_customer_lifetime_value_id ON mv_customer_lifetime_value (organization_id, customer_id);
CREATE INDEX idx_mv_customer_lifetime_value_org ON mv_customer_lifetime_value (organization_id);


-- ============================================================
-- 5. mv_revenue_by_service_category — daily revenue aggregation
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS mv_revenue_by_service_category;
CREATE MATERIALIZED VIEW mv_revenue_by_service_category AS
SELECT
  wo.organization_id,
  date(wo.created_at) AS date,
  COALESCE(sc.category, 'Uncategorized') AS category,
  count(DISTINCT wo.id) AS order_count,
  COALESCE(sum(wos.final_price), 0) AS total_service_revenue,
  COALESCE(sum(wop.final_price), 0) AS total_parts_revenue,
  COALESCE(sum(wos.final_price), 0) + COALESCE(sum(wop.final_price), 0) AS total_revenue
FROM work_orders wo
LEFT JOIN work_order_services wos ON wos.work_order_id = wo.id
LEFT JOIN service_catalog sc ON sc.id = wos.service_catalog_id
LEFT JOIN work_order_parts wop ON wop.work_order_id = wo.id
WHERE wo.deleted_at IS NULL
GROUP BY wo.organization_id, date(wo.created_at), COALESCE(sc.category, 'Uncategorized');

CREATE UNIQUE INDEX idx_mv_revenue_by_category_id ON mv_revenue_by_service_category (organization_id, date, category);
CREATE INDEX idx_mv_revenue_by_category_org ON mv_revenue_by_service_category (organization_id, date);


-- ============================================================
-- 6. pgvector — embedding columns for future semantic search
-- ============================================================
ALTER TABLE parts_catalog ADD COLUMN IF NOT EXISTS embedding vector(1536);
CREATE INDEX IF NOT EXISTS idx_parts_catalog_embedding
  ON parts_catalog USING hnsw (embedding vector_cosine_ops);

ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS embedding vector(1536);
CREATE INDEX IF NOT EXISTS idx_service_catalog_embedding
  ON service_catalog USING hnsw (embedding vector_cosine_ops);


-- ============================================================
-- 7. pg_cron refresh jobs — every 5 minutes
-- ============================================================
SELECT cron.schedule(
  'refresh_mv_work_order_summary',
  '*/5 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_work_order_summary'
);

SELECT cron.schedule(
  'refresh_mv_mechanic_performance',
  '*/5 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_mechanic_performance'
);

SELECT cron.schedule(
  'refresh_mv_customer_lifetime_value',
  '*/5 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_customer_lifetime_value'
);

SELECT cron.schedule(
  'refresh_mv_revenue_by_service_category',
  '*/5 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_revenue_by_service_category'
);
