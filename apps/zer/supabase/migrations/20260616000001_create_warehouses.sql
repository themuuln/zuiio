-- Create warehouses table for multi-warehouse support
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add warehouse_id to products (current_stock becomes warehouse-specific via warehouse_products)
CREATE TABLE IF NOT EXISTS public.warehouse_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    current_stock NUMERIC DEFAULT 0,
    min_stock NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(warehouse_id, product_id)
);

-- Add warehouse_id to stock_movements
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_products ENABLE ROW LEVEL SECURITY;

-- RLS policies for warehouses
CREATE POLICY "warehouses_select_own_org" ON public.warehouses
    FOR SELECT USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "warehouses_insert_own_org" ON public.warehouses
    FOR INSERT WITH CHECK (organization_id = (SELECT get_current_organization()));

CREATE POLICY "warehouses_update_own_org" ON public.warehouses
    FOR UPDATE USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "warehouses_delete_own_org" ON public.warehouses
    FOR DELETE USING (organization_id = (SELECT get_current_organization()));

-- RLS policies for warehouse_products
CREATE POLICY "warehouse_products_select_own_org" ON public.warehouse_products
    FOR SELECT USING (warehouse_id IN (SELECT id FROM public.warehouses WHERE organization_id = (SELECT get_current_organization())));

CREATE POLICY "warehouse_products_insert_own_org" ON public.warehouse_products
    FOR INSERT WITH CHECK (warehouse_id IN (SELECT id FROM public.warehouses WHERE organization_id = (SELECT get_current_organization())));

CREATE POLICY "warehouse_products_update_own_org" ON public.warehouse_products
    FOR UPDATE USING (warehouse_id IN (SELECT id FROM public.warehouses WHERE organization_id = (SELECT get_current_organization())));

CREATE POLICY "warehouse_products_delete_own_org" ON public.warehouse_products
    FOR DELETE USING (warehouse_id IN (SELECT id FROM public.warehouses WHERE organization_id = (SELECT get_current_organization())));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_warehouses_organization_id ON public.warehouses(organization_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_products_warehouse_id ON public.warehouse_products(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_products_product_id ON public.warehouse_products(product_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_products_org_lookup ON public.warehouse_products(warehouse_id, product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse_id ON public.stock_movements(warehouse_id);
