-- ── Work Order Helpers ──────────────────────────────────────
-- Junction table supporting multiple helper mechanics per work order.
-- The main mechanic is tracked via work_orders.mechanic_id;
-- additional mechanics are recorded here as helpers.

create table work_order_helpers (
  id uuid primary key default uuid_generate_v4(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  mechanic_id uuid not null references auth.users(id),
  assigned_at timestamp with time zone not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now()
);

-- Prevent duplicate helper assignments
create unique index idx_wo_helpers_unique on work_order_helpers(work_order_id, mechanic_id);
create index idx_wo_helpers_work_order on work_order_helpers(work_order_id);
create index idx_wo_helpers_mechanic on work_order_helpers(mechanic_id);

-- Enable RLS
alter table work_order_helpers enable row level security;

-- RLS: users can view helpers in their org
create policy "Users can view helpers in their org"
  on work_order_helpers for select
  using (
    organization_id in (
      select get_user_organization_id()
    )
  );

-- RLS: authenticated users can insert helpers in their org
create policy "Users can insert helpers in their org"
  on work_order_helpers for insert
  with check (
    organization_id in (
      select get_user_organization_id()
    )
  );

-- RLS: authenticated users can delete helpers in their org
create policy "Users can delete helpers in their org"
  on work_order_helpers for delete
  using (
    organization_id in (
      select get_user_organization_id()
    )
  );

-- RLS: users can update helper records in their org
create policy "Users can update helpers in their org"
  on work_order_helpers for update
  using (
    organization_id in (
      select get_user_organization_id()
    )
  )
  with check (
    organization_id in (
      select get_user_organization_id()
    )
  );
