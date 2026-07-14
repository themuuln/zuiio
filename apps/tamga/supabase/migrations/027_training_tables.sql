-- ============================================================
-- Training Log and Performance Tracking
-- Version: 27 (2026-06-18)
--
-- Adds Training Log and Performance Record tables for tracking
-- horse training sessions and performance metrics.
-- ============================================================

-- ── 1. Create training_logs table ──────────────────────────
CREATE TABLE IF NOT EXISTS training_logs (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  horse_id          UUID NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('gallop', 'sprint', 'endurance', 'rest')),
  date              TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes  INTEGER NOT NULL DEFAULT 0,
  distance_km       DOUBLE PRECISION,
  notes             TEXT NOT NULL DEFAULT '',
  handler_name      TEXT,
  weather           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Indexes for training_logs ──────────────────────────
CREATE INDEX IF NOT EXISTS idx_training_logs_horse
  ON training_logs(horse_id);

CREATE INDEX IF NOT EXISTS idx_training_logs_owner
  ON training_logs(owner_id);

CREATE INDEX IF NOT EXISTS idx_training_logs_date
  ON training_logs(date);

CREATE INDEX IF NOT EXISTS idx_training_logs_type
  ON training_logs(type);

-- ── 3. RLS for training_logs ──────────────────────────────
ALTER TABLE training_logs ENABLE ROW LEVEL SECURITY;

-- Users can read training logs for their horses
CREATE POLICY "TrainingLogs: users read own horse logs"
  ON training_logs FOR SELECT
  USING (
    owner_id = auth.uid()
    OR horse_id IN (
      SELECT id FROM horses WHERE owner_id = auth.uid()
    )
  );

-- Users can insert training logs for their horses
CREATE POLICY "TrainingLogs: users insert own"
  ON training_logs FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Users can update their own training logs
CREATE POLICY "TrainingLogs: users update own"
  ON training_logs FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Users can delete their own training logs
CREATE POLICY "TrainingLogs: users delete own"
  ON training_logs FOR DELETE
  USING (owner_id = auth.uid());

-- ── 4. Create performance_records table ────────────────────
CREATE TABLE IF NOT EXISTS performance_records (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  horse_id          UUID NOT NULL,
  metric            TEXT NOT NULL CHECK (metric IN ('speed', 'endurance', 'weight', 'condition')),
  value             DOUBLE PRECISION NOT NULL,
  unit              TEXT,
  notes             TEXT NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5. Indexes for performance_records ─────────────────────
CREATE INDEX IF NOT EXISTS idx_performance_records_horse
  ON performance_records(horse_id);

CREATE INDEX IF NOT EXISTS idx_performance_records_owner
  ON performance_records(owner_id);

CREATE INDEX IF NOT EXISTS idx_performance_records_metric
  ON performance_records(metric);

-- ── 6. RLS for performance_records ─────────────────────────
ALTER TABLE performance_records ENABLE ROW LEVEL SECURITY;

-- Users can read performance records for their horses
CREATE POLICY "PerformanceRecords: users read own horse records"
  ON performance_records FOR SELECT
  USING (
    owner_id = auth.uid()
    OR horse_id IN (
      SELECT id FROM horses WHERE owner_id = auth.uid()
    )
  );

-- Users can insert performance records for their horses
CREATE POLICY "PerformanceRecords: users insert own"
  ON performance_records FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Users can update their own performance records
CREATE POLICY "PerformanceRecords: users update own"
  ON performance_records FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Users can delete their own performance records
CREATE POLICY "PerformanceRecords: users delete own"
  ON performance_records FOR DELETE
  USING (owner_id = auth.uid());

-- ── 7. Auto-update updated_at trigger (shared function) ────
-- Reuse existing function if not already present.
CREATE OR REPLACE FUNCTION update_training_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to training_logs
CREATE TRIGGER trigger_training_logs_updated_at
  BEFORE UPDATE ON training_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_training_updated_at();

-- Apply trigger to performance_records
CREATE TRIGGER trigger_performance_records_updated_at
  BEFORE UPDATE ON performance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_training_updated_at();
