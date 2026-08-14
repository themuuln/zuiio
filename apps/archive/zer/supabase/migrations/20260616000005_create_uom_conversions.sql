-- Create uom_conversions table for Units of Measurement
CREATE TABLE IF NOT EXISTS public.uom_conversions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    from_unit TEXT NOT NULL,
    to_unit TEXT NOT NULL,
    conversion_factor NUMERIC NOT NULL, -- e.g., 12 for "ширхэг" -> "боодол" (12 pieces per pack)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.uom_conversions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "uom_conversions_select_own_org" ON public.uom_conversions
    FOR SELECT USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "uom_conversions_insert_own_org" ON public.uom_conversions
    FOR INSERT WITH CHECK (organization_id = (SELECT get_current_organization()));

CREATE POLICY "uom_conversions_update_own_org" ON public.uom_conversions
    FOR UPDATE USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "uom_conversions_delete_own_org" ON public.uom_conversions
    FOR DELETE USING (organization_id = (SELECT get_current_organization()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_uom_conversions_organization_id ON public.uom_conversions(organization_id);
CREATE INDEX IF NOT EXISTS idx_uom_conversions_product_id ON public.uom_conversions(product_id);

-- Also add image column used by barcode / bulk operations (store images for products)
-- (already exists: products.image_urls is ARRAY type)
