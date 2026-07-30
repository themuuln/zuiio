-- Digital Vehicle Inspection (DVI)
-- Full inspection workflow: draft → ready → sent → partially_approved → approved → declined → converted
-- Each inspection has categorized line items with photos, measurements, and cost estimates.

-- ============================================================
-- 1. Create digital_vehicle_inspections table
-- ============================================================

create table digital_vehicle_inspections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  work_order_id uuid references work_orders(id) on delete set null,
  status text not null default 'draft' check (status in (
    'draft',
    'ready',
    'sent',
    'partially_approved',
    'approved',
    'declined',
    'converted'
  )),
  odometer integer,
  fuel_level text,
  customer_token_hash text unique,
  customer_viewed_at timestamp with time zone,
  customer_decision_at timestamp with time zone,
  technician_notes text,
  created_by uuid not null references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

comment on table digital_vehicle_inspections is 'Digital Vehicle Inspection records — multi-step workflow from draft through customer decision';
comment on column digital_vehicle_inspections.status is 'Workflow state: draft → ready → sent → partially_approved/approved/declined → converted';
comment on column digital_vehicle_inspections.customer_token_hash is 'Hashed token for anonymous customer access to view/approve inspection';
comment on column digital_vehicle_inspections.technician_notes is 'Internal notes from the technician performing the inspection';

-- ============================================================
-- 2. Create dvi_inspection_items table
-- ============================================================

create table dvi_inspection_items (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references digital_vehicle_inspections(id) on delete cascade,
  category text not null check (category in (
    'exterior',
    'interior',
    'tires',
    'brakes',
    'under_hood',
    'under_vehicle',
    'lights',
    'fluids',
    'battery',
    'belts_hoses'
  )),
  item_name text not null,
  condition text not null default 'not_checked' check (condition in (
    'good',
    'fair',
    'poor',
    'fail',
    'not_checked'
  )),
  measurement_value numeric,
  measurement_unit text,
  severity text not null default 'info' check (severity in (
    'minor',
    'major',
    'critical'
  )),
  has_photo boolean not null default false,
  photo_urls jsonb not null default '[]'::jsonb,
  technician_notes text,
  recommended_service_id uuid references service_catalog(id) on delete set null,
  recommended_part_ids uuid[],
  estimated_cost numeric,
  customer_approved boolean,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now()
);

comment on table dvi_inspection_items is 'Line items within a DVI — categorized checks with photos, measurements, and cost estimates';
comment on column dvi_inspection_items.severity is 'Urgency level for the technician — info, monitor, recommend, urgent, c1itical';
comment on column dvi_inspection_items.condition is 'Visual condition assessment — good, fair, poor, fail, not_checked';
comment on column dvi_inspection_items.customer_approved is 'Customer decision on whether to proceed with this item';

-- ============================================================
-- 3. Indexes
-- ============================================================

create index idx_dvi_org on digital_vehicle_inspections(organization_id);
create index idx_dvi_vehicle on digital_vehicle_inspections(vehicle_id);
create index idx_dvi_status on digital_vehicle_inspections(status);
create unique index idx_dvi_customer_token on digital_vehicle_inspections(customer_token_hash) where customer_token_hash is not null;

create index idx_dvi_items_inspection on dvi_inspection_items(inspection_id);
create index idx_dvi_items_inspection_category on dvi_inspection_items(inspection_id, category);

-- ============================================================
-- 4. RLS
-- ============================================================

alter table digital_vehicle_inspections enable row level security;
alter table dvi_inspection_items enable row level security;

-- ── digital_vehicle_inspections policies ─────────────────────

create policy "Users can view inspections in their org"
  on digital_vehicle_inspections for select
  using (organization_id = get_user_organization_id());

create policy "Users can create inspections in their org"
  on digital_vehicle_inspections for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update inspections in their org"
  on digital_vehicle_inspections for update
  using (organization_id = get_user_organization_id());

create policy "Users can delete inspections in their org"
  on digital_vehicle_inspections for delete
  using (organization_id = get_user_organization_id());

-- ── dvi_inspection_items policies (org-scoped via parent inspection) ──

create policy "Users can view inspection items in their org"
  on dvi_inspection_items for select
  using (
    inspection_id in (
      select id from digital_vehicle_inspections
      where organization_id = get_user_organization_id()
    )
  );

create policy "Users can create inspection items in their org"
  on dvi_inspection_items for insert
  with check (
    inspection_id in (
      select id from digital_vehicle_inspections
      where organization_id = get_user_organization_id()
    )
  );

create policy "Users can update inspection items in their org"
  on dvi_inspection_items for update
  using (
    inspection_id in (
      select id from digital_vehicle_inspections
      where organization_id = get_user_organization_id()
    )
  );

create policy "Users can delete inspection items in their org"
  on dvi_inspection_items for delete
  using (
    inspection_id in (
      select id from digital_vehicle_inspections
      where organization_id = get_user_organization_id()
    )
  );

-- ============================================================
-- 5. Trigger: auto-update updated_at
-- ============================================================

create trigger set_digital_vehicle_inspections_updated_at
  before update on digital_vehicle_inspections
  for each row execute function update_updated_at_column();
