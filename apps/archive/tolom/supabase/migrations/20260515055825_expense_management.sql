-- ============================================================
-- Migration: Expense & Cost Management Module
-- Tables: expense_categories, expenses
-- RLS policies + indexes + triggers
-- ============================================================

-- ------------------------------------------------------------
-- Helper: get_current_org_id — used by RLS policies
-- ------------------------------------------------------------
create or replace function public.get_current_org_id()
returns uuid
language sql
stable
security definer
as $$
  select organization_id
  from public.organization_users
  where user_id = auth.uid()
  limit 1;
$$;

-- ------------------------------------------------------------
-- expense_categories: Categorize expenses (rent, utilities, etc.)
-- ------------------------------------------------------------
create table if not exists expense_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  description text,
  color text not null default '#6b7280',
  icon text not null default 'receipt',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ------------------------------------------------------------
-- expenses: Individual expense records
-- ------------------------------------------------------------
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  branch_id uuid references branches(id),
  category_id uuid references expense_categories(id),
  vendor_name text,
  description text not null,
  amount numeric(12,2) not null,
  tax_amount numeric(12,2) not null default 0,
  expense_date date not null default current_date,
  due_date date,
  paid_at timestamptz,
  payment_method text,
  reference_number text,
  receipt_url text,
  notes text,
  is_recurring boolean not null default false,
  recurrence_interval text check (recurrence_interval in ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
create index if not exists idx_expense_categories_org on expense_categories(organization_id) where deleted_at is null;
create index if not exists idx_expenses_org on expenses(organization_id) where deleted_at is null;
create index if not exists idx_expenses_category on expenses(category_id) where deleted_at is null;
create index if not exists idx_expenses_date on expenses(organization_id, expense_date) where deleted_at is null;
create index if not exists idx_expenses_vendor on expenses(organization_id, vendor_name) where deleted_at is null;
create index if not exists idx_expenses_paid on expenses(organization_id, paid_at) where deleted_at is null;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table expense_categories enable row level security;
alter table expenses enable row level security;

create policy "Users can view expense categories in their org"
  on expense_categories for select
  using (organization_id = get_current_org_id());

create policy "Users can create expense categories in their org"
  on expense_categories for insert
  with check (organization_id = get_current_org_id());

create policy "Users can update expense categories in their org"
  on expense_categories for update
  using (organization_id = get_current_org_id());

create policy "Users can delete expense categories in their org"
  on expense_categories for delete
  using (organization_id = get_current_org_id());

create policy "Users can view expenses in their org"
  on expenses for select
  using (organization_id = get_current_org_id());

create policy "Users can create expenses in their org"
  on expenses for insert
  with check (organization_id = get_current_org_id());

create policy "Users can update expenses in their org"
  on expenses for update
  using (organization_id = get_current_org_id());

create policy "Users can delete expenses in their org"
  on expenses for delete
  using (organization_id = get_current_org_id());

-- ------------------------------------------------------------
-- Updated_at triggers
-- ------------------------------------------------------------
create extension if not exists moddatetime schema extensions;

create trigger handle_expense_categories_updated_at
  before update on expense_categories
  for each row execute function moddatetime();

create trigger handle_expenses_updated_at
  before update on expenses
  for each row execute function moddatetime();
