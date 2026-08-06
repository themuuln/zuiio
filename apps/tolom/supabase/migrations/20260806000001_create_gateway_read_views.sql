-- ============================================================================
-- Gateway read views (agent-gateway Read Engine)
--
-- invoice_items has no direct organization_id column; tenant isolation is
-- inherited through invoices. The Read Engine always injects
-- `organization_id = <tenant>` at compile time, so this view exposes the
-- tenant column through the parent join.
--
-- Access: SELECT granted to service_role only — the gateway's data client.
-- These views are NOT exposed to anon/authenticated.
-- ============================================================================

-- ─── invoice_items_v ────────────────────────────────────────────────────────
create or replace view public.invoice_items_v as
select
  ii.id,
  ii.invoice_id,
  ii.item_type,
  ii.description,
  ii.quantity,
  ii.unit_price,
  ii.total_price,
  ii.discount_amount,
  ii.tax_rate,
  ii.is_tax_exempt,
  ii.sort_order,
  ii.created_at,
  inv.organization_id,
  inv.issued_at
from public.invoice_items ii
join public.invoices inv on inv.id = ii.invoice_id;

-- ─── Grants ─────────────────────────────────────────────────────────────────
-- service_role only — the gateway's data client. anon/authenticated stay out.
grant select on public.invoice_items_v to service_role;
