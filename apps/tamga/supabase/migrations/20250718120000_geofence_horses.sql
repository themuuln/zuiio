-- Migration: geofence_horses junction table for horse↔geofence association

CREATE TABLE IF NOT EXISTS geofence_horses (
  geofence_id UUID NOT NULL REFERENCES search_areas(id) ON DELETE CASCADE,
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (geofence_id, horse_id)
);

ALTER TABLE geofence_horses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage own geofence horses"
  ON geofence_horses FOR ALL
  USING (
    geofence_id IN (
      SELECT id FROM search_areas WHERE created_by = auth.uid()
    )
  );
