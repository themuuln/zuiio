-- ============================================================================
-- Baseline migration: core tables that were created outside the migration
-- system. Generated from src/lib/database.types.ts.
--
-- All tables use CREATE TABLE IF NOT EXISTS so this is safe to replay.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. organizations (no internal FK dependencies)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name                        text NOT NULL,
    slug                        text NOT NULL,
    company_type                text NOT NULL DEFAULT 'retail',
    currency                    text,
    brand_config                jsonb,
    enabled_features            text[],
    has_audit_log               boolean,
    has_brands                  boolean,
    has_buddhist_presets        boolean,
    has_categories              boolean,
    has_checkout_customer       boolean,
    has_checkout_quick_amounts  boolean,
    has_customer_credit         boolean,
    has_email_reports           boolean,
    has_inventory               boolean,
    has_multi_branch            boolean,
    has_receipt_drawer          boolean,
    has_suppliers               boolean,
    has_track_stock             boolean,
    has_uom                     boolean,
    has_variants                boolean,
    onboarding_completed        boolean,
    report_email_enabled        boolean NOT NULL DEFAULT false,
    report_email_recipient      text,
    report_email_time           text,
    shop_default_payment_method text NOT NULL DEFAULT 'cash',
    created_at                  timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. profiles (FK -> organizations; branch_id/role_id added by later migrations)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       text,
    role            text,
    branch_id       uuid,
    organization_id uuid REFERENCES public.organizations(id),
    role_id         uuid,
    created_at      timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. categories (FK -> organizations)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    slug            text NOT NULL,
    organization_id uuid NOT NULL REFERENCES public.organizations(id),
    created_at      timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 4. contacts (FK -> organizations; customer_segment_id added by later migration)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contacts (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 text NOT NULL,
    type                 text NOT NULL,
    email                text,
    phone                text,
    address              text,
    balance              numeric,
    credit_limit         numeric,
    payment_terms_days   integer,
    points_balance       numeric,
    customer_segment_id  uuid,
    organization_id      uuid NOT NULL REFERENCES public.organizations(id),
    created_at           timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 5. products (FK -> organizations, categories, profiles; brand_id added later)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name                text NOT NULL,
    name_norm           text,
    description         text,
    sku                 text,
    barcode             text,
    unit                text,
    cost_price          numeric,
    sale_price          numeric,
    current_stock       numeric,
    min_stock           numeric,
    category_id         uuid REFERENCES public.categories(id),
    brand_id            uuid,
    image_url           text,
    image_urls          text[],
    additional_info     text,
    care_instructions   text,
    usage_instructions  text,
    material_type       text,
    has_variants        boolean NOT NULL DEFAULT false,
    is_public           boolean NOT NULL DEFAULT false,
    organization_id     uuid NOT NULL REFERENCES public.organizations(id),
    published_at        timestamptz,
    published_by        uuid REFERENCES public.profiles(id),
    search_vector       tsvector,
    deleted_at          timestamptz,
    created_at          timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 6. expenses (FK -> organizations; other FKs added by later migrations)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    amount          numeric NOT NULL,
    category        text NOT NULL,
    description     text,
    expense_date    date NOT NULL DEFAULT CURRENT_DATE,
    payment_method  text,
    original_amount numeric,
    exchange_rate   numeric,
    bank_account_id uuid,
    branch_id       uuid NOT NULL,
    currency_id     uuid,
    created_by      uuid,
    organization_id uuid NOT NULL REFERENCES public.organizations(id),
    deleted_at      timestamptz,
    created_at      timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 7. sales (FK -> organizations, contacts; other FKs added by later migrations)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    total_amount     numeric NOT NULL,
    paid_amount      numeric,
    sale_date        date NOT NULL DEFAULT CURRENT_DATE,
    payment_method   text,
    payment_splits   jsonb,
    notes            text,
    status           text,
    currency_code    text,
    currency_symbol  text,
    original_amount  numeric,
    exchange_rate    numeric,
    bank_account_id  uuid,
    branch_id        uuid NOT NULL,
    contact_id       uuid REFERENCES public.contacts(id),
    currency_id      uuid,
    created_by       uuid,
    salesperson_id   uuid,
    organization_id  uuid NOT NULL REFERENCES public.organizations(id),
    deleted_at       timestamptz,
    created_at       timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 8. sale_items (FK -> sales, products; variant_id added later)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sale_items (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quantity          numeric NOT NULL,
    unit_price        numeric NOT NULL,
    total_price       numeric NOT NULL,
    commission_amount numeric NOT NULL DEFAULT 0,
    product_id        uuid REFERENCES public.products(id),
    variant_id        uuid,
    sale_id           uuid NOT NULL REFERENCES public.sales(id),
    deleted_at        timestamptz
);

-- ---------------------------------------------------------------------------
-- 9. stock_movements (FK -> organizations, products; other FKs added later)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type                   text NOT NULL,
    quantity               numeric NOT NULL,
    unit_cost              numeric,
    notes                  text,
    reference              text,
    batch_id               uuid,
    operation_id           uuid,
    branch_id              uuid NOT NULL,
    product_id             uuid NOT NULL REFERENCES public.products(id),
    variant_id             uuid,
    warehouse_id           uuid,
    created_by             uuid,
    production_material_id uuid,
    organization_id        uuid NOT NULL REFERENCES public.organizations(id),
    created_at             timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 10. product_presets (no FK dependencies)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_presets (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name      text NOT NULL,
    product_name    text NOT NULL,
    product_sku     text,
    category_name   text,
    brand_logo_url  text,
    cost_price      numeric,
    sale_price      numeric,
    min_stock       numeric,
    unit            text,
    sort_order      integer,
    created_at      timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 11. app_config (simple key-value store, no FK dependencies)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text NOT NULL,
    value jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Prerequisites for RLS policies (used by early migrations)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_permission AS ENUM (
    'products.create', 'products.read', 'products.update', 'products.delete',
    'categories.create', 'categories.read', 'categories.update', 'categories.delete',
    'brands.create', 'brands.read', 'brands.update', 'brands.delete',
    'contacts.create', 'contacts.read', 'contacts.update', 'contacts.delete',
    'sales.create', 'sales.read', 'sales.update', 'sales.delete',
    'expenses.create', 'expenses.read', 'expenses.update', 'expenses.delete',
    'invoices.create', 'invoices.read', 'invoices.update', 'invoices.delete',
    'warehouses.create', 'warehouses.read', 'warehouses.update', 'warehouses.delete',
    'stock_movements.create', 'stock_movements.read', 'stock_movements.update', 'stock_movements.delete',
    'uom_conversions.create', 'uom_conversions.read', 'uom_conversions.update', 'uom_conversions.delete',
    'members.read', 'members.invite', 'members.remove', 'members.manage_role',
    'roles.manage',
    'settings.manage',
    'settings.read', 'settings.update',
    'reports.manage',
    'reports.read',
    'notifications.manage',
    'audit_log.read',
    'access',
    'inventory.create', 'inventory.read', 'inventory.update', 'inventory.delete',
    'purchases.create', 'purchases.read', 'purchases.update', 'purchases.delete',
    'accounting.manage',
    'hr.create', 'hr.read', 'hr.update', 'hr.delete',
    'manufacturing.create', 'manufacturing.read', 'manufacturing.update', 'manufacturing.delete',
    'boms.create', 'boms.delete', 'boms.update',
    'discounts.create', 'discounts.delete', 'discounts.read', 'discounts.update',
    'emails.manage',
    'quotations.create', 'quotations.delete', 'quotations.read', 'quotations.update',
    'returns.create', 'returns.delete', 'returns.read', 'returns.update'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Stub has_permission — replaced by the full version in roles migration
CREATE OR REPLACE FUNCTION public.has_permission(p_permission app_permission)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IS NOT NULL
  );
$$;

-- Alias for bank_accounts/cash_registers RLS policies that reference this name.
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;


-- Missing prefix columns referenced by SECURITY DEFINER number generators
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS invoice_number_prefix TEXT DEFAULT 'INV';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS po_number_prefix TEXT DEFAULT 'PO';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS quote_number_prefix TEXT DEFAULT 'Q';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS return_number_prefix TEXT DEFAULT 'R';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS je_number_prefix TEXT DEFAULT 'JE';

-- Missing sequences referenced by SECURITY DEFINER functions
CREATE SEQUENCE IF NOT EXISTS public.po_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.je_number_seq START 1;

-- Enable RLS for tables that have policies but never had RLS enabled.
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
