-- zim — eSIM reseller initial schema
-- Money: bigint integer MNT; numeric(10,4) USD; numeric(12,4) FX.

-- ── regions ──────────────────────────────────────────────────────

create table regions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_en text not null,
  name_mn text not null,
  kind text not null check (kind in ('country', 'regional', 'global')),
  country_code text,
  sort_order int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── packages (synced from provider catalog) ──────────────────────

create table packages (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_package_id text not null,
  region_id uuid not null references regions(id),
  name text not null,
  data_mb int,
  is_unlimited boolean not null default false,
  validity_days int not null,
  coverage_countries text[] not null default '{}',
  cost_usd numeric(10, 4) not null,
  provider_meta jsonb not null default '{}',
  is_enabled boolean not null default false,
  is_archived boolean not null default false,
  needs_repricing boolean not null default false,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_package_id)
);

create index packages_region_idx on packages(region_id) where is_enabled and not is_archived;

-- ── fx rates (append-only; latest row wins) ──────────────────────

create table fx_rates (
  id uuid primary key default gen_random_uuid(),
  pair text not null default 'USD_MNT',
  rate numeric(12, 4) not null check (rate > 0),
  source text not null default 'manual' check (source in ('manual', 'auto')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index fx_rates_latest_idx on fx_rates(pair, created_at desc);

-- ── pricing rules ────────────────────────────────────────────────

create table pricing_rules (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('global', 'region', 'package')),
  region_id uuid references regions(id),
  package_id uuid references packages(id),
  markup_percent numeric(6, 2) not null check (markup_percent >= 0),
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  check (
    (scope = 'global' and region_id is null and package_id is null)
    or (scope = 'region' and region_id is not null and package_id is null)
    or (scope = 'package' and package_id is not null)
  )
);

create unique index one_active_global_rule on pricing_rules (scope) where scope = 'global' and is_active;
create unique index one_active_region_rule on pricing_rules (region_id) where scope = 'region' and is_active;
create unique index one_active_package_rule on pricing_rules (package_id) where scope = 'package' and is_active;

-- ── app settings ─────────────────────────────────────────────────

create table app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ── customers (guest-first) ──────────────────────────────────────

create table customers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  phone text not null,
  auth_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (email, phone)
);

create index customers_auth_idx on customers(auth_user_id) where auth_user_id is not null;

-- ── orders ───────────────────────────────────────────────────────

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null,
  customer_id uuid not null references customers(id),
  email text not null,
  phone text not null,
  locale text not null default 'mn',
  status text not null default 'pending_payment' check (status in (
    'pending_payment', 'paid', 'provisioning', 'delivered',
    'partially_failed', 'failed', 'expired', 'cancelled', 'refunded'
  )),
  total_mnt bigint not null check (total_mnt >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_status_idx on orders(status);
create index orders_customer_idx on orders(customer_id);

-- ── order items (pricing snapshot at purchase) ───────────────────

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  package_id uuid not null references packages(id),
  quantity int not null default 1 check (quantity > 0),
  package_name text not null,
  cost_usd numeric(10, 4) not null,
  fx_rate numeric(12, 4) not null,
  fx_rate_id uuid references fx_rates(id),
  markup_percent numeric(6, 2) not null,
  pricing_rule_id uuid references pricing_rules(id),
  min_margin_applied boolean not null default false,
  unit_retail_mnt bigint not null,
  unit_cost_mnt bigint not null
);

create index order_items_order_idx on order_items(order_id);

-- ── esims ────────────────────────────────────────────────────────

create table esims (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items(id),
  order_id uuid not null references orders(id),
  provider text not null,
  provider_esim_id text,
  provider_order_id text,
  iccid text,
  lpa_string text,
  activation_code text,
  smdp_address text,
  qr_payload text,
  status text not null default 'pending' check (status in (
    'pending', 'provisioning', 'delivered', 'activated', 'expired', 'failed', 'refunded'
  )),
  provider_status_raw jsonb,
  delivered_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index esims_order_idx on esims(order_id);
create index esims_provider_order_idx on esims(provider_order_id) where provider_order_id is not null;

-- ── payments (QPay) ──────────────────────────────────────────────

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  provider text not null default 'qpay',
  invoice_id text unique,
  sender_invoice_no text unique not null,
  amount_mnt bigint not null check (amount_mnt >= 0),
  status text not null default 'created' check (status in (
    'created', 'paid', 'failed', 'expired', 'refunded'
  )),
  qpay_payment_id text,
  paid_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now()
);

create index payments_order_idx on payments(order_id);

-- ── provisioning retry queue ─────────────────────────────────────

create table provisioning_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  esim_id uuid references esims(id),
  status text not null default 'queued' check (status in (
    'queued', 'running', 'succeeded', 'failed_permanent'
  )),
  attempts int not null default 0,
  max_attempts int not null default 5,
  next_retry_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now()
);

create index provisioning_jobs_due_idx on provisioning_jobs(next_retry_at) where status = 'queued';

-- ── idempotent provider webhook ingestion ────────────────────────

create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

-- ── admins ───────────────────────────────────────────────────────

create table admin_users (
  user_id uuid primary key references auth.users(id),
  role text not null default 'admin' check (role in ('admin', 'owner')),
  created_at timestamptz not null default now()
);

create or replace function is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from admin_users where user_id = auth.uid())
$$;

-- ── updated_at triggers ──────────────────────────────────────────

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_updated_at before update on orders
  for each row execute function set_updated_at();
create trigger esims_updated_at before update on esims
  for each row execute function set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────

alter table regions enable row level security;
alter table packages enable row level security;
alter table fx_rates enable row level security;
alter table pricing_rules enable row level security;
alter table app_settings enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table esims enable row level security;
alter table payments enable row level security;
alter table provisioning_jobs enable row level security;
alter table webhook_events enable row level security;
alter table admin_users enable row level security;

-- Public catalog: regions only. Packages have NO anon policy —
-- cost_usd is competitive intelligence; catalog reads go through
-- the service-role server client which returns display-safe DTOs.
create policy regions_public_read on regions
  for select using (is_active);

-- Admin full access
create policy packages_admin_all on packages
  for all using (is_admin()) with check (is_admin());
create policy regions_admin_all on regions
  for all using (is_admin()) with check (is_admin());
create policy fx_rates_admin_all on fx_rates
  for all using (is_admin()) with check (is_admin());
create policy pricing_rules_admin_all on pricing_rules
  for all using (is_admin()) with check (is_admin());
create policy app_settings_admin_all on app_settings
  for all using (is_admin()) with check (is_admin());
create policy customers_admin_all on customers
  for all using (is_admin()) with check (is_admin());
create policy orders_admin_all on orders
  for all using (is_admin()) with check (is_admin());
create policy order_items_admin_all on order_items
  for all using (is_admin()) with check (is_admin());
create policy esims_admin_all on esims
  for all using (is_admin()) with check (is_admin());
create policy payments_admin_all on payments
  for all using (is_admin()) with check (is_admin());
create policy provisioning_jobs_admin_all on provisioning_jobs
  for all using (is_admin()) with check (is_admin());
create policy webhook_events_admin_all on webhook_events
  for all using (is_admin()) with check (is_admin());
create policy admin_users_admin_read on admin_users
  for select using (is_admin());

-- Authenticated customers can read their own orders/esims
create policy customers_own_read on customers
  for select using (auth_user_id = auth.uid());
create policy orders_own_read on orders
  for select using (
    exists (
      select 1 from customers c
      where c.id = orders.customer_id and c.auth_user_id = auth.uid()
    )
  );
create policy order_items_own_read on order_items
  for select using (
    exists (
      select 1 from orders o
      join customers c on c.id = o.customer_id
      where o.id = order_items.order_id and c.auth_user_id = auth.uid()
    )
  );
create policy esims_own_read on esims
  for select using (
    exists (
      select 1 from orders o
      join customers c on c.id = o.customer_id
      where o.id = esims.order_id and c.auth_user_id = auth.uid()
    )
  );
