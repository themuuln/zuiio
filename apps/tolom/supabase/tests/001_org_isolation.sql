-- RLS Test: Organization Isolation
-- Verifies that org data is properly isolated: members of org A cannot
-- access org B's data. This is the most critical RLS guarantee.
--
-- Prerequisites:
--   1. pgtap extension enabled
--   2. Local Supabase running (supabase start)
--   3. Run: supabase test db
--
-- Tenant isolation pattern tested:
--   - Organizations table: members can only see their own org
--   - Customers table: customers scoped to org via organization_id
--   - Vehicles table: vehicles scoped via organization_id
--   - Work orders: scoped via organization_id
--   - Parts catalog: scoped via organization_id

begin;
select plan(16);

-- ── Setup: create users and org data ──────────────────────────────
-- Using service role to bypass RLS during setup.

select tests.set_auth('00000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'service_role');

-- Create org A with a role for membership
insert into organizations (id, name, slug) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Org A', 'org-a')
on conflict (id) do nothing;

insert into roles (id, name, description, organization_id, is_system)
values ('a0000002-0000-0000-0005-000000000001', 'staff', 'Staff role', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true)
on conflict (id) do nothing;

insert into customers (id, organization_id, first_name, last_name, phone, created_by)
values ('b0000000-0000-0000-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Customer', 'A1', '99990001', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

insert into customers (id, organization_id, first_name, last_name, phone, created_by)
values ('b0000000-0000-0000-0001-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Customer', 'A2', '99990002', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

insert into vehicles (id, organization_id, plate_number, make, model, year, vin, color, created_by)
values ('a0000001-0000-0000-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '0001УБА', 'Toyota', 'Camry', 2020, 'JTDBE32KX12345678', 'Silver', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- Create org B
insert into organizations (id, name, slug) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Org B', 'org-b')
on conflict (id) do nothing;

-- Create role for org B membership
insert into roles (id, name, description, organization_id, is_system)
values ('a0000002-0000-0000-0005-000000000002', 'staff', 'Staff role', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true)
on conflict (id) do nothing;

-- Create work orders for org A
insert into work_orders (id, organization_id, customer_id, vehicle_id, status, created_by)
values ('d0000000-0000-0000-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b0000000-0000-0000-0001-000000000001', 'a0000001-0000-0000-0001-000000000001', 'New', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- Create parts catalog entries for org A
insert into parts_catalog (id, organization_id, name, part_number, category, default_price, created_by)
values ('f0000000-0000-0000-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'OrgA Part', 'OA-001', 'General', 10000, '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;


-- Create parts catalog entries for org B
insert into parts_catalog (id, organization_id, name, part_number, category, default_price, created_by)
values ('f0000000-0000-0000-0002-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'OrgB Part', 'OB-001', 'General', 15000, '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

insert into customers (id, organization_id, first_name, last_name, phone, created_by)
values ('b0000000-0000-0000-0002-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Customer', 'B1', '99990003', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

insert into vehicles (id, organization_id, plate_number, make, model, year, vin, color, created_by)
values ('a0000001-0000-0000-0002-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '0002УБА', 'Honda', 'Accord', 2021, '1HGCG56661A1234567', 'Black', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- Create org membership so user 1 belongs to org A
insert into organization_users (organization_id, user_id, role_id)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', 'a0000002-0000-0000-0005-000000000001')
on conflict (organization_id, user_id) do nothing;


-- ── Test 1-4: Customer isolation ──────────────────────────────────
-- Org A user should see org A customers only

select tests.set_auth('00000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated');

select is(
  (select count(*)::int from customers where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  2,
  'OrgA user can see both OrgA customers'
);

select is(
  (select count(*)::int from customers where organization_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0,
  'OrgA user CANNOT see OrgB customers (RLS block)'
);

select is(
  (select count(*)::int from customers),
  2,
  'OrgA user sees only their 2 customers total'
);

-- Attempt direct access to org B customer
select throws_ok(
  $$delete from customers where id = 'b0000000-0000-0000-0002-000000000001'$$,
  42501,
  null,
  'OrgA user cannot delete OrgB customer'
);

-- ── Test 5-8: Vehicle isolation ───────────────────────────────────

select is(
  (select count(*)::int from vehicles where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'OrgA user can see their vehicles'
);

select is(
  (select count(*)::int from vehicles where organization_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0,
  'OrgA user CANNOT see OrgB vehicles'
);

select is(
  (select count(*)::int from vehicles),
  1,
  'OrgA sees only their 1 vehicle'
);

select throws_ok(
  $$update vehicles set plate_number = 'XXXXXX' where id = 'a0000001-0000-0000-0002-000000000001'$$,
  42501,
  null,
  'OrgA user cannot update OrgB vehicle'
);

-- ── Test 9-10: Work order & Parts catalog isolation ─────────────

select is(
  (select count(*)::int from work_orders where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'OrgA user can see their own work orders'
);

-- OrgA user can see their own parts catalog, not OrgB's
select is(
  (select count(*)::int from parts_catalog where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'OrgA user can see their own parts catalog'
);

-- ── Test 11-12: Cross-org insert isolation ────────────────────────

-- Org A user cannot insert a customer into org B
select throws_ok(
  $$insert into customers (id, organization_id, first_name, last_name, phone, created_by) values ('b0000000-0000-0000-0002-0000000000ff', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Cross', 'Org', '99999999', '00000000-0000-0000-0000-000000000001')$$,
  42501,
  null,
  'OrgA user cannot insert customer into OrgB'
);

-- Org A user CAN insert a customer into their own org
select lives_ok(
  $$insert into customers (id, organization_id, first_name, last_name, phone, created_by) values ('b0000000-0000-0000-0004-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'New', 'Customer', '99998888', '00000000-0000-0000-0000-000000000001')$$,
  'OrgA user can insert customer into their own org'
);
-- Clean up the test insert
delete from customers where id = 'b0000000-0000-0000-0004-000000000001';

-- ── Test 13-16: Organization table access ─────────────────────────

-- Org members can see their own organization
select is(
  (select count(*)::int from organizations where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'OrgA user can see their own organization'
);

-- Org members cannot see other organizations
select is(
  (select count(*)::int from organizations where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0,
  'OrgA user CANNOT see OrgB organization record'
);

-- Anonymous user should not see any orgs
select tests.clear_auth();
select is(
  (select count(*)::int from organizations),
  0,
  'Anonymous user sees no organizations'
);

-- Org B user (different org) cannot see Org A customers
select tests.set_auth('00000000-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'authenticated');
select is(
  (select count(*)::int from customers where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'OrgB user cannot see OrgA customers (cross-org isolation)'
);

select * from finish();
rollback;
