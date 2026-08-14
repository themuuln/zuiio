-- =============================================
-- Product Variant System
-- Allows parent products to have variants with
-- custom groups (size, color, material, etc.)
-- Each variant has its own SKU, price, and stock
-- =============================================

-- 1. Product Variant Groups (e.g., "Хэмжээ", "Өнгө")
CREATE TABLE IF NOT EXISTS public.product_variant_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Product Variant Options (e.g., "S", "M", "L" under "Хэмжээ")
CREATE TABLE IF NOT EXISTS public.product_variant_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.product_variant_groups(id) ON DELETE CASCADE NOT NULL,
    value TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Product Variants (each SKU-level variant with own price/stock)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    sku TEXT,
    barcode TEXT,
    cost_price NUMERIC DEFAULT 0,
    sale_price NUMERIC DEFAULT 0,
    current_stock NUMERIC DEFAULT 0,
    min_stock NUMERIC DEFAULT 0,
    image_urls TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Variant-Option Assignments (which options make up a variant)
CREATE TABLE IF NOT EXISTS public.product_variant_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE NOT NULL,
    option_id UUID REFERENCES public.product_variant_options(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(variant_id, option_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_variant_groups_product ON public.product_variant_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_variant_options_group ON public.product_variant_options(group_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variant_assignments_variant ON public.product_variant_assignments(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_assignments_option ON public.product_variant_assignments(option_id);

-- Enable RLS
ALTER TABLE public.product_variant_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_assignments ENABLE ROW LEVEL SECURITY;

-- RLS: product_variant_groups
CREATE POLICY "variant_groups_select_own_org" ON public.product_variant_groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE products.id = product_variant_groups.product_id
            AND products.organization_id = (SELECT get_current_organization())
        )
    );

CREATE POLICY "variant_groups_insert_own_org" ON public.product_variant_groups
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE products.id = product_variant_groups.product_id
            AND products.organization_id = (SELECT get_current_organization())
            AND public.has_permission('products.create')
        )
    );

CREATE POLICY "variant_groups_update_own_org" ON public.product_variant_groups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE products.id = product_variant_groups.product_id
            AND products.organization_id = (SELECT get_current_organization())
            AND public.has_permission('products.update')
        )
    );

CREATE POLICY "variant_groups_delete_own_org" ON public.product_variant_groups
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE products.id = product_variant_groups.product_id
            AND products.organization_id = (SELECT get_current_organization())
            AND public.has_permission('products.delete')
        )
    );

-- RLS: product_variant_options
CREATE POLICY "variant_options_select_own_org" ON public.product_variant_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.product_variant_groups
            JOIN public.products ON products.id = product_variant_groups.product_id
            WHERE product_variant_groups.id = product_variant_options.group_id
            AND products.organization_id = (SELECT get_current_organization())
        )
    );

CREATE POLICY "variant_options_insert_own_org" ON public.product_variant_options
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.product_variant_groups
            JOIN public.products ON products.id = product_variant_groups.product_id
            WHERE product_variant_groups.id = product_variant_options.group_id
            AND products.organization_id = (SELECT get_current_organization())
            AND public.has_permission('products.create')
        )
    );

CREATE POLICY "variant_options_update_own_org" ON public.product_variant_options
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.product_variant_groups
            JOIN public.products ON products.id = product_variant_groups.product_id
            WHERE product_variant_groups.id = product_variant_options.group_id
            AND products.organization_id = (SELECT get_current_organization())
            AND public.has_permission('products.update')
        )
    );

CREATE POLICY "variant_options_delete_own_org" ON public.product_variant_options
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.product_variant_groups
            JOIN public.products ON products.id = product_variant_groups.product_id
            WHERE product_variant_groups.id = product_variant_options.group_id
            AND products.organization_id = (SELECT get_current_organization())
            AND public.has_permission('products.delete')
        )
    );

-- RLS: product_variants
CREATE POLICY "variants_select_own_org" ON public.product_variants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE products.id = product_variants.product_id
            AND products.organization_id = (SELECT get_current_organization())
        )
    );

CREATE POLICY "variants_insert_own_org" ON public.product_variants
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE products.id = product_variants.product_id
            AND products.organization_id = (SELECT get_current_organization())
            AND public.has_permission('products.create')
        )
    );

CREATE POLICY "variants_update_own_org" ON public.product_variants
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE products.id = product_variants.product_id
            AND products.organization_id = (SELECT get_current_organization())
            AND public.has_permission('products.update')
        )
    );

CREATE POLICY "variants_delete_own_org" ON public.product_variants
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE products.id = product_variants.product_id
            AND products.organization_id = (SELECT get_current_organization())
            AND public.has_permission('products.delete')
        )
    );

-- RLS: product_variant_assignments
CREATE POLICY "variant_assignments_select_own_org" ON public.product_variant_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.product_variants
            JOIN public.products ON products.id = product_variants.product_id
            WHERE product_variants.id = product_variant_assignments.variant_id
            AND products.organization_id = (SELECT get_current_organization())
        )
    );

CREATE POLICY "variant_assignments_insert_own_org" ON public.product_variant_assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.product_variants
            JOIN public.products ON products.id = product_variants.product_id
            WHERE product_variants.id = product_variant_assignments.variant_id
            AND products.organization_id = (SELECT get_current_organization())
            AND public.has_permission('products.create')
        )
    );

CREATE POLICY "variant_assignments_delete_own_org" ON public.product_variant_assignments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.product_variants
            JOIN public.products ON products.id = product_variants.product_id
            WHERE product_variants.id = product_variant_assignments.variant_id
            AND products.organization_id = (SELECT get_current_organization())
            AND public.has_permission('products.delete')
        )
    );
