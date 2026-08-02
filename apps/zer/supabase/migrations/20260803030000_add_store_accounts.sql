-- =============================================
-- Store buyer accounts
--
-- 1. store_accounts: 1:1 buyer profile rows keyed on auth.users.id.
-- 2. sales.store_account_id: links a sale to the buyer who placed it.
-- 3. RLS: buyers can SELECT only their own sales rows.
-- 4. get_my_orders(): buyer order history RPC (SECURITY DEFINER).
-- =============================================

-- =============================================
-- 1. store_accounts table
-- =============================================
CREATE TABLE IF NOT EXISTS public.store_accounts (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  phone text,
  display_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.store_accounts ENABLE ROW LEVEL SECURITY;

-- Own-row policies: a buyer manages exactly their own store account row.
DROP POLICY IF EXISTS store_accounts_select_own ON public.store_accounts;
CREATE POLICY store_accounts_select_own ON public.store_accounts
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS store_accounts_insert_own ON public.store_accounts;
CREATE POLICY store_accounts_insert_own ON public.store_accounts
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS store_accounts_update_own ON public.store_accounts;
CREATE POLICY store_accounts_update_own ON public.store_accounts
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

GRANT SELECT, INSERT, UPDATE ON public.store_accounts TO authenticated;
GRANT ALL PRIVILEGES ON public.store_accounts TO service_role;

-- =============================================
-- 2. Link sales to store accounts
-- =============================================
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS store_account_id uuid REFERENCES public.store_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_store_account ON public.sales (store_account_id);

-- =============================================
-- 3. RLS: buyers may SELECT only their own sales rows.
--    Existing org policies (org-scoped, permission-gated) are untouched;
--    this is an additive OR branch that only matches buyer-owned rows.
-- =============================================
DROP POLICY IF EXISTS sales_select_own_store_account ON public.sales;
CREATE POLICY sales_select_own_store_account ON public.sales
  FOR SELECT USING (auth.uid() = store_account_id);

-- Explicit SELECT grant so buyer queries are not dependent on project
-- default privileges (existing org policies already rely on it).
GRANT SELECT ON public.sales TO authenticated;

-- =============================================
-- 4. get_my_orders() — buyer order history
--    SECURITY DEFINER so buyers can read their own sales rows without
--    the org-scoped sales SELECT permission. Filtering is pinned to
--    auth.uid() inside the function, so no cross-buyer leakage.
-- =============================================
CREATE OR REPLACE FUNCTION public.get_my_orders()
RETURNS TABLE(
  id uuid,
  invoice_number text,
  total_amount numeric,
  status text,
  created_at timestamptz,
  items jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    i.invoice_number,
    s.total_amount,
    s.status,
    s.created_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'product_id', si.product_id,
            'name', p.name,
            'quantity', si.quantity,
            'unit_price', si.unit_price,
            'total_price', si.total_price
          )
        )
        FROM public.sale_items si
        LEFT JOIN public.products p ON p.id = si.product_id
        WHERE si.sale_id = s.id
          AND si.deleted_at IS NULL
      ),
      '[]'::jsonb
    ) AS items
  FROM public.sales s
  LEFT JOIN public.invoices i ON i.sale_id = s.id
  WHERE s.store_account_id = auth.uid()
    AND s.deleted_at IS NULL
  ORDER BY s.created_at DESC
  LIMIT 100;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_orders() TO authenticated;
