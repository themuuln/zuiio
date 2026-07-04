-- Migration 010: Map features — lost horses, geofences, nearby discovery
-- Requires: PostGIS extension for spatial queries

-- ── Lost Horse Reports ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lost_horse_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  horse_name TEXT NOT NULL,
  description TEXT,
  last_seen_lat DOUBLE PRECISION NOT NULL,
  last_seen_lng DOUBLE PRECISION NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_radius_km DOUBLE PRECISION NOT NULL DEFAULT 5.0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'found', 'cancelled')),
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lost_horse_status ON lost_horse_reports(status) WHERE status = 'active';
CREATE INDEX idx_lost_horse_owner ON lost_horse_reports(owner_id);

-- ── Search Areas (Geofences) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS search_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  radius_km DOUBLE PRECISION NOT NULL,
  color INTEGER NOT NULL DEFAULT -4144960,  -- 0xFFC07A32
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_search_areas_owner ON search_areas(created_by);

-- ── Horse Locations (opt-in visibility) ─────────────────────────────

CREATE TABLE IF NOT EXISTS horse_locations (
  horse_id UUID PRIMARY KEY REFERENCES horses(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  horse_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_visible BOOLEAN NOT NULL DEFAULT false,
  coat_color TEXT
);

CREATE INDEX idx_horse_locations_visible ON horse_locations(is_visible) WHERE is_visible = true;

-- ── Geofence Alerts ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS geofence_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  horse_name TEXT NOT NULL,
  geofence_id UUID NOT NULL,
  geofence_name TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('entered', 'exited')),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  horse_lat DOUBLE PRECISION NOT NULL,
  horse_lng DOUBLE PRECISION NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_geofence_alerts_owner ON geofence_alerts(horse_id);

-- ── RLS Policies ────────────────────────────────────────────────────

ALTER TABLE lost_horse_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE horse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_alerts ENABLE ROW LEVEL SECURITY;

-- lost_horse_reports: owner CRUD + public read active
CREATE POLICY "Owner can CRUD own lost reports"
  ON lost_horse_reports FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Public can read active lost reports"
  ON lost_horse_reports FOR SELECT
  USING (status = 'active');

-- search_areas: owner CRUD
CREATE POLICY "Owner can CRUD own search areas"
  ON search_areas FOR ALL
  USING (auth.uid() = created_by);

-- horse_locations: owner update own, public read visible
CREATE POLICY "Owner can update own horse location"
  ON horse_locations FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Public can read visible horse locations"
  ON horse_locations FOR SELECT
  USING (is_visible = true);

-- geofence_alerts: owner read own
CREATE POLICY "Owner can read own geofence alerts"
  ON geofence_alerts FOR SELECT
  USING (
    horse_id IN (
      SELECT id FROM horses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "System can insert geofence alerts"
  ON geofence_alerts FOR INSERT
  WITH CHECK (true);
