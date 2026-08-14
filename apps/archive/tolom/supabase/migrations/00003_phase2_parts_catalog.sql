-- Phase 2: Vehicle Models Reference + Parts Catalog + Vehicle-Specific Pricing
-- TOLOM auto repair SaaS platform
-- Created: 2026-05-11

-- ============================================================
-- Tables
-- ============================================================

-- Vehicle model reference table (known makes/models, not customer vehicles)
create table vehicle_models (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  make text not null,
  model text not null,
  generation text,
  year_start integer,
  year_end integer,
  engine text,
  body_type text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- Parts catalog (master parts list)
create table parts_catalog (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  name text not null,
  part_number text,
  category text,
  description text,
  unit text default 'piece',
  default_price numeric(12,2),
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- Which parts fit which vehicle model, with vehicle-specific pricing
create table vehicle_model_parts (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  vehicle_model_id uuid not null references vehicle_models(id),
  part_id uuid not null references parts_catalog(id),
  specific_price numeric(12,2),
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(vehicle_model_id, part_id)
);

-- ============================================================
-- Enable Row Level Security
-- ============================================================
alter table vehicle_models enable row level security;
alter table parts_catalog enable row level security;
alter table vehicle_model_parts enable row level security;

-- ============================================================
-- RLS Policies
-- ============================================================

create policy "Users can view vehicle models in their org"
  on vehicle_models for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert vehicle models in their org"
  on vehicle_models for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update vehicle models in their org"
  on vehicle_models for update
  using (organization_id = get_user_organization_id());

create policy "Users can soft-delete vehicle models in their org"
  on vehicle_models for delete
  using (organization_id = get_user_organization_id());

create policy "Users can view parts catalog in their org"
  on parts_catalog for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert parts catalog in their org"
  on parts_catalog for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update parts catalog in their org"
  on parts_catalog for update
  using (organization_id = get_user_organization_id());

create policy "Users can soft-delete parts catalog in their org"
  on parts_catalog for delete
  using (organization_id = get_user_organization_id());

create policy "Users can view vehicle model parts in their org"
  on vehicle_model_parts for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert vehicle model parts in their org"
  on vehicle_model_parts for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update vehicle model parts in their org"
  on vehicle_model_parts for update
  using (organization_id = get_user_organization_id());

create policy "Users can delete vehicle model parts in their org"
  on vehicle_model_parts for delete
  using (organization_id = get_user_organization_id());

-- ============================================================
-- Indexes
-- ============================================================
create index idx_vehicle_models_org on vehicle_models(organization_id);
create index idx_vehicle_models_make_model on vehicle_models(organization_id, make, model) where deleted_at is null;
create index idx_vehicle_models_org_active on vehicle_models(organization_id, deleted_at) where deleted_at is null;

create index idx_parts_catalog_org on parts_catalog(organization_id);
create index idx_parts_catalog_category on parts_catalog(organization_id, category) where deleted_at is null;
create index idx_parts_catalog_org_active on parts_catalog(organization_id, deleted_at) where deleted_at is null;

create index idx_vehicle_model_parts_model on vehicle_model_parts(vehicle_model_id);
create index idx_vehicle_model_parts_part on vehicle_model_parts(part_id);
create index idx_vehicle_model_parts_org on vehicle_model_parts(organization_id);

-- ============================================================
-- Triggers
-- ============================================================
create trigger set_updated_at_vehicle_models
  before update on vehicle_models
  for each row execute function update_updated_at_column();

create trigger set_updated_at_parts_catalog
  before update on parts_catalog
  for each row execute function update_updated_at_column();

create trigger set_updated_at_vehicle_model_parts
  before update on vehicle_model_parts
  for each row execute function update_updated_at_column();
