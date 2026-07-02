create or replace function public.get_invoice_by_token(p_token text)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select json_build_object(
    'id', i.id,
    'invoice_number', i.invoice_number,
    'status', i.status,
    'subtotal', i.subtotal,
    'discount_total', i.discount_total,
    'total', i.total,
    'notes', i.notes,
    'customer_name', c.full_name,
    'customer_phone', c.phone,
    'customer_email', c.email,
    'organization_name', o.name,
    'organization_logo', o.logo_url,
    'items', coalesce(
      (select json_agg(json_build_object(
        'description', li.description,
        'quantity', li.quantity,
        'unit_price', li.unit_price,
        'total', li.total
      )) from invoice_items li where li.invoice_id = i.id),
      '[]'::json
    ),
    'payments', coalesce(
      (select json_agg(json_build_object(
        'amount', lp.amount,
        'method', lp.payment_method,
        'paid_at', lp.paid_at
      )) from invoice_payments lp where lp.invoice_id = i.id),
      '[]'::json
    ),
    'created_at', i.created_at
  ) into result
  from invoices i
  join customers c on c.id = i.customer_id
  join organizations o on o.id = i.organization_id
  where i.share_token = p_token;
  return result;
end;
$$;
