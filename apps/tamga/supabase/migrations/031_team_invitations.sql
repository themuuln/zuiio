-- ============================================================
-- Team Invitations — pending/accept/decline flow
-- Version: 31 (2026-06-18)
--
-- Tables:
--   team_invitations  — invitations to join a team
--
-- RLS ensures:
--   - Invited users can see their own invitations
--   - Team members can see invitations for their team
--   - Team owners/managers can create, update, and delete invitations
--   - Invited users can accept or decline their own pending invitations
-- ============================================================

-- ── 1. Create team_invitations table ─────────────────────────────

CREATE TABLE IF NOT EXISTS team_invitations (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id           UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team_name         TEXT NOT NULL DEFAULT '',
  invited_user_id   TEXT NOT NULL,
  invited_by_user_id TEXT NOT NULL,
  role              TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'vet', 'groom', 'viewer')),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Indexes ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_team_invitations_team
  ON team_invitations(team_id);

CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_user
  ON team_invitations(invited_user_id);

CREATE INDEX IF NOT EXISTS idx_team_invitations_status
  ON team_invitations(status);

CREATE INDEX IF NOT EXISTS idx_team_invitations_team_status
  ON team_invitations(team_id, status);

CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_user_status
  ON team_invitations(invited_user_id, status);

-- ── 3. RLS policies ──────────────────────────────────────────────

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Invited users can see their own invitations
CREATE POLICY "team_invitations_select_invited"
  ON team_invitations
  FOR SELECT
  TO authenticated
  USING (invited_user_id = auth.uid()::text);

-- Team members can see invitations for their team
CREATE POLICY "team_invitations_select_team_member"
  ON team_invitations
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  );

-- Team owners and managers can create invitations for their team
CREATE POLICY "team_invitations_insert_owner_manager"
  ON team_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_invitations.team_id
        AND team_members.user_id = auth.uid()
        AND (team_members.role = 'owner' OR team_members.role = 'manager')
    )
  );

-- Invited users can accept or decline their own pending invitations
CREATE POLICY "team_invitations_update_invited"
  ON team_invitations
  FOR UPDATE
  TO authenticated
  USING (invited_user_id = auth.uid()::text AND status = 'pending')
  WITH CHECK (invited_user_id = auth.uid()::text AND status IN ('accepted', 'declined'));

-- Team owners and managers can update invitations (e.g., cancel)
CREATE POLICY "team_invitations_update_owner_manager"
  ON team_invitations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_invitations.team_id
        AND team_members.user_id = auth.uid()
        AND (team_members.role = 'owner' OR team_members.role = 'manager')
    )
  );

-- Team owners and managers can delete invitations
CREATE POLICY "team_invitations_delete_owner_manager"
  ON team_invitations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_invitations.team_id
        AND team_members.user_id = auth.uid()
        AND (team_members.role = 'owner' OR team_members.role = 'manager')
    )
  );

-- ── 4. Auto-update updated_at trigger ────────────────────────────

-- Uses the moddatetime extension (already installed in migration 001)
CREATE TRIGGER trigger_team_invitations_updated_at
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);
