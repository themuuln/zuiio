create extension if not exists pg_cron;

drop view if exists inventory_balances cascade;

create materialized view inventory_balances as
select
  im.organization_id,
  im.branch_id,
  im.part_id,
  pc.name as part_name,
  pc.part_number,
  pc.category,
  pc.unit,
  pc.default_price,
  coalesce(sum(case
    when im.movement_type in ('purchase', 'transfer_in', 'return') then im.quantity
    when im.movement_type in ('sale', 'transfer_out', 'waste', 'adjustment') then -im.quantity
    else 0
  end), 0) as quantity_on_hand,
  max(im.created_at) as last_movement_at
from inventory_movements im
join parts_catalog pc on pc.id = im.part_id
group by im.organization_id, im.branch_id, im.part_id, pc.name, pc.part_number, pc.category, pc.unit, pc.default_price
with data;

create unique index if not exists idx_inventory_balances_unique
  on inventory_balances (organization_id, branch_id, part_id);

create index if not exists idx_inventory_balances_org
  on inventory_balances (organization_id);

do $$
begin
  perform cron.unschedule('refresh-inventory-balances');
exception
  when others then null;
end;
$$;

select cron.schedule(
  'refresh-inventory-balances',
  '*/5 * * * *',
  $$refresh materialized view concurrently inventory_balances$$
);
