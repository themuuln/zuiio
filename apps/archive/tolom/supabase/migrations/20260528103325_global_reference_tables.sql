-- ============================================================
-- Global reference tables for parts and services
-- Reusable across all organizations. No prices — each org
-- sets its own pricing when importing from these catalogs.
-- ============================================================

-- ── Global Parts Catalog ─────────────────────────────────────
CREATE TABLE global_parts_catalog (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  name_mn       TEXT,               -- Mongolian name
  part_number   TEXT,               -- OEM / aftermarket part number
  category      TEXT NOT NULL,      -- Engine, Brakes, Suspension, etc.
  description   TEXT,
  unit          TEXT NOT NULL DEFAULT 'piece',  -- piece, set, liter, kg, etc.
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE global_parts_catalog IS 'Global reference table of car parts. Visible to all organizations. No pricing — orgs set their own.';

CREATE INDEX idx_global_parts_category ON global_parts_catalog(category);
CREATE INDEX idx_global_parts_name ON global_parts_catalog(name);

-- ── Global Services Catalog ──────────────────────────────────
CREATE TABLE global_services_catalog (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  name_mn       TEXT,               -- Mongolian name
  category      TEXT NOT NULL,      -- Maintenance, Brakes, Diagnostics, etc.
  description   TEXT,
  estimated_duration_minutes INTEGER,  -- Typical duration
  interval_months  INT,             -- Recommended service interval (months)
  interval_km      INT,             -- Recommended service interval (km)
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE global_services_catalog IS 'Global reference table of auto services. Visible to all organizations. No pricing — orgs set their own.';

CREATE INDEX idx_global_services_category ON global_services_catalog(category);
CREATE INDEX idx_global_services_name ON global_services_catalog(name);

-- ── Global Parts ↔ Vehicle Models junction ───────────────────
CREATE TABLE global_parts_vehicle_models (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  global_part_id  UUID NOT NULL REFERENCES global_parts_catalog(id) ON DELETE CASCADE,
  vehicle_model_id UUID NOT NULL REFERENCES car_models(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(global_part_id, vehicle_model_id)
);

COMMENT ON TABLE global_parts_vehicle_models IS 'Which global parts fit which vehicle models.';

-- ── RLS — read-only for everyone, no org scoping ────────────
ALTER TABLE global_parts_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_services_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_parts_vehicle_models ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read
CREATE POLICY "global_parts_read" ON global_parts_catalog
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "global_services_read" ON global_services_catalog
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "global_parts_vm_read" ON global_parts_vehicle_models
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only service_role can insert/update/delete (admin-managed)
CREATE POLICY "global_parts_admin" ON global_parts_catalog
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "global_services_admin" ON global_services_catalog
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "global_parts_vm_admin" ON global_parts_vehicle_models
  FOR ALL USING (auth.role() = 'service_role');

-- ── Updated_at trigger ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_global_catalog_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_global_parts_updated
  BEFORE UPDATE ON global_parts_catalog
  FOR EACH ROW EXECUTE FUNCTION update_global_catalog_timestamp();

CREATE TRIGGER trg_global_services_updated
  BEFORE UPDATE ON global_services_catalog
  FOR EACH ROW EXECUTE FUNCTION update_global_catalog_timestamp();
