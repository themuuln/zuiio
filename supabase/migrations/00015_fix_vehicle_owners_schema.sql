alter table vehicle_owners add column if not exists owned_until timestamp with time zone;
alter table vehicle_owners add column if not exists created_by uuid references auth.users(id);
alter table vehicle_owners add column if not exists updated_by uuid references auth.users(id);
alter table vehicle_owners add column if not exists updated_at timestamp with time zone;
alter table vehicle_owners add column if not exists deleted_at timestamp with time zone;
alter table vehicle_owners add column if not exists branch_id uuid;
create unique index if not exists idx_vehicle_owners_active_unique
  on vehicle_owners(vehicle_id, customer_id)
  where owned_until is null;
