-- Phase 1: Tablet-first startup CRM, Operations, and Bay View
-- TOLOM auto repair SaaS platform
-- Created: 2026-05-11

-- ============================================================
-- Tables
-- ============================================================

-- Customers
create table customers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  branch_id uuid references branches(id),
  first_name text not null,
  last_name text,
  phone text,
  email text,
  address text,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- Vehicles
create table vehicles (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  branch_id uuid references branches(id),
  customer_id uuid references customers(id),
  plate_number text not null,
  make text not null,
  model text not null,
  year integer,
  vin text,
  color text,
  odometer integer,
  engine text,
  fuel_type text,
  transmission text,
  trim text,
  drivetrain text,
  body_type text,
  license_expiry date,
  inspection_notes text,
  last_visit_date timestamp with time zone,
  next_service_date date,
  notes text,
  tags text[],
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- Vehicle owners junction
create table vehicle_owners (
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  is_primary boolean not null default false,
  primary key (vehicle_id, customer_id)
);

-- Service catalog
create table service_catalog (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  name text not null,
  description text,
  default_price numeric(12,2) not null default 0,
  category text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- Work orders
create table work_orders (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  branch_id uuid references branches(id),
  customer_id uuid references customers(id),
  vehicle_id uuid references vehicles(id),
  bay_number integer,
  status text not null default 'New'
    check (status in ('New','Diagnosing','In Progress','Ready for Pickup','Completed','Cancelled')),
  description text,
  notes text,
  mechanic_id uuid references auth.users(id),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- Work order services (line items)
create table work_order_services (
  id uuid primary key default uuid_generate_v4(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  service_catalog_id uuid references service_catalog(id),
  name text not null,
  description text,
  base_price numeric(12,2) not null default 0,
  discount_amount_mnt numeric(12,2) default 0,
  discount_percent numeric(5,2) default 0,
  quantity integer not null default 1,
  final_price numeric(12,2) not null default 0,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now()
);

-- Work order parts (manual entry only in Phase 1)
create table work_order_parts (
  id uuid primary key default uuid_generate_v4(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  part_name text not null,
  part_number text,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  final_price numeric(12,2) not null default 0,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now()
);

-- Work order status history (ledger)
create table work_order_status_history (
  id uuid primary key default uuid_generate_v4(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  previous_status text,
  new_status text not null,
  changed_by uuid references auth.users(id),
  notes text,
  created_at timestamp with time zone not null default now()
);

-- Service pricing history (for price memory)
create table service_price_history (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  service_catalog_id uuid references service_catalog(id),
  vehicle_make text,
  vehicle_model text,
  base_price numeric(12,2) not null,
  discount_amount_mnt numeric(12,2) default 0,
  discount_percent numeric(5,2) default 0,
  quantity integer not null default 1,
  final_price numeric(12,2) not null,
  work_order_id uuid references work_orders(id),
  mechanic_id uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now()
);

-- Part pricing history
create table part_price_history (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  part_name text not null,
  part_number text,
  vehicle_make text,
  vehicle_model text,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null,
  final_price numeric(12,2) not null,
  work_order_id uuid references work_orders(id),
  mechanic_id uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now()
);

-- Mechanic assignments history
create table mechanic_assignments (
  id uuid primary key default uuid_generate_v4(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  mechanic_id uuid not null references auth.users(id),
  assigned_by uuid references auth.users(id),
  assigned_at timestamp with time zone not null default now(),
  unassigned_at timestamp with time zone,
  notes text
);

-- Work order notes
create table work_order_notes (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  content text not null,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now()
);

-- Mechanic daily reports (cached/derived for performance)
create table mechanic_daily_reports (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  mechanic_id uuid not null references auth.users(id),
  report_date date not null,
  work_orders_completed integer default 0,
  services_performed integer default 0,
  parts_used integer default 0,
  total_revenue numeric(12,2) default 0,
  total_discounts numeric(12,2) default 0,
  hours_worked numeric(4,1) default 0,
  notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- ============================================================
-- Enable Row Level Security on ALL tables
-- ============================================================
alter table customers enable row level security;
alter table vehicles enable row level security;
alter table vehicle_owners enable row level security;
alter table service_catalog enable row level security;
alter table work_orders enable row level security;
alter table work_order_services enable row level security;
alter table work_order_parts enable row level security;
alter table work_order_status_history enable row level security;
alter table service_price_history enable row level security;
alter table part_price_history enable row level security;
alter table mechanic_assignments enable row level security;
alter table work_order_notes enable row level security;
alter table mechanic_daily_reports enable row level security;

-- ============================================================
-- RLS Policies
-- ============================================================

-- ----------------------------------------------------------
-- customers
-- ----------------------------------------------------------

create policy "Users can view customers in their org"
  on customers for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert customers in their org"
  on customers for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update customers in their org"
  on customers for update
  using (organization_id = get_user_organization_id());

create policy "Users can soft-delete customers in their org"
  on customers for delete
  using (organization_id = get_user_organization_id());

-- ----------------------------------------------------------
-- vehicles
-- ----------------------------------------------------------

create policy "Users can view vehicles in their org"
  on vehicles for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert vehicles in their org"
  on vehicles for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update vehicles in their org"
  on vehicles for update
  using (organization_id = get_user_organization_id());

create policy "Users can soft-delete vehicles in their org"
  on vehicles for delete
  using (organization_id = get_user_organization_id());

-- ----------------------------------------------------------
-- vehicle_owners
-- ----------------------------------------------------------

create policy "Users can view vehicle_owners in their org"
  on vehicle_owners for select
  using (
    exists (
      select 1 from vehicles
      where vehicles.id = vehicle_owners.vehicle_id
      and vehicles.organization_id = get_user_organization_id()
    )
  );

create policy "Users can insert vehicle_owners in their org"
  on vehicle_owners for insert
  with check (
    exists (
      select 1 from vehicles
      where vehicles.id = vehicle_owners.vehicle_id
      and vehicles.organization_id = get_user_organization_id()
    )
  );

create policy "Users can delete vehicle_owners in their org"
  on vehicle_owners for delete
  using (
    exists (
      select 1 from vehicles
      where vehicles.id = vehicle_owners.vehicle_id
      and vehicles.organization_id = get_user_organization_id()
    )
  );

-- ----------------------------------------------------------
-- service_catalog
-- ----------------------------------------------------------

create policy "Users can view service catalog in their org"
  on service_catalog for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert service catalog in their org"
  on service_catalog for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update service catalog in their org"
  on service_catalog for update
  using (organization_id = get_user_organization_id());

create policy "Users can soft-delete service catalog in their org"
  on service_catalog for delete
  using (organization_id = get_user_organization_id());

-- ----------------------------------------------------------
-- work_orders
-- ----------------------------------------------------------

create policy "Users can view work orders in their org"
  on work_orders for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert work orders in their org"
  on work_orders for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update work orders in their org"
  on work_orders for update
  using (organization_id = get_user_organization_id());

create policy "Users can soft-delete work orders in their org"
  on work_orders for delete
  using (organization_id = get_user_organization_id());

-- ----------------------------------------------------------
-- work_order_services
-- ----------------------------------------------------------

create policy "Users can view work_order_services in their org"
  on work_order_services for select
  using (
    exists (
      select 1 from work_orders
      where work_orders.id = work_order_services.work_order_id
      and work_orders.organization_id = get_user_organization_id()
    )
  );

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

create policy "Users can update work_order_services in their org"
  on work_order_services for update
  using (
    exists (
      select 1 from work_orders
      where work_orders.id = work_order_services.work_order_id
      and work_orders.organization_id = get_user_organization_id()
    )
  );

create policy "Users can delete work_order_services in their org"
  on work_order_services for delete
  using (
    exists (
      select 1 from work_orders
      where work_orders.id = work_order_services.work_order_id
      and work_orders.organization_id = get_user_organization_id()
    )
  );

-- ----------------------------------------------------------
-- work_order_parts
-- ----------------------------------------------------------

create policy "Users can view work_order_parts in their org"
  on work_order_parts for select
  using (
    exists (
      select 1 from work_orders
      where work_orders.id = work_order_parts.work_order_id
      and work_orders.organization_id = get_user_organization_id()
    )
  );

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

create policy "Users can update work_order_parts in their org"
  on work_order_parts for update
  using (
    exists (
      select 1 from work_orders
      where work_orders.id = work_order_parts.work_order_id
      and work_orders.organization_id = get_user_organization_id()
    )
  );

create policy "Users can delete work_order_parts in their org"
  on work_order_parts for delete
  using (
    exists (
      select 1 from work_orders
      where work_orders.id = work_order_parts.work_order_id
      and work_orders.organization_id = get_user_organization_id()
    )
  );

-- ----------------------------------------------------------
-- work_order_status_history (append-only ledger)
-- ----------------------------------------------------------

create policy "Users can view status history in their org"
  on work_order_status_history for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert status history in their org"
  on work_order_status_history for insert
  with check (
    organization_id = get_user_organization_id()
    and changed_by = auth.uid()
  );

-- No update or delete for status history (immutable ledger)

-- ----------------------------------------------------------
-- service_price_history (append-only ledger)
-- ----------------------------------------------------------

create policy "Users can view service price history in their org"
  on service_price_history for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert service price history in their org"
  on service_price_history for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

-- No update or delete for price history (immutable ledger)

-- ----------------------------------------------------------
-- part_price_history (append-only ledger)
-- ----------------------------------------------------------

create policy "Users can view part price history in their org"
  on part_price_history for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert part price history in their org"
  on part_price_history for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

-- No update or delete for price history (immutable ledger)

-- ----------------------------------------------------------
-- mechanic_assignments
-- ----------------------------------------------------------

create policy "Users can view mechanic assignments in their org"
  on mechanic_assignments for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert mechanic assignments in their org"
  on mechanic_assignments for insert
  with check (
    organization_id = get_user_organization_id()
    and assigned_by = auth.uid()
  );

create policy "Users can update mechanic assignments in their org"
  on mechanic_assignments for update
  using (organization_id = get_user_organization_id());

-- No delete for mechanic assignments (history record)

-- ----------------------------------------------------------
-- work_order_notes
-- ----------------------------------------------------------

create policy "Users can view work_order_notes in their org"
  on work_order_notes for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert work_order_notes in their org"
  on work_order_notes for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update work_order_notes in their org"
  on work_order_notes for update
  using (organization_id = get_user_organization_id());

create policy "Users can delete work_order_notes in their org"
  on work_order_notes for delete
  using (organization_id = get_user_organization_id());

-- ----------------------------------------------------------
-- mechanic_daily_reports
-- ----------------------------------------------------------

create policy "Users can view mechanic daily reports in their org"
  on mechanic_daily_reports for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert mechanic daily reports in their org"
  on mechanic_daily_reports for insert
  with check (organization_id = get_user_organization_id());

create policy "Users can update mechanic daily reports in their org"
  on mechanic_daily_reports for update
  using (organization_id = get_user_organization_id());

create policy "Users can delete mechanic daily reports in their org"
  on mechanic_daily_reports for delete
  using (organization_id = get_user_organization_id());

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
create index idx_customers_organization_id on customers(organization_id);
create index idx_customers_phone on customers(organization_id, phone) where deleted_at is null;
create index idx_customers_name on customers(organization_id, lower(first_name), lower(last_name)) where deleted_at is null;
create index idx_customers_search on customers using gin(to_tsvector('simple', coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' || coalesce(phone,'') || ' ' || coalesce(email,''))) where deleted_at is null;

create index idx_vehicles_organization_id on vehicles(organization_id);
create index idx_vehicles_plate_number on vehicles(organization_id, plate_number) where deleted_at is null;
create index idx_vehicles_vin on vehicles(organization_id, vin) where deleted_at is null;
create index idx_vehicles_customer_id on vehicles(customer_id);
create index idx_vehicles_make_model on vehicles(organization_id, make, model) where deleted_at is null;

create index idx_vehicle_owners_vehicle_id on vehicle_owners(vehicle_id);
create index idx_vehicle_owners_customer_id on vehicle_owners(customer_id);

create index idx_service_catalog_organization_id on service_catalog(organization_id);
create index idx_service_catalog_category on service_catalog(organization_id, category) where deleted_at is null;

create index idx_work_orders_organization_id on work_orders(organization_id);
create index idx_work_orders_customer_id on work_orders(customer_id);
create index idx_work_orders_vehicle_id on work_orders(vehicle_id);
create index idx_work_orders_mechanic_id on work_orders(mechanic_id);
create index idx_work_orders_status on work_orders(organization_id, status) where deleted_at is null;
create index idx_work_orders_created_at on work_orders(organization_id, created_at desc) where deleted_at is null;

-- Only one active work order per bay at a time
create unique index idx_work_orders_active_bay
  on work_orders (organization_id, bay_number)
  where bay_number is not null
    and status not in ('Completed', 'Cancelled')
    and deleted_at is null;

create index idx_work_order_services_work_order_id on work_order_services(work_order_id);

create index idx_work_order_parts_work_order_id on work_order_parts(work_order_id);

create index idx_work_order_status_history_work_order_id on work_order_status_history(work_order_id);
create index idx_work_order_status_history_org on work_order_status_history(organization_id);

create index idx_service_price_history_org on service_price_history(organization_id);
create index idx_service_price_history_service on service_price_history(service_catalog_id);
create index idx_service_price_history_vehicle on service_price_history(vehicle_make, vehicle_model);
create index idx_service_price_history_lookup on service_price_history(organization_id, service_catalog_id, vehicle_make, vehicle_model);
create index idx_service_price_history_work_order on service_price_history(work_order_id);

create index idx_part_price_history_org on part_price_history(organization_id);
create index idx_part_price_history_vehicle on part_price_history(vehicle_make, vehicle_model);
create index idx_part_price_history_lookup on part_price_history(organization_id, part_name, vehicle_make, vehicle_model);
create index idx_part_price_history_work_order on part_price_history(work_order_id);

create index idx_mechanic_assignments_work_order on mechanic_assignments(work_order_id);
create index idx_mechanic_assignments_mechanic on mechanic_assignments(mechanic_id);
create index idx_mechanic_assignments_org on mechanic_assignments(organization_id);

create index idx_work_order_notes_work_order_id on work_order_notes(work_order_id, created_at desc);

create index idx_mechanic_daily_reports_org on mechanic_daily_reports(organization_id);
create index idx_mechanic_daily_reports_mechanic_date on mechanic_daily_reports(mechanic_id, report_date desc);

-- Composite indexes: soft-delete filtering
create index idx_customers_org_active on customers(organization_id, deleted_at) where deleted_at is null;
create index idx_vehicles_org_active on vehicles(organization_id, deleted_at) where deleted_at is null;
create index idx_service_catalog_org_active on service_catalog(organization_id, deleted_at) where deleted_at is null;
create index idx_work_orders_org_active on work_orders(organization_id, deleted_at) where deleted_at is null;

-- ============================================================
-- Triggers: auto-update updated_at
-- ============================================================
create trigger set_updated_at
  before update on customers
  for each row execute function update_updated_at_column();

create trigger set_updated_at
  before update on vehicles
  for each row execute function update_updated_at_column();

create trigger set_updated_at
  before update on service_catalog
  for each row execute function update_updated_at_column();

create trigger set_updated_at
  before update on work_orders
  for each row execute function update_updated_at_column();

create trigger set_updated_at
  before update on mechanic_daily_reports
  for each row execute function update_updated_at_column();
