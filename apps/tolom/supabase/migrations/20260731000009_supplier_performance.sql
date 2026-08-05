-- Supplier performance metrics view
-- Calculates supplier metrics from PO and return data
-- TOLOM auto repair SaaS platform
-- Created: 2026-07-31

-- Drop if exists (idempotent)
drop view if exists supplier_performance;

-- Create a view for supplier performance metrics
create view supplier_performance
with (security_invoker = true)
as
select
  s.id as supplier_id,
  s.organization_id,
  s.name as supplier_name,
  count(distinct po.id) as total_pos,
  count(distinct po.id) filter (where po.status = 'received') as completed_pos,
  count(distinct poi.id) as total_items_ordered,
  coalesce(sum(poi.quantity_ordered), 0) as total_quantity_ordered,
  coalesce(avg(poi.unit_cost), 0) as avg_unit_cost,
  max(po.created_at) as last_order_date
from suppliers s
left join purchase_orders po on po.supplier_id = s.id and po.deleted_at is null
left join purchase_order_items poi on poi.purchase_order_id = po.id
where s.deleted_at is null
group by s.id, s.organization_id, s.name;
