-- ============================================================
-- Team Horses & Activity Log — extends multi-user teams
-- Version: 41 (2026-07-16)
--
-- Tables:
--   team_horses        — many-to-many association: teams ↔ horses
--   team_activity_log  — chronological audit trail per team
--
-- RLS ensures:
--   - Team members can read team_horses and activity_log
--   - Owner/manager can add/remove horses
--   - All team members can log activity (app-level enforced)
-- ============================================================

-- ── 1. Create team_horses table ────────────────────────────────

CREATE TABLE IF NOT EXISTS team_horses (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id   UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  horse_id  UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  added_by  UUID REFERENCES profiles(id),
  added_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, horse_id)
);

CREATE INDEX IF NOT EXISTS idx_team_horses_team
  ON team_horses(team_id);

CREATE INDEX IF NOT EXISTS idx_team_horses_horse
  ON team_horses(horse_id);

-- ── 2. Create team_activity_log table ──────────────────────────

CREATE TABLE IF NOT EXISTS team_activity_log (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id    UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id),
  action     TEXT NOT NULL,
  details    JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_activity_team
  ON team_activity_log(team_id);

CREATE INDEX IF NOT EXISTS idx_team_activity_created
  ON team_activity_log(created_at);

CREATE INDEX IF NOT EXISTS idx_team_activity_team_created
  ON team_activity_log(team_id, created_at DESC);

-- ── 3. RLS policies ────────────────────────────────────────────

ALTER TABLE team_horses ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_activity_log ENABLE ROW LEVEL SECURITY;

-- team_horses: members can read
CREATE POLICY "team_horses_select_member"
  ON team_horses
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  );

-- team_horses: owner/manager can insert
CREATE POLICY "team_horses_insert_owner_manager"
  ON team_horses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_horses.team_id
        AND team_members.user_id = auth.uid()
        AND (team_members.role = 'owner' OR team_members.role = 'manager')
    )
  );

-- team_horses: owner/manager can delete
CREATE POLICY "team_horses_delete_owner_manager"
  ON team_horses
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_horses.team_id
        AND team_members.user_id = auth.uid()
        AND (team_members.role = 'owner' OR team_members.role = 'manager')
    )
  );

-- team_activity_log: members can read
CREATE POLICY "team_activity_select_member"
  ON team_activity_log
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  );

-- team_activity_log: members can insert (log their own actions)
CREATE POLICY "team_activity_insert_member"
  ON team_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  );
