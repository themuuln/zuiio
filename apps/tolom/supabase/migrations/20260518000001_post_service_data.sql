-- Post-Service Client Data Form
-- TOLOM auto repair SaaS platform
-- Tables for capturing mechanic recommendations + service completion data

-- ============================================================
-- 1. Add odometer_at_service to work_orders
-- ============================================================
alter table work_orders
  add column if not exists odometer_at_service integer;

-- ============================================================
-- 2. service_recommendations: per-service-line-item recommendations
-- ============================================================
create table if not exists service_recommendations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  branch_id uuid references branches(id),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  work_order_service_id uuid references work_order_services(id) on delete set null,
  service_name text not null,
  service_catalog_id uuid references service_catalog(id) on delete set null,
  recommended_interval_months integer,
  recommended_interval_km integer,
  next_due_date date,
  next_due_km integer,
  priority text not null default 'standard'
    check (priority in ('standard', 'important', 'urgent')),
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- ============================================================
-- 3. service_completion_data: snapshot at service completion
-- ============================================================
create table if not exists service_completion_data (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  branch_id uuid references branches(id),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id),
  odometer_reading integer,
  customer_satisfaction integer
    check (customer_satisfaction between 1 and 5),
  customer_feedback text,
  customer_preferences jsonb not null default '{}'::jsonb,
  next_appointment_date date,
  collected_at timestamp with time zone not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now()
);

-- ============================================================
-- Enable Row Level Security
-- ============================================================
alter table service_recommendations enable row level security;
alter table service_completion_data enable row level security;

-- ============================================================
-- RLS Policies — service_recommendations
-- ============================================================

create policy "Users can view service recommendations in their org"
  on service_recommendations for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert service recommendations in their org"
  on service_recommendations for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update service recommendations in their org"
  on service_recommendations for update
  using (organization_id = get_user_organization_id());

create policy "Users can soft-delete service recommendations in their org"
  on service_recommendations for delete
  using (organization_id = get_user_organization_id());

-- ============================================================
-- RLS Policies — service_completion_data
-- ============================================================

create policy "Users can view service completion data in their org"
  on service_completion_data for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert service completion data in their org"
  on service_completion_data for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update service completion data in their org"
  on service_completion_data for update
  using (organization_id = get_user_organization_id());

-- No delete for completion data (immutable once collected)

-- ============================================================
-- Indexes
-- ============================================================
create index idx_sr_organization_id on service_recommendations(organization_id);
create index idx_sr_work_order_id on service_recommendations(work_order_id);
create index idx_sr_org_active on service_recommendations(organization_id, deleted_at)
  where deleted_at is null;

create index idx_scd_organization_id on service_completion_data(organization_id);
create index idx_scd_work_order_id on service_completion_data(work_order_id);
create index idx_scd_vehicle_id on service_completion_data(vehicle_id);

-- ============================================================
-- Trigger: auto-update updated_at on service_recommendations
-- ============================================================
create trigger set_updated_at
  before update on service_recommendations
  for each row execute function update_updated_at_column();
