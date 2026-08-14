-- Add public_token to estimates for public sharing (like invoices)
-- and create a SECURITY DEFINER RPC for public access.

-- 1. Add public_token column with auto-generated token
ALTER TABLE estimates
  ADD COLUMN IF NOT EXISTS public_token text;

-- Backfill existing estimates with tokens
UPDATE estimates
  SET public_token = encode(gen_random_bytes(24), 'hex')
  WHERE public_token IS NULL;

-- Make it NOT NULL with a default for new rows
ALTER TABLE estimates
  ALTER COLUMN public_token SET DEFAULT encode(gen_random_bytes(24), 'hex'),
  ALTER COLUMN public_token SET NOT NULL;

-- Unique index for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_estimates_public_token
  ON estimates (public_token)
  WHERE deleted_at IS NULL;

-- 2. SECURITY DEFINER RPC for public estimate access
CREATE OR REPLACE FUNCTION get_public_estimate_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', e.id,
    'estimate_number', e.estimate_number,
    'status', e.status,
    'created_at', e.created_at,
    'valid_until', e.valid_until,
    'notes', e.notes,
    'terms', e.terms,
    'subtotal', e.subtotal,
    'discount_amount', e.discount_amount,
    'discount_percentage', e.discount_percentage,
    'discount_total', e.discount_total,
    'tax_total', e.tax_total,
    'grand_total', e.grand_total,
    'customer', jsonb_build_object(
      'first_name', c.first_name,
      'last_name', c.last_name,
      'phone', c.phone,
      'email', c.email
    ),
    'vehicle', jsonb_build_object(
      'plate_number', v.plate_number,
      'make', v.make,
      'model', v.model,
      'year', v.year
    ),
    'items', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'description', ei.description,
          'item_type', ei.item_type,
          'quantity', ei.quantity,
          'unit_price', ei.unit_price,
          'discount_amount', ei.discount_amount,
          'discount_percentage', ei.discount_percentage,
          'line_total', ei.line_total
        )
        ORDER BY ei.sort_order
      ), '[]'::jsonb)
      FROM estimate_items ei
      WHERE ei.estimate_id = e.id
    ),
    'organization', jsonb_build_object(
      'name', o.name,
      'phone', o.phone,
      'email', o.email,
      'address', o.address
    )
  ) INTO result
  FROM estimates e
  LEFT JOIN customers c ON c.id = e.customer_id
  LEFT JOIN vehicles v ON v.id = e.vehicle_id
  LEFT JOIN organizations o ON o.id = e.organization_id
  WHERE e.public_token = p_token
    AND e.deleted_at IS NULL;

  RETURN result;
END;
$$;

-- Grant execute to anon (public access)
GRANT EXECUTE ON FUNCTION get_public_estimate_by_token(text) TO anon;
