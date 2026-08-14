-- ============================================================
-- RPC: get_work_order_revenue_details
--
-- Single-query replacement for the remaining 2-query
-- services+parts patterns in report functions (fetchWoRevenue,
-- getComparisonData, getEndOfDaySummary, getMechanicKpis).
--
-- Returns per-work-order: revenue, cost, profit, margin,
-- service_count, part_count, and total_discount.
--
-- This combines the work_order_costs view (revenue/cost) with
-- inline aggregations of work_order_services and
-- work_order_parts for counts and discounts, all in one DB
-- round-trip.
-- ============================================================

CREATE OR REPLACE FUNCTION get_work_order_revenue_details(
  p_wo_ids uuid[]
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF p_wo_ids IS NULL OR array_length(p_wo_ids, 1) IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    FROM (
      SELECT
        wc.work_order_id,
        wc.services_revenue,
        wc.parts_revenue,
        wc.total_revenue,
        wc.services_cost,
        wc.parts_cost,
        wc.total_cost,
        wc.gross_profit,
        wc.margin_percent,
        COALESCE(s.cnt, 0)::bigint AS service_count,
        COALESCE(p.cnt, 0)::bigint AS part_count,
        COALESCE(s.discounts, 0::numeric) + COALESCE(p.discounts, 0::numeric) AS total_discount
      FROM work_order_costs wc
      LEFT JOIN (
        SELECT work_order_id,
          COUNT(*)::bigint AS cnt,
          SUM(COALESCE(discount_amount, 0::numeric)) AS discounts
        FROM work_order_services
        WHERE work_order_id = ANY(p_wo_ids)
        GROUP BY work_order_id
      ) s ON s.work_order_id = wc.work_order_id
      LEFT JOIN (
        SELECT work_order_id,
          COUNT(*)::bigint AS cnt,
          SUM(COALESCE(discount_amount, 0::numeric)) AS discounts
        FROM work_order_parts
        WHERE work_order_id = ANY(p_wo_ids)
        GROUP BY work_order_id
      ) p ON p.work_order_id = wc.work_order_id
      WHERE wc.work_order_id = ANY(p_wo_ids)
    ) t
  );
END;
$$;
