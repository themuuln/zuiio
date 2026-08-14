-- ─────────────────────────────────────────────────────────────
-- Appointments + Estimates / Quotes
-- Phase: Appointment booking + Quote generator
-- ─────────────────────────────────────────────────────────────

-- ── Appointments ──────────────────────────────────────────────

create table appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  vehicle_id uuid references vehicles(id) on delete set null,
  mechanic_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  scheduled_at timestamp with time zone not null,
  end_at timestamp with time zone,
  status text not null default 'scheduled'
    check (status in ('scheduled','checked_in','in_progress','completed','cancelled','no_show')),
  notes text,
  source_estimate_id uuid,  -- will be FK after estimates table is created
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

comment on table appointments is 'Customer appointments for service bookings';
comment on column appointments.title is 'Short reason for visit, e.g. Oil change, Brake inspection';
comment on column appointments.source_estimate_id is 'If appointment was created from a quote, link to it';

-- ── Estimates / Quotes ────────────────────────────────────────

create table estimates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  vehicle_id uuid references vehicles(id) on delete set null,
  estimate_number text not null,  -- human-readable, e.g. "EST-00001"
  status text not null default 'draft'
    check (status in ('draft','sent','approved','declined','expired','converted')),
  valid_until date,
  notes text,
  terms text,
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  discount_percentage numeric(5,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  converted_work_order_id uuid references work_orders(id) on delete set null,
  appointment_id uuid references appointments(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,

  constraint unique_estimate_number unique (organization_id, estimate_number)
);

comment on table estimates is 'Customer quotes/estimates that can be converted to work orders';
comment on column estimates.estimate_number is 'Auto-generated human-readable number, e.g. EST-00001';
comment on column estimates.converted_work_order_id is 'Set when quote is approved and converted to a work order';
comment on column estimates.appointment_id is 'Optional link back to the appointment that triggered this quote';

-- ── Estimate Items ────────────────────────────────────────────

create table estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references estimates(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  item_type text not null check (item_type in ('service','part','custom')),
  source_service_id uuid references service_catalog(id) on delete set null,
  source_part_id uuid references parts_catalog(id) on delete set null,
  description text not null,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  unit_cost numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  discount_percentage numeric(5,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

comment on table estimate_items is 'Line items on a quote — services, parts, or custom entries';

-- Enable RLS
alter table appointments enable row level security;
alter table estimates enable row level security;
alter table estimate_items enable row level security;

-- ── RLS Policies ──────────────────────────────────────────────

-- Appointments: org-scoped access
create policy "appointments_org_access"
  on appointments for all
  using (organization_id = coalesce((select get_user_organization_id()), '00000000-0000-0000-0000-000000000000'))
  with check (organization_id = coalesce((select get_user_organization_id()), '00000000-0000-0000-0000-000000000000'));

-- Estimates: org-scoped access
create policy "estimates_org_access"
  on estimates for all
  using (organization_id = coalesce((select get_user_organization_id()), '00000000-0000-0000-0000-000000000000'))
  with check (organization_id = coalesce((select get_user_organization_id()), '00000000-0000-0000-0000-000000000000'));

-- Estimate Items: inherited from estimate org
create policy "estimate_items_org_access"
  on estimate_items for all
  using (organization_id = coalesce((select get_user_organization_id()), '00000000-0000-0000-0000-000000000000'))
  with check (organization_id = coalesce((select get_user_organization_id()), '00000000-0000-0000-0000-000000000000'));

-- ── Indexes ───────────────────────────────────────────────────

create index idx_appointments_org_status on appointments(organization_id, status);
create index idx_appointments_scheduled_at on appointments(organization_id, scheduled_at);
create index idx_appointments_mechanic on appointments(organization_id, mechanic_id) where deleted_at is null;
create index idx_estimates_org_status on estimates(organization_id, status);
create index idx_estimates_number on estimates(organization_id, estimate_number);
create index idx_estimate_items_estimate on estimate_items(estimate_id);

-- ── Auto-increment estimate number ────────────────────────────

create sequence if not exists estimate_number_seq;

create or replace function generate_estimate_number()
returns text
language sql
stable
as $$
  select 'EST-' || lpad(nextval('estimate_number_seq')::text, 6, '0');
$$;

-- ── Back-fill FKs ─────────────────────────────────────────────

-- Now that estimates table exists, set the FK on appointments
alter table appointments
  add constraint fk_appointments_source_estimate
  foreign key (source_estimate_id) references estimates(id) on delete set null;

-- ── Audit trigger ─────────────────────────────────────────────

-- Estimates get audit log entries on key status changes
create or replace function log_estimate_status_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if old is null or old.status is distinct from new.status then
    insert into audit_logs (
      organization_id,
      table_name,
      record_id,
      action,
      old_values,
      new_values,
      changed_by
    ) values (
      new.organization_id,
      'estimates',
      new.id,
      'status_change',
      case when old is null then null else jsonb_build_object('status', old.status) end,
      jsonb_build_object('status', new.status),
      new.updated_by
    );
  end if;
  return new;
end;
$$;

create trigger trg_estimate_status_change
  after insert or update of status on estimates
  for each row execute function log_estimate_status_change();

-- ── Updated_at triggers ──────────────────────────────────────

create trigger handle_appointments_updated_at
  before update on appointments
  for each row execute function moddatetime();

create trigger handle_estimates_updated_at
  before update on estimates
  for each row execute function moddatetime();

-- ── Add source_estimate_id to work_orders for Bay View integration ──
-- Allows work order cards in Bay View to show "From quote #EST-00001"

alter table work_orders add column if not exists source_estimate_id uuid references estimates(id) on delete set null;

comment on column work_orders.source_estimate_id is 'Set when a work order is created from an approved estimate. Shows source on Bay View cards.';
