-- Add default interval columns to service_catalog for auto-schedule calculation

alter table service_catalog
  add column if not exists interval_months integer,
  add column if not exists interval_km integer;

-- Seed default intervals for common services
update service_catalog
set interval_months = 6
where lower(name) like '%oil%' or lower(name) like '%toś%' or lower(name) like '%тос%';

update service_catalog
set interval_months = 6
where lower(name) like '%tire%' or lower(name) like '%дугуй%' or lower(name) like '%wheel%';

update service_catalog
set interval_months = 12
where lower(name) like '%brake%' or lower(name) like '%тоормос%';

update service_catalog
set interval_months = 12
where lower(name) like '%air filter%' or lower(name) like '%шүүгч%' or lower(name) like '%filter%';

update service_catalog
set interval_months = 24
where lower(name) like '%coolant%' or lower(name) like '%хөргөлт%' or lower(name) like '%antifreeze%';

update service_catalog
set interval_months = 60
where lower(name) like '%timing belt%' or lower(name) like '%цаг%';
