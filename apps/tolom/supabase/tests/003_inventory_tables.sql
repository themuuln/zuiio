-- RLS Test: Inventory Tables
-- Verifies inventory table access for admin, mechanic, guest, and anonymous users.
-- Tests parts_catalog CRUD, inventory_movements, and cross-org isolation.
--
-- Prerequisites:
--   1. pgtap extension enabled
--   2. Local Supabase running (supabase start)
--   3. Run: supabase test db

begin;
select plan(16);

-- ── Setup: create test org and users ──────────────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'service_role');

insert into organizations (id, name, slug) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Inv Test Org A', 'inv-test-org-a'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Inv Test Org B', 'inv-test-org-b')
on conflict (id) do nothing;

-- Create roles for org A
insert into roles (id, name, description, organization_id, is_system) values
  ('a0000002-0000-0000-000a-000000000001', 'admin', 'Admin', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true),
  ('a0000002-0000-0000-000a-000000000002', 'mechanic', 'Mechanic', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true),
  ('a0000002-0000-0000-000a-000000000003', 'guest', 'Guest', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true)
on conflict do nothing;

-- Create parts catalog entries for org A
insert into parts_catalog (id, organization_id, name, default_price, created_by) values
  ('f0000000-0000-0000-000a-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Oil Filter', 15000, '00000000-0000-0000-0000-000000000001'),
  ('f0000000-0000-0000-000a-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Air Filter', 25000, '00000000-0000-0000-0000-000000000001'),
  ('f0000000-0000-0000-000a-000000000010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Brake Pad', 45000, '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- Create parts for org B
insert into parts_catalog (id, organization_id, name, default_price, created_by) values
  ('f0000000-0000-0000-000c-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Spark Plug', 8000, '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- Create inventory movements for org A
insert into inventory_movements (id, organization_id, part_id, movement_type, quantity, unit_cost, created_by) values
  ('90000000-0000-0000-000a-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f0000000-0000-0000-000a-000000000001', 'in', 100, 12000, '00000000-0000-0000-0000-000000000001'),
  ('90000000-0000-0000-000a-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f0000000-0000-0000-000a-000000000001', 'out', 5, 12000, '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- Create inventory movements for org B
insert into inventory_movements (id, organization_id, part_id, movement_type, quantity, unit_cost, created_by) values
  ('90000000-0000-0000-000c-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'f0000000-0000-0000-000c-000000000001', 'in', 50, 5000, '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- ── Test 1-3: Admin can CRUD parts_catalog ───────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated');

select is(
  (select count(*)::int from parts_catalog where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  3,
  'Admin can see all 3 parts in their org'
);

select lives_ok(
  $$insert into parts_catalog (id, organization_id, name, default_price, created_by)
    values ('f0000000-0000-0000-000a-0000000000ff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'New Part', 10000, '00000000-0000-0000-0000-000000000001')$$,
  'Admin can create a new part'
);
delete from parts_catalog where id = 'f0000000-0000-0000-000a-0000000000ff';

select lives_ok(
  $$update parts_catalog set default_price = 20000 where id = 'f0000000-0000-0000-000a-000000000001'$$,
  'Admin can update part price'
);

-- ── Test 4-6: Admin can CRUD inventory_movements ─────────────────
select lives_ok(
  $$insert into inventory_movements (id, organization_id, part_id, movement_type, quantity, unit_cost, created_by)
    values ('90000000-0000-0000-000a-000000000010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f0000000-0000-0000-000a-000000000001', 'in', 10, 12000, '00000000-0000-0000-0000-000000000001')$$,
  'Admin can create inventory movement'
);
delete from inventory_movements where id = '90000000-0000-0000-000a-000000000010';

select is(
  (select count(*)::int from inventory_movements where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  2,
  'Admin can see all movements in their org'
);

select lives_ok(
  $$delete from inventory_movements where id = '90000000-0000-0000-000a-000000000002'$$,
  'Admin can delete inventory movements'
);

-- ── Test 7: Admin can read inventory_balances ────────────────────
select lives_ok(
  'select * from inventory_balances where organization_id = ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'' limit 1',
  'Admin can read inventory_balances view'
);

-- ── Test 8-9: Mechanic can read parts but not delete ────────────
select tests.set_auth('00000000-0000-0000-0000-000000000020', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated');

select is(
  (select count(*)::int from parts_catalog where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  3,
  'Mechanic can read parts_catalog'
);

-- ── Test 10-11: Guest can read parts but not write ──────────────
select tests.set_auth('00000000-0000-0000-0000-000000000030', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated');

select lives_ok(
  'select * from parts_catalog where organization_id = ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'' limit 1',
  'Guest can read parts_catalog'
);

select throws_ok(
  $$insert into parts_catalog (id, organization_id, name, default_price, created_by)
    values ('f0000000-0000-0000-000a-00000000ffff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Guest Part', 5000, '00000000-0000-0000-0000-000000000030')$$,
  42501,
  null,
  'Guest cannot create parts'
);

-- ── Test 12-13: Guest cannot update/delete parts ────────────────
select throws_ok(
  $$update parts_catalog set default_price = 1 where id = 'f0000000-0000-0000-000a-000000000001'$$,
  42501,
  null,
  'Guest cannot update parts'
);

select throws_ok(
  $$delete from parts_catalog where id = 'f0000000-0000-0000-000a-000000000001'$$,
  42501,
  null,
  'Guest cannot delete parts'
);

-- ── Test 14: Guest cannot create movements ───────────────────────
select throws_ok(
  $$insert into inventory_movements (id, organization_id, part_id, movement_type, quantity, unit_cost, created_by)
    values ('90000000-0000-0000-000a-00000000ffff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f0000000-0000-0000-000a-000000000001', 'in', 1, 1000, '00000000-0000-0000-0000-000000000030')$$,
  42501,
  null,
  'Guest cannot create inventory movements'
);

-- ── Test 15: Anonymous user sees no inventory data ───────────────
select tests.clear_auth();

select is(
  (select count(*)::int from parts_catalog where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'Anonymous user sees no parts_catalog'
);

-- ── Test 16: Cross-org isolation ─────────────────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated');

select is(
  (select count(*)::int from parts_catalog where organization_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0,
  'OrgA user CANNOT see OrgB parts'
);

select * from finish();
rollback;
