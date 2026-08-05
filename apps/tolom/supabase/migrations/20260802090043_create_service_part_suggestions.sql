-- Service Part Suggestions
-- Commonly paired parts for services, used to speed up work order creation
-- Created: 2026-07-31

-- ============================================================
-- 1. Service Part Suggestions table
-- ============================================================
create table service_part_suggestions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  service_id uuid not null references service_catalog(id),
  part_id uuid not null references parts_catalog(id),
  quantity int not null default 1,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- One suggestion per (org, service, part) triplet
create unique index idx_service_part_suggestions_unique
  on service_part_suggestions(organization_id, service_id, part_id);

-- Fast lookup by service
create index idx_service_part_suggestions_service
  on service_part_suggestions(service_id);

-- Fast lookup by part
create index idx_service_part_suggestions_part
  on service_part_suggestions(part_id);

-- Org-scoped queries
create index idx_service_part_suggestions_org
  on service_part_suggestions(organization_id);

-- ============================================================
-- 2. Row Level Security
-- ============================================================
alter table service_part_suggestions enable row level security;

-- SELECT: org members can view suggestions in their org
create policy "org_members_select_service_part_suggestions"
  on service_part_suggestions for select
  using (organization_id = get_user_organization_id());

-- INSERT: org members can create suggestions
create policy "org_members_insert_service_part_suggestions"
  on service_part_suggestions for insert
  with check (
    organization_id = get_user_organization_id()
  );

-- DELETE: org members can delete suggestions in their org
create policy "org_members_delete_service_part_suggestions"
  on service_part_suggestions for delete
  using (organization_id = get_user_organization_id());

-- UPDATE: org members can update suggestions
create policy "org_members_update_service_part_suggestions"
  on service_part_suggestions for update
  using (organization_id = get_user_organization_id())
  with check (organization_id = get_user_organization_id());
