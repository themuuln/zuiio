-- Parts Cars Disassembly — Imported car -> strip -> inventory
-- TOLOM auto repair SaaS platform
-- Created: 2026-05-16

-- ============================================================
-- Location groups for organizing pulled parts
-- ============================================================
create type parts_car_location_group as enum (
  'engine',
  'transmission',
  'suspension',
  'brake',
  'body',
  'interior',
  'electrical',
  'cooling',
  'exhaust',
  'fuel',
  'steering',
  'ac',
  'other'
);

-- ============================================================
-- Parts Cars (imported vehicles for disassembly)
-- ============================================================
create table parts_cars (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  branch_id uuid references branches(id),

  -- Vehicle info
  make text not null,
  model text not null,
  year integer,
  vin text,
  license_plate text,

  -- Cost & arrival
  purchase_cost numeric(12,2) not null default 0,
  currency text not null default 'MNT',
  arrival_date date not null default current_date,
  status text not null default 'arrived'
    check (status in ('arrived', 'disassembling', 'completed', 'cancelled')),

  -- Summary (computed on complete)
  total_parts_actual integer not null default 0,
  total_estimated_value numeric(12,2) not null default 0,

  notes text,

  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- ============================================================
-- Parts Car Parts (individual parts pulled from the car)
-- ============================================================
create table parts_car_parts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  parts_car_id uuid not null references parts_cars(id) on delete cascade,

  -- Link to catalog (nullable — can create catalog entry later)
  part_id uuid references parts_catalog(id),

  -- Part info
  name text not null,
  location_group parts_car_location_group not null default 'other',
  quantity integer not null default 1,
  condition text not null default 'good'
    check (condition in ('good', 'fair', 'damaged')),

  -- Pricing
  estimated_price numeric(12,2) not null default 0,

  notes text,

  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index idx_parts_cars_org on parts_cars(organization_id);
create index idx_parts_cars_status on parts_cars(organization_id, status);
create index idx_parts_car_parts_car on parts_car_parts(parts_car_id);
create index idx_parts_car_parts_location on parts_car_parts(parts_car_id, location_group);

-- ============================================================
-- RLS
-- ============================================================
alter table parts_cars enable row level security;
alter table parts_car_parts enable row level security;

-- Parts Cars RLS
create policy "Users can view parts cars in their org"
  on parts_cars for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert parts cars in their org"
  on parts_cars for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update parts cars in their org"
  on parts_cars for update
  using (organization_id = get_user_organization_id());

create policy "Users can delete parts cars in their org"
  on parts_cars for delete
  using (organization_id = get_user_organization_id());

-- Parts Car Parts RLS
create policy "Users can view parts car parts in their org"
  on parts_car_parts for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert parts car parts in their org"
  on parts_car_parts for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update parts car parts in their org"
  on parts_car_parts for update
  using (organization_id = get_user_organization_id());

create policy "Users can delete parts car parts in their org"
  on parts_car_parts for delete
  using (organization_id = get_user_organization_id());

-- ============================================================
-- Triggers
-- ============================================================
create trigger set_updated_at_parts_cars
  before update on parts_cars
  for each row execute function update_updated_at_column();

create trigger set_updated_at_parts_car_parts
  before update on parts_car_parts
  for each row execute function update_updated_at_column();
