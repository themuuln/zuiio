-- Soft-delete for organization_users: add removed_at column
-- Instead of hard-deleting members, set removed_at to timestamp
-- All active-membership queries filter .is("removed_at", null)

ALTER TABLE public.organization_users
  ADD COLUMN removed_at timestamp with time zone;

-- Index for efficient filtering on active memberships
CREATE INDEX idx_org_users_active ON public.organization_users (organization_id, user_id)
  WHERE removed_at IS NULL;
