-- ============================================================================
-- zer perf: covering indexes for the last unindexed foreign keys
-- (advisor: unindexed_foreign_keys on coupon_category_scope/coupon_product_scope)
--
-- The coupon scope tables have 3 FKs each; 20260812010000 covered coupon_id
-- and organization_id, leaving category_id (coupon_category_scope) and
-- product_id (coupon_product_scope) uncovered. Add those two.
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_coupon_category_scope_category_id
  ON public.coupon_category_scope(category_id);
CREATE INDEX IF NOT EXISTS idx_coupon_product_scope_product_id
  ON public.coupon_product_scope(product_id);
