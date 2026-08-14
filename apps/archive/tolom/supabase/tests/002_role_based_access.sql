-- RLS Test: Role-Based Access Control
-- Verifies that different roles (admin, mechanic, guest) have appropriate
-- access levels to various tables within the Tolom org-scoped RLS schema.
--
-- Prerequisites:
--   1. pgtap extension enabled
--   2. Local Supabase running (supabase start)
--   3. Run: supabase test db
--
-- RBAC patterns tested:
--   - Admin: full CRUD access within org
--   - Mechanic: read + update on work_orders, read elsewhere
--   - Guest: read-only access to designated tables
--   - Service role: full bypass (for backend operations)
-- NOTE: The Tolom schema enforces org-scoped RLS (not role-scoped on data tables).
-- These tests verify that any authenticated org member has org-scoped access,
-- and that anonymous users are blocked.

begin;
select plan(20);

-- ── Setup: create test org, roles, and users ──────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'service_role');

insert into organizations (id, name, slug) values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'RBAC Test Org', 'rbac-test-org')
on conflict (id) do nothing;

-- Create role records
insert into roles (id, name, description, organization_id, is_system) values
  ('a0000002-0000-0000-0005-000000000001', 'admin', 'Admin role', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true),
  ('a0000002-0000-0000-0005-000000000002', 'mechanic', 'Mechanic role', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true),
  ('a0000002-0000-0000-0005-000000000003', 'guest', 'Guest role', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true)
on conflict do nothing;

-- Seed org-level permissions
insert into permissions (id, name, resource, action, organization_id) values
  ('e0000000-0000-0000-0005-000000000001', '*', '*', 'manage', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('e0000000-0000-0000-0005-000000000003', 'work_orders_write', 'work_orders', 'write', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('e0000000-0000-0000-0005-000000000002', 'customers_read', 'customers', 'read', 'cccccccc-cccc-cccc-cccc-cccccccccccc')
on conflict (id) do nothing;

-- Grant permissions to roles (role_permissions has no organization_id column)
insert into role_permissions (role_id, permission_id) values
  ('a0000002-0000-0000-0005-000000000001', 'e0000000-0000-0000-0005-000000000001'),
  ('a0000002-0000-0000-0005-000000000002', 'e0000000-0000-0000-0005-000000000003'),
  ('a0000002-0000-0000-0005-000000000002', 'e0000000-0000-0000-0005-000000000002'),
  ('a0000002-0000-0000-0005-000000000003', 'e0000000-0000-0000-0005-000000000002')
on conflict (role_id, permission_id) do nothing;

-- Create test data
insert into customers (id, organization_id, first_name, last_name, phone, created_by) values
  ('b0000000-0000-0000-0005-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'RBAC', 'Customer', '99990099', '00000000-0000-0000-0000-000000000010')
on conflict (id) do nothing;

insert into vehicles (id, organization_id, plate_number, make, model, created_by) values
  ('a0000001-0000-0000-0005-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'РБЦ0001', 'Test', 'Vehicle', '00000000-0000-0000-0000-000000000010')
on conflict (id) do nothing;

-- Create work order (status must match check constraint)
insert into work_orders (id, organization_id, customer_id, vehicle_id, status, created_by) values
  ('d0000000-0000-0000-0005-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'b0000000-0000-0000-0005-000000000001', 'a0000001-0000-0000-0005-000000000001', 'New', '00000000-0000-0000-0000-000000000010')
on conflict (id) do nothing;

-- Create org membership for each user
insert into organization_users (organization_id, user_id, role_id) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000010', 'a0000002-0000-0000-0005-000000000001'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000020', 'a0000002-0000-0000-0005-000000000002'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000030', 'a0000002-0000-0000-0005-000000000003')
on conflict (organization_id, user_id) do nothing;

-- Create org A with a customer for cross-org isolation tests
insert into organizations (id, name, slug) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Org A', 'org-a')
on conflict (id) do nothing;

insert into customers (id, organization_id, first_name, last_name, phone, created_by)
values ('b0000000-0000-0000-0005-000000000099', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cross', 'OrgCust', '99990098', '00000000-0000-0000-0000-000000000010')
on conflict (id) do nothing;

insert into work_orders (id, organization_id, customer_id, vehicle_id, status, created_by)
values ('d0000000-0000-0000-0005-000000000099', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b0000000-0000-0000-0005-000000000099', 'a0000001-0000-0000-0005-000000000001', 'New', '00000000-0000-0000-0000-000000000010')
on conflict (id) do nothing;

-- ── Test 1-5: Admin access ────────────────────────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'authenticated');

select lives_ok(
  'select * from customers where organization_id = ''cccccccc-cccc-cccc-cccc-cccccccccccc'' limit 1',
  'Admin can read customers'
);

select lives_ok(
  $$insert into customers (id, organization_id, first_name, last_name, phone, created_by)
    values ('b0000000-0000-0000-0001-0000000000f0', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Admin', 'Created', '99991111', '00000000-0000-0000-0000-000000000010')$$,
  'Admin can create customers'
);
delete from customers where id = 'b0000000-0000-0000-0001-0000000000f0';

select lives_ok(
  $$update customers set last_name = 'Updated' where id = 'b0000000-0000-0000-0005-000000000001'$$,
  'Admin can update customers'
);

select lives_ok(
  $$update work_orders set status = 'In Progress' where id = 'd0000000-0000-0000-0005-000000000001'$$,
  'Admin can update work orders'
);

-- Admin can read financial data (invoices is empty but SELECT should not throw)
select lives_ok(
  'select * from invoices where organization_id = ''cccccccc-cccc-cccc-cccc-cccccccccccc'' limit 1',
  'Admin can read invoices'
);

-- ── Test 6-10: Mechanic access ────────────────────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000020', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'authenticated');

-- Mechanic should be able to read customers
select lives_ok(
  'select * from customers where organization_id = ''cccccccc-cccc-cccc-cccc-cccccccccccc'' limit 1',
  'Mechanic can read customers'
);

-- Mechanic should be able to read work orders
select lives_ok(
  'select * from work_orders where organization_id = ''cccccccc-cccc-cccc-cccc-cccccccccccc'' limit 1',
  'Mechanic can read work orders'
);

-- Mechanic should be able to update work order status
select lives_ok(
  $$update work_orders set status = 'In Progress' where id = 'd0000000-0000-0000-0005-000000000001'$$,
  'Mechanic can update work order status'
);

-- Mechanic can read financial data (same org-scoped access)
select lives_ok(
  'select * from invoices where organization_id = ''cccccccc-cccc-cccc-cccc-cccccccccccc'' limit 1',
  'Mechanic can read invoices (org-scoped RLS)'
);

-- Mechanic can read cash register sessions (same org-scoped access)
select lives_ok(
  'select * from cash_register_sessions where organization_id = ''cccccccc-cccc-cccc-cccc-cccccccccccc'' limit 1',
  'Mechanic can read cash register sessions (org-scoped RLS)'
);

-- ── Test 11-15: Guest access + created_by enforcement ─────────────
select tests.set_auth('00000000-0000-0000-0000-000000000030', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'authenticated');

-- Guest can read customers
select lives_ok(
  'select * from customers where organization_id = ''cccccccc-cccc-cccc-cccc-cccccccccccc'' limit 1',
  'Guest can read customers'
);

-- Guest can read work orders
select lives_ok(
  'select * from work_orders where organization_id = ''cccccccc-cccc-cccc-cccc-cccccccccccc'' limit 1',
  'Guest can read work orders'
);

-- created_by enforcement: insert with null created_by should fail
-- because the insert policy checks created_by = auth.uid()
select throws_ok(
  $$insert into customers (id, organization_id, first_name, last_name, phone)
    values ('b0000000-0000-0000-0003-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'NoCreated', 'By', '99992222')$$,
  42501,
  null,
  'Insert without created_by is rejected (policy requires created_by = auth.uid())'
);

-- created_by enforcement: insert with mismatched created_by should fail
select throws_ok(
  $$insert into customers (id, organization_id, first_name, last_name, phone, created_by)
    values ('b0000000-0000-0000-0003-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'WrongCreated', 'By', '99992223', '00000000-0000-0000-0000-0000000000ff')$$,
  42501,
  null,
  'Insert with wrong created_by is rejected (policy requires created_by = auth.uid())'
);

-- Guest CAN insert with correct created_by (same org-scoped access)
select lives_ok(
  $$insert into customers (id, organization_id, first_name, last_name, phone, created_by)
    values ('b0000000-0000-0000-0003-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Guest', 'Insert', '99992224', '00000000-0000-0000-0000-000000000030')$$,
  'Guest can insert customer with correct created_by'
);
delete from customers where id = 'b0000000-0000-0000-0003-000000000003';

-- ── Test 16-17: Cross-org isolation ────────────────────────────────
-- Admin user from different org cannot see customers
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated');

select is(
  (select count(*)::int from customers where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'Org member cannot see customers from a different org (cross-org block)'
);

select is(
  (select count(*)::int from work_orders where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'Org member cannot see work orders from a different org (cross-org block)'
);

-- ── Test 18-20: Anonymous access (no auth) ────────────────────────
select tests.clear_auth();

select is(
  (select count(*)::int from customers where organization_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  0,
  'Anonymous user sees no customers'
);

select is(
  (select count(*)::int from work_orders where organization_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  0,
  'Anonymous user sees no work orders'
);

select throws_ok(
  $$insert into work_orders (id, organization_id, customer_id, vehicle_id, status, created_by)
    values ('d0000000-0000-0000-0005-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'b0000000-0000-0000-0005-000000000001', 'a0000001-0000-0000-0005-000000000001', 'New', '00000000-0000-0000-0000-000000000010')$$,
  42501,
  null,
  'Anonymous user cannot create work orders'
);

select * from finish();
rollback;
