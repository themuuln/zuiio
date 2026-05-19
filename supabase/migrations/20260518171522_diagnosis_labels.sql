-- Diagnosis labels/tags for work order complaints
create table if not exists diagnosis_labels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  name_mn text,
  color text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  deleted_at timestamptz
);

-- Enable RLS
alter table diagnosis_labels enable row level security;

-- RLS policies
create policy "Users can view their org's diagnosis labels"
  on diagnosis_labels for select
  using (organization_id = (select organization_id from organization_users where user_id = auth.uid() limit 1));

create policy "Users can insert diagnosis labels in their org"
  on diagnosis_labels for insert
  with check (organization_id = (select organization_id from organization_users where user_id = auth.uid() limit 1));

create policy "Users can update diagnosis labels in their org"
  on diagnosis_labels for update
  using (organization_id = (select organization_id from organization_users where user_id = auth.uid() limit 1));

create policy "Users can delete diagnosis labels in their org"
  on diagnosis_labels for delete
  using (organization_id = (select organization_id from organization_users where user_id = auth.uid() limit 1));

-- Indexes
create index idx_diagnosis_labels_org on diagnosis_labels(organization_id);
create index idx_diagnosis_labels_active on diagnosis_labels(organization_id, is_active) where deleted_at is null;

-- Trigger for updated_at
create trigger set_diagnosis_labels_updated_at
  before update on diagnosis_labels
  for each row execute function update_updated_at_column();
