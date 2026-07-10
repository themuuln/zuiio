-- Enable pg_trgm extension for fuzzy/typo-tolerant text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Customer search columns: first_name, last_name, full_name, company_name, contact_person, phone, email
CREATE INDEX IF NOT EXISTS idx_customers_full_name_trgm
  ON customers USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_first_name_trgm
  ON customers USING GIN (first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_last_name_trgm
  ON customers USING GIN (last_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_phone_trgm
  ON customers USING GIN (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_email_trgm
  ON customers USING GIN (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_company_name_trgm
  ON customers USING GIN (company_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_contact_person_trgm
  ON customers USING GIN (contact_person gin_trgm_ops);

-- Vehicle search columns: plate_number, vin
CREATE INDEX IF NOT EXISTS idx_vehicles_plate_number_trgm
  ON vehicles USING GIN (plate_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin_trgm
  ON vehicles USING GIN (vin gin_trgm_ops);
