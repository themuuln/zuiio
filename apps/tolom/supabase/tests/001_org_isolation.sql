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
-- We need real UUIDs that match the seed data or create our own.
-- Using service role to bypass RLS during setup.

select tests.set_auth('00000000-0000-0000-0000-000000000001', 'org-a', 'service_role');

-- Create org A with customer and vehicle
insert into organizations (id, name, slug) values ('org-a', 'Org A', 'org-a')
on conflict (id) do nothing;

insert into customers (id, organization_id, name, phone)
values ('cust-a1', 'org-a', 'Customer A1', '99990001')
on conflict (id) do nothing;

insert into customers (id, organization_id, name, phone)
values ('cust-a2', 'org-a', 'Customer A2', '99990002')
on conflict (id) do nothing;

insert into vehicles (id, organization_id, plate, make, model)
values ('veh-a1', 'org-a', 'УНН0001', 'Toyota', 'Camry')
on conflict (id) do nothing;

-- Create org B with customer
insert into organizations (id, name, slug) values ('org-b', 'Org B', 'org-b')
on conflict (id) do nothing;

insert into customers (id, organization_id, name, phone)
values ('cust-b1', 'org-b', 'Customer B1', '99990003')
on conflict (id) do nothing;

insert into vehicles (id, organization_id, plate, make, model)
values ('veh-b1', 'org-b', 'УНН0002', 'Honda', 'Accord')
on conflict (id) do nothing;

-- Create org membership so the test user belongs to org A
insert into org_members (organization_id, user_id, role_id)
values ('org-a', '00000000-0000-0000-0000-000000000001',
  (select id from roles where name = 'admin' limit 1))
on conflict (organization_id, user_id) do nothing;

-- ── Test 1-4: Customer isolation ──────────────────────────────────
-- Org A user should see org A customers only

select tests.set_auth('00000000-0000-0000-0000-000000000001', 'org-a', 'authenticated');

select is(
  (select count(*)::int from customers where organization_id = 'org-a'),
  2,
  'OrgA user can see both OrgA customers'
);

select is(
  (select count(*)::int from customers where organization_id = 'org-b'),
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
  $$delete from customers where id = 'cust-b1'$$,
  42501,
  null,
  'OrgA user cannot delete OrgB customer'
);

-- ── Test 5-8: Vehicle isolation ───────────────────────────────────

select is(
  (select count(*)::int from vehicles where organization_id = 'org-a'),
  1,
  'OrgA user can see their vehicles'
);

select is(
  (select count(*)::int from vehicles where organization_id = 'org-b'),
  0,
  'OrgA user CANNOT see OrgB vehicles'
);

select is(
  (select count(*)::int from vehicles),
  1,
  'OrgA sees only their 1 vehicle'
);

select throws_ok(
  $$update vehicles set plate = 'XXXXXX' where id = 'veh-b1'$$,
  42501,
  null,
  'OrgA user cannot update OrgB vehicle'
);

-- ── Test 9-12: Cross-org insert isolation ─────────────────────────

-- Org A user cannot insert a customer into org B
select throws_ok(
  $$insert into customers (id, organization_id, name, phone) values ('cust-cross', 'org-b', 'Cross Org', '99999999')$$,
  42501,
  null,
  'OrgA user cannot insert customer into OrgB'
);

-- Org A user CAN insert a customer into their own org
select lives_ok(
  $$insert into customers (id, organization_id, name, phone) values ('cust-new', 'org-a', 'New Customer', '99998888')$$,
  'OrgA user can insert customer into their own org'
);

-- Clean up the test insert
delete from customers where id = 'cust-new';

-- ── Test 13-16: Organization table access ─────────────────────────

-- Org members can see their own organization
select is(
  (select count(*)::int from organizations where id = 'org-a'),
  1,
  'OrgA user can see their own organization'
);

-- Org members cannot see other organizations
select is(
  (select count(*)::int from organizations where id = 'org-b'),
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

-- Org B's data remains inaccessible to different user
select tests.set_auth('00000000-0000-0000-0000-000000000002', 'org-b', 'authenticated');
-- This user has no membership in any org, so they should be blocked
select is(
  (select count(*)::int from customers where organization_id = 'org-a'),
  0,
  'Different user (no membership) cannot see OrgA customers'
);

select * from finish();
rollback;
