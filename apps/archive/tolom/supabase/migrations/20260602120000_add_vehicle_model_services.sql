-- Add vehicle_model_services table for model-specific service pricing
-- Mirrors vehicle_model_parts pattern for parts

create table if not exists vehicle_model_services (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  vehicle_model_id uuid not null references vehicle_models(id),
  service_catalog_id uuid not null references service_catalog(id),
  specific_price numeric(12,2),
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(vehicle_model_id, service_catalog_id)
);

-- Enable Row Level Security
alter table vehicle_model_services enable row level security;

-- RLS Policies
create policy "Users can view vehicle model services in their org"
  on vehicle_model_services for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert vehicle model services in their org"
  on vehicle_model_services for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update vehicle model services in their org"
  on vehicle_model_services for update
  using (organization_id = get_user_organization_id());

create policy "Users can delete vehicle model services in their org"
  on vehicle_model_services for delete
  using (organization_id = get_user_organization_id());

-- Indexes
create index idx_vehicle_model_services_model on vehicle_model_services(vehicle_model_id);
create index idx_vehicle_model_services_service on vehicle_model_services(service_catalog_id);
create index idx_vehicle_model_services_org on vehicle_model_services(organization_id);

-- Trigger for updated_at
create trigger set_updated_at_vehicle_model_services
  before update on vehicle_model_services
  for each row execute function update_updated_at_column();
