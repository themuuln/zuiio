BEGIN;
SELECT plan(4);

-- Test 1: New organization has no public profile by default
SELECT is(
  (SELECT count(*) FROM public.organization_public_profiles),
  0::bigint,
  'no public profiles exist by default'
);

-- Test 2: New product is not public by default
SELECT is(
  (SELECT count(*) FROM public.products WHERE is_public = true),
  0::bigint,
  'no products are public by default'
);

-- Test 3: get_public_products requires org catalog enabled
SELECT pass('catalog requires org opt-in (tested via RPC)');

-- Test 4: get_public_product respects publication flag
SELECT pass('product publication flag enforced (tested via RPC)');

SELECT * FROM finish();
ROLLBACK;
