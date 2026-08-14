-- Add batch_id to stock_movements for grouping bulk adjustments
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS batch_id UUID;

CREATE INDEX IF NOT EXISTS idx_stock_movements_batch ON public.stock_movements(batch_id);
