# 2. Data model (Supabase migration)

Money conventions: `bigint` integer MNT (tögrög), `numeric(10,4)` USD, `numeric(12,4)` FX rate.

## Tables

```sql
-- regions/destinations
create table regions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,                  -- 'china', 'japan', 'europe', 'global'
  name_en text not null, name_mn text not null,
  kind text not null check (kind in ('country','regional','global')),
  country_code text,                          -- ISO2 for flags; null for regional/global
  sort_order int not null default 100,
  is_active boolean not null default true
);

-- packages (synced from provider catalog)
create table packages (
  id uuid primary key default gen_random_uuid(),
  provider text not null,                     -- 'mock', later 'airalo' etc.
  provider_package_id text not null,
  region_id uuid not null references regions(id),
  name text not null,
  data_mb int,                                -- null = unlimited
  is_unlimited boolean not null default false,
  validity_days int not null,
  coverage_countries text[] not null default '{}',
  cost_usd numeric(10,4) not null,            -- SENSITIVE: never exposed to anon
  provider_meta jsonb not null default '{}',
  is_enabled boolean not null default false,  -- admin opt-in after sync
  is_archived boolean not null default false, -- disappeared from provider catalog
  needs_repricing boolean not null default false,
  synced_at timestamptz,
  unique (provider, provider_package_id)
);

-- FX rates (append-only history; latest row wins)
create table fx_rates (
  id uuid primary key default gen_random_uuid(),
  pair text not null default 'USD_MNT',
  rate numeric(12,4) not null,
  source text not null default 'manual' check (source in ('manual','auto')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- pricing rules
create table pricing_rules (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('global','region','package')),
  region_id uuid references regions(id),
  package_id uuid references packages(id),
  markup_percent numeric(6,2) not null,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  check ((scope='global' and region_id is null and package_id is null)
      or (scope='region' and region_id is not null and package_id is null)
      or (scope='package' and package_id is not null))
);
-- partial unique indexes: one active global rule; one active rule per region / per package

-- app settings
create table app_settings (key text primary key, value jsonb not null, updated_at timestamptz default now());
-- seed: min_margin_percent=10, rounding={"mode":"ceil_to","step":500}, order_ttl_minutes=30

-- customers (guest-first; optional auth link)
create table customers (
  id uuid primary key default gen_random_uuid(),
  email text not null, phone text not null,
  auth_user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null,            -- 'ZIM-7F3K2Q', unambiguous alphabet
  customer_id uuid not null references customers(id),
  email text not null, phone text not null,   -- contact snapshot
  locale text not null default 'mn',
  status text not null default 'pending_payment' check (status in
    ('pending_payment','paid','provisioning','delivered','partially_failed',
     'failed','expired','cancelled','refunded')),
  total_mnt bigint not null,
  expires_at timestamptz not null,            -- created_at + order_ttl
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- order_items with full pricing snapshot (margin reporting immune to later FX/rule edits)
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  package_id uuid not null references packages(id),
  quantity int not null default 1,
  package_name text not null,
  cost_usd numeric(10,4) not null,
  fx_rate numeric(12,4) not null,
  fx_rate_id uuid references fx_rates(id),
  markup_percent numeric(6,2) not null,
  pricing_rule_id uuid references pricing_rules(id),
  min_margin_applied boolean not null default false,
  unit_retail_mnt bigint not null,
  unit_cost_mnt bigint not null
);

-- esims
create table esims (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items(id),
  order_id uuid not null references orders(id),
  provider text not null,
  provider_esim_id text, provider_order_id text,
  iccid text, lpa_string text, activation_code text, smdp_address text,
  qr_payload text,                             -- = lpa_string
  status text not null default 'pending' check (status in
    ('pending','provisioning','delivered','activated','expired','failed','refunded')),
  provider_status_raw jsonb,
  delivered_at timestamptz, activated_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- payments (QPay)
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  provider text not null default 'qpay',
  invoice_id text unique,
  sender_invoice_no text unique not null,      -- = order_code
  amount_mnt bigint not null,
  status text not null default 'created' check (status in
    ('created','paid','failed','expired','refunded')),
  qpay_payment_id text, paid_at timestamptz,
  raw jsonb, created_at timestamptz not null default now()
);

-- provisioning retry queue
create table provisioning_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  esim_id uuid references esims(id),
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed_permanent')),
  attempts int not null default 0, max_attempts int not null default 5,
  next_retry_at timestamptz not null default now(),
  last_error text, created_at timestamptz not null default now()
);

-- idempotent provider webhook ingestion
create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null, event_id text not null,
  payload jsonb not null, processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

-- admins
create table admin_users (
  user_id uuid primary key references auth.users(id),
  role text not null default 'admin' check (role in ('admin','owner')),
  created_at timestamptz not null default now()
);
create or replace function is_admin() returns boolean language sql stable security definer
  as $$ select exists (select 1 from admin_users where user_id = auth.uid()) $$;
```

## RLS strategy (single-tenant consumer app)

- Enable RLS on **all** tables.
- `regions`: anon/authenticated SELECT where `is_active`.
- `packages`: **no anon policy** — `cost_usd` is competitive intelligence. Catalog reads happen server-side (service-role client in RSC/route handlers) which compute retail prices and pass display-safe DTOs. Admin SELECT/UPDATE via `is_admin()`.
- `orders`/`order_items`/`esims`/`payments`/`customers`: no anon policies. Guest access via server actions with explicit checks (order_code + phone, or HMAC token). SELECT for authed users where linked `customers.auth_user_id = auth.uid()`. Full access `is_admin()`.
- `pricing_rules`, `fx_rates`, `app_settings`, `provisioning_jobs`, `webhook_events`, `admin_users`: admin-only; server writes use service role.

Generate types: `supabase gen types typescript` → `src/lib/supabase/types.ts`.
