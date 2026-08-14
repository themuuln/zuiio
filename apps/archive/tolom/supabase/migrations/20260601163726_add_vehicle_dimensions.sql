-- Add vehicle dimension/weight columns from SmartCar API data
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS height integer;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS width integer;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS length integer;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS weight integer;
