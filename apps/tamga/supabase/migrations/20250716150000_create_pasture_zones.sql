-- Бэлчээрийн бүсийг үүсгэх — тойргийн хэлбэртэй газрын нэгж.
CREATE TABLE pasture_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  radius_km DOUBLE PRECISION NOT NULL CHECK (radius_km > 0),
  max_occupancy_days INTEGER NOT NULL DEFAULT 14,
  last_rotation_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Бэлчээр-морь холбооны хүснэгт.
CREATE TABLE pasture_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES pasture_zones(id) ON DELETE CASCADE,
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(zone_id, horse_id)
);

-- Гүйлгээний индексүүд.
CREATE INDEX idx_pasture_zones_owner ON pasture_zones(owner_id);
CREATE INDEX idx_pasture_assignments_zone ON pasture_assignments(zone_id);
CREATE INDEX idx_pasture_assignments_horse ON pasture_assignments(horse_id);

-- updated_at автоматаар шинэчлэх триггер.
CREATE OR REPLACE FUNCTION update_pasture_zone_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pasture_zones_updated_at
  BEFORE UPDATE ON pasture_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_pasture_zone_updated_at();
