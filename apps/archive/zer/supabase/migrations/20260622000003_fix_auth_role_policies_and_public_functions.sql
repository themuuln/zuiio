-- =============================================
-- 1. Fix deprecated auth.role() policies
--    Replace with TO authenticated clause
-- =============================================
DROP POLICY IF EXISTS "app_config_insert_authenticated" ON public.app_config;
DROP POLICY IF EXISTS "app_config_select_authenticated" ON public.app_config;
DROP POLICY IF EXISTS "app_config_update_authenticated" ON public.app_config;
DROP POLICY IF EXISTS "org_insert" ON public.organizations;

CREATE POLICY "app_config_insert" ON public.app_config
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "app_config_select" ON public.app_config
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "app_config_update" ON public.app_config
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "org_insert" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- =============================================
-- 2. Fix get_public_* functions: safe search_path
-- =============================================
CREATE OR REPLACE FUNCTION public.get_public_product(p_slug TEXT, p_product_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id UUID;
  v_org_name TEXT;
  v_currency TEXT;
  v_company_type TEXT;
  v_product JSONB;
BEGIN
  SELECT id, name, currency, company_type
  INTO v_org_id, v_org_name, v_currency, v_company_type
  FROM public.organizations
  WHERE slug = p_slug;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'sku', p.sku,
    'barcode', p.barcode,
    'unit', p.unit,
    'cost_price', p.cost_price,
    'sale_price', p.sale_price,
    'current_stock', p.current_stock,
    'min_stock', p.min_stock,
    'category_name', c.name,
    'created_at', p.created_at
  ) INTO v_product
  FROM public.products p
  LEFT JOIN public.categories c ON c.id = p.category_id
  WHERE p.organization_id = v_org_id AND p.id = p_product_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'organization', jsonb_build_object(
      'name', v_org_name,
      'slug', p_slug,
      'currency', COALESCE(v_currency, 'MNT'),
      'companyType', v_company_type
    ),
    'product', v_product
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_products(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id UUID;
  v_org_name TEXT;
  v_currency TEXT;
  v_company_type TEXT;
  v_org JSONB;
  v_products JSONB;
BEGIN
  SELECT id, name, currency, company_type
  INTO v_org_id, v_org_name, v_currency, v_company_type
  FROM public.organizations
  WHERE slug = p_slug;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_org := jsonb_build_object(
    'name', v_org_name,
    'slug', p_slug,
    'currency', COALESCE(v_currency, 'MNT'),
    'companyType', v_company_type
  );

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'sku', p.sku,
      'barcode', p.barcode,
      'unit', p.unit,
      'sale_price', p.sale_price,
      'current_stock', p.current_stock,
      'min_stock', p.min_stock,
      'category_name', c.name
    )
    ORDER BY p.name
  ) INTO v_products
  FROM public.products p
  LEFT JOIN public.categories c ON c.id = p.category_id
  WHERE p.organization_id = v_org_id;

  RETURN jsonb_build_object(
    'organization', v_org,
    'products', COALESCE(v_products, '[]'::JSONB)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_report_data(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id UUID;
  v_date_from DATE;
  v_date_to DATE;
  v_financial JSONB;
  v_products JSONB;
  v_expenses JSONB;
  v_stock JSONB;
  v_pending JSONB;
  v_total_sales NUMERIC;
  v_total_paid NUMERIC;
  v_total_expenses NUMERIC;
  v_cogs NUMERIC;
BEGIN
  SELECT organization_id, date_from, date_to
  INTO v_org_id, v_date_from, v_date_to
  FROM public.shared_reports
  WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(total_amount), 0), COALESCE(SUM(paid_amount), 0)
  INTO v_total_sales, v_total_paid
  FROM public.sales
  WHERE organization_id = v_org_id
    AND sale_date >= v_date_from AND sale_date <= v_date_to
    AND status != 'cancelled';

  SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
  FROM public.expenses
  WHERE organization_id = v_org_id
    AND expense_date >= v_date_from AND expense_date <= v_date_to;

  SELECT COALESCE(SUM(si.quantity * COALESCE(p.cost_price, 0)), 0) INTO v_cogs
  FROM public.sale_items si
  JOIN public.products p ON p.id = si.product_id
  JOIN public.sales s ON s.id = si.sale_id
  WHERE s.organization_id = v_org_id
    AND s.sale_date >= v_date_from AND s.sale_date <= v_date_to
    AND s.status != 'cancelled';

  v_financial := jsonb_build_object(
    'totalSales', v_total_sales,
    'totalPaid', v_total_paid,
    'totalExpenses', v_total_expenses,
    'netCash', v_total_paid - v_total_expenses,
    'grossProfit', v_total_sales - v_cogs
  );

  SELECT jsonb_agg(sub.items ORDER BY sub.revenue DESC) INTO v_products
  FROM (
    SELECT
      jsonb_build_object(
        'productName', p.name,
        'quantity', SUM(si.quantity),
        'revenue', SUM(si.total_price),
        'cost', SUM(si.quantity * COALESCE(p.cost_price, 0)),
        'profit', SUM(si.total_price) - SUM(si.quantity * COALESCE(p.cost_price, 0)),
        'margin', CASE WHEN SUM(si.total_price) > 0
          THEN ROUND(((SUM(si.total_price) - SUM(si.quantity * COALESCE(p.cost_price, 0))) / SUM(si.total_price) * 100)::NUMERIC, 1)
          ELSE 0 END
      ) AS items,
      SUM(si.total_price) AS revenue
    FROM public.sale_items si
    JOIN public.products p ON p.id = si.product_id
    JOIN public.sales s ON s.id = si.sale_id
    WHERE s.organization_id = v_org_id
      AND s.sale_date >= v_date_from AND s.sale_date <= v_date_to
      AND s.status != 'cancelled'
    GROUP BY p.name
  ) sub;
  v_products := COALESCE(v_products, '[]'::JSONB);

  SELECT jsonb_agg(sub.items ORDER BY sub.total DESC) INTO v_expenses
  FROM (
    SELECT
      jsonb_build_object(
        'category', e.category,
        'count', COUNT(*),
        'total', SUM(e.amount)
      ) AS items,
      SUM(e.amount) AS total
    FROM public.expenses e
    WHERE e.organization_id = v_org_id
      AND e.expense_date >= v_date_from AND e.expense_date <= v_date_to
    GROUP BY e.category
  ) sub;
  v_expenses := COALESCE(v_expenses, '[]'::JSONB);

  SELECT jsonb_build_object(
    'in', COALESCE(SUM(CASE WHEN type = 'in' THEN 1 ELSE 0 END), 0),
    'out', COALESCE(SUM(CASE WHEN type = 'out' THEN 1 ELSE 0 END), 0),
    'adjustment', COALESCE(SUM(CASE WHEN type = 'adjustment' THEN 1 ELSE 0 END), 0)
  ) INTO v_stock
  FROM public.stock_movements sm
  WHERE sm.organization_id = v_org_id
    AND sm.created_at >= v_date_from::TIMESTAMPTZ
    AND sm.created_at < (v_date_to::DATE + 1)::TIMESTAMPTZ;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'contactName', c.name,
      'saleDate', s.sale_date::TEXT,
      'totalAmount', s.total_amount,
      'paymentMethod', s.payment_method
    )
    ORDER BY s.sale_date DESC
  ) INTO v_pending
  FROM public.sales s
  LEFT JOIN public.contacts c ON c.id = s.contact_id
  WHERE s.organization_id = v_org_id
    AND s.status = 'pending'
    AND s.sale_date >= v_date_from AND s.sale_date <= v_date_to;
  v_pending := COALESCE(v_pending, '[]'::JSONB);

  RETURN jsonb_build_object(
    'financialSummary', v_financial,
    'productSales', v_products,
    'expenseBreakdown', v_expenses,
    'stockMovements', v_stock,
    'pendingSales', v_pending
  );
END;
$$;

-- =============================================
-- 3. Fix handle_new_user trigger: safe search_path
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- =============================================
-- 4. Fix public bucket listing for brand_assets
-- =============================================
DROP POLICY IF EXISTS "Public can read brand assets" ON storage.objects;

CREATE POLICY "Public can read brand assets"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'brand_assets'
    AND (storage.foldername(name))[1] IS NOT NULL
  );
