-- ============================================================
-- Tolom Test Data Migration
-- Apply this to the Tolom Supabase project (fhzuolncswccxkcqzclg)
-- ============================================================

-- 1. Create test organization
INSERT INTO organizations (id, name, slug, created_at)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Demo Auto Workshop', 'demo-auto-workshop', NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Create test branch
INSERT INTO branches (id, organization_id, name, slug, is_default, created_at)
VALUES ('b1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Main Branch', 'main', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Create expense categories
INSERT INTO expense_categories (id, organization_id, name, created_at)
VALUES 
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Parts', NOW()),
  ('c2b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Labor', NOW()),
  ('c3b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Rent', NOW()),
  ('c4b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Utilities', NOW()),
  ('c5b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Marketing', NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Create 20 customers
INSERT INTO customers (id, organization_id, full_name, phone, first_name, last_name, total_visits, last_visit_at, created_at)
SELECT 
  gen_random_uuid(),
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  CASE (random() * 9)::int
    WHEN 0 THEN 'Бат-Эрдэнэ'
    WHEN 1 THEN 'Ганбат'
    WHEN 2 THEN 'Оюунбат'
    WHEN 3 THEN 'Мөнхбат'
    WHEN 4 THEN 'Түвшинбат'
    WHEN 5 THEN 'Билэгт'
    WHEN 6 THEN 'Эрдэнэбат'
    WHEN 7 THEN 'Сүрэнжав'
    WHEN 8 THEN 'Дорж'
    WHEN 9 THEN 'Баяр'
  END || ' ' || (ARRAY['Ариунболд', 'Даваадорж', 'Энхбат', 'Оюунчимэг', 'Сайханбат'])[(random() * 4 + 1)::int],
  '99' || (random() * 9000000 + 1000000)::int::text,
  CASE (random() * 9)::int
    WHEN 0 THEN 'Бат'
    WHEN 1 THEN 'Ган'
    WHEN 2 THEN 'Оюун'
    WHEN 3 THEN 'Мөнх'
    WHEN 4 THEN 'Түвшин'
    WHEN 5 THEN 'Билэг'
    WHEN 6 THEN 'Эрдэнэ'
    WHEN 7 THEN 'Сүрэн'
    WHEN 8 THEN 'Дорж'
    WHEN 9 THEN 'Баяр'
  END,
  (ARRAY['Ариунболд', 'Даваадорж', 'Энхбат', 'Оюунчимэг', 'Сайханбат'])[(random() * 4 + 1)::int],
  (random() * 20 + 1)::int,
  NOW() - (random() * 30 || ' days')::interval,
  NOW() - (random() * 90 || ' days')::interval
FROM generate_series(1, 20) AS n;

-- 5. Create vehicles for customers
INSERT INTO vehicles (id, organization_id, customer_id, plate_number, make, model, year, created_at)
SELECT 
  gen_random_uuid(),
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  c.id,
  (ARRAY['УБА', 'УББ', 'УБД', 'УБЕ'])[(random() * 3 + 1)::int] || (random() * 9000 + 1000)::int::text,
  (ARRAY['Toyota', 'Hyundai', 'Nissan', 'Honda', 'Kia'])[(random() * 4 + 1)::int],
  (ARRAY['Camry', 'Sonata', 'Tiida', 'Civic', 'Sportage'])[(random() * 4 + 1)::int],
  (random() * 15 + 2010)::int,
  NOW() - (random() * 60 || ' days')::interval
FROM customers c
WHERE c.organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
LIMIT 15;

-- 6. Create 40 work orders (various statuses)
INSERT INTO work_orders (id, organization_id, customer_id, status, total_amount, plate_number, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  (SELECT id FROM customers WHERE organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' ORDER BY random() LIMIT 1),
  (ARRAY['pending', 'in_progress', 'waiting_parts', 'completed', 'delivered', 'cancelled'])[(random() * 5)::int],
  (random() * 2000000 + 100000)::numeric(12,2),
  (ARRAY['УБА', 'УББ', 'УБД'])[(random() * 2 + 1)::int] || (random() * 9000 + 1000)::int::text,
  NOW() - (random() * 30 || ' days')::interval,
  NOW() - (random() * 15 || ' days')::interval
FROM generate_series(1, 40) AS n;

-- 7. Create invoices (some paid, some unpaid)
INSERT INTO invoices (id, organization_id, customer_id, total, amount_paid, balance_due, status, issued_at, created_at)
SELECT 
  gen_random_uuid(),
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  (SELECT id FROM customers WHERE organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' ORDER BY random() LIMIT 1),
  (random() * 1500000 + 50000)::numeric(12,2),
  CASE WHEN random() > 0.3 THEN (random() * 1500000 + 50000)::numeric(12,2) ELSE 0 END,
  CASE WHEN random() > 0.3 THEN 0 ELSE (random() * 500000 + 50000)::numeric(12,2) END,
  CASE WHEN random() > 0.3 THEN 'paid' ELSE 'unpaid' END,
  NOW() - (random() * 30 || ' days')::interval,
  NOW() - (random() * 30 || ' days')::interval
FROM generate_series(1, 35) AS n;

-- 8. Create expenses (various categories)
INSERT INTO expenses (id, organization_id, amount, expense_date, description, category_id, created_at)
SELECT 
  gen_random_uuid(),
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  (random() * 500000 + 10000)::numeric(12,2),
  NOW() - (random() * 30 || ' days')::interval,
  (ARRAY['Сэлбэг худалдан авалт', 'Цалин', 'Түрээс', 'Цахилгаан', 'Сурталчилгаа', 'Бусад'])[(random() * 5 + 1)::int],
  (SELECT id FROM expense_categories WHERE organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' ORDER BY random() LIMIT 1),
  NOW() - (random() * 30 || ' days')::interval
FROM generate_series(1, 50) AS n;

-- 9. Create appointments
INSERT INTO appointments (id, organization_id, customer_id, vehicle_id, scheduled_at, status, notes, created_at)
SELECT 
  gen_random_uuid(),
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  c.id,
  (SELECT id FROM vehicles WHERE organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND customer_id = c.id ORDER BY random() LIMIT 1),
  NOW() + (random() * 7 || ' days')::interval + (random() * 12 || ' hours')::interval,
  (ARRAY['scheduled', 'confirmed', 'completed', 'cancelled'])[(random() * 3)::int],
  (ARRAY['Engine check', 'Oil change', 'Brake repair', 'Tire rotation', 'General service'])[(random() * 4 + 1)::int],
  NOW() - (random() * 7 || ' days')::interval
FROM customers c
WHERE c.organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
LIMIT 10;

-- 10. Link this org to the user's Telegram
-- UPDATE THIS with your actual telegram_user_id!
INSERT INTO telegram_links (id, organization_id, user_id, product_type, telegram_user_id, telegram_username, is_active, linked_at, created_at)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  (SELECT id FROM auth.users LIMIT 1),
  'tolom',
  YOUR_TELEGRAM_USER_ID,  -- <-- REPLACE THIS!
  'your_username',         -- <-- REPLACE THIS!
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Summary: What was created
-- ============================================================
-- 1 organization: "Demo Auto Workshop"
-- 1 branch: "Main Branch"
-- 5 expense categories
-- 20 customers with Mongolian names
-- 15 vehicles (Toyota, Hyundai, Nissan, Honda, Kia)
-- 40 work orders (mixed statuses)
-- 35 invoices (70% paid, 30% unpaid)
-- 50 expenses across categories
-- 10 appointments (next 7 days)
-- ============================================================
