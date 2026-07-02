-- Realtime Inventory Balances
-- Replaces 5-min cron-refreshed materialized view with real-time trigger-driven table.
-- The refresh_inventory_balance() function recalculates for a single part and upserts
-- into inventory_balances. Triggers on inventory_movements keep it current instantly.

-- 1. Drop the cron schedule (idempotent)
do $$
begin
  perform cron.unschedule('refresh-inventory-balances');
exception
  when others then null;
end;
$$;

-- 2. Drop the materialized view (cascade to its indexes)
drop materialized view if exists inventory_balances cascade;

-- 3. Create inventory_balances as a real table (same shape as the materialized view)
create table inventory_balances (
  organization_id uuid not null references organizations(id),
  branch_id uuid references branches(id),
  part_id uuid not null references parts_catalog(id),
  part_name text,
  part_number text,
  category text,
  unit text,
  default_price numeric(12,2),
  quantity_on_hand numeric(12,2) not null default 0,
  last_movement_at timestamp with time zone
);

comment on table inventory_balances is 'Real-time inventory balances maintained by triggers on inventory_movements';
comment on column inventory_balances.quantity_on_hand is 'Current stock level computed from ledger movements';

create index if not exists idx_inventory_balances_org
  on inventory_balances (organization_id);

-- Expression-based unique index (handles nullable branch_id)
create unique index if not exists idx_inventory_balances_unique
  on inventory_balances (organization_id, coalesce(branch_id, '00000000-0000-0000-0000-000000000000'), part_id);

-- 4. Trigger function: refresh balance for a single part
-- Recalculates from scratch using all movements for that part.
-- Uses delete + insert pattern (safe for nullable branch_id in unique constraint).
create or replace function refresh_inventory_balance(p_part_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from inventory_balances where part_id = p_part_id;

  insert into inventory_balances (
    organization_id, branch_id, part_id, part_name, part_number,
    category, unit, default_price, quantity_on_hand, last_movement_at
  )
  select
    im.organization_id,
    im.branch_id,
    im.part_id,
    max(pc.name),
    max(pc.part_number),
    max(pc.category),
    max(pc.unit),
    max(pc.default_price),
    coalesce(sum(case
      when im.movement_type in ('purchase', 'transfer_in', 'return') then im.quantity
      when im.movement_type in ('sale', 'transfer_out', 'waste', 'adjustment') then -im.quantity
      else 0
    end), 0),
    max(im.created_at)
  from inventory_movements im
  join parts_catalog pc on pc.id = im.part_id
  where im.part_id = p_part_id
  group by im.organization_id, im.branch_id, im.part_id;
end;
$$;

-- 5. Unified trigger function for all AFTER operations on inventory_movements
create or replace function trg_inventory_movement_sync()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'DELETE' then
    perform refresh_inventory_balance(OLD.part_id);
  elsif TG_OP = 'UPDATE' then
    perform refresh_inventory_balance(NEW.part_id);
    if OLD.part_id is distinct from NEW.part_id then
      perform refresh_inventory_balance(OLD.part_id);
    end if;
  else
    perform refresh_inventory_balance(NEW.part_id);
  end if;
  return null;
end;
$$;

create trigger trg_inventory_movement_after
  after insert or update or delete on inventory_movements
  for each row
  execute function trg_inventory_movement_sync();

-- 6. Seed initial balances from existing movements
insert into inventory_balances (
  organization_id, branch_id, part_id, part_name, part_number,
  category, unit, default_price, quantity_on_hand, last_movement_at
)
select
  im.organization_id,
  im.branch_id,
  im.part_id,
  pc.name,
  pc.part_number,
  pc.category,
  pc.unit,
  pc.default_price,
  coalesce(sum(case
    when im.movement_type in ('purchase', 'transfer_in', 'return') then im.quantity
    when im.movement_type in ('sale', 'transfer_out', 'waste', 'adjustment') then -im.quantity
    else 0
  end), 0),
  max(im.created_at)
from inventory_movements im
join parts_catalog pc on pc.id = im.part_id
group by im.organization_id, im.branch_id, im.part_id, pc.name, pc.part_number, pc.category, pc.unit, pc.default_price;
