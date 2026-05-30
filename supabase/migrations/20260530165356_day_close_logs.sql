-- Day close logs — tracks each end-of-day close for streak counting and audit
create table if not exists day_close_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  closed_by uuid references profiles(id) on delete set null,
  closed_at timestamptz not null default now(),
  date date not null,
  summary jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null
);

-- Unique constraint: one close per org per business date
alter table day_close_logs
  add constraint day_close_logs_org_date_key unique (organization_id, date);

-- RLS
alter table day_close_logs enable row level security;

create policy "Users can view their org's day close logs"
  on day_close_logs for select
  using (organization_id = auth_org_id());

create policy "Users can insert day close logs for their org"
  on day_close_logs for insert
  with check (organization_id = auth_org_id());

-- Indexes
create index idx_day_close_logs_org_date on day_close_logs(organization_id, date desc);
create index idx_day_close_logs_closed_by on day_close_logs(closed_by);
