-- Performance indexes for /shop catalog queries.
-- The shop page fetches: WHERE organization_id = $1 AND deleted_at IS NULL ORDER BY name
-- Partial index covers active products only — smaller, faster than indexing all rows.

CREATE INDEX IF NOT EXISTS idx_products_org_active_name
  ON public.products(organization_id, name)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_categories_org_name
  ON public.categories(organization_id, name);
