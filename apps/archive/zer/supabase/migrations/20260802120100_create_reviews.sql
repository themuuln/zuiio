-- =============================================
-- Product Reviews
--
-- Customer reviews for public storefront products.
-- Customers submit via RPC (status=pending); org admins moderate.
-- =============================================

-- =============================================
-- 1. Reviews table
-- =============================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reviews_org ON public.reviews (organization_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_org_status ON public.reviews (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_product_status ON public.reviews (product_id, status);

-- =============================================
-- 2. RLS
-- =============================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Admin moderation: full org-scoped CRUD gated by permission.
DROP POLICY IF EXISTS reviews_select_own_org ON public.reviews;
CREATE POLICY reviews_select_own_org ON public.reviews
  FOR SELECT USING (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('reviews.read'::public.app_permission)
  );

DROP POLICY IF EXISTS reviews_insert_own_org ON public.reviews;
CREATE POLICY reviews_insert_own_org ON public.reviews
  FOR INSERT WITH CHECK (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('reviews.create'::public.app_permission)
  );

DROP POLICY IF EXISTS reviews_update_own_org ON public.reviews;
CREATE POLICY reviews_update_own_org ON public.reviews
  FOR UPDATE USING (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('reviews.update'::public.app_permission)
  )
  WITH CHECK (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('reviews.update'::public.app_permission)
  );

DROP POLICY IF EXISTS reviews_delete_own_org ON public.reviews;
CREATE POLICY reviews_delete_own_org ON public.reviews
  FOR DELETE USING (
    organization_id = (SELECT public.get_current_organization())
    AND public.has_permission('reviews.delete'::public.app_permission)
  );

-- =============================================
-- 3. Grants
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL PRIVILEGES ON public.reviews TO service_role;

-- =============================================
-- 4. Public read RPC (approved reviews only)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_public_reviews(p_slug TEXT, p_product_id UUID)
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
          'id', r.id,
          'customer_name', r.customer_name,
          'rating', r.rating,
          'comment', r.comment,
          'created_at', r.created_at
        )
        ORDER BY r.created_at DESC
      ),
      '[]'::json
    )
    FROM public.reviews r
    WHERE r.organization_id = v_org_id
      AND r.product_id = p_product_id
      AND r.status = 'approved'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_reviews(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_reviews(TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_reviews(TEXT, UUID) TO authenticated;

-- =============================================
-- 5. Public submit RPC (creates pending review)
-- =============================================
CREATE OR REPLACE FUNCTION public.submit_product_review(
  p_slug TEXT,
  p_product_id UUID,
  p_customer_name TEXT,
  p_rating INTEGER,
  p_comment TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id UUID;
  v_review_id UUID;
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN
    RETURN json_build_object('success', false, 'error', 'Үнэлгээ 1-5 хооронд байх ёстой.');
  END IF;

  IF p_comment IS NULL OR length(btrim(p_comment)) < 1 THEN
    RETURN json_build_object('success', false, 'error', 'Сэтгэгдэл шаардлагатай.');
  END IF;

  IF p_customer_name IS NULL OR length(btrim(p_customer_name)) < 1 THEN
    RETURN json_build_object('success', false, 'error', 'Нэр шаардлагатай.');
  END IF;

  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE slug = p_slug;

  IF v_org_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Байгууллага олдсонгүй.');
  END IF;

  -- Product must exist, be public, and belong to the org.
  IF NOT EXISTS (
    SELECT 1 FROM public.products
    WHERE id = p_product_id
      AND organization_id = v_org_id
      AND is_public = true
      AND deleted_at IS NULL
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Бүтээгдэхүүн олдсонгүй.');
  END IF;

  INSERT INTO public.reviews (organization_id, product_id, customer_name, rating, comment, status)
  VALUES (v_org_id, p_product_id, btrim(p_customer_name), p_rating, btrim(p_comment), 'pending')
  RETURNING id INTO v_review_id;

  RETURN json_build_object('success', true, 'review_id', v_review_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_product_review(TEXT, UUID, TEXT, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_product_review(TEXT, UUID, TEXT, INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_product_review(TEXT, UUID, TEXT, INTEGER, TEXT) TO authenticated;

-- =============================================
-- 6. Backfill new permissions for existing orgs
--    Owner (level 0) and admin/manager (level 1) system roles
--    get the new permissions, matching org-creation behavior.
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
          'reviews.create',
          'reviews.read',
          'reviews.update',
          'reviews.delete'
        ]::public.app_permission[]
      )
    LOOP
      INSERT INTO public.role_permissions (role_id, permission)
      VALUES (v_role.role_id, v_perm)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
