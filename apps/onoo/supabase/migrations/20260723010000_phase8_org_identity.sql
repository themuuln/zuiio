-- ============================================================================
-- Phase 8 — Organizational identity extension
-- Extends public.organizations with branding, contact, and settings fields.
-- Adds cmd_* functions for org management.
-- ============================================================================

-- ── Extend organizations table ────────────────────────────────────────────
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;

-- Add slug for existing orgs (use sanitized name)
UPDATE public.organizations SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9\u0400-\u04FF]+', '-', 'g'))
WHERE slug IS NULL;

-- Make slug NOT NULL after backfill
ALTER TABLE public.organizations ALTER COLUMN slug SET NOT NULL;

-- ── Index for org lookups ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS organizations_slug_idx ON public.organizations (slug);

-- ── Org management commands ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cmd_update_organization(
  p_org_id uuid,
  p_name text DEFAULT NULL,
  p_slug text DEFAULT NULL,
  p_logo_url text DEFAULT NULL,
  p_contact_phone text DEFAULT NULL,
  p_contact_email text DEFAULT NULL,
  p_website text DEFAULT NULL,
  p_settings jsonb DEFAULT NULL
) RETURNS public.organizations LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE v_org public.organizations;
BEGIN
  -- Only org-level owners and admins may update org profile
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = (SELECT auth.uid())
      AND m.scope_type = 'org'
      AND m.scope_id = p_org_id
      AND m.role IN ('owner', 'admin')
  ) THEN RAISE EXCEPTION 'not authorized to update organization';
  END IF;

  UPDATE public.organizations SET
    name = COALESCE(p_name, name),
    slug = COALESCE(p_slug, slug),
    logo_url = COALESCE(p_logo_url, logo_url),
    contact_phone = COALESCE(p_contact_phone, contact_phone),
    contact_email = COALESCE(p_contact_email, contact_email),
    website = COALESCE(p_website, website),
    settings = COALESCE(p_settings, settings)
  WHERE id = p_org_id
  RETURNING * INTO v_org;

  IF NOT FOUND THEN RAISE EXCEPTION 'organization not found'; END IF;
  PERFORM private.write_audit('update_organization', 'organization', p_org_id,
    jsonb_build_object('name', p_name));
  RETURN v_org;
END;
$$;

REVOKE ALL ON FUNCTION public.cmd_update_organization FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_update_organization TO authenticated;

-- ── RLS: Authenticated users can read orgs (already exists), owners/admins manage ──
-- Existing public_read_organizations policy from v2 baseline covers anon reads
-- Admin writes go through cmd_update_organization (SECURITY DEFINER), not direct DML

-- Ensure authenticated users can read orgs for admin UI
DROP POLICY IF EXISTS authenticated_read_organizations ON public.organizations;
CREATE POLICY authenticated_read_organizations ON public.organizations
  FOR SELECT TO authenticated USING (true);
