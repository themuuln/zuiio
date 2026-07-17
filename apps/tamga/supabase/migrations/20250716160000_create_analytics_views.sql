-- ============================================================
-- Analytics views and RPC functions
-- Version: 42 (2026-07-16)
-- Provides server-side aggregation for the Analytics Dashboard.
-- ============================================================

-- ── 1. Herd analytics view ───────────────────────────────────

CREATE OR REPLACE VIEW herd_analytics_view AS
SELECT
  owner_id,
  COUNT(*) as total_horses,
  COUNT(*) FILTER (WHERE gender = 'stallion') as stallion_count,
  COUNT(*) FILTER (WHERE gender = 'mare') as mare_count,
  COUNT(*) FILTER (WHERE gender = 'gelding') as gelding_count,
  COUNT(*) FILTER (WHERE gender = 'foal') as foal_count,
  COUNT(*) FILTER (WHERE birth_year >= EXTRACT(YEAR FROM now()) - 2) as young_horses,
  COUNT(*) FILTER (WHERE birth_year <= EXTRACT(YEAR FROM now()) - 10) as senior_horses,
  MIN(created_at) as first_horse_date,
  MAX(created_at) as latest_horse_date
FROM horses
GROUP BY owner_id;

COMMENT ON VIEW herd_analytics_view IS
  'Herd-level aggregation per owner: counts by gender, age cohort, and timestamps.';

-- ── 2. Health analytics RPC ──────────────────────────────────

CREATE OR REPLACE FUNCTION get_health_analytics(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_horses', (SELECT COUNT(*) FROM horses WHERE owner_id = p_user_id),
    'vaccination_rate', (
      SELECT COALESCE(
        ROUND(COUNT(DISTINCT hl.horse_id)::numeric /
              NULLIF(COUNT(DISTINCT h.id), 0) * 100, 1),
        0
      )
      FROM horses h
      LEFT JOIN health_logs hl ON h.id = hl.horse_id
        AND hl.log_type = 'vaccination'
        AND hl.date >= now() - INTERVAL '1 year'
      WHERE h.owner_id = p_user_id
    ),
    'upcoming_vaccinations', (
      SELECT COUNT(*)
      FROM reminder_templates rt
      WHERE rt.owner_id = p_user_id
        AND rt.reminder_type = 'vaccination'
        AND rt.next_due <= now() + INTERVAL '30 days'
        AND rt.is_active = true
    ),
    'total_health_events', (
      SELECT COUNT(*)
      FROM health_logs hl
      JOIN horses h ON hl.horse_id = h.id
      WHERE h.owner_id = p_user_id
    ),
    'health_events_by_type', (
      SELECT COALESCE(json_object_agg(log_type, count), '{}'::json)
      FROM (
        SELECT hl.log_type, COUNT(*) as count
        FROM health_logs hl
        JOIN horses h ON hl.horse_id = h.id
        WHERE h.owner_id = p_user_id
        GROUP BY hl.log_type
      ) sub
    ),
    'recent_health_events', (
      SELECT COALESCE(json_agg(json_build_object(
        'horse_name', h.name,
        'log_type', hl.log_type,
        'date', hl.date,
        'notes', hl.notes
      ) ORDER BY hl.date DESC), '[]'::json)
      FROM health_logs hl
      JOIN horses h ON hl.horse_id = h.id
      WHERE h.owner_id = p_user_id
      ORDER BY hl.date DESC
      LIMIT 10
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_health_analytics(UUID) IS
  'Returns aggregated health metrics for a user: vaccination rate, upcoming due items, event counts by type, and recent events.';

-- ── 3. Financial analytics RPC ───────────────────────────────

CREATE OR REPLACE FUNCTION get_financial_analytics(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_listings', (
      SELECT COUNT(*) FROM market_listings WHERE seller_id = p_user_id
    ),
    'active_listings', (
      SELECT COUNT(*) FROM market_listings
      WHERE seller_id = p_user_id AND status = 'active'
    ),
    'sold_listings', (
      SELECT COUNT(*) FROM market_listings
      WHERE seller_id = p_user_id AND status = 'sold'
    ),
    'total_revenue', (
      SELECT COALESCE(SUM(price_amount), 0)
      FROM market_listings
      WHERE seller_id = p_user_id AND status = 'sold'
    ),
    'average_sale_price', (
      SELECT COALESCE(ROUND(AVG(price_amount)), 0)
      FROM market_listings
      WHERE seller_id = p_user_id AND status = 'sold'
    ),
    'revenue_by_type', (
      SELECT COALESCE(json_object_agg(sale_type, revenue), '{}'::json)
      FROM (
        SELECT sale_type, SUM(price_amount) as revenue
        FROM market_listings
        WHERE seller_id = p_user_id AND status = 'sold'
        GROUP BY sale_type
      ) sub
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_financial_analytics(UUID) IS
  'Returns aggregated marketplace financial metrics: listing counts, revenue, avg price, and revenue by sale type.';

-- ── 4. Breeding analytics RPC (Breeder+ tier) ───────────────

CREATE OR REPLACE FUNCTION get_breeding_analytics(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'active_breedings', (
      SELECT COUNT(*) FROM breeding_records
      WHERE owner_id = p_user_id AND status = 'active'
    ),
    'total_breedings', (
      SELECT COUNT(*) FROM breeding_records WHERE owner_id = p_user_id
    ),
    'foaling_success_rate', (
      SELECT COALESCE(
        ROUND(
          COUNT(*) FILTER (WHERE status = 'foaled')::numeric /
          NULLIF(COUNT(*), 0) * 100, 1
        ), 0
      )
      FROM breeding_records
      WHERE owner_id = p_user_id
        AND created_at >= now() - INTERVAL '1 year'
    ),
    'breeding_records', (
      SELECT COALESCE(json_agg(json_build_object(
        'sire_name', sire_name,
        'dam_name', dam_name,
        'breeding_date', breeding_date,
        'expected_foaling_date', expected_foaling_date,
        'status', status
      ) ORDER BY breeding_date DESC), '[]'::json)
      FROM breeding_records
      WHERE owner_id = p_user_id
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_breeding_analytics(UUID) IS
  'Returns breeding metrics: active/total counts, foaling success rate, and recent breeding records.';
