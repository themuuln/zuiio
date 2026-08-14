-- Inventory extras: expiry tracking, warranty, multi-unit, cost center
-- TOLOM auto repair SaaS platform
-- Created: 2026-07-31

-- ============================================================
-- 1. Part Batches (for expiry date tracking)
-- ============================================================
-- Tracks individual batches of parts received, with expiry dates
-- for items like oil, chemicals, tires that have shelf life.
create table part_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  part_id uuid not null references parts_catalog(id),
  batch_number text,
  expiry_date date,
  quantity numeric(12,2) not null default 0,
  received_date date not null default current_date,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table part_batches enable row level security;

create policy "org_members_select_part_batches"
  on part_batches for select
  using (organization_id = get_user_organization_id());

create policy "org_members_insert_part_batches"
  on part_batches for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "org_members_update_part_batches"
  on part_batches for update
  using (organization_id = get_user_organization_id());

create policy "org_members_delete_part_batches"
  on part_batches for delete
  using (organization_id = get_user_organization_id());

create index idx_part_batches_part on part_batches(part_id);
create index idx_part_batches_expiry on part_batches(organization_id, expiry_date) where expiry_date is not null;

-- ============================================================
-- 2. Warranty tracking on work_order_parts
-- ============================================================
alter table work_order_parts
  add column if not exists warranty_months int,
  add column if not exists warranty_expires_at timestamptz,
  add column if not exists warranty_notes text;

-- Also add warranty to parts_catalog for default warranty periods
alter table parts_catalog
  add column if not exists default_warranty_months int;

-- ============================================================
-- 3. Multi-unit support seeds
-- ============================================================
-- Adds conversion factors to parts_catalog for alternate units
alter table parts_catalog
  add column if not exists alt_unit text,
  add column if not exists alt_unit_conversion numeric(12,4),
  add column if not exists alt_unit_label text;

-- ============================================================
-- 4. Cost center on expenses
-- ============================================================
-- Allows allocating expenses to specific cost centers/departments
alter table expenses
  add column if not exists cost_center text;

create index idx_expenses_cost_center on expenses(organization_id, cost_center) where cost_center is not null;
