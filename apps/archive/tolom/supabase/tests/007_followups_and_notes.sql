-- RLS Test: Customer Followups, Notes, and Communications
-- Verifies org-scoped isolation for CRM-related tables.
--
-- Prerequisites:
--   1. pgtap extension enabled
--   2. Local Supabase running (supabase start)
--   3. Run: supabase test db
--
-- Tables tested:
--   - customer_followups: org-scoped with full CRUD policies
--   - customer_notes: org-scoped with full CRUD policies
--   - customer_communications: org-scoped with SELECT/INSERT/UPDATE/DELETE

begin;
select plan(20);

-- ── Setup: create test orgs and data ──────────────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'dddddddd-dddd-dddd-dddd-dddddddddd01', 'service_role');

insert into organizations (id, name, slug) values
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', 'FN Test Org A', 'fn-test-org-a'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd02', 'FN Test Org B', 'fn-test-org-b')
on conflict (id) do nothing;

-- Roles for org A
insert into roles (id, name, description, organization_id, is_system) values
  ('a0000002-0000-0000-000d-000000000001', 'admin', 'Admin', 'dddddddd-dddd-dddd-dddd-dddddddddd01', true)
on conflict do nothing;

-- Customers for FK references
insert into customers (id, organization_id, first_name, last_name, phone, created_by) values
  ('b0000000-0000-0000-000d-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddd01', 'FN', 'CustA', '99991111', '00000000-0000-0000-0000-000000000010'),
  ('b0000000-0000-0000-000d-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddd02', 'FN', 'CustB', '99992222', '00000000-0000-0000-0000-000000000010')
on conflict (id) do nothing;

-- Customer followups
insert into customer_followups (id, organization_id, customer_id, type, subject, due_at, status, created_by) values
  ('a000000d-0000-0000-000d-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddd01',
   'b0000000-0000-0000-000d-000000000001', 'call', 'Followup A1', now() + interval '1 day', 'pending', '00000000-0000-0000-0000-000000000010'),
  ('a000000d-0000-0000-000d-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddd01',
   'b0000000-0000-0000-000d-000000000001', 'email', 'Followup A2', now() + interval '2 days', 'pending', '00000000-0000-0000-0000-000000000010'),
  ('a000000d-0000-0000-000d-000000000010', 'dddddddd-dddd-dddd-dddd-dddddddddd02',
   'b0000000-0000-0000-000d-000000000002', 'call', 'Followup B1', now() + interval '1 day', 'pending', '00000000-0000-0000-0000-000000000010')
on conflict (id) do nothing;

-- Customer notes (created_by is NOT NULL)
insert into customer_notes (id, organization_id, customer_id, content, type, created_by) values
  ('c000000d-0000-0000-000d-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddd01',
   'b0000000-0000-0000-000d-000000000001', 'Note A1', 'general', '00000000-0000-0000-0000-000000000010'),
  ('c000000d-0000-0000-000d-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddd01',
   'b0000000-0000-0000-000d-000000000001', 'Note A2', 'follow_up', '00000000-0000-0000-0000-000000000010'),
  ('c000000d-0000-0000-000d-000000000010', 'dddddddd-dddd-dddd-dddd-dddddddddd02',
   'b0000000-0000-0000-000d-000000000002', 'Note B1', 'general', '00000000-0000-0000-0000-000000000010')
on conflict (id) do nothing;

-- Customer communications (direction is required)
insert into customer_communications (id, organization_id, customer_id, type, direction, subject, content) values
  ('e000000d-0000-0000-000d-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddd01',
   'b0000000-0000-0000-000d-000000000001', 'email', 'outbound', 'Subject A1', 'Content A1'),
  ('e000000d-0000-0000-000d-000000000010', 'dddddddd-dddd-dddd-dddd-dddddddddd02',
   'b0000000-0000-0000-000d-000000000002', 'call', 'inbound', 'Subject B1', 'Content B1')
on conflict (id) do nothing;

-- Membership for user 010 in org A
insert into organization_users (organization_id, user_id, role_id) values
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', '00000000-0000-0000-0000-000000000010',
   'a0000002-0000-0000-000d-000000000001')
on conflict (organization_id, user_id) do nothing;

-- ── Test 1-3: Customer followups — org A access ──────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'dddddddd-dddd-dddd-dddd-dddddddddd01', 'authenticated');

select is(
  (select count(*)::int from customer_followups where organization_id = 'dddddddd-dddd-dddd-dddd-dddddddddd01'),
  2,
  'OrgA user can see their 2 followups'
);

select lives_ok(
  $$insert into customer_followups (id, organization_id, customer_id, type, subject, due_at, status)
    values ('a000000d-0000-0000-000d-00000000fff0', 'dddddddd-dddd-dddd-dddd-dddddddddd01',
            'b0000000-0000-0000-000d-000000000001', 'call', 'New Followup', now() + interval '1 day', 'pending')$$,
  'OrgA user can create followups in their org'
);
delete from customer_followups where id = 'a000000d-0000-0000-000d-00000000fff0';

select lives_ok(
  $$update customer_followups set status = 'completed' where id = 'a000000d-0000-0000-000d-000000000001'$$,
  'OrgA user can update their followups'
);

-- ── Test 4-6: Customer followups — cross-org and anon ────────────

select is(
  (select count(*)::int from customer_followups where organization_id = 'dddddddd-dddd-dddd-dddd-dddddddddd02'),
  0,
  'OrgA user CANNOT see OrgB followups'
);

select throws_ok(
  $$update customer_followups set status = 'completed' where id = 'a000000d-0000-0000-000d-000000000010'$$,
  42501,
  null,
  'OrgA user cannot update OrgB followup'
);

select tests.clear_auth();
select is(
  (select count(*)::int from customer_followups where organization_id = 'dddddddd-dddd-dddd-dddd-dddddddddd01'),
  0,
  'Anonymous user sees no followups'
);

-- ── Test 7-9: Customer notes — org A access ──────────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'dddddddd-dddd-dddd-dddd-dddddddddd01', 'authenticated');

select is(
  (select count(*)::int from customer_notes where organization_id = 'dddddddd-dddd-dddd-dddd-dddddddddd01'),
  2,
  'OrgA user can see their 2 notes'
);

select lives_ok(
  $$insert into customer_notes (id, organization_id, customer_id, content, type, created_by)
    values ('c000000d-0000-0000-000d-00000000fff0', 'dddddddd-dddd-dddd-dddd-dddddddddd01',
            'b0000000-0000-0000-000d-000000000001', 'New Note', 'general', '00000000-0000-0000-0000-000000000010')$$,
  'OrgA user can create notes in their org'
);
delete from customer_notes where id = 'c000000d-0000-0000-000d-00000000fff0';

select lives_ok(
  $$update customer_notes set content = 'Updated note' where id = 'c000000d-0000-0000-000d-000000000001'$$,
  'OrgA user can update their notes'
);

-- ── Test 10-12: Customer notes — cross-org and anon ──────────────

select is(
  (select count(*)::int from customer_notes where organization_id = 'dddddddd-dddd-dddd-dddd-dddddddddd02'),
  0,
  'OrgA user CANNOT see OrgB notes'
);

select throws_ok(
  $$update customer_notes set content = 'Hacked' where id = 'c000000d-0000-0000-000d-000000000010'$$,
  42501,
  null,
  'OrgA user cannot update OrgB note'
);

select tests.clear_auth();
select is(
  (select count(*)::int from customer_notes where organization_id = 'dddddddd-dddd-dddd-dddd-dddddddddd01'),
  0,
  'Anonymous user sees no notes'
);

-- ── Test 13-15: Customer communications — org A access ───────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'dddddddd-dddd-dddd-dddd-dddddddddd01', 'authenticated');

select is(
  (select count(*)::int from customer_communications where organization_id = 'dddddddd-dddd-dddd-dddd-dddddddddd01'),
  1,
  'OrgA user can see their communication'
);

select lives_ok(
  $$insert into customer_communications (id, organization_id, customer_id, type, direction, subject, content)
    values ('e000000d-0000-0000-000d-00000000fff0', 'dddddddd-dddd-dddd-dddd-dddddddddd01',
            'b0000000-0000-0000-000d-000000000001', 'email', 'outbound', 'New Subject', 'New Content')$$,
  'OrgA user can create communications in their org'
);
delete from customer_communications where id = 'e000000d-0000-0000-000d-00000000fff0';

select lives_ok(
  $$update customer_communications set subject = 'Updated' where id = 'e000000d-0000-0000-000d-000000000001'$$,
  'OrgA user can update their communications'
);

-- ── Test 16-18: Customer communications — cross-org and anon ─────

select is(
  (select count(*)::int from customer_communications where organization_id = 'dddddddd-dddd-dddd-dddd-dddddddddd02'),
  0,
  'OrgA user CANNOT see OrgB communications'
);

select throws_ok(
  $$update customer_communications set subject = 'Hacked' where id = 'e000000d-0000-0000-000d-000000000010'$$,
  42501,
  null,
  'OrgA user cannot update OrgB communication'
);

select tests.clear_auth();
select is(
  (select count(*)::int from customer_communications where organization_id = 'dddddddd-dddd-dddd-dddd-dddddddddd01'),
  0,
  'Anonymous user sees no communications'
);

-- ── Test 19: OrgA user can delete their followup ─────────────────
select tests.set_auth('00000000-0000-0000-0000-000000000010', 'dddddddd-dddd-dddd-dddd-dddddddddd01', 'authenticated');

select lives_ok(
  $$delete from customer_followups where id = 'a000000d-0000-0000-000d-000000000002'$$,
  'OrgA user can delete their followup'
);

-- ── Test 20: Organ user can delete their communication ──────────
select lives_ok(
  $$delete from customer_communications where id = 'e000000d-0000-0000-000d-000000000001'$$,
  'OrgA user can delete their communication'
);

select * from finish();
rollback;
