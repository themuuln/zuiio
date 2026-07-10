-- =============================================
-- Product Search Scoring for /shop
--
-- Adds server-side scored search using pg_trgm
-- (trigram similarity) + full-text search.
--
-- Features:
-- 1. Typo-tolerant name matching via trigrams
-- 2. Weighted FTS (name=A, sku=B)
-- 3. Barcode exact match path (13+ digits)
-- 4. Composite scoring: trigram + FTS + SKU + barcode + prefix
-- =============================================

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- 2. Generated columns on products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS name_norm text
    GENERATED ALWAYS AS (lower(regexp_replace(coalesce(name, ''), '[^[:alnum:]а-яА-ЯёЁөӨүҮ\s]', '', 'g'))) STORED;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
      setweight(to_tsvector('simple', coalesce(sku, '')), 'B')
    ) STORED;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON public.products USING gin (name_norm gin_trgm_ops)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON public.products USING gin (search_vector)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_barcode_exact
  ON public.products (barcode)
  WHERE deleted_at IS NULL AND barcode IS NOT NULL;

-- 4. RPC: scored product search
CREATE OR REPLACE FUNCTION public.search_products(
  p_query text,
  p_limit int DEFAULT 20
)
RETURNS SETOF public.products
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

  -- Barcode exact match: if query is 13+ digits, do direct lookup
  IF v_query ~ '^\d{13,}$' THEN
    RETURN QUERY
    SELECT pr.*
    FROM public.products pr
    WHERE pr.barcode = v_query
      AND pr.organization_id = v_org_id
      AND pr.deleted_at IS NULL
    LIMIT 1;
    RETURN;
  END IF;

  -- Scored search: trigram similarity + FTS + field bonuses
  RETURN QUERY
  WITH scored AS (
    SELECT
      pr.*,
      (
        -- Text score component (80% of total)
        GREATEST(
          similarity(pr.name_norm, lower(v_query)) * 0.6,
          ts_rank_cd(pr.search_vector, plainto_tsquery('simple', v_query)) * 0.4
        ) * 0.80
        +
        -- SKU exact match bonus (10%)
        CASE WHEN lower(pr.sku) = lower(v_query) THEN 0.10 ELSE 0 END
        +
        -- Barcode partial match bonus (5%)
        CASE WHEN pr.barcode ILIKE '%' || v_query || '%' THEN 0.05 ELSE 0 END
        +
        -- Name prefix bonus (5%) — typing "төгрөг" should beat "төгрөгний"
        CASE WHEN pr.name_norm LIKE lower(v_query) || '%' THEN 0.05 ELSE 0 END
      )::real AS score
    FROM public.products pr
    WHERE pr.organization_id = v_org_id
      AND pr.deleted_at IS NULL
      AND (
        pr.name_norm % lower(v_query)
        OR pr.search_vector @@ plainto_tsquery('simple', v_query)
        OR lower(pr.sku) = lower(v_query)
        OR pr.barcode ILIKE '%' || v_query || '%'
      )
  )
  SELECT scored.*
  FROM scored
  ORDER BY scored.score DESC, scored.name
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_products(text, int) TO authenticated;
