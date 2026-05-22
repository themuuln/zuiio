-- Mechanic time tracking: clock-in/out logs
create table mechanic_time_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  mechanic_id uuid not null references auth.users(id),
  clock_in timestamptz not null default now(),
  clock_out timestamptz,
  date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

-- Indexes for fast lookups
create index idx_time_logs_mechanic_date on mechanic_time_logs(mechanic_id, date desc);
create index idx_time_logs_org on mechanic_time_logs(organization_id);

-- RLS
alter table mechanic_time_logs enable row level security;

create policy "Users can view time logs in their org"
  on mechanic_time_logs for select
  using (organization_id = get_user_organization_id());

create policy "Mechanics can insert own time logs"
  on mechanic_time_logs for insert
  with check (mechanic_id = auth.uid());

create policy "Mechanics can update own time logs"
  on mechanic_time_logs for update
  using (mechanic_id = auth.uid());
