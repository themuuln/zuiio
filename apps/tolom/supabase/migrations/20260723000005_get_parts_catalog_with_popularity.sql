-- ============================================================
-- RPC: get_parts_catalog_with_popularity
--
-- Single-query replacement for the 2-query pattern in
-- getPartsCatalog() (parts_catalog + vehicle_model_parts
-- popularity fetch). Returns catalog items with popularity
-- scores computed from vehicle_model_parts assignments, all
-- in one DB round-trip.
--
-- When p_page > 0, returns paginated results as:
--   { data: [...], total: number }
-- When p_page = 0 (default), returns flat array.
-- ============================================================

CREATE OR REPLACE FUNCTION get_parts_catalog_with_popularity(
  p_org_id uuid,
  p_page int DEFAULT 0,
  p_page_size int DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_offset int;
  v_total int;
BEGIN
  -- Count total (non-deleted parts for this org)
  SELECT COUNT(*) INTO v_total
  FROM parts_catalog
  WHERE organization_id = p_org_id
    AND deleted_at IS NULL;

  -- Compute offset only when paginating
  v_offset := GREATEST(0, (p_page - 1) * p_page_size);

  -- Subquery for aggregation, outer query for JSON building
  -- (avoids PostgreSQL's "aggregate function calls cannot be nested" error)
  RETURN (
    SELECT jsonb_build_object(
      'data', COALESCE(jsonb_agg(subq.data ORDER BY subq.popularity DESC), '[]'::jsonb),
      'total', v_total
    )
    FROM (
      SELECT
        jsonb_build_object(
          'id', pc.id,
          'organization_id', pc.organization_id,
          'name', pc.name,
          'name_mn', pc.name_mn,
          'part_number', pc.part_number,
          'category', pc.category,
          'unit', pc.unit,
          'default_price', pc.default_price,
          'is_active', pc.is_active,
          'purchase_price', pc.purchase_price,
          'image_url', pc.image_url,
          'location', pc.location,
          'created_at', pc.created_at,
          'deleted_at', pc.deleted_at,
          'global_part_id', pc.global_part_id,
          'popularity_score', COALESCE(
            (COUNT(vmp.part_id)::int * 100 / NULLIF((SELECT COUNT(*) FROM vehicle_models vm WHERE vm.organization_id = p_org_id), 0)),
            0
          )
        ) AS data,
        COUNT(vmp.part_id) AS popularity
      FROM parts_catalog pc
      LEFT JOIN vehicle_model_parts vmp
        ON vmp.part_id = pc.id
        AND vmp.organization_id = p_org_id
      WHERE pc.organization_id = p_org_id
        AND pc.deleted_at IS NULL
      GROUP BY pc.id
      ORDER BY popularity DESC
      LIMIT CASE WHEN p_page > 0 THEN p_page_size ELSE v_total END
      OFFSET CASE WHEN p_page > 0 THEN v_offset ELSE 0 END
    ) subq
  );
END;
$$;
