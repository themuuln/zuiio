create or replace function public.get_dashboard_quick_stats(p_organization_id uuid)
returns table (
  product_count bigint,
  customer_count bigint,
  supplier_count bigint,
  inventory_value numeric,
  low_stock_count bigint
)
language sql
security invoker
set search_path = ''
stable
as $$
  select
    (select count(*) from public.products p
      where p.organization_id = p_organization_id and p.deleted_at is null),
    (select count(*) from public.contacts c
      where c.organization_id = p_organization_id and c.type = 'customer'),
    (select count(*) from public.contacts c
      where c.organization_id = p_organization_id and c.type = 'supplier'),
    (select coalesce(sum(coalesce(p.cost_price, 0) * coalesce(p.current_stock, 0)), 0)
      from public.products p
      where p.organization_id = p_organization_id and p.deleted_at is null),
    (select count(*) from public.products p
      where p.organization_id = p_organization_id and p.deleted_at is null
        and coalesce(p.current_stock, 0) < coalesce(p.min_stock, 0));
$$;

grant execute on function public.get_dashboard_quick_stats(uuid) to authenticated;
