-- Add organization_id indexes for price_list tables missing them.
-- Both tables are queried by organization_id in every request (RLS + app queries).
-- IF NOT EXISTS for idempotency; CREATE INDEX is non-blocking in Postgres < 12
-- and acquires only a ShareLock for the duration of the build (safe for production).

-- price_list_segments: linked to customer_segments and price_lists
CREATE INDEX IF NOT EXISTS idx_pls_org
  ON public.price_list_segments (organization_id);

-- price_list_rules: per-product/category pricing rules
CREATE INDEX IF NOT EXISTS idx_plr_org
  ON public.price_list_rules (organization_id);
