-- Add name_mn column to service_catalog for Mongolian service names

alter table service_catalog
  add column if not exists name_mn text;

-- Index for searching
create index if not exists idx_service_catalog_name_mn
  on service_catalog(organization_id, name_mn)
  where name_mn is not null;

-- Remove name_mn from the partial unique index that checks active+not-deleted services
-- (This preserves existing indexes — no destructive changes needed)
