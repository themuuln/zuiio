-- =============================================
-- Product Attribute System
--
-- Generic typed-attribute model for products.
-- Supports text, number, boolean, and select values.
-- Definitions are org-scoped; optionally linked to categories.
-- =============================================

-- 1. Attribute Definitions
CREATE TABLE IF NOT EXISTS public.product_attribute_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  value_type TEXT NOT NULL CHECK (value_type IN ('text', 'number', 'boolean', 'select')),
  unit TEXT,
  options JSONB,
  is_required BOOLEAN DEFAULT false,
  is_filterable BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT product_attribute_definitions_org_slug_unique UNIQUE (organization_id, slug)
);

-- 2. Category linkage (which definitions appear for which categories)
CREATE TABLE IF NOT EXISTS public.product_attribute_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_definition_id UUID NOT NULL REFERENCES public.product_attribute_definitions(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT product_attribute_categories_unique UNIQUE (attribute_definition_id, category_id)
);

-- 3. Attribute Values (one value per product/definition)
CREATE TABLE IF NOT EXISTS public.product_attribute_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  attribute_definition_id UUID NOT NULL REFERENCES public.product_attribute_definitions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  value_text TEXT,
  value_number NUMERIC,
  value_boolean BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT product_attribute_values_product_def_unique UNIQUE (product_id, attribute_definition_id),
  -- Only one value column should be populated per row
  CONSTRAINT product_attribute_values_single_type CHECK (
    (value_text IS NOT NULL AND value_number IS NULL AND value_boolean IS NULL)
    OR (value_number IS NOT NULL AND value_text IS NULL AND value_boolean IS NULL)
    OR (value_boolean IS NOT NULL AND value_text IS NULL AND value_number IS NULL)
  )
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_pad_org ON public.product_attribute_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_pad_slug ON public.product_attribute_definitions(organization_id, slug);
CREATE INDEX IF NOT EXISTS idx_pac_category ON public.product_attribute_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_pac_definition ON public.product_attribute_categories(attribute_definition_id);
CREATE INDEX IF NOT EXISTS idx_pav_product ON public.product_attribute_values(product_id);
CREATE INDEX IF NOT EXISTS idx_pav_definition ON public.product_attribute_values(attribute_definition_id);
CREATE INDEX IF NOT EXISTS idx_pav_org ON public.product_attribute_values(organization_id);
-- For filterable lookups
CREATE INDEX IF NOT EXISTS idx_pav_text ON public.product_attribute_values(attribute_definition_id, value_text) WHERE value_text IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pav_number ON public.product_attribute_values(attribute_definition_id, value_number) WHERE value_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pav_boolean ON public.product_attribute_values(attribute_definition_id, value_boolean) WHERE value_boolean IS NOT NULL;

-- 5. RLS
ALTER TABLE public.product_attribute_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_values ENABLE ROW LEVEL SECURITY;

-- product_attribute_definitions policies
CREATE POLICY "pad_select" ON public.product_attribute_definitions
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.read')
  );

CREATE POLICY "pad_insert" ON public.product_attribute_definitions
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.create')
  );

CREATE POLICY "pad_update" ON public.product_attribute_definitions
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.update')
  )
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.update')
  );

CREATE POLICY "pad_delete" ON public.product_attribute_definitions
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.delete')
  );

-- product_attribute_categories policies
CREATE POLICY "pac_select" ON public.product_attribute_categories
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.read')
  );

CREATE POLICY "pac_insert" ON public.product_attribute_categories
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.create')
  );

CREATE POLICY "pac_update" ON public.product_attribute_categories
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.update')
  )
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.update')
  );

CREATE POLICY "pac_delete" ON public.product_attribute_categories
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.delete')
  );

-- product_attribute_values policies
CREATE POLICY "pav_select" ON public.product_attribute_values
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.read')
  );

CREATE POLICY "pav_insert" ON public.product_attribute_values
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.create')
  );

CREATE POLICY "pav_update" ON public.product_attribute_values
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.update')
  )
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.update')
  );

CREATE POLICY "pav_delete" ON public.product_attribute_values
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.delete')
  );

-- 6. GRANTs for authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_attribute_definitions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_attribute_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_attribute_values TO authenticated;
