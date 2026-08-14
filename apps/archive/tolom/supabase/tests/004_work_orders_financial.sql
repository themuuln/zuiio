-- RLS Test: Work Orders + Financial Tables
-- Verifies work_order lifecycle access and financial data isolation.
--
-- Prerequisites:
--   1. pgtap extension enabled
--   2. Local Supabase running (supabase start)
--   3. Run: supabase test db

begin;
select plan(20);

-- ── Setup ─────────────────────────────────────────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'service_role');

insert into organizations (id, name, slug) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'WO Fin Test Org', 'wo-fin-test-org'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'WO Fin Org B', 'wo-fin-org-b')
on conflict (id) do nothing;

-- Roles for financial org
insert into roles (id, name, description, organization_id, is_system) values
  ('a0000002-0000-0000-000b-000000000001', 'admin', 'Admin', 'dddddddd-dddd-dddd-dddd-dddddddddddd', true),
  ('a0000002-0000-0000-000b-000000000002', 'mechanic', 'Mechanic', 'dddddddd-dddd-dddd-dddd-dddddddddddd', true),
  ('a0000002-0000-0000-000b-000000000003', 'guest', 'Guest', 'dddddddd-dddd-dddd-dddd-dddddddddddd', true)
on conflict do nothing;

-- Customer and vehicle for work orders
insert into customers (id, organization_id, first_name, last_name, phone, created_by) values
  ('b0000000-0000-0000-0006-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'WO', 'Customer', '99990011', '00000000-0000-0000-0000-000000000010')
on conflict (id) do nothing;

insert into vehicles (id, organization_id, plate_number, make, model, created_by) values
  ('a0000001-0000-0000-0006-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ФИН0001', 'Toyota', 'Camry', '00000000-0000-0000-0000-000000000010')
on conflict (id) do nothing;

-- Work orders
insert into work_orders (id, organization_id, customer_id, vehicle_id, status, created_by) values
  ('d0000000-0000-0000-0006-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'b0000000-0000-0000-0006-000000000001', 'a0000001-0000-0000-0006-000000000001', 'New', '00000000-0000-0000-0000-000000000010')
on conflict (id) do nothing;

-- Invoices
insert into invoices (id, organization_id, work_order_id, total_amount, status) values
  ('e0000000-0000-0000-0006-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'd0000000-0000-0000-0006-000000000001', 150000, 'pending')
on conflict (id) do nothing;

-- Cash register session
insert into cash_register_sessions (id, organization_id, opened_at) values
  ('11000000-0000-0000-0006-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', now())
on conflict (id) do nothing;

-- Expenses
insert into expenses (id, organization_id, amount, category, description) values
  ('22000000-0000-0000-0006-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 25000, 'supplies', 'Office supplies')
on conflict (id) do nothing;

-- Org B data for cross-org tests
insert into customers (id, organization_id, first_name, last_name, phone, created_by) values
  ('b0000000-0000-0000-0006-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'OrgB', 'Cust', '99990022', '00000000-0000-0000-0000-000000000010')
on conflict (id) do nothing;

insert into vehicles (id, organization_id, plate_number, make, model, created_by) values
  ('a0000001-0000-0000-0006-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ОРБ0001', 'Honda', 'Accord', '00000000-0000-0000-0000-000000000010')
on conflict (id) do nothing;

insert into work_orders (id, organization_id, customer_id, vehicle_id, status, created_by) values
  ('d0000000-0000-0000-0006-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b0000000-0000-0000-0006-000000000002', 'a0000001-0000-0000-0006-000000000002', 'New', '00000000-0000-0000-0000-000000000010')
on conflict (id) do nothing;

-- Memberships
insert into organization_users (organization_id, user_id, role_id) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-000000000010', 'a0000002-0000-0000-000b-000000000001'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-000000000020', 'a0000002-0000-0000-000b-000000000002'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-000000000030', 'a0000002-0000-0000-000b-000000000003')
on conflict (organization_id, user_id) do nothing;

-- ── Test 1-5: Admin can CRUD work_orders ─────────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'authenticated');

select lives_ok(
  'select * from work_orders where organization_id = ''dddddddd-dddd-dddd-dddd-dddddddddddd'' limit 1',
  'Admin can read work_orders'
);

select lives_ok(
  $$update work_orders set status = 'Diagnosing' where id = 'd0000000-0000-0000-0006-000000000001'$$,
  'Admin can update work order status'
);

select lives_ok(
  $$update work_orders set status = 'New' where id = 'd0000000-0000-0000-0006-000000000001'$$,
  'Admin can reset work order status'
);

-- Admin can read invoices
select lives_ok(
  'select * from invoices where organization_id = ''dddddddd-dddd-dddd-dddd-dddddddddddd'' limit 1',
  'Admin can read invoices'
);

-- Admin can read cash_register_sessions
select lives_ok(
  'select * from cash_register_sessions where organization_id = ''dddddddd-dddd-dddd-dddd-dddddddddddd'' limit 1',
  'Admin can read cash_register_sessions'
);

-- ── Test 6-10: Mechanic work order access ────────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000020', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'authenticated');

select lives_ok(
  'select * from work_orders where organization_id = ''dddddddd-dddd-dddd-dddd-dddddddddddd'' limit 1',
  'Mechanic can read work_orders'
);

select lives_ok(
  $$update work_orders set status = 'In Progress' where id = 'd0000000-0000-0000-0006-000000000001'$$,
  'Mechanic can update work order status to In Progress'
);

select lives_ok(
  $$update work_orders set status = 'Completed' where id = 'd0000000-0000-0000-0006-000000000001'$$,
  'Mechanic can complete work order'
);

select lives_ok(
  $$update work_orders set status = 'New' where id = 'd0000000-0000-0000-0006-000000000001'$$,
  'Mechanic can reset work order for testing'
);

select throws_ok(
  $$delete from work_orders where id = 'd0000000-0000-0000-0006-000000000001'$$,
  42501,
  null,
  'Mechanic cannot delete work orders'
);

-- ── Test 11-12: Mechanic cannot access financial data ────────────
select throws_ok(
  $$insert into invoices (id, organization_id, work_order_id, total_amount, status)
    values ('e0000000-0000-0000-0006-0000000000f0', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'd0000000-0000-0000-0006-000000000001', 50000, 'pending')$$,
  42501,
  null,
  'Mechanic cannot create invoices'
);

-- ── Test 13-15: Guest read-only access ───────────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000030', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'authenticated');

select lives_ok(
  'select * from work_orders where organization_id = ''dddddddd-dddd-dddd-dddd-dddddddddddd'' limit 1',
  'Guest can read work_orders'
);

select throws_ok(
  $$update work_orders set status = 'Completed' where id = 'd0000000-0000-0000-0006-000000000001'$$,
  42501,
  null,
  'Guest cannot update work_orders'
);

select throws_ok(
  $$insert into invoices (id, organization_id, work_order_id, total_amount, status)
    values ('e0000000-0000-0000-0006-00000000ffff', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'd0000000-0000-0000-0006-000000000001', 10000, 'pending')$$,
  42501,
  null,
  'Guest cannot create invoices'
);

-- ── Test 16-17: Cross-org isolation ──────────────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'authenticated');

select is(
  (select count(*)::int from work_orders where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'OrgFin user cannot see OrgB work_orders'
);

select throws_ok(
  $$update work_orders set status = 'Cancelled' where id = 'd0000000-0000-0000-0006-000000000002'$$,
  42501,
  null,
  'OrgFin user cannot update OrgB work_orders'
);

-- ── Test 18-19: Anonymous blocked ────────────────────────────────
select tests.clear_auth();

select is(
  (select count(*)::int from work_orders where organization_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  0,
  'Anonymous user sees no work_orders'
);

select throws_ok(
  $$insert into work_orders (id, organization_id, customer_id, vehicle_id, status, created_by)
    values ('d0000000-0000-0000-0006-00000000ffff', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'b0000000-0000-0000-0006-000000000001', 'a0000001-0000-0000-0006-000000000001', 'New', '00000000-0000-0000-0000-000000000001')$$,
  42501,
  null,
  'Anonymous user cannot create work_orders'
);

-- ── Test 20: Admin can delete work_orders ────────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'authenticated');

select lives_ok(
  $$delete from work_orders where id = 'd0000000-0000-0000-0006-000000000001'$$,
  'Admin can delete work_orders'
);

select * from finish();
rollback;
