-- Seed product_presets table with gym brand data
-- This powers the "Брэнд, бүтээгдэхүүний сан" card in settings

-- Add image columns to product_presets
ALTER TABLE public.product_presets ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.product_presets ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

INSERT INTO public.product_presets (brand_name, brand_logo_url, product_name, product_sku, category_name, unit, cost_price, sale_price, min_stock, sort_order) VALUES

-- Myprotein
('Myprotein', NULL, 'Impact Whey Protein 2.5kg', 'MP-WHEY-25', 'Протейн', 'ш', 120000, 160000, 5, 1),
('Myprotein', NULL, 'Impact Whey Protein 1kg', 'MP-WHEY-10', 'Протейн', 'ш', 55000, 75000, 5, 2),
('Myprotein', NULL, 'Casein Protein 1kg', 'MP-CASEIN-10', 'Протейн', 'ш', 65000, 85000, 3, 3),
('Myprotein', NULL, 'Creatine Monohydrate 500g', 'MP-CREATINE-05', 'Креатин', 'ш', 35000, 50000, 5, 4),
('Myprotein', NULL, 'BCAA 2:1:1 500g', 'MP-BCAA-05', 'Амин хүчил', 'ш', 30000, 45000, 5, 5),
('Myprotein', NULL, 'Pre-Workout 500g', 'MP-PRE-05', 'Дасгалын өмнөх', 'ш', 40000, 60000, 3, 6),
('Myprotein', NULL, 'L-Glutamine 500g', 'MP-GLUT-05', 'Амин хүчил', 'ш', 25000, 38000, 3, 7),
('Myprotein', NULL, 'Omega 3 Fish Oil 120 caps', 'MP-OMEGA-120', 'Витамин', 'ш', 15000, 25000, 5, 8),
('Myprotein', NULL, 'Multivitamin 60 tabs', 'MP-MV-60', 'Витамин', 'ш', 12000, 20000, 5, 9),
('Myprotein', NULL, 'Protein Bar 12x60g', 'MP-BAR-12', 'Амттан', 'ш', 20000, 30000, 10, 10),

-- Thorne
('Thorne', NULL, 'Whey Protein Isolate 2lb', 'TH-WPI-2', 'Протейн', 'ш', 80000, 120000, 3, 11),
('Thorne', NULL, 'Creatine Capsules 120 caps', 'TH-CREATINE-120', 'Креатин', 'ш', 45000, 65000, 3, 12),
('Thorne', NULL, 'Vitamin D-5000 60 caps', 'TH-VITD-60', 'Витамин', 'ш', 18000, 28000, 5, 13),
('Thorne', NULL, 'Omega-3 60 caps', 'TH-OMEGA-60', 'Витамин', 'ш', 25000, 38000, 5, 14),
('Thorne', NULL, 'Magnesium Citrate 60 caps', 'TH-MAG-60', 'Эрдэс', 'ш', 20000, 30000, 5, 15),
('Thorne', NULL, 'Zinc Picolinate 60 caps', 'TH-ZINC-60', 'Эрдэс', 'ш', 15000, 22000, 5, 16),
('Thorne', NULL, 'Basic B Complex 60 caps', 'TH-BCOM-60', 'Витамин', 'ш', 22000, 35000, 3, 17),
('Thorne', NULL, 'Vitamin C 500mg 90 caps', 'TH-VITC-90', 'Витамин', 'ш', 16000, 25000, 5, 18),

-- HiTec Nutrition
('HiTec Nutrition', NULL, 'Whey Protein 2kg', 'HT-WHEY-20', 'Протейн', 'ш', 90000, 130000, 3, 19),
('HiTec Nutrition', NULL, 'Mass Gainer 3kg', 'HT-MASS-30', 'Жин нэмэгч', 'ш', 100000, 140000, 3, 20),
('HiTec Nutrition', NULL, 'L-Carnitine 60 caps', 'HT-CARN-60', 'Өөх шатаагч', 'ш', 20000, 32000, 5, 21),
('HiTec Nutrition', NULL, 'Creatine Monohydrate 300g', 'HT-CREA-03', 'Креатин', 'ш', 25000, 38000, 5, 22),
('HiTec Nutrition', NULL, 'BCAA 500g', 'HT-BCAA-05', 'Амин хүчил', 'ш', 28000, 42000, 5, 23),
('HiTec Nutrition', NULL, 'Glucosamine 90 tabs', 'HT-GLUC-90', 'Үе мөч', 'ш', 22000, 35000, 3, 24),

-- Real Pharm
('Real Pharm', NULL, 'Whey Protein 2kg', 'RP-WHEY-20', 'Протейн', 'ш', 75000, 110000, 3, 25),
('Real Pharm', NULL, 'Creatine 500g', 'RP-CREA-05', 'Креатин', 'ш', 22000, 35000, 5, 26),
('Real Pharm', NULL, 'BCAA 400g', 'RP-BCAA-04', 'Амин хүчил', 'ш', 20000, 30000, 5, 27),
('Real Pharm', NULL, 'L-Carnitine Liquid 1000ml', 'RP-CARN-LQ', 'Өөх шатаагч', 'ш', 25000, 38000, 3, 28),
('Real Pharm', NULL, 'Omega 3 100 caps', 'RP-OMEGA-100', 'Витамин', 'ш', 18000, 28000, 5, 29)

ON CONFLICT DO NOTHING;

-- Set product images (sourced from official manufacturer websites)
-- ── Real Pharm ──
UPDATE public.product_presets SET image_url = 'https://realpharm.eu/hpeciai/6dcaa99e728653d397a73530e7086548/eng_pl_REAL-WHEY-100-2KG-1284_1.jpg', image_urls = ARRAY['https://realpharm.eu/hpeciai/6dcaa99e728653d397a73530e7086548/eng_pl_REAL-WHEY-100-2KG-1284_1.jpg'] WHERE product_sku = 'RP-WHEY-20';
UPDATE public.product_presets SET image_url = 'https://realpharm.eu/hpeciai/eecec708ff50a25f7ba0722e08f1a3cc/eng_pl_Real-Pharm-Kreatyna-Creatine-500g-1022_3.png', image_urls = ARRAY['https://realpharm.eu/hpeciai/eecec708ff50a25f7ba0722e08f1a3cc/eng_pl_Real-Pharm-Kreatyna-Creatine-500g-1022_3.png'] WHERE product_sku = 'RP-CREA-05';
UPDATE public.product_presets SET image_url = 'https://realpharm.eu/hpeciai/2b58caf2639603bf3fbab6077e5d487b/eng_pl_ProActive-Aminokwasy-BCAA-400g-GRAPE-2639_7.png', image_urls = ARRAY['https://realpharm.eu/hpeciai/2b58caf2639603bf3fbab6077e5d487b/eng_pl_ProActive-Aminokwasy-BCAA-400g-GRAPE-2639_7.png'] WHERE product_sku = 'RP-BCAA-04';
-- FIXME: RP-CARN-LQ (L-Carnitine Liquid) needs a correct product image.
-- The previous assignment used the Omega-3 image URL by mistake (copy-paste error).
-- Set to NULL until the correct image URL can be sourced from the manufacturer.
UPDATE public.product_presets SET image_url = NULL, image_urls = '{}' WHERE product_sku = 'RP-CARN-LQ';
UPDATE public.product_presets SET image_url = 'https://realpharm.eu/hpeciai/b2c5738f29afd5986deef127210876bd/eng_pm_Real-Pharm-Omega-3-60-caps-2336_1.png', image_urls = ARRAY['https://realpharm.eu/hpeciai/b2c5738f29afd5986deef127210876bd/eng_pm_Real-Pharm-Omega-3-60-caps-2336_1.png'] WHERE product_sku = 'RP-OMEGA-100';

-- ── HiTec Nutrition ──
UPDATE public.product_presets SET image_url = 'https://hitec.pl/hpeciai/5230f82c115505af7b67a0e153fa90c4/pol_pm_WPC-80-2000g-1037_8.jpg', image_urls = ARRAY['https://hitec.pl/hpeciai/5230f82c115505af7b67a0e153fa90c4/pol_pm_WPC-80-2000g-1037_8.jpg'] WHERE product_sku = 'HT-WHEY-20';
UPDATE public.product_presets SET image_url = 'https://hitec.pl/hpeciai/8043008f7df03720559e419c57313dc6/pol_pm_100-Whey-Mass-3000g-944_1.jpg', image_urls = ARRAY['https://hitec.pl/hpeciai/8043008f7df03720559e419c57313dc6/pol_pm_100-Whey-Mass-3000g-944_1.jpg'] WHERE product_sku = 'HT-MASS-30';
UPDATE public.product_presets SET image_url = 'https://hitec.pl/hpeciai/fb392bcfa52f943d4d7485444389d321/pol_pm_Creatine-Powder-500g-39_1.jpg', image_urls = ARRAY['https://hitec.pl/hpeciai/fb392bcfa52f943d4d7485444389d321/pol_pm_Creatine-Powder-500g-39_1.jpg'] WHERE product_sku = 'HT-CREA-03';
UPDATE public.product_presets SET image_url = 'https://hitec.pl/hpeciai/7e51c58890d0f04b816fa467fa877d13/pol_pl_BCAA-Powder-500g-26_1.jpg', image_urls = ARRAY['https://hitec.pl/hpeciai/7e51c58890d0f04b816fa467fa877d13/pol_pl_BCAA-Powder-500g-26_1.jpg'] WHERE product_sku = 'HT-BCAA-05';
