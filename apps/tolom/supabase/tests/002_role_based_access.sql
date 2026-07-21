-- RLS Test: Role-Based Access Control
-- Verifies that different roles (admin, mechanic, guest) have appropriate
-- access levels to various tables.
--
-- Prerequisites:
--   1. pgtap extension enabled
--   2. Local Supabase running (supabase start)
--   3. Run: supabase test db
--
-- RBAC patterns tested:
--   - Admin: full CRUD access within org
--   - Mechanic: limited write to work_orders, read-only elsewhere
--   - Guest: read-only access to designated tables
--   - Service role: full bypass (for backend operations)

begin;
select plan(20);

-- ── Setup: create test org, roles, and users ──────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'org-rbac', 'service_role');

insert into organizations (id, name, slug) values ('org-rbac', 'RBAC Test Org', 'org-rbac')
on conflict (id) do nothing;

-- Create role records if they don't exist
-- Assumes roles are seeded by migration 20260531075930
insert into roles (id, name, label, organization_id) values
  ('role-admin', 'admin', 'Admin', 'org-rbac'),
  ('role-mechanic', 'mechanic', 'Mechanic', 'org-rbac'),
  ('role-guest', 'guest', 'Guest', 'org-rbac')
on conflict (id) do nothing;

-- Seed org-level permissions (simplified)
insert into permissions (id, name, resource, action, organization_id) values
  ('perm-all', '*', '*', 'ALL', 'org-rbac'),
  ('perm-workorder-write', 'work_orders', 'work_orders', 'WRITE', 'org-rbac'),
  ('perm-customer-read', 'customers', 'customers', 'READ', 'org-rbac')
on conflict (id) do nothing;

-- Grant permissions to roles
insert into role_permissions (role_id, permission_id, organization_id) values
  ('role-admin', 'perm-all', 'org-rbac'),
  ('role-mechanic', 'perm-workorder-write', 'org-rbac'),
  ('role-mechanic', 'perm-customer-read', 'org-rbac'),
  ('role-guest', 'perm-customer-read', 'org-rbac')
on conflict do nothing;

-- Create test data
insert into customers (id, organization_id, name, phone) values
  ('cust-rbac-1', 'org-rbac', 'RBAC Customer', '99990099')
on conflict (id) do nothing;

insert into vehicles (id, organization_id, plate, make, model) values
  ('veh-rbac-1', 'org-rbac', 'РБАК001', 'Test', 'Vehicle')
on conflict (id) do nothing;

-- Create work order
insert into work_orders (id, organization_id, customer_id, vehicle_id, status) values
  ('wo-rbac-1', 'org-rbac', 'cust-rbac-1', 'veh-rbac-1', 'queued')
on conflict (id) do nothing;

-- Create org membership
insert into org_members (organization_id, user_id, role_id) values
  ('org-rbac', '00000000-0000-0000-0000-000000000010', 'role-admin'),
  ('org-rbac', '00000000-0000-0000-0000-000000000020', 'role-mechanic'),
  ('org-rbac', '00000000-0000-0000-0000-000000000030', 'role-guest')
on conflict (organization_id, user_id) do nothing;

-- ── Test 1-5: Admin access ────────────────────────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'org-rbac', 'authenticated');

select lives_ok(
  'select * from customers where organization_id = ''org-rbac'' limit 1',
  'Admin can read customers'
);

select lives_ok(
  $$insert into customers (id, organization_id, name, phone)
    values ('cust-admin-new', 'org-rbac', 'Admin Created', '99991111')$$,
  'Admin can create customers'
);
delete from customers where id = 'cust-admin-new';

select lives_ok(
  $$update customers set name = 'Admin Updated' where id = 'cust-rbac-1'$$,
  'Admin can update customers'
);

select lives_ok(
  $$update work_orders set status = 'in_progress' where id = 'wo-rbac-1'$$,
  'Admin can update work orders'
);

-- Admin can read financial data
select lives_ok(
  'select * from invoices where organization_id = ''org-rbac'' limit 1',
  'Admin can read invoices'
);

-- ── Test 6-12: Mechanic access ────────────────────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000020', 'org-rbac', 'authenticated');

-- Mechanic should be able to read customers
select lives_ok(
  'select * from customers where organization_id = ''org-rbac'' limit 1',
  'Mechanic can read customers'
);

-- Mechanic should be able to read work orders
select lives_ok(
  'select * from work_orders where organization_id = ''org-rbac'' limit 1',
  'Mechanic can read work orders'
);

-- Mechanic should be able to update work order status
select lives_ok(
  $$update work_orders set status = 'in_progress' where id = 'wo-rbac-1'$$,
  'Mechanic can update work order status'
);

-- Mechanic should NOT be able to delete customers
select throws_ok(
  $$delete from customers where id = 'cust-rbac-1'$$,
  42501,
  null,
  'Mechanic cannot delete customers'
);

-- Mechanic should NOT be able to access cash register
select throws_ok(
  'select * from cash_register_sessions where organization_id = ''org-rbac'' limit 1',
  42501,
  null,
  'Mechanic cannot access cash register'
);

-- Mechanic should NOT be able to delete work orders
select throws_ok(
  $$delete from work_orders where id = 'wo-rbac-1'$$,
  42501,
  null,
  'Mechanic cannot delete work orders'
);

-- ── Test 13-17: Guest access ──────────────────────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000030', 'org-rbac', 'authenticated');

-- Guest should be able to read customers
select lives_ok(
  'select * from customers where organization_id = ''org-rbac'' limit 1',
  'Guest can read customers'
);

-- Guest should NOT be able to create customers
select throws_ok(
  $$insert into customers (id, organization_id, name, phone)
    values ('cust-guest-new', 'org-rbac', 'Guest Attempt', '99992222')$$,
  42501,
  null,
  'Guest cannot create customers'
);

-- Guest should NOT be able to update work orders
select throws_ok(
  $$update work_orders set status = 'completed' where id = 'wo-rbac-1'$$,
  42501,
  null,
  'Guest cannot update work orders'
);

-- Guest should not have write access to inventory
select throws_ok(
  $$insert into parts_catalog (id, organization_id, name, default_price)
    values ('part-guest-new', 'org-rbac', 'Guest Part', 1000)$$,
  42501,
  null,
  'Guest cannot create parts'
);

-- Guest should be able to read work orders (read-only)
select lives_ok(
  'select * from work_orders where organization_id = ''org-rbac'' limit 1',
  'Guest can read work orders (read-only)'
);

-- ── Test 18-20: Anonymous access (no auth) ────────────────────────
select tests.clear_auth();

select is(
  (select count(*)::int from customers where organization_id = 'org-rbac'),
  0,
  'Anonymous user sees no customers'
);

select is(
  (select count(*)::int from work_orders where organization_id = 'org-rbac'),
  0,
  'Anonymous user sees no work orders'
);

select throws_ok(
  $$insert into work_orders (id, organization_id, customer_id, vehicle_id, status)
    values ('wo-anon', 'org-rbac', 'cust-rbac-1', 'veh-rbac-1', 'queued')$$,
  42501,
  null,
  'Anonymous user cannot create work orders'
);

select * from finish();
rollback;
