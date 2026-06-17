-- =============================================
-- New Features Migration:
-- 1. Purchase / Procurement
-- 2. Quotations / Estimates
-- 3. Returns Management
-- 4. Double-Entry Accounting / GL
-- 5. Discounts & Promotions
-- 6. SMTP / Email infrastructure
-- =============================================

-- =============================================
-- 0. Add new values to app_permission enum
-- =============================================
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'purchases.create';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'purchases.read';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'purchases.update';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'purchases.delete';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'quotations.create';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'quotations.read';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'quotations.update';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'quotations.delete';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'returns.create';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'returns.read';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'returns.update';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'returns.delete';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'accounting.manage';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'discounts.create';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'discounts.read';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'discounts.update';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'discounts.delete';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'emails.manage';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 1. Purchase Orders
-- =============================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'partially_received', 'received', 'cancelled')),
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  description TEXT,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
  unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  received_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Purchase order number sequence
CREATE SEQUENCE IF NOT EXISTS public.purchase_order_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_purchase_order_number()
RETURNS TEXT
LANGUAGE SQL
AS $$
  SELECT 'PO-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('public.purchase_order_number_seq')::TEXT, 4, '0');
$$;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_organization_id ON public.purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON public.purchase_order_items(product_id);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. Quotations / Estimates
-- =============================================
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  quote_number TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted')),
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  converted_to_sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  description TEXT,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS public.quote_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TEXT
LANGUAGE SQL
AS $$
  SELECT 'Q-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('public.quote_number_seq')::TEXT, 4, '0');
$$;

CREATE INDEX IF NOT EXISTS idx_quotations_organization_id ON public.quotations(organization_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_contact_id ON public.quotations(contact_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON public.quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_product_id ON public.quotation_items(product_id);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. Returns Management
-- =============================================
CREATE TABLE IF NOT EXISTS public.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  return_number TEXT NOT NULL,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('sales_return', 'purchase_return')),
  reference_type TEXT CHECK (reference_type IN ('sale', 'purchase_order')),
  reference_id UUID,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'completed', 'cancelled')),
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  reason TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID REFERENCES public.returns(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity NUMERIC(12, 2) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS public.return_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_return_number()
RETURNS TEXT
LANGUAGE SQL
AS $$
  SELECT 'R-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('public.return_number_seq')::TEXT, 4, '0');
$$;

CREATE INDEX IF NOT EXISTS idx_returns_organization_id ON public.returns(organization_id);
CREATE INDEX IF NOT EXISTS idx_returns_type ON public.returns(type);
CREATE INDEX IF NOT EXISTS idx_returns_status ON public.returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_reference_id ON public.returns(reference_id);
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON public.return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_return_items_product_id ON public.return_items(product_id);

ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. Double-Entry Accounting / GL
-- =============================================
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  parent_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, code)
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_number TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT NOT NULL,
  debit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  credit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_non_negative CHECK (debit_amount >= 0 AND credit_amount >= 0),
  CONSTRAINT chk_at_least_one CHECK (debit_amount > 0 OR credit_amount > 0)
);

CREATE SEQUENCE IF NOT EXISTS public.journal_entry_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
RETURNS TEXT
LANGUAGE SQL
AS $$
  SELECT 'JE-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('public.journal_entry_number_seq')::TEXT, 4, '0');
$$;

CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_org ON public.chart_of_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_type ON public.chart_of_accounts(type);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent ON public.chart_of_accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_org ON public.journal_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON public.journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_reference ON public.journal_entries(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry ON public.journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account ON public.journal_entry_lines(account_id);

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- Default chart of accounts seed function
CREATE OR REPLACE FUNCTION public.seed_default_chart_of_accounts(p_organization_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_asset_id UUID;
  v_liability_id UUID;
  v_equity_id UUID;
  v_income_id UUID;
  v_expense_id UUID;
BEGIN
  -- Asset group
  INSERT INTO public.chart_of_accounts (organization_id, code, name, type) VALUES (p_organization_id, '1000', 'Хөрөнгө', 'asset') RETURNING id INTO v_asset_id;
  INSERT INTO public.chart_of_accounts (organization_id, code, name, type, parent_id) VALUES (p_organization_id, '1100', 'Бэлэн мөнгө', 'asset', v_asset_id);
  INSERT INTO public.chart_of_accounts (organization_id, code, name, type, parent_id) VALUES (p_organization_id, '1200', 'Банкны данс', 'asset', v_asset_id);
  INSERT INTO public.chart_of_accounts (organization_id, code, name, type, parent_id) VALUES (p_organization_id, '1300', 'Авлага', 'asset', v_asset_id);
  INSERT INTO public.chart_of_accounts (organization_id, code, name, type, parent_id) VALUES (p_organization_id, '1400', 'Бараа материал', 'asset', v_asset_id);

  -- Liability group
  INSERT INTO public.chart_of_accounts (organization_id, code, name, type) VALUES (p_organization_id, '2000', 'Өр төлбөр', 'liability') RETURNING id INTO v_liability_id;
  INSERT INTO public.chart_of_accounts (organization_id, code, name, type, parent_id) VALUES (p_organization_id, '2100', 'Өглөг', 'liability', v_liability_id);
  INSERT INTO public.chart_of_accounts (organization_id, code, name, type, parent_id) VALUES (p_organization_id, '2200', 'Татвар', 'liability', v_liability_id);

  -- Equity group
  INSERT INTO public.chart_of_accounts (organization_id, code, name, type) VALUES (p_organization_id, '3000', 'Өмч', 'equity') RETURNING id INTO v_equity_id;
  INSERT INTO public.chart_of_accounts (organization_id, code, name, type, parent_id) VALUES (p_organization_id, '3100', 'Анхны хөрөнгө', 'equity', v_equity_id);
  INSERT INTO public.chart_of_accounts (organization_id, code, name, type, parent_id) VALUES (p_organization_id, '3200', 'Хуримтлагдсан ашиг', 'equity', v_equity_id);

  -- Income group
  INSERT INTO public.chart_of_accounts (organization_id, code, name, type) VALUES (p_organization_id, '4000', 'Орлого', 'income') RETURNING id INTO v_income_id;
  INSERT INTO public.chart_of_accounts (organization_id, code, name, type, parent_id) VALUES (p_organization_id, '4100', 'Борлуулалтын орлого', 'income', v_income_id);
  INSERT INTO public.chart_of_accounts (organization_id, code, name, type, parent_id) VALUES (p_organization_id, '4200', 'Бусад орлого', 'income', v_income_id);

  -- Expense group
  INSERT INTO public.chart_of_accounts (organization_id, code, name, type) VALUES (p_organization_id, '5000', 'Зарлага', 'expense') RETURNING id INTO v_expense_id;
  INSERT INTO public.chart_of_accounts (organization_id, code, name, type, parent_id) VALUES (p_organization_id, '5100', 'Борлуулсан бүтээгдэхүүний өртөг', 'expense', v_expense_id);
  INSERT INTO public.chart_of_accounts (organization_id, code, name, type, parent_id) VALUES (p_organization_id, '5200', 'Үйл ажиллагааны зарлага', 'expense', v_expense_id);
  INSERT INTO public.chart_of_accounts (organization_id, code, name, type, parent_id) VALUES (p_organization_id, '5300', 'Тарифаас бусад зарлага', 'expense', v_expense_id);
END;
$$;

-- Trial balance function
CREATE OR REPLACE FUNCTION public.get_trial_balance(p_organization_id UUID, p_as_of_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(account_id UUID, account_code TEXT, account_name TEXT, account_type TEXT, debit_balance NUMERIC, credit_balance NUMERIC)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    c.id AS account_id,
    c.code,
    c.name,
    c.type,
    CASE WHEN c.type IN ('asset', 'expense')
      THEN COALESCE(SUM(jl.debit_amount), 0) - COALESCE(SUM(jl.credit_amount), 0)
      ELSE 0
    END AS debit_balance,
    CASE WHEN c.type IN ('liability', 'equity', 'income')
      THEN COALESCE(SUM(jl.credit_amount), 0) - COALESCE(SUM(jl.debit_amount), 0)
      ELSE 0
    END AS credit_balance
  FROM public.chart_of_accounts c
  LEFT JOIN public.journal_entry_lines jl ON jl.account_id = c.id
  LEFT JOIN public.journal_entries je ON je.id = jl.journal_entry_id AND je.entry_date <= p_as_of_date AND je.organization_id = p_organization_id
  WHERE c.organization_id = p_organization_id
  GROUP BY c.id, c.code, c.name, c.type
  ORDER BY c.code;
$$;

-- =============================================
-- 5. Discounts & Promotions
-- =============================================
CREATE TABLE IF NOT EXISTS public.discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount')),
  value NUMERIC(12, 2) NOT NULL,
  applies_to TEXT NOT NULL DEFAULT 'all'
    CHECK (applies_to IN ('all', 'selected_products', 'selected_categories')),
  min_purchase_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.discount_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id UUID REFERENCES public.discounts(id) ON DELETE CASCADE NOT NULL,
  condition_type TEXT NOT NULL CHECK (condition_type IN ('product', 'category')),
  condition_value UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discounts_org ON public.discounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON public.discounts(is_active);
CREATE INDEX IF NOT EXISTS idx_discount_conditions_discount ON public.discount_conditions(discount_id);

ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_conditions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. SMTP / Email Infrastructure
-- =============================================
CREATE TABLE IF NOT EXISTS public.smtp_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host TEXT NOT NULL DEFAULT 'smtp.gmail.com',
  port INTEGER NOT NULL DEFAULT 587,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  daily_count INTEGER NOT NULL DEFAULT 0,
  last_reset_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.report_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  recipient_email TEXT NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  smtp_config_id UUID REFERENCES public.smtp_configs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add report_email columns to organizations if not present
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS report_email_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS report_email_recipient TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS report_email_time TIME DEFAULT '09:00'::TIME;

CREATE INDEX IF NOT EXISTS idx_report_email_log_org ON public.report_email_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_report_email_log_status ON public.report_email_log(status);

ALTER TABLE public.report_email_log ENABLE ROW LEVEL SECURITY;

-- SMTP count tracker
CREATE OR REPLACE FUNCTION public.increment_smtp_count(p_config_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.smtp_configs
  SET
    daily_count = daily_count + 1,
    last_reset_date = CURRENT_DATE
  WHERE id = p_config_id;
END;
$$;

-- pg_cron scheduling helpers (these just interact with the cron schema if available)
CREATE OR REPLACE FUNCTION public.schedule_daily_report_cron(p_app_url TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function is called manually or via migration.
  -- It expects pg_cron extension to be available.
  -- If not, it returns a notice.
  BEGIN
    PERFORM cron.schedule('daily-report-email', '0 9 * * *',
      'SELECT net.http_post(
        url:=''' || p_app_url || '/api/cron/daily-report'',
        headers:=''{"Content-Type": "application/json"}''
      )'
    );
    RETURN 'Cron job scheduled for 09:00 daily.';
  EXCEPTION WHEN undefined_table THEN
    RETURN 'pg_cron not available. Schedule manually: run cron at 09:00 hitting ' || p_app_url || '/api/cron/daily-report';
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.unschedule_daily_report_cron()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('daily-report-email');
    RETURN 'Cron job unscheduled.';
  EXCEPTION WHEN undefined_table THEN
    RETURN 'pg_cron not available. Remove schedule manually.';
  END;
END;
$$;

-- =============================================
-- RLS Policies (all use has_permission)
-- =============================================

-- --- Purchase Orders ---
CREATE POLICY "purchase_orders_select_own_org" ON public.purchase_orders
  FOR SELECT USING (
    organization_id = get_current_organization()
    AND has_permission('purchases.read'::public.app_permission)
  );
CREATE POLICY "purchase_orders_insert_own_org" ON public.purchase_orders
  FOR INSERT WITH CHECK (
    organization_id = get_current_organization()
    AND has_permission('purchases.create'::public.app_permission)
  );
CREATE POLICY "purchase_orders_update_own_org" ON public.purchase_orders
  FOR UPDATE USING (
    organization_id = get_current_organization()
    AND has_permission('purchases.update'::public.app_permission)
  );
CREATE POLICY "purchase_orders_delete_own_org" ON public.purchase_orders
  FOR DELETE USING (
    organization_id = get_current_organization()
    AND has_permission('purchases.delete'::public.app_permission)
  );

CREATE POLICY "purchase_order_items_select_own_org" ON public.purchase_order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_id AND po.organization_id = get_current_organization())
    AND has_permission('purchases.read'::public.app_permission)
  );
CREATE POLICY "purchase_order_items_insert_own_org" ON public.purchase_order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_id AND po.organization_id = get_current_organization())
    AND has_permission('purchases.create'::public.app_permission)
  );
CREATE POLICY "purchase_order_items_update_own_org" ON public.purchase_order_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_id AND po.organization_id = get_current_organization())
    AND has_permission('purchases.update'::public.app_permission)
  );
CREATE POLICY "purchase_order_items_delete_own_org" ON public.purchase_order_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_id AND po.organization_id = get_current_organization())
    AND has_permission('purchases.delete'::public.app_permission)
  );

-- --- Quotations ---
CREATE POLICY "quotations_select_own_org" ON public.quotations
  FOR SELECT USING (
    organization_id = get_current_organization()
    AND has_permission('quotations.read'::public.app_permission)
  );
CREATE POLICY "quotations_insert_own_org" ON public.quotations
  FOR INSERT WITH CHECK (
    organization_id = get_current_organization()
    AND has_permission('quotations.create'::public.app_permission)
  );
CREATE POLICY "quotations_update_own_org" ON public.quotations
  FOR UPDATE USING (
    organization_id = get_current_organization()
    AND has_permission('quotations.update'::public.app_permission)
  );
CREATE POLICY "quotations_delete_own_org" ON public.quotations
  FOR DELETE USING (
    organization_id = get_current_organization()
    AND has_permission('quotations.delete'::public.app_permission)
  );

CREATE POLICY "quotation_items_select_own_org" ON public.quotation_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.quotations q WHERE q.id = quotation_id AND q.organization_id = get_current_organization())
    AND has_permission('quotations.read'::public.app_permission)
  );
CREATE POLICY "quotation_items_insert_own_org" ON public.quotation_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.quotations q WHERE q.id = quotation_id AND q.organization_id = get_current_organization())
    AND has_permission('quotations.create'::public.app_permission)
  );
CREATE POLICY "quotation_items_update_own_org" ON public.quotation_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.quotations q WHERE q.id = quotation_id AND q.organization_id = get_current_organization())
    AND has_permission('quotations.update'::public.app_permission)
  );
CREATE POLICY "quotation_items_delete_own_org" ON public.quotation_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.quotations q WHERE q.id = quotation_id AND q.organization_id = get_current_organization())
    AND has_permission('quotations.delete'::public.app_permission)
  );

-- --- Returns ---
CREATE POLICY "returns_select_own_org" ON public.returns
  FOR SELECT USING (
    organization_id = get_current_organization()
    AND has_permission('returns.read'::public.app_permission)
  );
CREATE POLICY "returns_insert_own_org" ON public.returns
  FOR INSERT WITH CHECK (
    organization_id = get_current_organization()
    AND has_permission('returns.create'::public.app_permission)
  );
CREATE POLICY "returns_update_own_org" ON public.returns
  FOR UPDATE USING (
    organization_id = get_current_organization()
    AND has_permission('returns.update'::public.app_permission)
  );
CREATE POLICY "returns_delete_own_org" ON public.returns
  FOR DELETE USING (
    organization_id = get_current_organization()
    AND has_permission('returns.delete'::public.app_permission)
  );

CREATE POLICY "return_items_select_own_org" ON public.return_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.returns r WHERE r.id = return_id AND r.organization_id = get_current_organization())
    AND has_permission('returns.read'::public.app_permission)
  );
CREATE POLICY "return_items_insert_own_org" ON public.return_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.returns r WHERE r.id = return_id AND r.organization_id = get_current_organization())
    AND has_permission('returns.create'::public.app_permission)
  );
CREATE POLICY "return_items_update_own_org" ON public.return_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.returns r WHERE r.id = return_id AND r.organization_id = get_current_organization())
    AND has_permission('returns.update'::public.app_permission)
  );
CREATE POLICY "return_items_delete_own_org" ON public.return_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.returns r WHERE r.id = return_id AND r.organization_id = get_current_organization())
    AND has_permission('returns.delete'::public.app_permission)
  );

-- --- Chart of Accounts ---
CREATE POLICY "chart_of_accounts_select_own_org" ON public.chart_of_accounts
  FOR SELECT USING (
    organization_id = get_current_organization()
    AND has_permission('accounting.manage'::public.app_permission)
  );
CREATE POLICY "chart_of_accounts_insert_own_org" ON public.chart_of_accounts
  FOR INSERT WITH CHECK (
    organization_id = get_current_organization()
    AND has_permission('accounting.manage'::public.app_permission)
  );
CREATE POLICY "chart_of_accounts_update_own_org" ON public.chart_of_accounts
  FOR UPDATE USING (
    organization_id = get_current_organization()
    AND has_permission('accounting.manage'::public.app_permission)
  );
CREATE POLICY "chart_of_accounts_delete_own_org" ON public.chart_of_accounts
  FOR DELETE USING (
    organization_id = get_current_organization()
    AND has_permission('accounting.manage'::public.app_permission)
  );

-- --- Journal Entries ---
CREATE POLICY "journal_entries_select_own_org" ON public.journal_entries
  FOR SELECT USING (
    organization_id = get_current_organization()
    AND has_permission('accounting.manage'::public.app_permission)
  );
CREATE POLICY "journal_entries_insert_own_org" ON public.journal_entries
  FOR INSERT WITH CHECK (
    organization_id = get_current_organization()
    AND has_permission('accounting.manage'::public.app_permission)
  );

CREATE POLICY "journal_entry_lines_select_own_org" ON public.journal_entry_lines
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.journal_entries je WHERE je.id = journal_entry_id AND je.organization_id = get_current_organization())
    AND has_permission('accounting.manage'::public.app_permission)
  );
CREATE POLICY "journal_entry_lines_insert_own_org" ON public.journal_entry_lines
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.journal_entries je WHERE je.id = journal_entry_id AND je.organization_id = get_current_organization())
    AND has_permission('accounting.manage'::public.app_permission)
  );

-- --- Discounts ---
CREATE POLICY "discounts_select_own_org" ON public.discounts
  FOR SELECT USING (
    organization_id = get_current_organization()
    AND has_permission('discounts.read'::public.app_permission)
  );
CREATE POLICY "discounts_insert_own_org" ON public.discounts
  FOR INSERT WITH CHECK (
    organization_id = get_current_organization()
    AND has_permission('discounts.create'::public.app_permission)
  );
CREATE POLICY "discounts_update_own_org" ON public.discounts
  FOR UPDATE USING (
    organization_id = get_current_organization()
    AND has_permission('discounts.update'::public.app_permission)
  );
CREATE POLICY "discounts_delete_own_org" ON public.discounts
  FOR DELETE USING (
    organization_id = get_current_organization()
    AND has_permission('discounts.delete'::public.app_permission)
  );

CREATE POLICY "discount_conditions_select_own_org" ON public.discount_conditions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.discounts d WHERE d.id = discount_id AND d.organization_id = get_current_organization())
    AND has_permission('discounts.read'::public.app_permission)
  );
CREATE POLICY "discount_conditions_insert_own_org" ON public.discount_conditions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.discounts d WHERE d.id = discount_id AND d.organization_id = get_current_organization())
    AND has_permission('discounts.create'::public.app_permission)
  );

-- --- Report Email Log ---
CREATE POLICY "report_email_log_select_own_org" ON public.report_email_log
  FOR SELECT USING (
    organization_id = get_current_organization()
    AND has_permission('emails.manage'::public.app_permission)
  );
CREATE POLICY "report_email_log_insert_own_org" ON public.report_email_log
  FOR INSERT WITH CHECK (
    organization_id = get_current_organization()
    AND has_permission('emails.manage'::public.app_permission)
  );

-- Seed default roles with new permissions
-- This gives owner and admin roles the new permissions automatically
DO $$
DECLARE
  r RECORD;
  perm public.app_permission;
BEGIN
  -- For each owner role in every org, grant all new permissions
  FOR r IN SELECT id, organization_id FROM public.roles WHERE name = 'owner' AND is_system_role = true LOOP
    FOR perm IN
      SELECT p FROM unnest(enum_range(NULL::public.app_permission)) AS p
      WHERE p::TEXT IN (
        'purchases.create', 'purchases.read', 'purchases.update', 'purchases.delete',
        'quotations.create', 'quotations.read', 'quotations.update', 'quotations.delete',
        'returns.create', 'returns.read', 'returns.update', 'returns.delete',
        'accounting.manage',
        'discounts.create', 'discounts.read', 'discounts.update', 'discounts.delete',
        'emails.manage'
      )
    LOOP
      INSERT INTO public.role_permissions (role_id, permission)
      VALUES (r.id, perm)
      ON CONFLICT (role_id, permission) DO NOTHING;
    END LOOP;
  END LOOP;

  -- For each admin role, grant all new permissions except accounting.manage and emails.manage
  FOR r IN SELECT id, organization_id FROM public.roles WHERE name = 'admin' AND is_system_role = true LOOP
    FOR perm IN
      SELECT p FROM unnest(enum_range(NULL::public.app_permission)) AS p
      WHERE p::TEXT IN (
        'purchases.create', 'purchases.read', 'purchases.update', 'purchases.delete',
        'quotations.create', 'quotations.read', 'quotations.update', 'quotations.delete',
        'returns.create', 'returns.read', 'returns.update', 'returns.delete',
        'discounts.create', 'discounts.read', 'discounts.update', 'discounts.delete'
      )
    LOOP
      INSERT INTO public.role_permissions (role_id, permission)
      VALUES (r.id, perm)
      ON CONFLICT (role_id, permission) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Seed default chart of accounts for existing orgs that don't have one
DO $$
DECLARE
  org_rec RECORD;
  account_count INTEGER;
BEGIN
  FOR org_rec IN SELECT id FROM public.organizations LOOP
    SELECT COUNT(*) INTO account_count FROM public.chart_of_accounts WHERE organization_id = org_rec.id;
    IF account_count = 0 THEN
      PERFORM public.seed_default_chart_of_accounts(org_rec.id);
    END IF;
  END LOOP;
END $$;
