-- =============================================
-- Blog Posts
--
-- Per-organization blog/articles CMS.
-- Admin CRUD scoped by org + permission; public read via RPC (published only).
-- =============================================

-- =============================================
-- 1. Blog posts table
-- =============================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_org ON public.blog_posts (organization_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_org_published ON public.blog_posts (organization_id, is_published, published_at);

-- =============================================
-- 2. RLS
-- =============================================
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blog_posts_select_own_org ON public.blog_posts;
CREATE POLICY blog_posts_select_own_org ON public.blog_posts
  FOR SELECT USING (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('blog.read'::public.app_permission)
  );

DROP POLICY IF EXISTS blog_posts_insert_own_org ON public.blog_posts;
CREATE POLICY blog_posts_insert_own_org ON public.blog_posts
  FOR INSERT WITH CHECK (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('blog.create'::public.app_permission)
  );

DROP POLICY IF EXISTS blog_posts_update_own_org ON public.blog_posts;
CREATE POLICY blog_posts_update_own_org ON public.blog_posts
  FOR UPDATE USING (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('blog.update'::public.app_permission)
  )
  WITH CHECK (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('blog.update'::public.app_permission)
  );

DROP POLICY IF EXISTS blog_posts_delete_own_org ON public.blog_posts;
CREATE POLICY blog_posts_delete_own_org ON public.blog_posts
  FOR DELETE USING (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('blog.delete'::public.app_permission)
  );

-- =============================================
-- 3. Grants
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL PRIVILEGES ON public.blog_posts TO service_role;

-- =============================================
-- 4. Public read RPCs (published posts only)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_public_blog_posts(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE slug = p_slug;

  IF v_org_id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'id', b.id,
          'title', b.title,
          'slug', b.slug,
          'excerpt', b.excerpt,
          'cover_image_url', b.cover_image_url,
          'published_at', b.published_at
        )
        ORDER BY b.published_at DESC
      ),
      '[]'::json
    )
    FROM public.blog_posts b
    WHERE b.organization_id = v_org_id
      AND b.is_published = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_blog_post(p_slug TEXT, p_post_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id UUID;
  v_post JSON;
BEGIN
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE slug = p_slug;

  IF v_org_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'id', b.id,
    'title', b.title,
    'slug', b.slug,
    'excerpt', b.excerpt,
    'content', b.content,
    'cover_image_url', b.cover_image_url,
    'published_at', b.published_at
  ) INTO v_post
  FROM public.blog_posts b
  WHERE b.organization_id = v_org_id
    AND b.slug = p_post_slug
    AND b.is_published = true;

  RETURN v_post;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_blog_posts(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_blog_posts(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_blog_posts(TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_public_blog_post(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_blog_post(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_blog_post(TEXT, TEXT) TO authenticated;

-- =============================================
-- 5. Backfill new permissions for existing orgs
-- =============================================
DO $$
DECLARE
  v_role RECORD;
  v_perm public.app_permission;
BEGIN
  FOR v_role IN
    SELECT DISTINCT r.id AS role_id
    FROM public.roles r
    WHERE r.is_system_role = true
      AND r.hierarchy_level IN (0, 1)
  LOOP
    FOR v_perm IN
      SELECT unnest(
        ARRAY[
          'blog.create',
          'blog.read',
          'blog.update',
          'blog.delete'
        ]::public.app_permission[]
      )
    LOOP
      INSERT INTO public.role_permissions (role_id, permission)
      VALUES (v_role.role_id, v_perm)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
