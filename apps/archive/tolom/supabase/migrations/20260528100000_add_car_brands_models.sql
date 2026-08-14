-- Migration: Add global car brands and models reference tables
-- These are organization-independent reference data visible to all orgs.

-- ============================================================
-- TABLE: car_brands
-- ============================================================
CREATE TABLE IF NOT EXISTS public.car_brands (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  country text,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.car_brands IS 'Global reference table of car brands. Visible to all organizations.';

-- ============================================================
-- TABLE: car_models
-- ============================================================
CREATE TABLE IF NOT EXISTS public.car_models (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES public.car_brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  body_type text,                    -- sedan, suv, crossover, truck, mpv, hatchback, coupe, sports
  fuel_type text,                    -- gasoline, diesel, hybrid, plug-in-hybrid, electric, hydrogen
  transmission text,                 -- automatic, manual, cvt
  drivetrain text,                   -- fwd, rwd, awd, 4wd
  year_start integer,                -- first production year
  year_end integer,                  -- last production year (null = still in production)
  engine_options text,               -- comma-separated common engine codes/names
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.car_models IS 'Global reference table of car models. Visible to all organizations.';

CREATE INDEX IF NOT EXISTS idx_car_models_brand_id ON public.car_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_car_models_name ON public.car_models(name);
CREATE INDEX IF NOT EXISTS idx_car_models_body_type ON public.car_models(body_type);

-- ============================================================
-- RLS: Allow all authenticated users to read
-- ============================================================
ALTER TABLE public.car_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "car_brands_select_auth" ON public.car_brands
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "car_models_select_auth" ON public.car_models
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- INSERT: Toyota
-- ============================================================
INSERT INTO public.car_brands (name, country) VALUES
  ('Toyota', 'Japan'),
  ('Lexus', 'Japan');

-- ============================================================
-- INSERT: Toyota Models
-- ============================================================
WITH toyota AS (
  SELECT id FROM public.car_brands WHERE name = 'Toyota'
)
INSERT INTO public.car_models (brand_id, name, body_type, fuel_type, transmission, drivetrain, year_start, year_end, engine_options) VALUES

-- === SEDANS ===
((SELECT id FROM toyota), 'Camry', 'sedan', 'gasoline,hybrid', 'automatic,cvt', 'fwd,awd', 1982, NULL, '2.5L A25A-FKS, 3.5L 2GR-FKS, 2.5L Hybrid'),
((SELECT id FROM toyota), 'Corolla', 'sedan', 'gasoline,hybrid', 'automatic,cvt', 'fwd', 1966, NULL, '1.8L 2ZR-FAE, 2.0L M20A-FKS, 1.8L Hybrid'),
((SELECT id FROM toyota), 'Crown', 'sedan,crossover', 'gasoline,hybrid', 'automatic', 'awd', 1955, NULL, '2.5L Hybrid, 2.4L Turbo Hybrid'),
((SELECT id FROM toyota), 'Prius', 'hatchback', 'hybrid,plug-in-hybrid', 'cvt', 'fwd', 1997, NULL, '1.8L 2ZR-FXE, 2.0L M20A-FXS'),
((SELECT id FROM toyota), 'Mirai', 'sedan', 'hydrogen', 'automatic', 'rwd', 2014, NULL, 'Fuel Cell'),
((SELECT id FROM toyota), 'Avalon', 'sedan', 'gasoline,hybrid', 'automatic', 'fwd,awd', 1994, 2022, '3.5L 2GR-FKS, 2.5L Hybrid'),
((SELECT id FROM toyota), 'Yaris', 'sedan,hatchback', 'gasoline,hybrid', 'cvt,automatic', 'fwd', 1999, NULL, '1.5L 2NR-FKE, 1.5L Hybrid'),
((SELECT id FROM toyota), 'Vios', 'sedan', 'gasoline', 'cvt,automatic', 'fwd', 2002, NULL, '1.5L 2NR-FE, 1.3L 1NR-FE'),

-- === HATCHBACKS ===
((SELECT id FROM toyota), 'GR Corolla', 'hatchback', 'gasoline', 'manual', 'awd', 2022, NULL, '1.6L G16E-GTS Turbo'),
((SELECT id FROM toyota), 'GR Yaris', 'hatchback', 'gasoline', 'manual', 'awd', 2020, NULL, '1.6L G16E-GTS Turbo'),
((SELECT id FROM toyota), 'Aqua', 'hatchback', 'hybrid', 'cvt', 'fwd', 2011, NULL, '1.5L 2NR-FXE Hybrid'),
((SELECT id FROM toyota), 'Corolla Hatchback', 'hatchback', 'gasoline,hybrid', 'cvt,manual', 'fwd', 2018, NULL, '2.0L M20A-FKS, 1.8L Hybrid'),

-- === CROSSOVERS / SUVs ===
((SELECT id FROM toyota), 'C-HR', 'crossover', 'gasoline,hybrid', 'cvt,automatic', 'fwd,awd', 2016, NULL, '1.8L 2ZR-FXE Hybrid, 2.0L M20A-FKS'),
((SELECT id FROM toyota), 'Corolla Cross', 'crossover', 'gasoline,hybrid', 'cvt', 'fwd,awd', 2020, NULL, '2.0L M20A-FKS, 1.8L Hybrid'),
((SELECT id FROM toyota), 'Harrier', 'crossover', 'gasoline,hybrid,plug-in-hybrid', 'cvt,automatic', 'fwd,awd', 1997, NULL, '2.0L M20A-FKS, 2.5L Hybrid, 2.5L PHEV'),
((SELECT id FROM toyota), 'RAV4', 'crossover', 'gasoline,hybrid,plug-in-hybrid', 'cvt,automatic', 'fwd,awd', 1994, NULL, '2.0L M20A-FKS, 2.5L A25A-FKS, 2.5L Hybrid, 2.5L PHEV'),
((SELECT id FROM toyota), 'Highlander', 'crossover', 'gasoline,hybrid', 'automatic', 'fwd,awd', 2000, NULL, '2.4L Turbo, 3.5L 2GR-FKS, 2.5L Hybrid'),
((SELECT id FROM toyota), 'Grand Highlander', 'crossover', 'gasoline,hybrid', 'automatic', 'fwd,awd', 2023, NULL, '2.4L Turbo, 2.5L Hybrid'),
((SELECT id FROM toyota), 'Venza', 'crossover', 'hybrid', 'cvt', 'fwd,awd', 2008, 2024, '2.5L A25A-FXS Hybrid'),
((SELECT id FROM toyota), 'Crown Signia', 'crossover', 'hybrid', 'automatic', 'awd', 2023, NULL, '2.5L Hybrid, 2.4L Turbo Hybrid'),
((SELECT id FROM toyota), 'Crown Sport', 'crossover', 'hybrid,plug-in-hybrid', 'automatic', 'awd', 2023, NULL, '2.5L Hybrid, 2.5L PHEV'),
((SELECT id FROM toyota), 'Yaris Cross', 'crossover', 'gasoline,hybrid', 'cvt', 'fwd,awd', 2020, NULL, '1.5L 2NR-FKE, 1.5L Hybrid'),
((SELECT id FROM toyota), 'bZ4X', 'crossover', 'electric', 'automatic', 'fwd,awd', 2022, NULL, 'Electric Motor 150kW/204hp'),
((SELECT id FROM toyota), 'Frontlander', 'crossover', 'gasoline,hybrid', 'cvt', 'fwd,awd', 2021, NULL, '2.0L M20A-FKS, 2.5L Hybrid'),
((SELECT id FROM toyota), 'Urban Cruiser', 'crossover', 'gasoline,hybrid', 'automatic,cvt', 'fwd,awd', 2022, NULL, '1.5L Hybrid'),

-- === BODY-ON-FRAME SUVs ===
((SELECT id FROM toyota), 'Land Cruiser', 'suv', 'gasoline,diesel', 'automatic', '4wd', 1951, NULL, '3.5L V6 Twin Turbo, 3.3L V6 Diesel Twin Turbo'),
((SELECT id FROM toyota), 'Land Cruiser Prado', 'suv', 'gasoline,diesel', 'automatic', '4wd', 1984, NULL, '2.8L Diesel Turbo, 2.4L Turbo, 2.5L Hybrid'),
((SELECT id FROM toyota), 'Land Cruiser 70', 'suv', 'gasoline,diesel', 'automatic,manual', '4wd', 1984, NULL, '4.5L V8 Diesel, 2.8L Diesel Turbo'),
((SELECT id FROM toyota), '4Runner', 'suv', 'gasoline,hybrid', 'automatic', '4wd,awd', 1984, NULL, '2.4L Turbo, 2.4L Turbo Hybrid'),
((SELECT id FROM toyota), 'Fortuner', 'suv', 'gasoline,diesel', 'automatic,manual', '4wd', 2005, NULL, '2.8L Diesel Turbo, 2.7L Gasoline'),
((SELECT id FROM toyota), 'Sequoia', 'suv', 'hybrid', 'automatic', '4wd,awd', 2001, NULL, '3.4L V6 Twin Turbo Hybrid'),
((SELECT id FROM toyota), 'Rush', 'suv', 'gasoline', 'automatic,manual', 'rwd,4wd', 2006, NULL, '1.5L 2NR-VE, 1.5L 2NR-FE'),

-- === TRUCKS ===
((SELECT id FROM toyota), 'Hilux', 'truck', 'gasoline,diesel', 'automatic,manual', '4wd,rwd', 1968, NULL, '2.8L Diesel Turbo, 2.4L Diesel Turbo, 2.7L Gasoline'),
((SELECT id FROM toyota), 'Tacoma', 'truck', 'gasoline,hybrid', 'automatic,manual', '4wd,rwd', 1995, NULL, '2.4L Turbo, 2.4L Turbo Hybrid, 2.7L I4'),
((SELECT id FROM toyota), 'Tundra', 'truck', 'gasoline,hybrid', 'automatic', '4wd,rwd', 1999, NULL, '3.4L V6 Twin Turbo, 3.4L Twin Turbo Hybrid'),
((SELECT id FROM toyota), 'Hilux Champ', 'truck', 'gasoline,diesel', 'automatic,manual', 'rwd,4wd', 2023, NULL, '2.7L Gasoline, 2.4L Diesel Turbo'),
((SELECT id FROM toyota), 'Dyna', 'truck', 'diesel', 'manual,automatic', 'rwd', 1959, NULL, '4.0L Diesel, 2.7L Gasoline'),

-- === MPVs / MINIVANS ===
((SELECT id FROM toyota), 'Alphard', 'mpv', 'gasoline,hybrid', 'cvt,automatic', 'fwd,awd', 2002, NULL, '2.5L 2AR-FXE Hybrid, 2.4L 2AZ-FE'),
((SELECT id FROM toyota), 'Vellfire', 'mpv', 'gasoline,hybrid', 'cvt,automatic', 'fwd,awd', 2008, NULL, '2.5L Hybrid, 3.5L V6'),
((SELECT id FROM toyota), 'Sienna', 'mpv', 'hybrid', 'cvt', 'fwd,awd', 1997, NULL, '2.5L A25A-FKS Hybrid'),
((SELECT id FROM toyota), 'Innova', 'mpv', 'gasoline,diesel,hybrid', 'automatic,manual', 'fwd,rwd', 2004, NULL, '2.8L Diesel Turbo, 2.7L Gasoline, 2.5L Hybrid'),
((SELECT id FROM toyota), 'Avanza', 'mpv', 'gasoline', 'manual,cvt', 'fwd', 2003, NULL, '1.3L 1NR-FE, 1.5L 2NR-VE'),
((SELECT id FROM toyota), 'Noah', 'mpv', 'gasoline,hybrid', 'cvt', 'fwd,awd', 2001, NULL, '2.0L M20A-FKS, 1.8L Hybrid'),
((SELECT id FROM toyota), 'Voxy', 'mpv', 'gasoline,hybrid', 'cvt', 'fwd,awd', 2001, NULL, '2.0L M20A-FKS, 1.8L Hybrid'),
((SELECT id FROM toyota), 'Sienta', 'mpv', 'gasoline,hybrid', 'cvt', 'fwd,awd', 2003, NULL, '1.5L 2NR-FKE, 1.5L Hybrid'),
((SELECT id FROM toyota), 'Roomy', 'mpv', 'gasoline', 'cvt', 'fwd', 2016, NULL, '1.0L 1KR-FE'),
((SELECT id FROM toyota), 'HiAce', 'mpv,van', 'gasoline,diesel', 'automatic,manual', 'rwd,4wd', 1967, NULL, '2.8L Diesel Turbo, 3.5L V6, 2.7L Gasoline'),

-- === SPORTS / PERFORMANCE ===
((SELECT id FROM toyota), 'GR86', 'coupe', 'gasoline', 'manual,automatic', 'rwd', 2012, NULL, '2.4L FA24 Boxer 4-cyl'),
((SELECT id FROM toyota), 'GR Supra', 'coupe', 'gasoline', 'manual,automatic', 'rwd', 2019, NULL, '2.0L Turbo, 3.0L I6 Turbo'),
((SELECT id FROM toyota), 'GR Land Cruiser', 'suv', 'gasoline,hybrid', 'automatic', '4wd', 2024, NULL, '2.4L Turbo Hybrid'),

-- === KEI CARS (Japan) ===
((SELECT id FROM toyota), 'Copen GR Sport', 'hatchback', 'gasoline', 'automatic,manual', 'fwd', 2019, NULL, '0.66L Turbo'),
((SELECT id FROM toyota), 'Pixis Epoch', 'hatchback', 'gasoline', 'cvt', 'fwd', 2011, NULL, '0.66L'),
((SELECT id FROM toyota), 'Raize', 'crossover', 'gasoline,hybrid', 'cvt', 'fwd,4wd', 2019, NULL, '1.0L Turbo, 1.2L Hybrid'),

-- === FORMER PRODUCTION (still common in service) ===
((SELECT id FROM toyota), 'Corolla Axio', 'sedan', 'gasoline,hybrid', 'cvt', 'fwd,awd', 2006, 2023, '1.3L 1NR-FE, 1.5L 2NR-FKE, 1.5L Hybrid'),
((SELECT id FROM toyota), 'Corolla Fielder', 'hatchback', 'gasoline,hybrid', 'cvt', 'fwd,awd', 2006, 2023, '1.3L 1NR-FE, 1.5L 2NR-FKE, 1.5L Hybrid'),
((SELECT id FROM toyota), 'Mark X', 'sedan', 'gasoline', 'automatic', 'rwd', 2004, 2019, '2.5L 4GR-FSE, 3.5L 2GR-FSE'),
((SELECT id FROM toyota), 'Mark II', 'sedan', 'gasoline', 'automatic', 'rwd', 1968, 2004, '2.5L 1JZ-GTE, 3.0L 2JZ-GE'),
((SELECT id FROM toyota), 'Premio', 'sedan', 'gasoline', 'cvt', 'fwd,awd', 2001, 2007, '1.8L 1ZZ-FE, 3.0L 1MZ-FE'),
((SELECT id FROM toyota), 'Allion', 'sedan', 'gasoline', 'cvt', 'fwd,awd', 2001, 2007, '1.5L 1NZ-FE, 1.8L 1ZZ-FE'),
((SELECT id FROM toyota), 'Avensis', 'sedan,hatchback', 'gasoline,diesel', 'automatic,manual', 'fwd', 1997, 2018, '1.6L, 1.8L, 2.0L, 2.2L Diesel'),
((SELECT id FROM toyota), 'Corolla Verso', 'mpv', 'gasoline,diesel', 'manual,automatic', 'fwd', 2004, 2009, '1.6L, 1.8L, 2.0L Diesel'),
((SELECT id FROM toyota), 'Verso', 'mpv', 'gasoline,diesel', 'cvt,manual', 'fwd', 2009, 2018, '1.6L Diesel, 1.8L, 2.0L Diesel'),
((SELECT id FROM toyota), 'Picnic', 'mpv', 'gasoline', 'automatic,manual', 'fwd', 2001, 2010, '1.8L 1ZZ-FE, 2.0L 1CD-FTV Diesel'),
((SELECT id FROM toyota), 'Kluger', 'crossover', 'gasoline,hybrid', 'automatic', 'fwd,awd', 2000, 2025, '3.5L V6, 2.5L Hybrid'),
((SELECT id FROM toyota), 'Matrix', 'hatchback', 'gasoline', 'automatic,manual', 'fwd,awd', 2002, 2014, '1.8L 1ZZ-FE, 2.4L 2AZ-FE'),
((SELECT id FROM toyota), 'Echo', 'sedan,hatchback', 'gasoline', 'automatic,manual', 'fwd', 1999, 2005, '1.5L 1NZ-FE'),
((SELECT id FROM toyota), 'Scion xB', 'hatchback', 'gasoline', 'automatic,manual', 'fwd', 2003, 2015, '1.5L 1NZ-FE, 2.4L 2AZ-FE'),
((SELECT id FROM toyota), 'FJ Cruiser', 'suv', 'gasoline', 'automatic,manual', '4wd', 2006, 2014, '4.0L 1GR-FE V6');

-- ============================================================
-- INSERT: Lexus Models
-- ============================================================
WITH lexus AS (
  SELECT id FROM public.car_brands WHERE name = 'Lexus'
)
INSERT INTO public.car_models (brand_id, name, body_type, fuel_type, transmission, drivetrain, year_start, year_end, engine_options) VALUES

-- === SEDANS ===
((SELECT id FROM lexus), 'IS', 'sedan', 'gasoline,hybrid', 'automatic', 'rwd,awd', 1998, NULL, '2.0L Turbo, 2.5L V6, 3.0L Turbo, 3.5L V6, 5.0L V8'),
((SELECT id FROM lexus), 'ES', 'sedan', 'gasoline,hybrid', 'automatic,cvt', 'fwd,awd', 1989, NULL, '2.5L, 3.5L V6, 2.5L Hybrid, 300h'),
((SELECT id FROM lexus), 'LS', 'sedan', 'gasoline,hybrid', 'automatic', 'rwd,awd', 1989, NULL, '3.5L V6 Twin Turbo, 5.0L V8, 3.5L Hybrid, 500h'),
((SELECT id FROM lexus), 'GS', 'sedan', 'gasoline,hybrid', 'automatic', 'rwd,awd', 1993, 2020, '2.0L Turbo, 3.0L, 3.5L V6, 5.0L V8, 450h'),
((SELECT id FROM lexus), 'HS', 'sedan', 'hybrid', 'cvt', 'fwd', 2009, 2018, '2.4L 2AZ-FXE Hybrid'),

-- === COUPES ===
((SELECT id FROM lexus), 'LC', 'coupe', 'gasoline,hybrid', 'automatic', 'rwd', 2017, NULL, '5.0L V8, 3.5L V6 Hybrid (500h)'),
((SELECT id FROM lexus), 'RC', 'coupe', 'gasoline,hybrid', 'automatic', 'rwd,awd', 2014, 2025, '2.0L Turbo, 3.5L V6, 2.5L Hybrid'),
((SELECT id FROM lexus), 'LFA', 'coupe', 'gasoline', 'sequential', 'rwd', 2010, 2012, '4.8L V10 1LR-GUE'),

-- === CROSSOVERS ===
((SELECT id FROM lexus), 'LBX', 'crossover', 'gasoline,hybrid', 'cvt,automatic', 'fwd,awd', 2023, NULL, '1.5L Hybrid'),
((SELECT id FROM lexus), 'UX', 'crossover', 'gasoline,hybrid,electric', 'cvt', 'fwd,awd', 2018, NULL, '2.0L, 2.0L Hybrid, Electric'),
((SELECT id FROM lexus), 'NX', 'crossover', 'gasoline,hybrid,plug-in-hybrid', 'automatic', 'fwd,awd', 2014, NULL, '2.0L Turbo, 2.5L, 2.5L Hybrid, 2.5L PHEV'),
((SELECT id FROM lexus), 'RX', 'crossover', 'gasoline,hybrid', 'automatic', 'fwd,awd', 1998, NULL, '2.4L Turbo, 3.5L V6, 3.5L Hybrid, 500h, 350h, 450h+'),
((SELECT id FROM lexus), 'RZ', 'crossover', 'electric', 'automatic', 'awd', 2022, NULL, 'Electric Motor 150kW/204hp, Dual Motor'),
((SELECT id FROM lexus), 'TX', 'crossover', 'gasoline,hybrid', 'automatic', 'fwd,awd', 2023, NULL, '2.4L Turbo, 2.5L Hybrid, 2.4L Turbo Hybrid'),

-- === BODY-ON-FRAME SUVs ===
((SELECT id FROM lexus), 'GX', 'suv', 'gasoline,hybrid', 'automatic', '4wd', 2002, NULL, '4.6L V8, 2.4L Turbo, 2.4L Turbo Hybrid'),
((SELECT id FROM lexus), 'LX', 'suv', 'gasoline,diesel,hybrid', 'automatic', '4wd', 1995, NULL, '3.5L V6 Twin Turbo, 3.3L V6 Diesel, 3.5L Hybrid (700h)'),

-- === MPV ===
((SELECT id FROM lexus), 'LM', 'mpv', 'gasoline,hybrid', 'automatic', 'fwd,awd', 2020, NULL, '2.5L Hybrid, 3.5L V6, 2.4L Turbo Hybrid'),

-- === FORMER PRODUCTION (still common in service) ===
((SELECT id FROM lexus), 'CT', 'hatchback', 'hybrid', 'cvt', 'fwd', 2011, 2022, '1.8L 2ZR-FXE Hybrid'),
((SELECT id FROM lexus), 'SC', 'coupe', 'gasoline', 'automatic', 'rwd', 1991, 2010, '3.0L 2JZ-GE, 4.0L 3UZ-FE, 4.3L V8');

-- ============================================================
-- Mark discontinued models (those with year_end set)
-- ============================================================
UPDATE public.car_models SET is_active = false WHERE year_end IS NOT NULL;
