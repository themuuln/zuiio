-- Add name_mn column to service_catalog (mirrors parts_catalog.name_mn)
alter table service_catalog
  add column if not exists name_mn text;

-- Add index for searching by Mongolian name
create index if not exists idx_service_catalog_name_mn
  on service_catalog(name_mn);
