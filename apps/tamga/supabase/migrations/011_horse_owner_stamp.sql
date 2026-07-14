-- Migration: 011_horse_owner_stamp
-- Add owner_stamp_svg column to horses table for storing traditional Mongolian horse brand (тамга) as SVG.

-- Add the owner_stamp_svg column
ALTER TABLE horses ADD COLUMN owner_stamp_svg TEXT;

-- Add comment for documentation
COMMENT ON COLUMN horses.owner_stamp_svg IS 'Traditional Mongolian horse brand (тамга) stored as SVG vector graphic. Each owner has a unique stamp pattern.';
