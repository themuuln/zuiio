-- Service Reminders: vehicle service schedules + reminder audit trail
-- TOLOM auto repair SaaS platform
-- Created: 2026-05-16

-- ============================================================
-- Tables
-- ============================================================

-- Vehicle service schedules: per-vehicle reminder configurations
create table vehicle_service_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  branch_id uuid references branches(id),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  service_catalog_id uuid references service_catalog(id) on delete set null,
  service_name text not null,
  interval_months integer,
  interval_km integer,
  last_service_date timestamp with time zone,
  last_service_odometer integer,
  next_due_date date,
  next_due_km integer,
  reminder_enabled boolean not null default true,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,

  -- At least one interval type must be set
  constraint check_interval check (
    interval_months is not null or interval_km is not null
  )
);

-- Reminder logs: audit trail of sent/pending reminders
create table reminder_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  vehicle_service_schedule_id uuid references vehicle_service_schedules(id) on delete set null,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  service_catalog_id uuid references service_catalog(id) on delete set null,
  service_name text not null,
  reminder_type text not null default 'service_due'
    check (reminder_type in ('service_due', 'service_overdue', 'custom')),
  channel text not null default 'sms'
    check (channel in ('sms', 'email', 'both', 'in_app')),
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'cancelled')),
  scheduled_at timestamp with time zone not null default now(),
  sent_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone not null default now()
);

-- ============================================================
-- Enable Row Level Security
-- ============================================================
alter table vehicle_service_schedules enable row level security;
alter table reminder_logs enable row level security;

-- ============================================================
-- RLS Policies
-- ============================================================

-- ----------------------------------------------------------
-- vehicle_service_schedules
-- ----------------------------------------------------------

create policy "Users can view service schedules in their org"
  on vehicle_service_schedules for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert service schedules in their org"
  on vehicle_service_schedules for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update service schedules in their org"
  on vehicle_service_schedules for update
  using (organization_id = get_user_organization_id());

create policy "Users can soft-delete service schedules in their org"
  on vehicle_service_schedules for delete
  using (organization_id = get_user_organization_id());

-- ----------------------------------------------------------
-- reminder_logs
-- ----------------------------------------------------------

create policy "Users can view reminder logs in their org"
  on reminder_logs for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert reminder logs in their org"
  on reminder_logs for insert
  with check (organization_id = get_user_organization_id());

-- No update or delete for reminder_logs (immutable audit trail)

-- ============================================================
-- Indexes
-- ============================================================
create index idx_vss_organization_id on vehicle_service_schedules(organization_id);
create index idx_vss_vehicle_id on vehicle_service_schedules(vehicle_id);
create index idx_vss_service_catalog_id on vehicle_service_schedules(service_catalog_id);
create index idx_vss_next_due_date on vehicle_service_schedules(organization_id, next_due_date)
  where deleted_at is null and reminder_enabled = true;
create index idx_vss_org_active on vehicle_service_schedules(organization_id, deleted_at)
  where deleted_at is null;

create index idx_rl_organization_id on reminder_logs(organization_id);
create index idx_rl_vehicle_id on reminder_logs(vehicle_id);
create index idx_rl_schedule_id on reminder_logs(vehicle_service_schedule_id);
create index idx_rl_status on reminder_logs(organization_id, status, scheduled_at);
create index idx_rl_created_at on reminder_logs(organization_id, created_at desc);

-- ============================================================
-- Trigger: auto-update updated_at
-- ============================================================
create trigger set_updated_at
  before update on vehicle_service_schedules
  for each row execute function update_updated_at_column();
