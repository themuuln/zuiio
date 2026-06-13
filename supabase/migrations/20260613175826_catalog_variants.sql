-- ============================================================================
-- Catalog Variants — generic "product comes in multiple versions" system
-- ============================================================================

-- 1. Variant Groups (Dimensions)

CREATE TABLE IF NOT EXISTS public.catalog_variant_groups (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    name text NOT NULL,
    name_mn text,
    applies_to text NOT NULL DEFAULT 'both' CHECK (applies_to IN ('service', 'part', 'both')),
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT catalog_variant_groups_pkey PRIMARY KEY (id)
);

ALTER TABLE public.catalog_variant_groups ENABLE ROW LEVEL SECURITY;

-- 2. Variant Options (Values within each dimension)

CREATE TABLE IF NOT EXISTS public.catalog_variant_options (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    group_id uuid NOT NULL REFERENCES public.catalog_variant_groups(id) ON DELETE CASCADE,
    label text NOT NULL,
    label_mn text,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT catalog_variant_options_pkey PRIMARY KEY (id)
);

ALTER TABLE public.catalog_variant_options ENABLE ROW LEVEL SECURITY;

-- 3. Concrete Item Variants (priced SKU-level)

CREATE TABLE IF NOT EXISTS public.catalog_item_variants (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    entity_type text NOT NULL CHECK (entity_type IN ('service', 'part')),
    entity_id uuid NOT NULL,
    variant_label text NOT NULL,
    variant_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    price numeric(12,2),
    cost numeric(12,2),
    sku text,
    barcode text,
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_by uuid,
    updated_by uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT catalog_item_variants_pkey PRIMARY KEY (id),
    CONSTRAINT catalog_item_variants_entity_unique UNIQUE (entity_type, entity_id, variant_label)
);

ALTER TABLE public.catalog_item_variants ENABLE ROW LEVEL SECURITY;

-- 4. Updated_at triggers

CREATE OR REPLACE FUNCTION public.update_catalog_variants_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    CREATE TRIGGER catalog_variant_groups_updated_at
        BEFORE UPDATE ON public.catalog_variant_groups
        FOR EACH ROW EXECUTE FUNCTION public.update_catalog_variants_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER catalog_variant_options_updated_at
        BEFORE UPDATE ON public.catalog_variant_options
        FOR EACH ROW EXECUTE FUNCTION public.update_catalog_variants_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER catalog_item_variants_updated_at
        BEFORE UPDATE ON public.catalog_item_variants
        FOR EACH ROW EXECUTE FUNCTION public.update_catalog_variants_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Add variant columns to existing transaction tables

ALTER TABLE public.work_order_services
    ADD COLUMN IF NOT EXISTS catalog_item_variant_id uuid REFERENCES public.catalog_item_variants(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS variant_label text;

ALTER TABLE public.work_order_parts
    ADD COLUMN IF NOT EXISTS catalog_item_variant_id uuid REFERENCES public.catalog_item_variants(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS variant_label text;

ALTER TABLE public.estimate_items
    ADD COLUMN IF NOT EXISTS catalog_item_variant_id uuid REFERENCES public.catalog_item_variants(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS variant_label text;

-- 6. Indexes

CREATE INDEX IF NOT EXISTS idx_catalog_variant_groups_org ON public.catalog_variant_groups(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_variant_options_group ON public.catalog_variant_options(group_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_variant_options_org ON public.catalog_variant_options(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_item_variants_entity ON public.catalog_item_variants(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_item_variants_org ON public.catalog_item_variants(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_item_variants_sku ON public.catalog_item_variants(sku) WHERE sku IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_item_variants_barcode ON public.catalog_item_variants(barcode) WHERE barcode IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_work_order_services_variant ON public.work_order_services(catalog_item_variant_id) WHERE catalog_item_variant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_work_order_parts_variant ON public.work_order_parts(catalog_item_variant_id) WHERE catalog_item_variant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_estimate_items_variant ON public.estimate_items(catalog_item_variant_id) WHERE catalog_item_variant_id IS NOT NULL;

-- 7. RLS Policies

DO $$ BEGIN
    CREATE POLICY "catalog_variant_groups_select" ON public.catalog_variant_groups
        FOR SELECT USING (organization_id = get_user_organization_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "catalog_variant_groups_insert" ON public.catalog_variant_groups
        FOR INSERT WITH CHECK (organization_id = get_user_organization_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "catalog_variant_groups_update" ON public.catalog_variant_groups
        FOR UPDATE USING (organization_id = get_user_organization_id())
        WITH CHECK (organization_id = get_user_organization_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "catalog_variant_groups_delete" ON public.catalog_variant_groups
        FOR DELETE USING (organization_id = get_user_organization_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "catalog_variant_options_select" ON public.catalog_variant_options
        FOR SELECT USING (organization_id = get_user_organization_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "catalog_variant_options_insert" ON public.catalog_variant_options
        FOR INSERT WITH CHECK (organization_id = get_user_organization_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "catalog_variant_options_update" ON public.catalog_variant_options
        FOR UPDATE USING (organization_id = get_user_organization_id())
        WITH CHECK (organization_id = get_user_organization_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "catalog_variant_options_delete" ON public.catalog_variant_options
        FOR DELETE USING (organization_id = get_user_organization_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "catalog_item_variants_select" ON public.catalog_item_variants
        FOR SELECT USING (organization_id = get_user_organization_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "catalog_item_variants_insert" ON public.catalog_item_variants
        FOR INSERT WITH CHECK (organization_id = get_user_organization_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "catalog_item_variants_update" ON public.catalog_item_variants
        FOR UPDATE USING (organization_id = get_user_organization_id())
        WITH CHECK (organization_id = get_user_organization_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "catalog_item_variants_delete" ON public.catalog_item_variants
        FOR DELETE USING (organization_id = get_user_organization_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 8. Grants

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_variant_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_variant_options TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_item_variants TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
