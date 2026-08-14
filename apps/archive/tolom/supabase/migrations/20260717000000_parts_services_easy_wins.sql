-- Easy wins: add missing columns to parts, services, suppliers, movements, vehicle_model_parts
-- See docs/gaps.md

-- 1. Barcode on parts_catalog (direct, not just on variants)
ALTER TABLE parts_catalog ADD COLUMN IF NOT EXISTS barcode TEXT;

-- 2. Default cost on service_catalog (for margin tracking)
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS default_cost NUMERIC;

-- 3. Reference ID on inventory_movements (trace back to PO or work order)
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS reference_id UUID;
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS reference_type TEXT;

-- 4. Supplier ordering info
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS min_order_quantity INTEGER;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS lead_time_days INTEGER;

-- 5. Vehicle-model fitment notes
ALTER TABLE vehicle_model_parts ADD COLUMN IF NOT EXISTS compatibility_notes TEXT;

-- 6. Index on barcode for fast lookup
CREATE INDEX IF NOT EXISTS idx_parts_catalog_barcode ON parts_catalog (barcode) WHERE barcode IS NOT NULL;

-- 7. Index on reference_id for movement tracing
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference ON inventory_movements (reference_id) WHERE reference_id IS NOT NULL;
