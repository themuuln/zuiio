-- Fix column name drift between TypeScript types and SQL schema
-- Add missing columns to match service code expectations
-- Create payments table for manual payment recording
-- Created: 2026-05-12

-- ============================================================
-- 1. FIX: work_order_services — rename columns, add missing
-- ============================================================

-- Code expects: service_name, unit_price, discount_amount, discount_percentage
-- SQL has: name, base_price, discount_amount_mnt, discount_percent

alter table work_order_services rename column name to service_name;
alter table work_order_services rename column base_price to unit_price;
alter table work_order_services rename column discount_amount_mnt to discount_amount;
alter table work_order_services rename column discount_percent to discount_percentage;

-- Add missing columns used by service layer
alter table work_order_services add column organization_id uuid references organizations(id);
alter table work_order_services add column mechanic_id uuid references auth.users(id);
alter table work_order_services add column last_sold_price numeric(12,2);

-- Update RLS policies to use new column name
drop policy if exists "Users can view work_order_services in their org" on work_order_services;
create policy "Users can view work_order_services in their org"
  on work_order_services for select
  using (
    exists (
      select 1 from work_orders
      where work_orders.id = work_order_services.work_order_id
      and work_orders.organization_id = get_user_organization_id()
    )
  );

drop policy if exists "Users can insert work_order_services in their org" on work_order_services;
create policy "Users can insert work_order_services in their org"
  on work_order_services for insert
  with check (
    exists (
      select 1 from work_orders
      where work_orders.id = work_order_services.work_order_id
      and work_orders.organization_id = get_user_organization_id()
    )
    and created_by = auth.uid()
  );

drop policy if exists "Users can update work_order_services in their org" on work_order_services;
create policy "Users can update work_order_services in their org"
  on work_order_services for update
  using (
    exists (
      select 1 from work_orders
      where work_orders.id = work_order_services.work_order_id
      and work_orders.organization_id = get_user_organization_id()
    )
  );

drop policy if exists "Users can delete work_order_services in their org" on work_order_services;
create policy "Users can delete work_order_services in their org"
  on work_order_services for delete
  using (
    exists (
      select 1 from work_orders
      where work_orders.id = work_order_services.work_order_id
      and work_orders.organization_id = get_user_organization_id()
    )
  );

-- ============================================================
-- 2. FIX: work_order_parts — add missing columns
-- ============================================================

-- Code expects: discount_amount, discount_percentage, last_sold_price, organization_id
-- SQL has: none of these — discount was only applied to final_price

alter table work_order_parts add column organization_id uuid references organizations(id);
alter table work_order_parts add column discount_amount numeric(12,2) default 0;
alter table work_order_parts add column discount_percentage numeric(5,2) default 0;
alter table work_order_parts add column last_sold_price numeric(12,2);

-- Update RLS to match new column semantics (already works via work_order join, but adding organization_id filter)
drop policy if exists "Users can view work_order_parts in their org" on work_order_parts;
create policy "Users can view work_order_parts in their org"
  on work_order_parts for select
  using (
    exists (
      select 1 from work_orders
      where work_orders.id = work_order_parts.work_order_id
      and work_orders.organization_id = get_user_organization_id()
    )
  );

drop policy if exists "Users can insert work_order_parts in their org" on work_order_parts;
create policy "Users can insert work_order_parts in their org"
  on work_order_parts for insert
  with check (
    exists (
      select 1 from work_orders
      where work_orders.id = work_order_parts.work_order_id
      and work_orders.organization_id = get_user_organization_id()
    )
    and created_by = auth.uid()
  );

drop policy if exists "Users can update work_order_parts in their org" on work_order_parts;
create policy "Users can update work_order_parts in their org"
  on work_order_parts for update
  using (
    exists (
      select 1 from work_orders
      where work_orders.id = work_order_parts.work_order_id
      and work_orders.organization_id = get_user_organization_id()
    )
  );

drop policy if exists "Users can delete work_order_parts in their org" on work_order_parts;
create policy "Users can delete work_order_parts in their org"
  on work_order_parts for delete
  using (
    exists (
      select 1 from work_orders
      where work_orders.id = work_order_parts.work_order_id
      and work_orders.organization_id = get_user_organization_id()
    )
  );

-- ============================================================
-- 3. FIX: service_price_history — rename columns
-- ============================================================

-- Code expects: unit_price, discount_amount, discount_percentage, service_name
-- SQL has: base_price, discount_amount_mnt, discount_percent

alter table service_price_history rename column base_price to unit_price;
alter table service_price_history rename column discount_amount_mnt to discount_amount;
alter table service_price_history rename column discount_percent to discount_percentage;
alter table service_price_history add column service_name text;
alter table service_price_history add column vehicle_id uuid references vehicles(id);
alter table service_price_history add column work_order_service_id uuid references work_order_services(id);

-- ============================================================
-- 4. FIX: part_price_history — add discount columns
-- ============================================================

-- Code expects: discount_amount, discount_percentage
-- SQL has: neither

alter table part_price_history add column discount_amount numeric(12,2) default 0;
alter table part_price_history add column discount_percentage numeric(5,2) default 0;
alter table part_price_history add column vehicle_id uuid references vehicles(id);
alter table part_price_history add column work_order_part_id uuid references work_order_parts(id);

-- ============================================================
-- 5. FIX: work_orders — add financial columns
-- ============================================================

-- Code types expect: subtotal, discount_total, total
-- SQL has: none of these

alter table work_orders add column subtotal numeric(12,2) not null default 0;
alter table work_orders add column discount_total numeric(12,2) not null default 0;
alter table work_orders add column total numeric(12,2) not null default 0;

-- ============================================================
-- 6. CREATE: payments table (manual entry, simple)
-- ============================================================

create table payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  branch_id uuid references branches(id),
  work_order_id uuid references work_orders(id),
  amount numeric(12,2) not null,
  payment_method text not null check (payment_method in ('cash', 'card', 'internet_bank')),
  reference text,
  notes text,
  paid_at timestamp with time zone not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- Enable RLS
alter table payments enable row level security;

-- RLS policies for payments
create policy "Users can view payments in their org"
  on payments for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert payments in their org"
  on payments for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update payments in their org"
  on payments for update
  using (organization_id = get_user_organization_id());

create policy "Users can delete payments in their org"
  on payments for delete
  using (organization_id = get_user_organization_id());

-- Indexes for payments
create index idx_payments_org on payments(organization_id);
create index idx_payments_work_order on payments(work_order_id);
create index idx_payments_paid_at on payments(organization_id, paid_at desc);
create index idx_payments_method on payments(organization_id, payment_method);

-- ============================================================
-- 7. Rebuild affected indexes (column renames invalidate them)
-- ============================================================

drop index if exists idx_work_order_services_work_order_id;
create index idx_work_order_services_work_order_id on work_order_services(work_order_id);

drop index if exists idx_service_price_history_service;
create index idx_service_price_history_service on service_price_history(service_catalog_id);
drop index if exists idx_service_price_history_vehicle;
create index idx_service_price_history_vehicle on service_price_history(vehicle_make, vehicle_model);
drop index if exists idx_service_price_history_lookup;
create index idx_service_price_history_lookup on service_price_history(organization_id, service_catalog_id, vehicle_make, vehicle_model);
drop index if exists idx_service_price_history_work_order;
create index idx_service_price_history_work_order on service_price_history(work_order_id);

drop index if exists idx_work_order_parts_work_order_id;
create index idx_work_order_parts_work_order_id on work_order_parts(work_order_id);

drop index if exists idx_part_price_history_vehicle;
create index idx_part_price_history_vehicle on part_price_history(vehicle_make, vehicle_model);
drop index if exists idx_part_price_history_lookup;
create index idx_part_price_history_lookup on part_price_history(organization_id, part_name, vehicle_make, vehicle_model);
drop index if exists idx_part_price_history_work_order;
create index idx_part_price_history_work_order on part_price_history(work_order_id);
