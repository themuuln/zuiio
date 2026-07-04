-- ============================================================
-- Drop team member_count column + add user lookup function
-- Version: 33 (2026-06-20)
--
-- Changes:
--   1. Drops `member_count` from `teams` — member count is
--      computed in application code via COUNT query instead.
--   2. Drops the now-unnecessary `increment_team_member_count`
--      and `decrement_team_member_count` RPC functions if they
--      happen to exist.
--   3. Creates `lookup_user_by_contact(contact)` RPC to resolve
--      a phone or email to an auth.uid() UUID at invite time.
-- ============================================================

-- ── 1. Drop member_count column from teams ───────────────────────
ALTER TABLE teams DROP COLUMN IF EXISTS member_count;

-- ── 2. Drop RPC functions if they exist ──────────────────────────
DROP FUNCTION IF EXISTS increment_team_member_count;
DROP FUNCTION IF EXISTS decrement_team_member_count;

-- ── 3. User lookup by phone or email (security definer) ──────────
--
-- Allows the anon-key SSR client to resolve a phone number or
-- email address to a user's auth.uid() UUID at invitation time.
-- Uses SECURITY DEFINER so it can read auth.users.

CREATE OR REPLACE FUNCTION lookup_user_by_contact(contact text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_id uuid;
BEGIN
  -- Try phone lookup in public.profiles first
  SELECT p.id INTO found_id
  FROM profiles p
  WHERE p.phone = contact;

  IF found_id IS NOT NULL THEN
    RETURN found_id;
  END IF;

  -- Try email lookup in auth.users
  SELECT u.id INTO found_id
  FROM auth.users u
  WHERE u.email = contact;

  RETURN found_id;
END;
$$;
