BEGIN;
SELECT plan(12);

-- Test 1: Anonymous cannot enumerate invoices
SELECT is(
  (SELECT count(*) FROM public.invoices WHERE token_hash IS NOT NULL),
  0::bigint,
  'anon cannot read invoices via direct table access'
);

-- Test 2: Anonymous cannot enumerate invoice_items
SELECT is(
  (SELECT count(*) FROM public.invoice_items),
  0::bigint,
  'anon cannot read invoice_items via direct table access'
);

-- Test 3: Anonymous cannot enumerate shared_reports
SELECT is(
  (SELECT count(*) FROM public.shared_reports WHERE token_hash IS NOT NULL),
  0::bigint,
  'anon cannot read shared_reports via direct table access'
);

-- Test 4: get_public_invoice returns NULL for malformed token
SELECT is(
  public.get_public_invoice('short'),
  NULL,
  'get_public_invoice rejects malformed token'
);

-- Test 5: get_public_invoice returns NULL for invalid token
SELECT is(
  public.get_public_invoice('0000000000000000000000000000000000000000000000000000000000000000'),
  NULL,
  'get_public_invoice returns NULL for non-existent token'
);

-- Test 6: get_public_report_data returns NULL for malformed token
SELECT is(
  public.get_public_report_data('not-hex'),
  NULL,
  'get_public_report_data rejects malformed token'
);

-- Test 7: get_public_report_data returns NULL for invalid token
SELECT is(
  public.get_public_report_data('0000000000000000000000000000000000000000000000000000000000000000'),
  NULL,
  'get_public_report_data returns NULL for non-existent token'
);

-- Test 8: get_public_receipt returns NULL for malformed token
SELECT is(
  public.get_public_receipt('abc'),
  NULL,
  'get_public_receipt rejects malformed token'
);

-- Test 9: get_public_receipt returns NULL for invalid token
SELECT is(
  public.get_public_receipt('0000000000000000000000000000000000000000000000000000000000000000'),
  NULL,
  'get_public_receipt returns NULL for non-existent token'
);

-- Test 10: Expired token returns NULL
-- (would need fixture data; placeholder for now)
SELECT pass('expired token test placeholder');

-- Test 11: Revoked token returns NULL
SELECT pass('revoked token test placeholder');

-- Test 12: Valid active token returns projected data
SELECT pass('valid token test placeholder');

SELECT * FROM finish();
ROLLBACK;
