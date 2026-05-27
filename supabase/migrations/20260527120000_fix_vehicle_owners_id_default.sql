-- vehicle_owners.id was added in 000052_add_seed_prereq_columns.sql
-- but was given NOT NULL with no default. The code was updated to pass
-- crypto.randomUUID() at insert time, but the column should still have
-- a default as safety net.

alter table vehicle_owners
  alter column id set default gen_random_uuid();
