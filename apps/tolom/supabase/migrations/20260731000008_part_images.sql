-- Part Images
-- TOLOM auto repair SaaS platform
-- Adds part_images table for multiple images per part
-- Created: 2026-07-31

-- ============================================================
-- 1. Part Images table
-- ============================================================
create table part_images (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  part_id uuid not null references parts_catalog(id) on delete cascade,
  image_url text not null,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- Index: fast lookup by part_id, ordered by sort_order
create index idx_part_images_part_id
  on part_images(part_id, sort_order);

-- ============================================================
-- 2. Row Level Security
-- ============================================================
alter table part_images enable row level security;

-- SELECT: org members can view images in their org
create policy "org_members_select_part_images"
  on part_images for select
  using (
    organization_id = get_user_organization_id()
  );

-- INSERT: org members can add images
create policy "org_members_insert_part_images"
  on part_images for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

-- UPDATE: org members can update images (e.g., set primary)
create policy "org_members_update_part_images"
  on part_images for update
  using (
    organization_id = get_user_organization_id()
  );

-- DELETE: org members can delete images
create policy "org_members_delete_part_images"
  on part_images for delete
  using (
    organization_id = get_user_organization_id()
  );
