-- ============================================================================
-- News articles — admin-managed public content
--
-- * Writes go through cmd_create_news / cmd_update_news / cmd_delete_news
--   (SECURITY DEFINER, org owner/admin authorization, empty search_path).
-- * The news table itself has NO direct write policies — only the two
--   SELECT policies below (public published rows + org admin full read).
-- * Public pages read the curated v_public_news view (published only).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  excerpt text,
  body text NOT NULL,
  cover_image_url text,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS news_published_at_idx ON public.news (published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS news_created_at_idx ON public.news (created_at DESC);

-- ── RLS policies ────────────────────────────────────────────────────────────
-- Public readers: published rows only (also backs the security_invoker view).
CREATE POLICY public_read_news ON public.news
  FOR SELECT TO anon, authenticated
  USING (published = true);

-- Org owner/admin: full read (drafts included) for the admin console.
CREATE POLICY admin_read_news ON public.news
  FOR SELECT TO authenticated
  USING (
    exists (
      select 1 from public.memberships m
      where m.user_id = (select auth.uid())
        and m.scope_type = 'org'
        and m.role in ('owner', 'admin')
    )
  );

-- ── Public curated view ─────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_public_news
WITH (security_invoker = true)
AS
SELECT
  n.id,
  n.title,
  n.excerpt,
  n.body,
  n.cover_image_url,
  n.published_at,
  n.created_at
FROM public.news n
WHERE n.published = true;

-- ── Grants ──────────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.news TO anon, authenticated;
GRANT SELECT ON public.v_public_news TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;

-- ── Write commands (SECURITY DEFINER) ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.cmd_create_news(
  p_title text,
  p_excerpt text,
  p_body text,
  p_cover_image_url text,
  p_published boolean
) RETURNS public.news
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row public.news;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = (SELECT auth.uid())
      AND m.scope_type = 'org'
      AND m.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Permission denied: org admin role required';
  END IF;

  INSERT INTO public.news (title, excerpt, body, cover_image_url, published, published_at, created_by)
  VALUES (
    p_title,
    NULLIF(p_excerpt, ''),
    p_body,
    NULLIF(p_cover_image_url, ''),
    COALESCE(p_published, false),
    CASE WHEN COALESCE(p_published, false) THEN now() ELSE NULL END,
    (SELECT auth.uid())
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.cmd_update_news(
  p_id uuid,
  p_title text,
  p_excerpt text,
  p_body text,
  p_cover_image_url text,
  p_published boolean
) RETURNS public.news
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row public.news;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = (SELECT auth.uid())
      AND m.scope_type = 'org'
      AND m.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Permission denied: org admin role required';
  END IF;

  UPDATE public.news n
  SET title = p_title,
      excerpt = NULLIF(p_excerpt, ''),
      body = p_body,
      cover_image_url = NULLIF(p_cover_image_url, ''),
      published = COALESCE(p_published, false),
      published_at = CASE
        WHEN COALESCE(p_published, false) AND n.published_at IS NULL THEN now()
        WHEN COALESCE(p_published, false) THEN n.published_at
        ELSE NULL
      END,
      updated_at = now()
  WHERE n.id = p_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'News article not found';
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.cmd_delete_news(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = (SELECT auth.uid())
      AND m.scope_type = 'org'
      AND m.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Permission denied: org admin role required';
  END IF;

  DELETE FROM public.news WHERE id = p_id;
  RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cmd_create_news(text, text, text, text, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cmd_update_news(uuid, text, text, text, text, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cmd_delete_news(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.cmd_create_news(text, text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cmd_update_news(uuid, text, text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cmd_delete_news(uuid) TO authenticated;
