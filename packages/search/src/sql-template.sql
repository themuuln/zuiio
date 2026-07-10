-- ═══════════════════════════════════════════════════════════════════════
-- Search Scoring Migration Template
-- ═══════════════════════════════════════════════════════════════════════
--
-- Copy this template and adapt for your entity (products, contacts, etc.)
--
-- What to customize:
--   1. TABLE_NAME — your target table
--   2. SEARCH_FIELDS — which columns to index and weight
--   3. SCORING_WEIGHTS — adjust text/sku/barcode/prefix weights
--   4. BARCODE_FIELD — set to a column name or remove barcode logic
--   5. ORG_RESOLUTION — how to get organization_id from auth.uid()
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- 2. Add generated columns
--    Adapt: replace 'name', 'sku' with your searchable columns
ALTER TABLE public.TABLE_NAME
  ADD COLUMN IF NOT EXISTS name_norm text
    GENERATED ALWAYS AS (
      lower(regexp_replace(
        coalesce(name, ''),
        '[^[:alnum:]а-яА-ЯёЁөӨүҮ\s]',
        '', 'g'
      ))
    ) STORED;

--    Adapt: setweight for each field (A = highest priority, D = lowest)
ALTER TABLE public.TABLE_NAME
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
      setweight(to_tsvector('simple', coalesce(sku, '')), 'B')
    ) STORED;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_TABLE_NAME_name_trgm
  ON public.TABLE_NAME USING gin (name_norm gin_trgm_ops)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_TABLE_NAME_search_vector
  ON public.TABLE_NAME USING gin (search_vector)
  WHERE deleted_at IS NULL;

--    Optional: barcode B-tree index for exact lookup
-- CREATE INDEX IF NOT EXISTS idx_TABLE_NAME_barcode_exact
--   ON public.TABLE_NAME (barcode)
--   WHERE deleted_at IS NULL AND barcode IS NOT NULL;

-- 4. RPC function
--    Adapt: scoring weights, field names, org resolution
CREATE OR REPLACE FUNCTION public.search_TABLE_NAME(
  p_query text,
  p_limit int DEFAULT 20
)
RETURNS SETOF public.TABLE_NAME
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id UUID;
  v_query text;
BEGIN
  -- Resolve caller's organization
  SELECT p.organization_id INTO v_org_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF v_org_id IS NULL THEN
    RETURN;
  END IF;

  v_query := trim(p_query);

  -- Optional: barcode exact match path
  -- IF v_query ~ '^\d{13,}$' THEN
  --   RETURN QUERY
  --   SELECT pr.*
  --   FROM public.TABLE_NAME pr
  --   WHERE pr.barcode = v_query
  --     AND pr.organization_id = v_org_id
  --     AND pr.deleted_at IS NULL
  --   LIMIT 1;
  --   RETURN;
  -- END IF;

  -- Scored search
  RETURN QUERY
  WITH scored AS (
    SELECT
      pr.*,
      (
        GREATEST(
          similarity(pr.name_norm, lower(v_query)) * 0.6,
          ts_rank_cd(pr.search_vector, plainto_tsquery('simple', v_query)) * 0.4
        ) * 0.80
        +
        CASE WHEN lower(pr.sku) = lower(v_query) THEN 0.10 ELSE 0 END
        +
        CASE WHEN pr.name_norm LIKE lower(v_query) || '%' THEN 0.05 ELSE 0 END
      )::real AS score
    FROM public.TABLE_NAME pr
    WHERE pr.organization_id = v_org_id
      AND pr.deleted_at IS NULL
      AND (
        pr.name_norm % lower(v_query)
        OR pr.search_vector @@ plainto_tsquery('simple', v_query)
        OR lower(pr.sku) = lower(v_query)
      )
  )
  SELECT scored.*
  FROM scored
  ORDER BY scored.score DESC, scored.name
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_TABLE_NAME(text, int) TO authenticated;
