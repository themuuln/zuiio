-- RLS Test: Catalog Variants and Inventory Balances
-- Verifies org-scoped isolation for variant tables and inventory_balances.
--
-- Prerequisites:
--   1. pgtap extension enabled
--   2. Local Supabase running (supabase start)
--   3. Run: supabase test db
--
-- Tables tested:
--   - catalog_variant_groups: org-scoped
--   - catalog_variant_options: org-scoped (FK to groups)
--   - inventory_balances: org-scoped, read-only (trigger-maintained)

begin;
select plan(16);

-- ── Setup: create test orgs and data ──────────────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'service_role');

insert into organizations (id, name, slug) values
  ('ffffffff-ffff-ffff-ffff-fffffffffff1', 'CV Test Org A', 'cv-test-org-a'),
  ('ffffffff-ffff-ffff-ffff-fffffffffff2', 'CV Test Org B', 'cv-test-org-b')
on conflict (id) do nothing;

-- Roles for org A
insert into roles (id, name, description, organization_id, is_system) values
  ('a0000002-0000-0000-000f-000000000001', 'admin', 'Admin', 'ffffffff-ffff-ffff-ffff-fffffffffff1', true)
on conflict do nothing;

-- Catalog variant groups
insert into catalog_variant_groups (id, organization_id, name, applies_to, sort_order) values
  ('a0000003-0000-0000-000f-000000000001', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'Group A1', 'both', 1),
  ('a0000003-0000-0000-000f-000000000002', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'Group A2', 'part', 2),
  ('a0000003-0000-0000-000f-000000000010', 'ffffffff-ffff-ffff-ffff-fffffffffff2', 'Group B1', 'both', 1)
on conflict (id) do nothing;

-- Catalog variant options (FK to groups)
insert into catalog_variant_options (id, organization_id, group_id, label, sort_order) values
  ('b0000003-0000-0000-000f-000000000001', 'ffffffff-ffff-ffff-ffff-fffffffffff1',
   'a0000003-0000-0000-000f-000000000001', 'Option A1', 1),
  ('b0000003-0000-0000-000f-000000000002', 'ffffffff-ffff-ffff-ffff-fffffffffff1',
   'a0000003-0000-0000-000f-000000000002', 'Option A2', 1),
  ('b0000003-0000-0000-000f-000000000010', 'ffffffff-ffff-ffff-ffff-fffffffffff2',
   'a0000003-0000-0000-000f-000000000010', 'Option B1', 1)
on conflict (id) do nothing;

-- Parts needed for inventory_balances
insert into parts_catalog (id, organization_id, name, part_number, unit, default_price, created_by) values
  ('f0000000-0000-0000-000f-000000000001', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'Part A1', 'CV-001', 'piece', 15000, '00000000-0000-0000-0000-000000000010'),
  ('f0000000-0000-0000-000f-000000000010', 'ffffffff-ffff-ffff-ffff-fffffffffff2', 'Part B1', 'CV-002', 'piece', 20000, '00000000-0000-0000-0000-000000000010')
on conflict (id) do nothing;

-- Inventory balances (trigger-maintained table, direct insert for test)
insert into inventory_balances (organization_id, part_id, quantity_on_hand, part_name, default_price) values
  ('ffffffff-ffff-ffff-ffff-fffffffffff1', 'f0000000-0000-0000-000f-000000000001', 50, 'Part A1', 15000),
  ('ffffffff-ffff-ffff-ffff-fffffffffff2', 'f0000000-0000-0000-000f-000000000010', 30, 'Part B1', 20000)
on conflict do nothing;

-- Membership
insert into organization_users (organization_id, user_id, role_id) values
  ('ffffffff-ffff-ffff-ffff-fffffffffff1', '00000000-0000-0000-0000-000000000010',
   'a0000002-0000-0000-000f-000000000001')
on conflict (organization_id, user_id) do nothing;

-- ── Test 1-3: Catalog variant groups — org A access ──────────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'authenticated');

select is(
  (select count(*)::int from catalog_variant_groups where organization_id = 'ffffffff-ffff-ffff-ffff-fffffffffff1'),
  2,
  'OrgA user can see their 2 variant groups'
);

select lives_ok(
  $$insert into catalog_variant_groups (id, organization_id, name)
    values ('a0000003-0000-0000-000f-00000000fff0', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'New Group')$$,
  'OrgA user can create variant group in their org'
);
delete from catalog_variant_groups where id = 'a0000003-0000-0000-000f-00000000fff0';

select lives_ok(
  $$update catalog_variant_groups set name = 'Updated Group' where id = 'a0000003-0000-0000-000f-000000000001'$$,
  'OrgA user can update their variant group'
);

-- ── Test 4-6: Catalog variant groups — cross-org and anon ────────

select is(
  (select count(*)::int from catalog_variant_groups where organization_id = 'ffffffff-ffff-ffff-ffff-fffffffffff2'),
  0,
  'OrgA user CANNOT see OrgB variant groups'
);

select throws_ok(
  $$update catalog_variant_groups set name = 'Hacked' where id = 'a0000003-0000-0000-000f-000000000010'$$,
  42501,
  null,
  'OrgA user cannot update OrgB variant group'
);

select tests.clear_auth();
select is(
  (select count(*)::int from catalog_variant_groups where organization_id = 'ffffffff-ffff-ffff-ffff-fffffffffff1'),
  0,
  'Anonymous user sees no variant groups'
);

-- ── Test 7-9: Catalog variant options — org A access ─────────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'authenticated');

select is(
  (select count(*)::int from catalog_variant_options where organization_id = 'ffffffff-ffff-ffff-ffff-fffffffffff1'),
  2,
  'OrgA user can see their 2 variant options'
);

select lives_ok(
  $$insert into catalog_variant_options (id, organization_id, group_id, label)
    values ('b0000003-0000-0000-000f-00000000fff0', 'ffffffff-ffff-ffff-ffff-fffffffffff1',
            'a0000003-0000-0000-000f-000000000001', 'New Option')$$,
  'OrgA user can create variant option in their org'
);
delete from catalog_variant_options where id = 'b0000003-0000-0000-000f-00000000fff0';

select lives_ok(
  $$update catalog_variant_options set label = 'Updated' where id = 'b0000003-0000-0000-000f-000000000001'$$,
  'OrgA user can update their variant option'
);

-- ── Test 10-12: Catalog variant options — cross-org and anon ─────

select is(
  (select count(*)::int from catalog_variant_options where organization_id = 'ffffffff-ffff-ffff-ffff-fffffffffff2'),
  0,
  'OrgA user CANNOT see OrgB variant options'
);

select throws_ok(
  $$update catalog_variant_options set label = 'Hacked' where id = 'b0000003-0000-0000-000f-000000000010'$$,
  42501,
  null,
  'OrgA user cannot update OrgB variant option'
);

select tests.clear_auth();
select is(
  (select count(*)::int from catalog_variant_options where organization_id = 'ffffffff-ffff-ffff-ffff-fffffffffff1'),
  0,
  'Anonymous user sees no variant options'
);

-- ── Test 13-15: Inventory balances — org A access ────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'authenticated');

select is(
  (select count(*)::int from inventory_balances where organization_id = 'ffffffff-ffff-ffff-ffff-fffffffffff1'),
  1,
  'OrgA user can see their inventory balance'
);

select lives_ok(
  'select * from inventory_balances where organization_id = ''ffffffff-ffff-ffff-ffff-fffffffffff1'' limit 1',
  'OrgA user can read inventory_balances'
);

-- ── Test 16-18: Inventory balances — cross-org and anon ──────────

select is(
  (select count(*)::int from inventory_balances where organization_id = 'ffffffff-ffff-ffff-ffff-fffffffffff2'),
  0,
  'OrgA user CANNOT see OrgB inventory balances'
);

select tests.clear_auth();
select is(
  (select count(*)::int from inventory_balances where organization_id = 'ffffffff-ffff-ffff-ffff-fffffffffff1'),
  0,
  'Anonymous user sees no inventory balances'
);

-- Re-auth to clean up test data
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'service_role');

-- Cleanup test insert
delete from catalog_variant_options where id = 'b0000003-0000-0000-000f-00000000fff0';
delete from catalog_variant_groups where id = 'a0000003-0000-0000-000f-00000000fff0';

select * from finish();
rollback;
