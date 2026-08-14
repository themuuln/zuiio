-- RLS Test: Price Rules and Store Credit
-- Verifies org-scoped isolation for price_rules and store_credit_balances.
--
-- Prerequisites:
--   1. pgtap extension enabled
--   2. Local Supabase running (supabase start)
--   3. Run: supabase test db
--
-- Tables tested:
--   - price_rules: org-scoped with deleted_at filtering and created_by enforcement
--   - store_credit_balances: org-scoped with UNIQUE(customer_id, organization_id)

begin;
select plan(16);

-- ── Setup: create test orgs and data ──────────────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'service_role');

insert into organizations (id, name, slug) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'PR Test Org A', 'pr-test-org-a'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'PR Test Org B', 'pr-test-org-b')
on conflict (id) do nothing;

-- Roles for org A
insert into roles (id, name, description, organization_id, is_system) values
  ('a0000002-0000-0000-000e-000000000001', 'admin', 'Admin', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', true),
  ('a0000002-0000-0000-000e-000000000002', 'mechanic', 'Mechanic', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', true),
  ('a0000002-0000-0000-000e-000000000003', 'guest', 'Guest', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', true)
on conflict do nothing;

-- Price rules for org A (deleted_at = NULL)
insert into price_rules (id, organization_id, name, apply_to, conditions, operator, value, priority, created_by) values
  ('f0000000-0000-0000-000e-000000000001', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'OrgA Rule 1', 'part',
   '{}'::jsonb, 'multiply', 1.5, 100, '00000000-0000-0000-0000-000000000010'),
  ('f0000000-0000-0000-000e-000000000002', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'OrgA Rule 2', 'service',
   '{}'::jsonb, 'add_fixed', 10000, 50, '00000000-0000-0000-0000-000000000010')
on conflict (id) do nothing;

-- Price rule for org B
insert into price_rules (id, organization_id, name, apply_to, conditions, operator, value, priority, created_by) values
  ('f0000000-0000-0000-000e-000000000010', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'OrgB Rule', 'both',
   '{}'::jsonb, 'multiply', 2.0, 100, '00000000-0000-0000-0000-000000000010')
on conflict (id) do nothing;

-- Customers for store credit
insert into customers (id, organization_id, first_name, last_name, phone, created_by) values
  ('b0000000-0000-0000-000e-000000000001', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'SC', 'CustomerA', '99991111', '00000000-0000-0000-0000-000000000010'),
  ('b0000000-0000-0000-000e-000000000002', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'SC', 'CustomerB', '99992222', '00000000-0000-0000-0000-000000000010')
on conflict (id) do nothing;

-- Store credit balances
insert into store_credit_balances (id, customer_id, organization_id, balance) values
  ('c0000000-0000-0000-000e-000000000001', 'b0000000-0000-0000-000e-000000000001', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 50000),
  ('c0000000-0000-0000-000e-000000000002', 'b0000000-0000-0000-000e-000000000002', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 100000)
on conflict (id) do nothing;

-- Membership for user 010 in org A
insert into organization_users (organization_id, user_id, role_id) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', '00000000-0000-0000-0000-000000000010', 'a0000002-0000-0000-000e-000000000001')
on conflict (organization_id, user_id) do nothing;

-- ── Test 1-3: Price rules — org A user access ────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'authenticated');

select is(
  (select count(*)::int from price_rules where organization_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1'),
  2,
  'OrgA user can see their 2 price rules'
);

select lives_ok(
  $$insert into price_rules (id, organization_id, name, apply_to, conditions, operator, value, priority, created_by)
    values ('f0000000-0000-0000-000e-0000000000f0', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'New Rule', 'part',
            '{}'::jsonb, 'multiply', 1.1, 90, '00000000-0000-0000-0000-000000000010')$$,
  'OrgA user can create price rules with correct created_by'
);
delete from price_rules where id = 'f0000000-0000-0000-000e-0000000000f0';

select lives_ok(
  $$update price_rules set value = 2.0 where id = 'f0000000-0000-0000-000e-000000000001'$$,
  'OrgA user can update their own price rules'
);

-- ── Test 4-6: Price rules — cross-org and anon ────────────────────

select is(
  (select count(*)::int from price_rules where organization_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2'),
  0,
  'OrgA user CANNOT see OrgB price rules'
);

select throws_ok(
  $$update price_rules set value = 3.0 where id = 'f0000000-0000-0000-000e-000000000010'$$,
  42501,
  null,
  'OrgA user cannot update OrgB price rules'
);

select tests.clear_auth();

select is(
  (select count(*)::int from price_rules where organization_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1'),
  0,
  'Anonymous user sees no price rules'
);

-- ── Test 7-8: Price rules — created_by enforcement (wrong user) ──
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'authenticated');

select throws_ok(
  $$insert into price_rules (id, organization_id, name, apply_to, conditions, operator, value, priority, created_by)
    values ('f0000000-0000-0000-000e-00000000ffff', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'Wrong Creator', 'part',
            '{}'::jsonb, 'multiply', 1.0, 50, '00000000-0000-0000-0000-0000000000ff')$$,
  42501,
  null,
  'Insert with wrong created_by is rejected'
);

select throws_ok(
  $$insert into price_rules (id, organization_id, name, apply_to, conditions, operator, value, priority)
    values ('f0000000-0000-0000-000e-00000000fff1', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'No Creator', 'part',
            '{}'::jsonb, 'multiply', 1.0, 50)$$,
  42501,
  null,
  'Insert without created_by is rejected'
);

-- ── Test 9-11: Store credit — org A user access ──────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'authenticated');

select is(
  (select count(*)::int from store_credit_balances where organization_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1'),
  1,
  'OrgA user can see their org store credit balances'
);

select lives_ok(
  $$insert into store_credit_balances (id, customer_id, organization_id, balance)
    values ('c0000000-0000-0000-000e-00000000fff0', 'b0000000-0000-0000-000e-000000000001',
            'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 25000)$$,
  'OrgA user can create store credit balance in their org'
);
delete from store_credit_balances where id = 'c0000000-0000-0000-000e-00000000fff0';

-- reset original balance after possible update
update store_credit_balances set balance = 50000 where id = 'c0000000-0000-0000-000e-000000000001';

select lives_ok(
  $$update store_credit_balances set balance = 75000 where id = 'c0000000-0000-0000-000e-000000000001'$$,
  'OrgA user can update store credit balances in their org'
);

-- ── Test 12-13: Store credit — cross-org and anon ────────────────

select is(
  (select count(*)::int from store_credit_balances where organization_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2'),
  0,
  'OrgA user CANNOT see OrgB store credit'
);

select throws_ok(
  $$update store_credit_balances set balance = 0 where id = 'c0000000-0000-0000-000e-000000000002'$$,
  42501,
  null,
  'OrgA user cannot update OrgB store credit'
);

-- ── Test 14-16: Anonymous blocked ────────────────────────────────
select tests.clear_auth();

select is(
  (select count(*)::int from store_credit_balances where organization_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1'),
  0,
  'Anonymous user sees no store credit'
);

select throws_ok(
  $$insert into store_credit_balances (id, customer_id, organization_id, balance)
    values ('c0000000-0000-0000-000e-00000000ffff', 'b0000000-0000-0000-000e-000000000001',
            'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 10000)$$,
  42501,
  null,
  'Anonymous user cannot create store credit'
);

select tests.set_auth('00000000-0000-0000-0000-000000000010', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'authenticated');
select lives_ok(
  $$delete from store_credit_balances where id = 'c0000000-0000-0000-000e-000000000001'$$,
  'OrgA user can delete store credit in their org'
);

select * from finish();
rollback;
