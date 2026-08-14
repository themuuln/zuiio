-- ============================================================
-- Sync vehicles table columns present in production but missing
-- from the migration history (added via SQL editor in prod).
--
-- The app (vehicle-service create/update field maps,
-- vehicle-detail-drawer) writes/reads these columns, so a DB
-- built purely from migrations must have them.
-- ============================================================

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS total_visits integer,
  ADD COLUMN IF NOT EXISTS import_date date,
  ADD COLUMN IF NOT EXISTS country_of_origin text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS seats integer,
  ADD COLUMN IF NOT EXISTS steering text;

COMMENT ON COLUMN vehicles.import_date IS 'Import date for vehicles imported from the SmartCar API';
COMMENT ON COLUMN vehicles.country_of_origin IS 'Country of origin for imported vehicles';
COMMENT ON COLUMN vehicles.category IS 'Vehicle category (e.g. sedan, suv, luxury)';
COMMENT ON COLUMN vehicles.seats IS 'Number of seats';
COMMENT ON COLUMN vehicles.steering IS 'Steering side (left/right)';
