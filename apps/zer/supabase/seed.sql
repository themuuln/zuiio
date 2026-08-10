-- =============================================
-- Storefront E2E test fixture (local stack only).
--
-- Run against the LOCAL Supabase stack once (or after `supabase db reset`):
--   supabase start && psql "$(supabase status --output json | jq -r .DB_URL)" -f supabase/seed.sql
--
-- Idempotent: all rows use fixed UUIDs and upsert (ON CONFLICT (id) DO UPDATE),
-- so re-running refreshes prices/names without failing on FK-protected rows
-- (sales.organization_id is NO ACTION). This fixture backs:
--   - e2e/public-storefront.spec.ts (catalog pagination, variants, cart/checkout)
--   - manual storefront smoke tests (slug: storefront-e2e-test)
--   - tests/actions-organization.test.ts data expectations where applicable
--
-- Data: 1 org (catalog enabled, custom-domain fields), 1 branch, 2 categories,
-- 31 public products (30 plain + 1 with 3 variants + attributes), 1 blog post.
-- =============================================

BEGIN;

-- ── Org + public profile ────────────────────────────────────
INSERT INTO organizations (id, slug, name, currency, company_type, onboarding_completed)
VALUES ('10000000-0000-4000-8000-000000000001', 'storefront-e2e-test', 'Storefront E2E Shop', 'MNT', 'retail', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, currency = EXCLUDED.currency,
  company_type = EXCLUDED.company_type, onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO organization_public_profiles (
  organization_id, catalog_enabled, display_name, description,
  contact_email, contact_phone, address, website_url, business_hours
) VALUES (
  '10000000-0000-4000-8000-000000000001', true, 'Storefront E2E Shop',
  'Нийтийн дэлгүүрийн E2E тестийн дэлгүүр. Бүтээгдэхүүн, вариант, блог зэргийг шалгана.',
  'shop@example.mn', '99112233', 'Улаанбаатар, Чингэлтэй дүүрэг', 'https://example.mn',
  '{"Monday":"09:00-18:00","Tuesday":"09:00-18:00","Saturday":"10:00-15:00"}'::jsonb
)
ON CONFLICT (organization_id) DO UPDATE SET
  catalog_enabled = EXCLUDED.catalog_enabled, display_name = EXCLUDED.display_name,
  description = EXCLUDED.description, contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone, address = EXCLUDED.address,
  website_url = EXCLUDED.website_url, business_hours = EXCLUDED.business_hours;

-- ── Branch (required by submit_shop_order) ──────────────────
INSERT INTO branches (id, organization_id, name, slug, is_default)
VALUES ('80000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Төв салбар', 'main', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, is_default = EXCLUDED.is_default;

-- ── Categories ──────────────────────────────────────────────
INSERT INTO categories (id, organization_id, name, slug)
VALUES ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Хүнс', 'food'),
       ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Гэр ахуй', 'home')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

-- ── 30 plain public products (deterministic ids 900...01..30).
--    Pagination fixture: pageSize 24 -> page 2 has 6 products.
INSERT INTO products (id, organization_id, name, description, unit, sale_price, current_stock, min_stock, category_id, is_public, has_variants, published_at)
SELECT
  ('90000000-0000-4000-8000-0000000000' || lpad(gs::text, 2, '0'))::uuid AS id,
  '10000000-0000-4000-8000-000000000001',
  'Бүтээгдэхүүн ' || gs,
  CASE WHEN gs % 5 = 0 THEN 'Энэ бүтээгдэхүүний дэлгэрэнгүй тайлбар. Хоёр дахь өгүүлбэр.' ELSE NULL END,
  'ширхэг',
  (gs * 1000)::numeric,
  20::numeric,
  5::numeric,
  CASE WHEN gs % 2 = 0 THEN '20000000-0000-4000-8000-000000000001'::uuid
       ELSE '20000000-0000-4000-8000-000000000002'::uuid END,
  true,
  false,
  now()
FROM generate_series(1, 30) AS gs
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  sale_price = EXCLUDED.sale_price, current_stock = EXCLUDED.current_stock,
  min_stock = EXCLUDED.min_stock, category_id = EXCLUDED.category_id,
  is_public = EXCLUDED.is_public, published_at = EXCLUDED.published_at;

-- ── Variant product + options + assignments + attributes ────
INSERT INTO products (id, organization_id, name, description, unit, sale_price, current_stock, min_stock, category_id, is_public, has_variants, published_at)
VALUES ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
        'Цамц (Варианттай)', 'Өнгө, хэмжээний сонголттой цамц.', 'ширхэг', 12000, 100, 10,
        '20000000-0000-4000-8000-000000000002', true, true, now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, sale_price = EXCLUDED.sale_price,
  current_stock = EXCLUDED.current_stock, min_stock = EXCLUDED.min_stock,
  category_id = EXCLUDED.category_id, is_public = EXCLUDED.is_public, has_variants = true;

INSERT INTO product_variant_groups (id, product_id, name, sort_order)
VALUES ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Хэмжээ', 0),
       ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'Өнгө', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO product_variant_options (id, group_id, value, sort_order)
VALUES ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'S', 0),
       ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', 'M', 1),
       ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000001', 'L', 2),
       ('50000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000002', 'Хар', 0),
       ('50000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000002', 'Цагаан', 1)
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, sort_order = EXCLUDED.sort_order;

INSERT INTO product_variants (id, product_id, sku, sale_price, current_stock, min_stock)
VALUES ('60000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'SHIRT-S-BLK', 12000, 10, 2),
       ('60000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'SHIRT-M-WHT', 12500, 15, 2),
       ('60000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'SHIRT-L-BLK', 13000, 8, 2)
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku, sale_price = EXCLUDED.sale_price,
  current_stock = EXCLUDED.current_stock, min_stock = EXCLUDED.min_stock;

INSERT INTO product_variant_assignments (variant_id, option_id)
VALUES ('60000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001'),
       ('60000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000004'),
       ('60000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000002'),
       ('60000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000005'),
       ('60000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000003'),
       ('60000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000004')
ON CONFLICT (variant_id, option_id) DO NOTHING;

INSERT INTO product_attribute_definitions (id, organization_id, name, slug, value_type)
VALUES ('70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Материал', 'material', 'text'),
       ('70000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Ус нэвтэрдэггүй', 'waterproof', 'boolean')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, value_type = EXCLUDED.value_type;

INSERT INTO product_attribute_values (product_id, attribute_definition_id, organization_id, value_text)
VALUES ('30000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Хөвөн')
ON CONFLICT (product_id, attribute_definition_id) DO UPDATE SET value_text = EXCLUDED.value_text;

INSERT INTO product_attribute_values (product_id, attribute_definition_id, organization_id, value_boolean)
VALUES ('30000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', true)
ON CONFLICT (product_id, attribute_definition_id) DO UPDATE SET value_boolean = EXCLUDED.value_boolean;

-- ── Blog post (multi-paragraph content) ─────────────────────
INSERT INTO blog_posts (organization_id, title, slug, excerpt, content, is_published, published_at)
VALUES (
  '10000000-0000-4000-8000-000000000001',
  'Шинэ улирлын цуглуулга ирлээ',
  'new-season-collection',
  'Энэ улирлын шинэ бүтээгдэхүүнүүд нэмэгдлээ.',
  'Шинэ улирлын цуглуулга ирлээ.\n\nЭнэ удаад бид 30 гаруй шинэ бүтээгдэхүүн нэмсэн.\n\nБүх бүтээгдэхүүн онлайн захиалгаар авах боломжтой.',
  true,
  now()
)
ON CONFLICT (organization_id, slug) DO UPDATE SET
  title = EXCLUDED.title, excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content, is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at;

COMMIT;
