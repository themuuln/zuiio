-- ============================================================
-- Production-ready global catalogs
-- 1. Fix incorrect Mongolian translations
-- 2. Add full-text search (pg_trgm + GIN)
-- 3. Add unique constraints to prevent duplicates
-- 4. Add CHECK constraints for data quality
-- ============================================================

-- ── 1. Fix incorrect Mongolian translations ───────────────────

-- Brakes: "Гэмтлийн" → "Тоормосны" (the correct automotive term)
UPDATE global_parts_catalog SET name_mn = 'Тоормосны дэвсгэр - Урд багц' WHERE name = 'Brake Pads - Front Set';
UPDATE global_parts_catalog SET name_mn = 'Тоормосны дэвсгэр - Арын багц' WHERE name = 'Brake Pads - Rear Set';
UPDATE global_parts_catalog SET name_mn = 'Тоормосны диск - Урд' WHERE name = 'Brake Rotor - Front';
UPDATE global_parts_catalog SET name_mn = 'Тоормосны диск - Арын' WHERE name = 'Brake Rotor - Rear';
UPDATE global_parts_catalog SET name_mn = 'Тоормосны калипер - Урд' WHERE name = 'Brake Caliper - Front';
UPDATE global_parts_catalog SET name_mn = 'Тоормосны калипер - Арын' WHERE name = 'Brake Caliper - Rear';
UPDATE global_parts_catalog SET name_mn = 'Тоормосны шингэн DOT4' WHERE name = 'Brake Fluid DOT4';
UPDATE global_parts_catalog SET name_mn = 'Тоормосны шланг - Урд' WHERE name = 'Brake Hose - Front';
UPDATE global_parts_catalog SET name_mn = 'Тоормосны шланг - Арын' WHERE name = 'Brake Hose - Rear';
UPDATE global_parts_catalog SET name_mn = 'Зогсоолын тоормосны утас' WHERE name = 'Parking Brake Cable';

-- Hose: "араатан" → "шланг" (standard automotive term)
UPDATE global_parts_catalog SET name_mn = 'Хөргөлтийн шланг - Дээд' WHERE name = 'Coolant Hose - Upper';
UPDATE global_parts_catalog SET name_mn = 'Хөргөлтийн шланг - Доод' WHERE name = 'Coolant Hose - Lower';

-- Oil filter: "Газрын тосны шүүрүүр" → "Тосны шүүлтүүр"
UPDATE global_parts_catalog SET name_mn = 'Тосны шүүлтүүр' WHERE name = 'Engine Oil Filter';

-- Spark plug: "Лаавар" is acceptable, but let's also fix the brake-related services
UPDATE global_services_catalog SET name_mn = 'Урд тоормосны дэвсгэр солих' WHERE name = 'Brake Pad Replacement - Front';
UPDATE global_services_catalog SET name_mn = 'Арын тоормосны дэвсгэр солих' WHERE name = 'Brake Pad Replacement - Rear';
UPDATE global_services_catalog SET name_mn = 'Урд тоормосны диск солих' WHERE name = 'Brake Rotor Replacement - Front';
UPDATE global_services_catalog SET name_mn = 'Арын тоормосны диск солих' WHERE name = 'Brake Rotor Replacement - Rear';
UPDATE global_services_catalog SET name_mn = 'Тоормосны калипер солих' WHERE name = 'Brake Caliper Replacement';
UPDATE global_services_catalog SET name_mn = 'Тоормосны шланг солих' WHERE name = 'Brake Line Replacement';
UPDATE global_services_catalog SET name_mn = 'Бүтэн тоормосны засвар' WHERE name = 'Full Brake Service';
UPDATE global_services_catalog SET name_mn = 'Тоормосны шингэн солих' WHERE name = 'Brake Fluid Change';

-- ── 2. Full-text search indexes ───────────────────────────────

-- Enable pg_trgm extension (safe to call if already exists)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index for trigram search on parts name + name_mn
CREATE INDEX IF NOT EXISTS idx_global_parts_search
  ON global_parts_catalog USING GIN (
    (coalesce(name, '') || ' ' || coalesce(name_mn, '') || ' ' || coalesce(part_number, '') || ' ' || coalesce(category, ''))
    gin_trgm_ops
  );

-- GIN index for trigram search on services name + name_mn
CREATE INDEX IF NOT EXISTS idx_global_services_search
  ON global_services_catalog USING GIN (
    (coalesce(name, '') || ' ' || coalesce(name_mn, '') || ' ' || coalesce(category, ''))
    gin_trgm_ops
  );

-- ── 3. Unique constraint: prevent duplicate parts ─────────────

-- Expression index to prevent duplicate parts (same name + category + part_number)
CREATE UNIQUE INDEX IF NOT EXISTS idx_global_parts_dedup
  ON global_parts_catalog (lower(name), category, coalesce(lower(part_number), ''));

-- Expression index to prevent duplicate services (same name + category)
CREATE UNIQUE INDEX IF NOT EXISTS idx_global_services_dedup
  ON global_services_catalog (lower(name), category);

-- ── 4. CHECK constraints for data quality ─────────────────────

-- Name must not be empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'global_parts_name_not_empty'
  ) THEN
    ALTER TABLE global_parts_catalog
      ADD CONSTRAINT global_parts_name_not_empty CHECK (length(trim(name)) > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'global_services_name_not_empty'
  ) THEN
    ALTER TABLE global_services_catalog
      ADD CONSTRAINT global_services_name_not_empty CHECK (length(trim(name)) > 0);
  END IF;

  -- Category must not be empty
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'global_parts_category_not_empty'
  ) THEN
    ALTER TABLE global_parts_catalog
      ADD CONSTRAINT global_parts_category_not_empty CHECK (length(trim(category)) > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'global_services_category_not_empty'
  ) THEN
    ALTER TABLE global_services_catalog
      ADD CONSTRAINT global_services_category_not_empty CHECK (length(trim(category)) > 0);
  END IF;
END $$;

-- ── 5. Additional useful indexes ──────────────────────────────

-- Index for vehicle model lookups
CREATE INDEX IF NOT EXISTS idx_global_parts_vm_part
  ON global_parts_vehicle_models (global_part_id);

CREATE INDEX IF NOT EXISTS idx_global_parts_vm_model
  ON global_parts_vehicle_models (vehicle_model_id);
