-- ============================================================
-- Migration 00020: Fix ALL schema drifts between DB & codebase
-- ============================================================
-- Discovered during schema audit:
--   1. invoices, invoice_items, invoice_payments tables missing from migrations
--   2. work_order_status_history: new_status→status, changed_by→created_by
--   3. work_order_parts missing part_id column
--   4. parts_catalog missing purchase_price & last_purchase_price columns
--   5. get_invoice_by_token RPC references old share_token column
-- Created: 2026-05-13
-- ============================================================

-- ============================================================
-- PART A: Create missing invoicing tables
-- ============================================================

-- ----------------------------------------------------------
-- invoices: Main invoice record
-- ----------------------------------------------------------
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  branch_id uuid references branches(id),
  work_order_id uuid references work_orders(id),
  customer_id uuid references customers(id),
  vehicle_id uuid references vehicles(id),
  invoice_number text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),
  subtotal numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,
  issued_at timestamp with time zone not null default now(),
  due_at timestamp with time zone,
  paid_at timestamp with time zone,
  customer_name text,
  customer_phone text,
  customer_email text,
  customer_address text,
  vehicle_plate text,
  vehicle_details text,
  public_token text not null default gen_random_uuid()::text,
  email_sent_at timestamp with time zone,
  notes text,
  terms text,
  footer text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- ----------------------------------------------------------
-- invoice_items: Line items on an invoice
-- ----------------------------------------------------------
create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  item_type text not null check (item_type in ('service', 'part')),
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now()
);

-- ----------------------------------------------------------
-- invoice_payments: Payments recorded against an invoice
-- ----------------------------------------------------------
create table if not exists invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric(12,2) not null,
  method text not null default 'cash',
  reference text,
  notes text,
  paid_at timestamp with time zone not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now()
);

-- ============================================================
-- PART B: Fix work_order_status_history column names
--   Code writes: status, created_by
--   SQL has:     new_status, changed_by
-- ============================================================

do $$
begin
  -- Rename new_status → status
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'work_order_status_history'
    and column_name = 'new_status'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'work_order_status_history'
    and column_name = 'status'
  ) then
    alter table public.work_order_status_history rename column new_status to status;
  end if;

  -- Rename changed_by → created_by
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'work_order_status_history'
    and column_name = 'changed_by'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'work_order_status_history'
    and column_name = 'created_by'
  ) then
    alter table public.work_order_status_history rename column changed_by to created_by;
  end if;
end $$;

-- ============================================================
-- PART C: Add missing part_id to work_order_parts
--   Code writes part_id (FK to parts_catalog) but column never created
-- ============================================================

alter table work_order_parts
  add column if not exists part_id uuid references parts_catalog(id);

-- ============================================================
-- PART D: Add missing cost columns to parts_catalog
--   Code: purchase_price, last_purchase_price
-- ============================================================

alter table parts_catalog
  add column if not exists purchase_price numeric(12,2);

alter table parts_catalog
  add column if not exists last_purchase_price numeric(12,2);

-- ============================================================
-- PART E: Update get_invoice_by_token RPC
--   RPC used share_token but types/code use public_token
-- ============================================================

create or replace function public.get_invoice_by_token(p_token text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  result json;
begin
  select json_build_object(
    'id', i.id,
    'invoice_number', i.invoice_number,
    'status', i.status,
    'subtotal', i.subtotal,
    'discount_total', i.discount_total,
    'total', i.total,
    'notes', i.notes,
    'customer_name', c.full_name,
    'customer_phone', c.phone,
    'customer_email', c.email,
    'organization_name', o.name,
    'organization_logo', o.logo_url,
    'items', coalesce(
      (select json_agg(json_build_object(
        'description', li.description,
        'quantity', li.quantity,
        'unit_price', li.unit_price,
        'total', li.total_price
      )) from invoice_items li where li.invoice_id = i.id),
      '[]'::json
    ),
    'payments', coalesce(
      (select json_agg(json_build_object(
        'amount', lp.amount,
        'method', lp.method,
        'paid_at', lp.paid_at
      )) from invoice_payments lp where lp.invoice_id = i.id),
      '[]'::json
    ),
    'created_at', i.created_at
  ) into result
  from invoices i
  join customers c on c.id = i.customer_id
  join organizations o on o.id = i.organization_id
  where i.public_token = p_token;
  return result;
end;
$$;

-- ============================================================
-- PART F: RLS — Enable on all three new tables
-- ============================================================

alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table invoice_payments enable row level security;

-- ----------------------------------------------------------
-- invoices RLS
-- ----------------------------------------------------------

drop policy if exists "Users can view invoices in their org" on invoices;
create policy "Users can view invoices in their org"
  on invoices for select
  using (organization_id = get_user_organization_id());

drop policy if exists "Users can insert invoices in their org" on invoices;
create policy "Users can insert invoices in their org"
  on invoices for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

drop policy if exists "Users can update invoices in their org" on invoices;
create policy "Users can update invoices in their org"
  on invoices for update
  using (organization_id = get_user_organization_id());

drop policy if exists "Users can soft-delete invoices in their org" on invoices;
create policy "Users can soft-delete invoices in their org"
  on invoices for delete
  using (organization_id = get_user_organization_id());

-- ----------------------------------------------------------
-- invoice_items RLS (scoped via invoice's org)
-- ----------------------------------------------------------

drop policy if exists "Users can view invoice_items in their org" on invoice_items;
create policy "Users can view invoice_items in their org"
  on invoice_items for select
  using (
    exists (
      select 1 from invoices
      where invoices.id = invoice_items.invoice_id
      and invoices.organization_id = get_user_organization_id()
    )
  );

drop policy if exists "Users can insert invoice_items in their org" on invoice_items;
create policy "Users can insert invoice_items in their org"
  on invoice_items for insert
  with check (
    exists (
      select 1 from invoices
      where invoices.id = invoice_items.invoice_id
      and invoices.organization_id = get_user_organization_id()
    )
  );

drop policy if exists "Users can update invoice_items in their org" on invoice_items;
create policy "Users can update invoice_items in their org"
  on invoice_items for update
  using (
    exists (
      select 1 from invoices
      where invoices.id = invoice_items.invoice_id
      and invoices.organization_id = get_user_organization_id()
    )
  );

drop policy if exists "Users can delete invoice_items in their org" on invoice_items;
create policy "Users can delete invoice_items in their org"
  on invoice_items for delete
  using (
    exists (
      select 1 from invoices
      where invoices.id = invoice_items.invoice_id
      and invoices.organization_id = get_user_organization_id()
    )
  );

-- ----------------------------------------------------------
-- invoice_payments RLS (scoped via invoice's org)
-- ----------------------------------------------------------

drop policy if exists "Users can view invoice_payments in their org" on invoice_payments;
create policy "Users can view invoice_payments in their org"
  on invoice_payments for select
  using (
    exists (
      select 1 from invoices
      where invoices.id = invoice_payments.invoice_id
      and invoices.organization_id = get_user_organization_id()
    )
  );

drop policy if exists "Users can insert invoice_payments in their org" on invoice_payments;
create policy "Users can insert invoice_payments in their org"
  on invoice_payments for insert
  with check (
    exists (
      select 1 from invoices
      where invoices.id = invoice_payments.invoice_id
      and invoices.organization_id = get_user_organization_id()
    )
  );

drop policy if exists "Users can update invoice_payments in their org" on invoice_payments;
create policy "Users can update invoice_payments in their org"
  on invoice_payments for update
  using (
    exists (
      select 1 from invoices
      where invoices.id = invoice_payments.invoice_id
      and invoices.organization_id = get_user_organization_id()
    )
  );

drop policy if exists "Users can delete invoice_payments in their org" on invoice_payments;
create policy "Users can delete invoice_payments in their org"
  on invoice_payments for delete
  using (
    exists (
      select 1 from invoices
      where invoices.id = invoice_payments.invoice_id
      and invoices.organization_id = get_user_organization_id()
    )
  );

-- ============================================================
-- PART G: Indexes for performance
-- ============================================================

-- invoices
create index if not exists idx_invoices_org on invoices(organization_id);
create index if not exists idx_invoices_work_order on invoices(work_order_id);
create index if not exists idx_invoices_status on invoices(organization_id, status) where deleted_at is null;
create index if not exists idx_invoices_org_created on invoices(organization_id, created_at desc) where deleted_at is null;
create unique index if not exists idx_invoices_public_token on invoices(public_token);
create index if not exists idx_invoices_invoice_number on invoices(organization_id, invoice_number);

-- invoice_items
create index if not exists idx_invoice_items_invoice on invoice_items(invoice_id);

-- invoice_payments
create index if not exists idx_invoice_payments_invoice on invoice_payments(invoice_id);

-- parts_catalog new columns
create index if not exists idx_parts_catalog_purchase_price
  on parts_catalog(purchase_price) where purchase_price is not null;

-- ============================================================
-- PART H: Trigger for auto-updating invoices.updated_at
-- ============================================================

create trigger set_updated_at_invoices
  before update on invoices
  for each row execute function update_updated_at_column();
