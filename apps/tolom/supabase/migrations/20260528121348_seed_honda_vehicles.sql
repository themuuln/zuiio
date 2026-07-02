-- ============================================================
-- INSERT: Honda + Acura
-- ============================================================
INSERT INTO public.car_brands (name, country) VALUES
('Honda', 'Japan'),
('Acura', 'Japan');

-- ============================================================
-- INSERT: Honda Models
-- ============================================================
WITH honda AS (
    SELECT id FROM public.car_brands
    WHERE name = 'Honda'
)

INSERT INTO public.car_models (
    brand_id,
    name,
    body_type,
    fuel_type,
    transmission,
    drivetrain,
    year_start,
    year_end,
    engine_options
) VALUES

-- === SEDANS ===
(
    (SELECT id FROM honda),
    'Civic',
    'sedan',
    'gasoline,hybrid',
    'cvt,manual',
    'fwd',
    1972,
    NULL,
    '1.5L Turbo, 2.0L NA, 1.5L Hybrid'
),
(
    (SELECT id FROM honda),
    'Accord',
    'sedan',
    'gasoline,hybrid',
    'cvt,automatic',
    'fwd',
    1976,
    NULL,
    '1.5L Turbo, 2.0L Turbo, 2.0L Hybrid'
),
(
    (SELECT id FROM honda),
    'Insight',
    'sedan',
    'hybrid',
    'cvt',
    'fwd',
    2000,
    NULL,
    '1.5L 2-Motor Hybrid (L15B)'
),
(
    (SELECT id FROM honda),
    'City',
    'sedan',
    'gasoline',
    'cvt,manual',
    'fwd',
    1981,
    NULL,
    '1.0L Turbo, 1.5L NA, 1.5L Hybrid'
),
(
    (SELECT id FROM honda),
    'Grace',
    'sedan',
    'hybrid,gasoline',
    'cvt',
    'fwd',
    2014,
    NULL,
    '1.5L 2-Motor Hybrid, 1.5L NA'
),
(
    (SELECT id FROM honda),
    'Spirior',
    'sedan',
    'gasoline',
    'automatic,cvt',
    'fwd',
    2009,
    NULL,
    '2.0L, 2.4L'
),
(
    (SELECT id FROM honda),
    'Civic Ferio',
    'sedan',
    'gasoline',
    'manual,automatic',
    'fwd',
    1991,
    2005,
    '1.5L VTEC, 1.6L VTEC, 1.7L CTDi'
),
(
    (SELECT id FROM honda),
    'Torneo',
    'sedan',
    'gasoline',
    'manual,automatic',
    'fwd',
    1997,
    2001,
    '2.0L H22A, 2.0L F20B'
),
(
    (SELECT id FROM honda),
    'Civic Si',
    'sedan',
    'gasoline',
    'manual',
    'fwd',
    2022,
    NULL,
    '2.0L NA K20C2'
),
(
    (SELECT id FROM honda),
    'Integra',
    'sedan',
    'gasoline',
    'cvt,manual',
    'fwd',
    2022,
    NULL,
    '1.5L Turbo, 2.0L Turbo Type S'
),

-- === HATCHBACKS ===
(
    (SELECT id FROM honda),
    'Civic Hatchback',
    'hatchback',
    'gasoline,hybrid',
    'cvt,manual',
    'fwd',
    2016,
    NULL,
    '1.5L Turbo, 1.5L Hybrid'
),
(
    (SELECT id FROM honda),
    'Civic Type R',
    'hatchback',
    'gasoline',
    'manual',
    'fwd',
    2015,
    NULL,
    '2.0L Turbo K20C1'
),
(
    (SELECT id FROM honda),
    'Fit',
    'hatchback',
    'gasoline,hybrid',
    'cvt',
    'fwd',
    2001,
    NULL,
    '1.3L L13A, 1.5L L15A, 1.5L Hybrid'
),
(
    (SELECT id FROM honda),
    'Jazz',
    'hatchback',
    'gasoline,hybrid',
    'cvt',
    'fwd',
    2001,
    NULL,
    '1.3L, 1.5L, 1.5L Hybrid'
),
(
    (SELECT id FROM honda),
    'Honda e',
    'hatchback',
    'electric',
    'automatic',
    'rwd',
    2020,
    NULL,
    'Electric Motor 113kW/154hp'
),
(
    (SELECT id FROM honda),
    'Civic 3-Door',
    'hatchback',
    'gasoline',
    'manual,automatic',
    'fwd',
    1983,
    2017,
    '1.6L VTEC, 1.8L VTEC'
),
(
    (SELECT id FROM honda),
    'Civic EG6',
    'hatchback',
    'gasoline',
    'manual',
    'fwd',
    1991,
    1995,
    '1.6L VTEC B16A'
),
(
    (SELECT id FROM honda),
    'CR-Z',
    'hatchback',
    'hybrid',
    'cvt,manual',
    'fwd',
    2010,
    2016,
    '1.5L 2-Motor Hybrid IMA'
),
(
    (SELECT id FROM honda),
    'Prelude',
    'coupe',
    'gasoline',
    'manual,automatic',
    'fwd',
    1978,
    2001,
    '2.0L, 2.2L VTEC, 2.2L DOHC'
),
(
    (SELECT id FROM honda),
    'S2000',
    'coupe',
    'gasoline',
    'manual',
    'rwd',
    1999,
    2009,
    '2.0L F20C VTEC'
),

-- === CROSSOVERS / SUVs ===
(
    (SELECT id FROM honda),
    'HR-V',
    'crossover',
    'gasoline,hybrid',
    'cvt,automatic',
    'fwd,awd',
    1999,
    NULL,
    '1.5L, 1.6L, 1.5L Hybrid'
),
(
    (SELECT id FROM honda),
    'Vezel',
    'crossover',
    'gasoline,hybrid',
    'cvt',
    'fwd,awd',
    2013,
    NULL,
    '1.5L L15B, 1.5L 2-Motor Hybrid'
),
(
    (SELECT id FROM honda),
    'CR-V',
    'crossover',
    'gasoline,hybrid,plug-in-hybrid',
    'cvt,automatic',
    'fwd,awd',
    1995,
    NULL,
    '1.5L Turbo, 2.0L 2-Motor Hybrid, 2.0L PHEV'
),
(
    (SELECT id FROM honda),
    'ZR-V',
    'crossover',
    'gasoline,hybrid',
    'cvt',
    'fwd,awd',
    2022,
    NULL,
    '1.5L Turbo, 2.0L 2-Motor Hybrid'
),
(
    (SELECT id FROM honda),
    'WR-V',
    'crossover',
    'gasoline',
    'cvt,manual',
    'fwd',
    2016,
    NULL,
    '1.2L, 1.5L NA'
),
(
    (SELECT id FROM honda),
    'Elevate',
    'crossover',
    'gasoline',
    'cvt',
    'fwd,awd',
    2022,
    NULL,
    '1.5L NA'
),
(
    (SELECT id FROM honda),
    'Element',
    'suv',
    'gasoline',
    'automatic,manual',
    'awd,fwd',
    2003,
    2011,
    '2.4L K24A'
),
(
    (SELECT id FROM honda),
    'Crossroad',
    'crossover',
    'gasoline',
    'automatic',
    'fwd,awd',
    2007,
    2010,
    '1.8L, 2.0L, 2.4L'
),
(
    (SELECT id FROM honda),
    'Crosstour',
    'crossover',
    'gasoline',
    'automatic',
    'fwd,awd',
    2010,
    2015,
    '2.4L, 3.5L V6'
),

-- === BODY-ON-FRAME SUVs ===
(
    (SELECT id FROM honda),
    'Pilot',
    'suv',
    'gasoline',
    'automatic',
    'fwd,awd',
    2003,
    NULL,
    '3.5L V6 J35Z'
),
(
    (SELECT id FROM honda),
    'Passport',
    'suv',
    'gasoline',
    'automatic',
    'fwd,awd',
    2019,
    NULL,
    '3.5L V6 J35Y'
),

-- === TRUCKS ===
(
    (SELECT id FROM honda),
    'Ridgeline',
    'truck',
    'gasoline',
    'automatic',
    'awd,fwd',
    2006,
    NULL,
    '3.5L V6 J35'
),

-- === MPVs / MINIVANS ===
(
    (SELECT id FROM honda),
    'Stepwgn',
    'mpv',
    'gasoline,hybrid',
    'cvt',
    'fwd',
    1996,
    NULL,
    '2.0L K20A, 2.0L Hybrid'
),
(
    (SELECT id FROM honda),
    'Stepwgn Spada',
    'mpv',
    'gasoline,hybrid',
    'cvt',
    'fwd,awd',
    2005,
    NULL,
    '2.0L K20A, 1.5L Turbo, 2.0L Hybrid'
),
(
    (SELECT id FROM honda),
    'Freed',
    'mpv',
    'gasoline,hybrid',
    'cvt',
    'fwd,awd',
    2008,
    NULL,
    '1.5L L15A, 1.5L 2-Motor Hybrid'
),
(
    (SELECT id FROM honda),
    'Odyssey',
    'mpv',
    'gasoline',
    'cvt,automatic',
    'fwd',
    1994,
    NULL,
    '2.4L, 3.5L V6, 2.0L Hybrid'
),
(
    (SELECT id FROM honda),
    'Stream',
    'mpv',
    'gasoline',
    'cvt,automatic',
    'fwd,awd',
    2000,
    2014,
    '1.8L, 2.0L'
),
(
    (SELECT id FROM honda),
    'Jade',
    'mpv',
    'gasoline,hybrid',
    'cvt',
    'fwd',
    2015,
    2020,
    '1.5L Turbo, 2.0L 2-Motor Hybrid'
),
(
    (SELECT id FROM honda),
    'Mobilio',
    'mpv',
    'gasoline',
    'cvt,manual',
    'fwd',
    2014,
    2020,
    '1.5L L15B'
),
(
    (SELECT id FROM honda),
    'That\'s',
    'mpv',
    'gasoline',
    'cvt,manual',
    'fwd',
    2002,
    2023,
    '0.66L, 1.3L, 1.5L'
),
(
    (SELECT id FROM honda),
    'Vamos',
    'mpv',
    'gasoline',
    'cvt,manual',
    'fwd,4wd',
    1999,
    2019,
    '0.66L, 1.3L, 1.5L'
),

-- === KEI CARS (Japan) ===
(
    (SELECT id FROM honda),
    'N-BOX',
    'mpv',
    'gasoline',
    'cvt',
    'fwd,4wd',
    2011,
    NULL,
    '0.66L Turbo, 0.66L NA'
),
(
    (SELECT id FROM honda),
    'N-WGN',
    'hatchback',
    'gasoline',
    'cvt',
    'fwd,4wd',
    2012,
    NULL,
    '0.66L Turbo, 0.66L NA'
),
(
    (SELECT id FROM honda),
    'N-ONE',
    'hatchback',
    'gasoline',
    'cvt,manual',
    'fwd,4wd',
    2012,
    NULL,
    '0.66L Turbo, 0.66L NA'
),
(
    (SELECT id FROM honda),
    'N-VAN',
    'mpv',
    'gasoline',
    'cvt',
    'fwd,4wd',
    2018,
    NULL,
    '0.66L Turbo, 0.66L NA'
),
(
    (SELECT id FROM honda),
    'S660',
    'coupe',
    'gasoline',
    'cvt',
    'rwd',
    2015,
    2022,
    '0.66L Turbo MT07'
),
(
    (SELECT id FROM honda),
    'Beat',
    'hatchback',
    'gasoline',
    'manual',
    'mid-rear',
    1991,
    1996,
    '0.66L NA E07A'
),

-- === FORMER PRODUCTION (still common in service) ===
(
    (SELECT id FROM honda),
    'Civic EG',
    'sedan,hatchback',
    'gasoline',
    'manual,automatic',
    'fwd',
    1991,
    1995,
    '1.5L VTEC D15B, 1.6L VTEC B16A'
),
(
    (SELECT id FROM honda),
    'Civic EK',
    'sedan,hatchback',
    'gasoline',
    'manual,automatic',
    'fwd',
    1995,
    2000,
    '1.6L VTEC B16A, 1.6L D16Y'
),
(
    (SELECT id FROM honda),
    'Civic EP3',
    'hatchback',
    'gasoline',
    'manual',
    'fwd',
    2001,
    2005,
    '2.0L K20A, 1.7L CTDi'
),
(
    (SELECT id FROM honda),
    'Civic FD',
    'sedan',
    'gasoline',
    'automatic,cvt',
    'fwd',
    2006,
    2011,
    '1.8L R18A, 2.0L K20Z'
),
(
    (SELECT id FROM honda),
    'Civic FB',
    'sedan',
    'gasoline,hybrid',
    'cvt',
    'fwd',
    2012,
    2015,
    '1.8L R18Z, 1.5L Hybrid'
),
(
    (SELECT id FROM honda),
    'Civic FC',
    'sedan',
    'gasoline,hybrid',
    'cvt,manual',
    'fwd',
    2016,
    2020,
    '1.5L Turbo L15B, 2.0L NA, 1.5L Hybrid'
),
(
    (SELECT id FROM honda),
    'Accord CF',
    'sedan',
    'gasoline',
    'automatic',
    'fwd',
    2003,
    2007,
    '2.0L, 2.4L K24A'
),
(
    (SELECT id FROM honda),
    'Accord CP',
    'sedan',
    'gasoline',
    'automatic,cvt',
    'fwd',
    2008,
    2012,
    '2.0L, 2.4L K24Z'
),
(
    (SELECT id FROM honda),
    'Accord CR',
    'sedan',
    'gasoline',
    'automatic',
    'fwd,awd',
    2013,
    2017,
    '2.4L, 3.5L V6'
),
(
    (SELECT id FROM honda),
    'Accord CN',
    'sedan',
    'gasoline,hybrid',
    'cvt,automatic',
    'fwd',
    2018,
    2024,
    '1.5L Turbo, 2.0L Turbo, 2.0L Hybrid'
),
(
    (SELECT id FROM honda),
    'CR-V RD',
    'crossover',
    'gasoline',
    'automatic',
    'fwd,awd',
    2007,
    2011,
    '2.0L, 2.4L K24Z'
),
(
    (SELECT id FROM honda),
    'CR-V RE',
    'crossover',
    'gasoline',
    'cvt,automatic',
    'fwd,awd',
    2012,
    2016,
    '2.0L, 2.4L K24W'
),
(
    (SELECT id FROM honda),
    'CR-V RM',
    'crossover',
    'gasoline,hybrid',
    'cvt',
    'fwd,awd',
    2017,
    2021,
    '1.5L Turbo L15B, 2.0L Hybrid'
),
(
    (SELECT id FROM honda),
    'Fit GE',
    'hatchback',
    'gasoline',
    'cvt',
    'fwd',
    2007,
    2013,
    '1.3L L13A, 1.5L L15A'
),
(
    (SELECT id FROM honda),
    'Fit GK',
    'hatchback',
    'gasoline',
    'cvt',
    'fwd',
    2013,
    2020,
    '1.3L L13B, 1.5L L15B'
),
(
    (SELECT id FROM honda),
    'Fit GR',
    'hatchback',
    'gasoline,hybrid',
    'cvt',
    'fwd',
    2020,
    NULL,
    '1.3L, 1.5L Hybrid'
),
(
    (SELECT id FROM honda),
    'Odyssey RB',
    'mpv',
    'gasoline',
    'cvt',
    'fwd,awd',
    2008,
    2013,
    '2.4L K24A'
),
(
    (SELECT id FROM honda),
    'Odyssey RC',
    'mpv',
    'gasoline',
    'cvt',
    'fwd,awd',
    2013,
    2023,
    '2.4L K24W, 2.0L Hybrid'
),
(
    (SELECT id FROM honda),
    'Insight 1st Gen',
    'hatchback',
    'hybrid',
    'cvt',
    'fwd',
    2000,
    2006,
    '1.0L 3-cyl IMA'
),
(
    (SELECT id FROM honda),
    'Insight 2nd Gen',
    'hatchback',
    'hybrid',
    'cvt',
    'fwd',
    2009,
    2014,
    '1.3L IMA'
),
(
    (SELECT id FROM honda),
    'HR-V JV',
    'crossover',
    'gasoline',
    'manual,automatic',
    'fwd,awd',
    1999,
    2006,
    '1.6L D16Z'
),
(
    (SELECT id FROM honda),
    'HR-V GK',
    'crossover',
    'gasoline',
    'cvt',
    'fwd,awd',
    2014,
    2021,
    '1.5L L15B, 1.5L Turbo'
),
(
    (SELECT id FROM honda),
    'Pilot YF',
    'suv',
    'gasoline',
    'automatic',
    'fwd,awd',
    2012,
    2015,
    '3.5L V6 J35Z'
),
(
    (SELECT id FROM honda),
    'Pilot RL',
    'suv',
    'gasoline',
    'automatic',
    'fwd,awd',
    2016,
    2022,
    '3.5L V6 J35Y'
),
(
    (SELECT id FROM honda),
    'Element SC',
    'suv',
    'gasoline',
    'automatic,manual',
    'fwd,awd',
    2003,
    2011,
    '2.4L K24A4'
),
(
    (SELECT id FROM honda),
    'Civic Ferio EK',
    'sedan',
    'gasoline',
    'manual,automatic',
    'fwd',
    1995,
    2001,
    '1.5L D15B, 1.6L B16A'
),
(
    (SELECT id FROM honda),
    'Civic Si FG4',
    'sedan',
    'gasoline',
    'manual',
    'fwd',
    2006,
    2011,
    '2.0L K20Z3'
),
(
    (SELECT id FROM honda),
    'Civic Si FB6',
    'sedan',
    'gasoline',
    'manual',
    'fwd',
    2012,
    2015,
    '2.4L K24W'
),
(
    (SELECT id FROM honda),
    'Integra DC2',
    'coupe',
    'gasoline',
    'manual',
    'fwd',
    1994,
    2001,
    '1.8L B18C VTEC'
),
(
    (SELECT id FROM honda),
    'Integra DC5',
    'coupe',
    'gasoline',
    'manual',
    'fwd',
    2001,
    2006,
    '2.0L K20A, 2.0L K20A Type R'
),
(
    (SELECT id FROM honda),
    'S2000 AP1',
    'coupe',
    'gasoline',
    'manual',
    'rwd',
    1999,
    2003,
    '2.0L F20C VTEC 9000rpm'
),
(
    (SELECT id FROM honda),
    'S2000 AP2',
    'coupe',
    'gasoline',
    'manual',
    'rwd',
    2004,
    2009,
    '2.2L F22C VTEC'
);

-- ============================================================
-- INSERT: Acura Models
-- ============================================================
WITH acura AS (
    SELECT id FROM public.car_brands
    WHERE name = 'Acura'
)

INSERT INTO public.car_models (
    brand_id,
    name,
    body_type,
    fuel_type,
    transmission,
    drivetrain,
    year_start,
    year_end,
    engine_options
) VALUES

-- === SEDANS ===
(
    (SELECT id FROM acura),
    'ILX',
    'sedan',
    'gasoline',
    'dct',
    'fwd',
    2013,
    2022,
    '2.4L K24W'
),
(
    (SELECT id FROM acura),
    'TLX',
    'sedan',
    'gasoline',
    'automatic',
    'fwd,awd',
    2015,
    NULL,
    '2.4L Turbo, 3.5L V6, 2.0L Turbo'
),
(
    (SELECT id FROM acura),
    'Integra',
    'sedan',
    'gasoline',
    'cvt,manual',
    'fwd',
    2022,
    NULL,
    '1.5L Turbo, 2.0L Turbo Type S'
),
(
    (SELECT id FROM acura),
    'RSX',
    'coupe',
    'gasoline',
    'manual,automatic',
    'fwd',
    2002,
    2006,
    '2.0L K20A'
),
(
    (SELECT id FROM acura),
    'TSX',
    'sedan',
    'gasoline',
    'automatic,manual',
    'fwd',
    2004,
    2014,
    '2.4L K24A, 2.0L Turbo, 3.5L V6'
),
(
    (SELECT id FROM acura),
    'TL',
    'sedan',
    'gasoline',
    'automatic,manual',
    'fwd,awd',
    1996,
    2014,
    '2.5L, 3.2L V6, 3.5L V6'
),
(
    (SELECT id FROM acura),
    'RL',
    'sedan',
    'gasoline',
    'automatic',
    'awd',
    1996,
    2012,
    '3.5L V6, 3.7L V6'
),

-- === COUPES ==
(
    (SELECT id FROM acura),
    'NSX',
    'coupe',
    'gasoline,hybrid',
    'dct',
    'awd',
    2016,
    2022,
    '3.5L V6 Twin Turbo Hybrid'
),
(
    (SELECT id FROM acura),
    'RSX Type S',
    'coupe',
    'gasoline',
    'manual',
    'fwd',
    2002,
    2006,
    '2.0L K20A2 VTEC'
),

-- === CROSSOVERS / SUVs ===
(
    (SELECT id FROM acura),
    'RDX',
    'crossover',
    'gasoline',
    'automatic',
    'fwd,awd',
    2007,
    NULL,
    '2.3L Turbo, 2.0L Turbo, 3.5L V6'
),
(
    (SELECT id FROM acura),
    'MDX',
    'crossover',
    'gasoline,hybrid',
    'automatic',
    'fwd,awd',
    2001,
    NULL,
    '3.5L V6, 3.0L V6 Hybrid'
),
(
    (SELECT id FROM acura),
    'ZDX',
    'crossover',
    'electric',
    'automatic',
    'awd',
    2024,
    NULL,
    'Electric Motor 288kW, Dual Motor'
),
(
    (SELECT id FROM acura),
    'CDX',
    'crossover',
    'gasoline,hybrid',
    'dct',
    'fwd,awd',
    2016,
    NULL,
    '1.5L Turbo, 1.5L Hybrid'
),
(
    (SELECT id FROM acura),
    'ADX',
    'crossover',
    'gasoline',
    'cvt',
    'fwd,awd',
    2025,
    NULL,
    '1.5L Turbo L15C'
);

-- ============================================================
-- Mark discontinued models (those with year_end set)
-- ============================================================
UPDATE public.car_models SET is_active = FALSE
WHERE year_end IS NOT NULL;
