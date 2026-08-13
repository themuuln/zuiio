-- =============================================
-- Public order tracking for the storefront AI chat
--
-- Anonymous buyers who order through the chat (or the storefront) get an
-- order number (invoice number / sale id) but have no account, so the
-- authenticated-only get_public_order() (keyed by auth.uid()) can never
-- serve them. This RPC lets a buyer verify their own order with the
-- two facts they know — order number + contact phone — and returns the
-- status timeline and totals.
--
-- Privacy: only status, timeline, totals, items, payment method and
-- delivery status are returned. The buyer's address, phone, and email
-- are deliberately NOT included (they are the caller's own data and the
-- agent must not echo them back into the conversation).
-- =============================================

CREATE OR REPLACE FUNCTION public.get_public_order_status(
  p_slug text,
  p_order_number text,
  p_contact_phone text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id uuid;
  v_result jsonb;
BEGIN
  -- Resolve the org; unknown slug or disabled catalog → null.
  SELECT o.id INTO v_org_id
  FROM public.organizations o
  JOIN public.organization_public_profiles pp ON pp.organization_id = o.id
  WHERE o.slug = p_slug AND pp.catalog_enabled = true;

  IF NOT FOUND OR p_order_number IS NULL OR p_order_number = ''
     OR p_contact_phone IS NULL OR p_contact_phone = '' THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'order', jsonb_build_object(
      'id', s.id,
      'invoice_number', i.invoice_number,
      'status', s.status,
      'created_at', s.created_at,
      'total_amount', s.total_amount,
      'payment_method', s.payment_method,
      'currency_code', s.currency_code,
      'delivery_type', s.delivery_type,
      'status_history', COALESCE(s.status_history, '[]'::jsonb),
      'delivery', (
        SELECT jsonb_build_object(
          'status', d.status,
          'external_tracking_id', d.external_tracking_id
        )
        FROM public.deliveries d
        WHERE d.sale_id = s.id
        ORDER BY d.created_at DESC
        LIMIT 1
      ),
      'items', COALESCE(
        (
          SELECT jsonb_agg(jsonb_build_object(
            'product_id', si.product_id,
            'name', p.name,
            'quantity', si.quantity,
            'unit_price', si.unit_price,
            'total_price', si.total_price
          ))
          FROM public.sale_items si
          LEFT JOIN public.products p ON p.id = si.product_id
          WHERE si.sale_id = s.id
            AND si.deleted_at IS NULL
        ),
        '[]'::jsonb
      )
    )
  ) INTO v_result
  FROM public.sales s
  LEFT JOIN public.invoices i ON i.sale_id = s.id
  JOIN public.contacts c ON c.id = s.contact_id
  WHERE s.organization_id = v_org_id
    AND s.deleted_at IS NULL
    AND c.phone = p_contact_phone
    AND (i.invoice_number = p_order_number OR s.id::text = p_order_number);

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_order_status(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_order_status(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_order_status(text, text, text) TO authenticated;

-- Org-scoped lookup by buyer phone + order number (order tracking).
CREATE INDEX IF NOT EXISTS idx_contacts_org_phone ON public.contacts(organization_id, phone);
