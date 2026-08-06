-- View that pre-computes work order costs to eliminate N+1 queries
-- in the work orders list page.
CREATE OR REPLACE VIEW work_order_costs AS
SELECT
  wo.id AS work_order_id,
  wo.organization_id,
  COALESCE(s.services_cost, 0) AS services_cost,
  COALESCE(p.parts_cost, 0) AS parts_cost,
  COALESCE(s.services_revenue, 0) AS services_revenue,
  COALESCE(p.parts_revenue, 0) AS parts_revenue,
  COALESCE(s.services_revenue, 0) + COALESCE(p.parts_revenue, 0) AS total_revenue,
  COALESCE(s.services_cost, 0) + COALESCE(p.parts_cost, 0) AS total_cost,
  (COALESCE(s.services_revenue, 0) + COALESCE(p.parts_revenue, 0))
    - (COALESCE(s.services_cost, 0) + COALESCE(p.parts_cost, 0)) AS gross_profit,
  CASE
    WHEN (COALESCE(s.services_revenue, 0) + COALESCE(p.parts_revenue, 0)) > 0
    THEN ROUND(
      ((COALESCE(s.services_revenue, 0) + COALESCE(p.parts_revenue, 0))
        - (COALESCE(s.services_cost, 0) + COALESCE(p.parts_cost, 0)))
      / (COALESCE(s.services_revenue, 0) + COALESCE(p.parts_revenue, 0))
      * 100, 2
    )
    ELSE 0
  END AS margin_percent
FROM work_orders wo
LEFT JOIN (
  SELECT
    work_order_id,
    SUM(unit_cost * quantity) AS services_cost,
    SUM(final_price) AS services_revenue
  FROM work_order_services
  GROUP BY work_order_id
) s ON s.work_order_id = wo.id
LEFT JOIN (
  SELECT
    work_order_id,
    SUM(unit_cost * quantity) AS parts_cost,
    SUM(final_price) AS parts_revenue
  FROM work_order_parts
  GROUP BY work_order_id
) p ON p.work_order_id = wo.id;