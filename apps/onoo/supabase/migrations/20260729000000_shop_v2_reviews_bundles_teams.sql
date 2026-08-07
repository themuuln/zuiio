-- Shop V2: team_id, reviews, bundles
-- ============================================================================
-- Adds team connection, customer reviews, and bundle deals to the shop.
-- ============================================================================

-- ============================================================================
-- 1. Add team_id to products
-- ============================================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_team_id ON public.products(team_id);

-- ============================================================================
-- 2. Create product_reviews table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text NOT NULL,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON public.product_reviews(is_approved);

-- ============================================================================
-- 3. Create bundles tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  discount_percent smallint NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES public.product_bundles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bundle_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON public.bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_items_product ON public.bundle_items(product_id);

-- ============================================================================
-- 4. RLS policies
-- ============================================================================

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

-- Product reviews: anon can read approved, anon can insert
DO $$ BEGIN
  DROP POLICY IF EXISTS "reviews_public_read" ON public.product_reviews;
  CREATE POLICY "reviews_public_read" ON public.product_reviews
    FOR SELECT TO anon, authenticated
    USING (is_approved = true);
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "reviews_admin_all" ON public.product_reviews;
  CREATE POLICY "reviews_admin_all" ON public.product_reviews
    TO authenticated
    USING (true)
    WITH CHECK (true);
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "reviews_public_insert" ON public.product_reviews;
  CREATE POLICY "reviews_public_insert" ON public.product_reviews
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);
END $$;

-- Bundles: public read active; admin full
DO $$ BEGIN
  DROP POLICY IF EXISTS "bundles_public_read" ON public.product_bundles;
  CREATE POLICY "bundles_public_read" ON public.product_bundles
    FOR SELECT TO anon, authenticated
    USING (is_active = true);
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "bundles_admin_all" ON public.product_bundles;
  CREATE POLICY "bundles_admin_all" ON public.product_bundles
    TO authenticated
    USING (true)
    WITH CHECK (true);
END $$;

-- Bundle items: public read based on active bundles; admin full
DO $$ BEGIN
  DROP POLICY IF EXISTS "bundle_items_public_read" ON public.bundle_items;
  CREATE POLICY "bundle_items_public_read" ON public.bundle_items
    FOR SELECT TO anon, authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.product_bundles
        WHERE id = bundle_id AND is_active = true
      )
    );
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "bundle_items_admin_all" ON public.bundle_items;
  CREATE POLICY "bundle_items_admin_all" ON public.bundle_items
    TO authenticated
    USING (true)
    WITH CHECK (true);
END $$;

-- ============================================================================
-- 5. Recreate v_public_shop_products with team join
-- ============================================================================

DROP VIEW IF EXISTS public.v_public_shop_products CASCADE;

CREATE VIEW public.v_public_shop_products
WITH (security_barrier = true) AS
SELECT
  p.id,
  p.name,
  p.name_en,
  p.slug,
  p.description,
  p.price_mnt,
  p.images,
  p.category,
  p.variants,
  p.is_available,
  p.team_id,
  t.name AS team_name,
  t.slug AS team_slug,
  t.primary_color AS team_primary_color,
  t.short_code AS team_short_code,
  p.created_at,
  p.updated_at
FROM public.products p
LEFT JOIN public.teams t ON t.id = p.team_id
WHERE p.is_available = true;

-- ============================================================================
-- 6. Grants
-- ============================================================================

GRANT SELECT ON public.v_public_shop_products TO anon, authenticated;
GRANT SELECT, INSERT ON public.product_reviews TO anon, authenticated;
GRANT SELECT ON public.product_bundles TO anon, authenticated;
GRANT SELECT ON public.bundle_items TO anon, authenticated;

-- ============================================================================
-- 7. Seed data: sample reviews for existing products
-- ============================================================================

INSERT INTO public.product_reviews (product_id, author_name, rating, content, is_approved)
SELECT p.id, 'Бат-Эрдэнэ', 5, 'Чанартай бүтээгдэхүүн. Хүргэлт хурдан.', true
FROM public.products p WHERE p.slug = 'onoo-t-shirt'
AND NOT EXISTS (SELECT 1 FROM public.product_reviews WHERE product_id = p.id);

INSERT INTO public.product_reviews (product_id, author_name, rating, content, is_approved)
SELECT p.id, 'Оюунтуяа', 4, 'Өмсөхөд тав тухтай. Хэмжээ нь стандарт.', true
FROM public.products p WHERE p.slug = 'onoo-t-shirt'
AND NOT EXISTS (SELECT 1 FROM public.product_reviews WHERE product_id = p.id AND author_name = 'Оюунтуяа');

INSERT INTO public.product_reviews (product_id, author_name, rating, content, is_approved)
SELECT p.id, 'Ганболд', 5, 'Даавуу нь сайн, хэдэн удаа угаахад хэвэндээ үлдсэн.', true
FROM public.products p WHERE p.slug = 'onoo-hoodie'
AND NOT EXISTS (SELECT 1 FROM public.product_reviews WHERE product_id = p.id);

-- ============================================================================
-- 8. Seed data: sample bundle
-- ============================================================================

INSERT INTO public.product_bundles (id, name, description, discount_percent, is_active)
SELECT 'b0000000-0000-0000-0000-000000000001', 'Onoo Starter Pack', 'T-Shirt + малгай хямдруулсан багц. Дуртай багийнхаа хэрэгслээр гараагаа эхлүүлээрэй!', 15, true
WHERE NOT EXISTS (SELECT 1 FROM public.product_bundles WHERE id = 'b0000000-0000-0000-0000-000000000001');

INSERT INTO public.bundle_items (bundle_id, product_id)
SELECT 'b0000000-0000-0000-0000-000000000001', id
FROM public.products
WHERE slug IN ('onoo-t-shirt', 'onoo-cap')
AND NOT EXISTS (
  SELECT 1 FROM public.bundle_items
  WHERE bundle_id = 'b0000000-0000-0000-0000-000000000001' AND product_id = products.id
);
