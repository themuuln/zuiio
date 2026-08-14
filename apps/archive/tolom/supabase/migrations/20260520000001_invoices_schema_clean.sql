do $$
begin
  if not exists (select 1 from pg_type where typname = 'invoice_status') then
    create type invoice_status as enum ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled');
  end if;
end $$;

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  branch_id uuid references branches(id),
  work_order_id uuid references work_orders(id),
  customer_id uuid references customers(id),
  vehicle_id uuid references vehicles(id),
  invoice_number text not null,
  status invoice_status not null default 'draft',
  subtotal numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  paid_at timestamptz,
  customer_name text,
  customer_phone text,
  customer_email text,
  customer_address text,
  vehicle_plate text,
  vehicle_details text,
  public_token text default encode(gen_random_bytes(24), 'hex'),
  email_sent_at timestamptz,
  notes text,
  terms text default 'Payment due upon receipt.',
  footer text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

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
  created_at timestamptz not null default now()
);

create table if not exists invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  organization_id uuid references organizations(id),
  amount numeric(12,2) not null,
  method text not null default 'cash',
  reference text,
  notes text,
  paid_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table invoice_payments add column if not exists organization_id uuid references organizations(id);

alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table invoice_payments enable row level security;

create index if not exists idx_invoices_org on invoices(organization_id);
create index if not exists idx_invoices_public_token on invoices(public_token);
create index if not exists idx_invoice_items_invoice on invoice_items(invoice_id);
create index if not exists idx_invoice_payments_invoice on invoice_payments(invoice_id);
