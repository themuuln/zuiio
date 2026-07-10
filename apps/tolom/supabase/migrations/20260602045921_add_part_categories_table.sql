-- Part categories table — org-scoped, enables combobox selection + user-created categories
-- Created: 2026-06-02

create table part_categories (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name            text not null,
  created_by      uuid references auth.users(id),
  created_at      timestamp with time zone not null default now(),
  unique(organization_id, name)
);

-- Enable RLS
alter table part_categories enable row level security;

-- Policies
create policy "Users can view part categories in their org"
  on part_categories for select
  using (organization_id = get_user_organization_id());

create policy "Users can create part categories in their org"
  on part_categories for insert
  with check (
    organization_id = get_user_organization_id()
  );

create policy "Users can delete part categories in their org"
  on part_categories for delete
  using (organization_id = get_user_organization_id());
