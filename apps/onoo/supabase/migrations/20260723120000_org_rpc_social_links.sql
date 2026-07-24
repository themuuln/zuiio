-- ============================================================================
-- Update cmd_update_organization to accept social_links
-- ============================================================================

-- Drop the old 8-param overload to avoid ambiguous REVOKE/GRANT on the new function
DROP FUNCTION IF EXISTS public.cmd_update_organization(uuid, text, text, text, text, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.cmd_update_organization(
  p_org_id uuid,
  p_name text DEFAULT NULL,
  p_slug text DEFAULT NULL,
  p_logo_url text DEFAULT NULL,
  p_contact_phone text DEFAULT NULL,
  p_contact_email text DEFAULT NULL,
  p_website text DEFAULT NULL,
  p_settings jsonb DEFAULT NULL,
  p_social_links jsonb DEFAULT NULL
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
    settings = COALESCE(p_settings, settings),
    social_links = COALESCE(p_social_links, social_links)
  WHERE id = p_org_id
  RETURNING * INTO v_org;

  IF NOT FOUND THEN RAISE EXCEPTION 'organization not found'; END IF;
  PERFORM private.write_audit('update_organization', 'organization', p_org_id,
    jsonb_build_object('name', p_name));
  RETURN v_org;
END;
$$;

REVOKE ALL ON FUNCTION public.cmd_update_organization(uuid, text, text, text, text, text, text, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_update_organization(uuid, text, text, text, text, text, text, jsonb, jsonb) TO authenticated;
