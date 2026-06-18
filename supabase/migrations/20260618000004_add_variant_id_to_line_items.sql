-- =============================================
-- Add variant_id to line item tables
-- Allows transactions to reference specific variants
-- =============================================

-- Sale items
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- Invoice items
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- Purchase order items
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- Quotation items
ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- Return items
ALTER TABLE public.return_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- Stock movements (already has product_id, add variant_id)
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_variant ON public.sale_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_variant ON public.invoice_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_variant ON public.purchase_order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_variant ON public.quotation_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_return_items_variant ON public.return_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_variant ON public.stock_movements(variant_id);
