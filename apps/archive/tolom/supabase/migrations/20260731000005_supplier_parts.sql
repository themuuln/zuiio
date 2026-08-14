-- ── Supplier-Part Junction Table ──────────────────────────────
-- Explicit many-to-many mapping between suppliers and parts.

create table if not exists supplier_parts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  supplier_id uuid not null references suppliers(id) on delete cascade,
  part_id uuid not null references parts_catalog(id) on delete cascade,
  supplier_part_number text,
  unit_cost numeric(12,2),
  is_preferred boolean not null default false,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, supplier_id, part_id)
);

-- Index for fast part-side lookup
create index if not exists idx_supplier_parts_part_id on supplier_parts(part_id);
create index if not exists idx_supplier_parts_supplier_id on supplier_parts(supplier_id);

-- ── RLS ───────────────────────────────────────────────────────

alter table supplier_parts enable row level security;

-- SELECT: org members can view
create policy "org_members_select" on supplier_parts
  for select using (
    organization_id = get_user_organization_id()
  );

-- INSERT: org admins+ can add
create policy "org_admins_insert" on supplier_parts
  for insert with check (
    organization_id = get_user_organization_id()
    and exists (
      select 1 from organization_users ou
      join roles r on r.id = ou.role_id
      where ou.organization_id = supplier_parts.organization_id
        and ou.user_id = auth.uid()
        and r.name in ('Org Owner', 'Manager')
        and r.deleted_at is null
    )
  );

-- UPDATE: org admins+ can update (e.g. set preferred, change part number)
create policy "org_admins_update" on supplier_parts
  for update using (
    organization_id = get_user_organization_id()
    and exists (
      select 1 from organization_users ou
      join roles r on r.id = ou.role_id
      where ou.organization_id = supplier_parts.organization_id
        and ou.user_id = auth.uid()
        and r.name in ('Org Owner', 'Manager')
        and r.deleted_at is null
    )
  );

-- DELETE: org admins+ can remove
create policy "org_admins_delete" on supplier_parts
  for delete using (
    organization_id = get_user_organization_id()
    and exists (
      select 1 from organization_users ou
      join roles r on r.id = ou.role_id
      where ou.organization_id = supplier_parts.organization_id
        and ou.user_id = auth.uid()
        and r.name in ('Org Owner', 'Manager')
        and r.deleted_at is null
    )
  );

-- ── Trigger for updated_at ────────────────────────────────────

create trigger set_updated_at_supplier_parts
  before update on supplier_parts
  for each row
  execute function moddatetime();
 
-- Enforce that both referenced records belong to the same organization.
alter table suppliers
  add constraint suppliers_organization_id_id_key
  unique (organization_id, id);

alter table parts_catalog
  add constraint parts_catalog_organization_id_id_key
  unique (organization_id, id);

alter table supplier_parts
  add constraint supplier_parts_supplier_org_fk
  foreign key (organization_id, supplier_id)
  references suppliers (organization_id, id)
  on delete cascade;

alter table supplier_parts
  add constraint supplier_parts_part_org_fk
  foreign key (organization_id, part_id)
  references parts_catalog (organization_id, id)
  on delete cascade;
