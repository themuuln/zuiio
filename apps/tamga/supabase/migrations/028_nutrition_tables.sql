-- ============================================================
-- Nutrition Tracking — Feed Schedules and Feed Logs
-- Version: 28 (2026-06-18)
--
-- Adds Feed Schedule and Feed Log tables for tracking horse
-- nutrition and feeding schedules.
-- ============================================================

-- ── 1. Create feed_schedules table ──────────────────────────
CREATE TABLE IF NOT EXISTS feed_schedules (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  horse_id          UUID NOT NULL,
  feed_type         TEXT NOT NULL CHECK (feed_type IN ('hay', 'grain', 'supplement')),
  quantity_kg       DOUBLE PRECISION NOT NULL DEFAULT 0,
  frequency         TEXT NOT NULL DEFAULT '',
  start_date        TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date          TIMESTAMPTZ,
  notes             TEXT NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Indexes for feed_schedules ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_feed_schedules_horse
  ON feed_schedules(horse_id);

CREATE INDEX IF NOT EXISTS idx_feed_schedules_owner
  ON feed_schedules(owner_id);

CREATE INDEX IF NOT EXISTS idx_feed_schedules_feed_type
  ON feed_schedules(feed_type);

-- ── 3. RLS for feed_schedules ───────────────────────────────
ALTER TABLE feed_schedules ENABLE ROW LEVEL SECURITY;

-- Users can read feed schedules for their horses
CREATE POLICY "FeedSchedules: users read own horse schedules"
  ON feed_schedules FOR SELECT
  USING (
    owner_id = auth.uid()
    OR horse_id IN (
      SELECT id FROM horses WHERE owner_id = auth.uid()
    )
  );

-- Users can insert feed schedules for their horses
CREATE POLICY "FeedSchedules: users insert own"
  ON feed_schedules FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Users can update their own feed schedules
CREATE POLICY "FeedSchedules: users update own"
  ON feed_schedules FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Users can delete their own feed schedules
CREATE POLICY "FeedSchedules: users delete own"
  ON feed_schedules FOR DELETE
  USING (owner_id = auth.uid());

-- ── 4. Create feed_logs table ───────────────────────────────
CREATE TABLE IF NOT EXISTS feed_logs (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_id       UUID NOT NULL,
  horse_id          UUID NOT NULL,
  date              TIMESTAMPTZ NOT NULL DEFAULT now(),
  amount_given      DOUBLE PRECISION NOT NULL DEFAULT 0,
  skipped           BOOLEAN NOT NULL DEFAULT false,
  notes             TEXT NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5. Indexes for feed_logs ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_feed_logs_horse
  ON feed_logs(horse_id);

CREATE INDEX IF NOT EXISTS idx_feed_logs_owner
  ON feed_logs(owner_id);

CREATE INDEX IF NOT EXISTS idx_feed_logs_schedule
  ON feed_logs(schedule_id);

CREATE INDEX IF NOT EXISTS idx_feed_logs_date
  ON feed_logs(date);

-- ── 6. RLS for feed_logs ────────────────────────────────────
ALTER TABLE feed_logs ENABLE ROW LEVEL SECURITY;

-- Users can read feed logs for their horses
CREATE POLICY "FeedLogs: users read own horse logs"
  ON feed_logs FOR SELECT
  USING (
    owner_id = auth.uid()
    OR horse_id IN (
      SELECT id FROM horses WHERE owner_id = auth.uid()
    )
  );

-- Users can insert feed logs for their horses
CREATE POLICY "FeedLogs: users insert own"
  ON feed_logs FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Users can update their own feed logs
CREATE POLICY "FeedLogs: users update own"
  ON feed_logs FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Users can delete their own feed logs
CREATE POLICY "FeedLogs: users delete own"
  ON feed_logs FOR DELETE
  USING (owner_id = auth.uid());

-- ── 7. Auto-update updated_at trigger ────────────────────────
-- Reuse existing function if not already present.
CREATE OR REPLACE FUNCTION update_nutrition_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to feed_schedules
CREATE TRIGGER trigger_feed_schedules_updated_at
  BEFORE UPDATE ON feed_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_nutrition_updated_at();

-- Apply trigger to feed_logs
CREATE TRIGGER trigger_feed_logs_updated_at
  BEFORE UPDATE ON feed_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_nutrition_updated_at();
