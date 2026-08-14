-- Create brands table
CREATE TABLE public.brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add brand_id to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "brands_select_own_org" ON public.brands
    FOR SELECT USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "brands_insert_own_org" ON public.brands
    FOR INSERT WITH CHECK (organization_id = (SELECT get_current_organization()));

CREATE POLICY "brands_update_own_org" ON public.brands
    FOR UPDATE USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "brands_delete_own_org" ON public.brands
    FOR DELETE USING (organization_id = (SELECT get_current_organization()));

-- Indexes
CREATE INDEX idx_brands_organization_id ON public.brands(organization_id);
CREATE INDEX idx_products_brand_id ON public.products(brand_id);
