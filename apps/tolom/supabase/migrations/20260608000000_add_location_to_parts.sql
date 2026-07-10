-- Add shelf location column to parts_catalog
-- Location format: "A-3-12" = Shelf A, Row 3, Level 12
ALTER TABLE parts_catalog ADD COLUMN IF NOT EXISTS location text;

COMMENT ON COLUMN parts_catalog.location IS 'Physical shelf location (e.g. A-3-12)';
