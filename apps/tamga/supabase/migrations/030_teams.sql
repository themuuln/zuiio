-- ============================================================
-- Teams — multi-user stable management
-- Version: 30 (2026-06-18)
--
-- Tables:
--   teams          — stable/team groups
--   team_members   — membership with roles and permissions
--
-- RLS ensures:
--   - Members can read their teams
--   - Owners can manage everything
--   - Members can read other members in same team
--   - Owners can insert/update/delete members
-- ============================================================

-- ── 1. Create teams table ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS teams (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_count  INTEGER NOT NULL DEFAULT 1,
  horse_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teams_owner
  ON teams(owner_user_id);

-- ── 2. Create team_members table ────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_members (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id       UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'vet', 'groom', 'viewer')),
  permissions   TEXT[] DEFAULT '{}',
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team
  ON team_members(team_id);

CREATE INDEX IF NOT EXISTS idx_team_members_user
  ON team_members(user_id);

-- ── 3. RLS policies ────────────────────────────────────────────────

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- ── Teams RLS ──────────────────────────────────────────────────────

-- Members can read teams they belong to
CREATE POLICY "teams_select_member"
  ON teams
  FOR SELECT
  TO authenticated
  USING (
    owner_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
    )
  );

-- Owner can insert their own teams
CREATE POLICY "teams_insert_owner"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

-- Owner can update their own teams
CREATE POLICY "teams_update_owner"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Owner can delete their own teams
CREATE POLICY "teams_delete_owner"
  ON teams
  FOR DELETE
  TO authenticated
  USING (owner_user_id = auth.uid());

-- ── team_members RLS ──────────────────────────────────────────────

-- Members can read other members in same team
CREATE POLICY "team_members_select_member"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members AS tm
      WHERE tm.user_id = auth.uid()
    )
  );

-- Only owner/manager can invite new members (insert)
CREATE POLICY "team_members_insert_owner_manager"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members AS tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'manager')
    )
  );

-- Only owner/manager can update member roles
CREATE POLICY "team_members_update_owner_manager"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members AS tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'manager')
    )
  );

-- Only owner/manager can remove members
CREATE POLICY "team_members_delete_owner_manager"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members AS tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'manager')
    )
  );
