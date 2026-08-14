-- ============================================================================
-- Gateway read views (agent-gateway Read Engine)
--
-- Line-item tables (sale_items, invoice_items, return_items,
-- purchase_order_items) have no direct organization_id column; tenant
-- isolation is inherited through their parent document. The Read Engine
-- always injects `organization_id = <tenant>` at compile time, so these
-- views expose the tenant column (plus useful parent/denormalized columns)
-- through the parent join.
--
-- Access: SELECT granted to service_role only — the gateway's data client.
-- These views are NOT exposed to anon/authenticated.
-- ============================================================================

-- ─── sale_items_v ───────────────────────────────────────────────────────────
create or replace view public.sale_items_v as
select
  si.id,
  si.sale_id,
  si.product_id,
  si.variant_id,
  si.quantity,
  si.unit_price,
  si.total_price,
  si.commission_amount,
  si.deleted_at,
  s.organization_id,
  s.sale_date,
  p.name as product_name
from public.sale_items si
join public.sales s on s.id = si.sale_id
left join public.products p on p.id = si.product_id;

-- ─── invoice_items_v ────────────────────────────────────────────────────────
create or replace view public.invoice_items_v as
select
  ii.id,
  ii.invoice_id,
  ii.product_id,
  ii.variant_id,
  ii.description,
  ii.quantity,
  ii.unit_price,
  ii.total_price,
  ii.deleted_at,
  inv.organization_id,
  inv.issue_date,
  p.name as product_name
from public.invoice_items ii
join public.invoices inv on inv.id = ii.invoice_id
left join public.products p on p.id = ii.product_id;

-- ─── return_items_v ─────────────────────────────────────────────────────────
create or replace view public.return_items_v as
select
  ri.id,
  ri.return_id,
  ri.product_id,
  ri.variant_id,
  ri.quantity,
  ri.unit_price,
  ri.total_price,
  ri.reason,
  ri.created_at,
  ri.deleted_at,
  r.organization_id,
  r.return_date,
  p.name as product_name
from public.return_items ri
join public.returns r on r.id = ri.return_id
left join public.products p on p.id = ri.product_id;

-- ─── purchase_order_items_v ─────────────────────────────────────────────────
create or replace view public.purchase_order_items_v as
select
  poi.id,
  poi.purchase_order_id,
  poi.product_id,
  poi.variant_id,
  poi.description,
  poi.quantity,
  poi.received_quantity,
  poi.unit_cost,
  poi.total_cost,
  poi.created_at,
  poi.deleted_at,
  po.organization_id,
  po.order_date,
  p.name as product_name
from public.purchase_order_items poi
join public.purchase_orders po on po.id = poi.purchase_order_id
left join public.products p on p.id = poi.product_id;

-- ─── Grants ─────────────────────────────────────────────────────────────────
-- service_role only — the gateway's data client. anon/authenticated stay out.
grant select on public.sale_items_v to service_role;
grant select on public.invoice_items_v to service_role;
grant select on public.return_items_v to service_role;
grant select on public.purchase_order_items_v to service_role;
