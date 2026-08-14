alter table customers add column if not exists type text;
alter table customers add column if not exists full_name text;
alter table customers add column if not exists total_visits integer not null default 0;
alter table customers alter column first_name drop not null;
alter table vehicles add column if not exists last_visit_at timestamp with time zone;
alter table vehicle_owners add column if not exists id uuid;
update vehicle_owners set id = gen_random_uuid() where id is null;
alter table vehicle_owners alter column id set not null;
do $$
begin
  if not exists (select 1 from pg_index where indrelid = 'vehicle_owners'::regclass and indkey::text like 'id%') then
    alter table vehicle_owners drop constraint if exists vehicle_owners_pkey;
    alter table vehicle_owners add primary key (id);
  end if;
end $$;
alter table vehicle_owners add column if not exists organization_id uuid;
alter table vehicle_owners add column if not exists owned_from timestamp with time zone not null default now();
alter table vehicle_owners add column if not exists created_at timestamp with time zone not null default now();
