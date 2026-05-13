-- Seed: Showcase demo data — parts, suppliers, POs, movements, work orders
-- TOLOM auto repair SaaS — focuses on Harrier, Lexus RX, Highlander, Kluger
-- Run after 00008_inventory_control.sql

-- ═══════════════════════════════════════════════════════════════
-- HELPERS: get existing branch & user IDs
-- ═══════════════════════════════════════════════════════════════
do $$
declare
  branch_id_val uuid;
  admin_user_id uuid;
  org_id constant uuid := '00000000-0000-0000-0000-000000000001';
begin
  -- Get or create the main branch
  select id into branch_id_val from public.branches
    where organization_id = org_id and is_main = true limit 1;

  if branch_id_val is null then
    insert into public.branches (organization_id, name, is_main, created_by)
    values (org_id, 'Main Branch', true, auth.uid())
    returning id into branch_id_val;
  end if;

  -- Get or create an admin user reference
  select user_id into admin_user_id from public.organization_users
    where organization_id = org_id and is_primary = true limit 1;

  if admin_user_id is null then
    -- Create a demo auth user for seeding purposes
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, confirmation_sent_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000000',
      'admin@demo.tolom.mn',
      '',
      now(),
      now(),
      '{"provider":"email"}'::jsonb,
      '{}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated'
    )
    on conflict (id) do nothing;

    -- Create profile
    insert into public.profiles (id, organization_id, branch_id, full_name, is_active)
    values ('00000000-0000-0000-0000-000000000001', org_id, branch_id_val, 'Admin', true)
    on conflict (id) do nothing;

    -- Link to org
    insert into public.organization_users (organization_id, user_id, is_primary)
    values (org_id, '00000000-0000-0000-0000-000000000001', true)
    on conflict do nothing
    returning user_id into admin_user_id;
  end if;

  if admin_user_id is null then
    admin_user_id := '00000000-0000-0000-0000-000000000001';
  end if;

  -- ═════════════════════════════════════════════════════════════
  -- VEHICLE MODELS
  -- ═════════════════════════════════════════════════════════════
  insert into public.vehicle_models (id, organization_id, make, model, generation, year_start, year_end, engine, body_type, created_by) values
    -- Toyota Harrier (also sold as Lexus RX in some markets)
    (gen_random_uuid(), org_id, 'Toyota', 'Harrier', 'XU60 (3rd gen)', 2013, 2019, '2.0L 3ZR-FAE / 2.5L 2AR-FXE Hybrid', 'suv', admin_user_id),
    (gen_random_uuid(), org_id, 'Toyota', 'Harrier', 'XU80 (4th gen)', 2020, 2025, '2.0L M20A-FKS / 2.5L A25A-FXS Hybrid', 'suv', admin_user_id),
    -- Lexus RX
    (gen_random_uuid(), org_id, 'Lexus', 'RX', 'AL20 (4th gen)', 2015, 2019, '2.0T 8AR-FTS / 3.5L 2GR-FKS / 450h', 'suv', admin_user_id),
    (gen_random_uuid(), org_id, 'Lexus', 'RX', 'AL30 (5th gen)', 2019, 2025, '2.0T / 3.5L V6 / 450h+ / 500h', 'suv', admin_user_id),
    -- Toyota Highlander
    (gen_random_uuid(), org_id, 'Toyota', 'Highlander', 'XU50 (3rd gen)', 2013, 2019, '2.7L 1AR-FE / 3.5L 2GR-FKS / Hybrid', 'suv', admin_user_id),
    (gen_random_uuid(), org_id, 'Toyota', 'Highlander', 'XU70 (4th gen)', 2019, 2025, '3.5L 2GR-FKS / 2.5L Hybrid', 'suv', admin_user_id),
    -- Toyota Kluger (Highlander in Australia/Japan)
    (gen_random_uuid(), org_id, 'Toyota', 'Kluger', 'XU50', 2013, 2019, '3.5L 2GR-FE / 2.7L 1AR-FE', 'suv', admin_user_id),
    (gen_random_uuid(), org_id, 'Toyota', 'Kluger', 'XU70', 2020, 2025, '3.5L 2GR-FKS / 2.5L Hybrid', 'suv', admin_user_id),
    -- Additional common models
    (gen_random_uuid(), org_id, 'Toyota', 'Camry', 'XV70', 2017, 2024, '2.5L A25A-FKS / 3.5L 2GR-FKS / Hybrid', 'sedan', admin_user_id),
    (gen_random_uuid(), org_id, 'Lexus', 'ES', 'XZ10', 2018, 2025, '2.5L A25A-FKS / 3.5L 2GR-FKS / 300h', 'sedan', admin_user_id)
  on conflict do nothing;

  -- ═════════════════════════════════════════════════════════════
  -- PARTS CATALOG — real auto parts for these vehicles
  -- ═════════════════════════════════════════════════════════════
  insert into public.parts_catalog (id, organization_id, name, part_number, category, description, unit, default_price, created_by) values
    -- Engine parts
    (gen_random_uuid(), org_id, 'Хөдөлгүүрийн тос – 5W-30 (4L)', 'TOS-5W30-4L', 'Тос, шингэн', 'Toyota 5W-30 синтетик хөдөлгүүрийн тос, 4л', 'сав', 45000, admin_user_id),
    (gen_random_uuid(), org_id, 'Хөдөлгүүрийн тос – 0W-20 (4L)', 'TOS-0W20-4L', 'Тос, шингэн', 'Toyota 0W-20 синтетик хөдөлгүүрийн тос, 4л', 'сав', 55000, admin_user_id),
    (gen_random_uuid(), org_id, 'Тосны шүүрүүр – Toyota', 'FIL-OIL-TOY', 'Шүүрүүр', 'Тохирох: Harrier, Highlander, Kluger, Camry 2.0/2.5/3.5', 'ш', 12000, admin_user_id),
    (gen_random_uuid(), org_id, 'Агаарын шүүрүүр – Harrier XU60', 'FIL-AIR-HAR60', 'Шүүрүүр', 'Харриер XU60 (2013-2019) агаарын шүүрүүр', 'ш', 18500, admin_user_id),
    (gen_random_uuid(), org_id, 'Агаарын шүүрүүр – Lexus RX AL20', 'FIL-AIR-RX20', 'Шүүрүүр', 'Lexus RX AL20 (2015-2019) агаарын шүүрүүр', 'ш', 22000, admin_user_id),
    (gen_random_uuid(), org_id, 'Агаарын шүүрүүр – Highlander/Kluger XU70', 'FIL-AIR-HIG70', 'Шүүрүүр', 'Highlander/Kluger XU70 (2019+) агаарын шүүрүүр', 'ш', 19500, admin_user_id),
    (gen_random_uuid(), org_id, 'Салонны шүүрүүр – Toyota (стандарт)', 'FIL-CAB-TOY', 'Шүүрүүр', 'Салонны шүүрүүр, ихэнх Toyota/Lexus загварт тохирно', 'ш', 25000, admin_user_id),
    (gen_random_uuid(), org_id, 'Газрын тосны шүүрүүр – Toyota/Lexus', 'FIL-FUEL-TOY', 'Шүүрүүр', 'Газрын тосны шүүрүүр, Toyota/Lexus', 'ш', 32000, admin_user_id),

    -- Brake system
    (gen_random_uuid(), org_id, 'Тормосны дэвсгэр – Урд (Harrier XU60)', 'BRK-PAD-HAR60-F', 'Тормос', 'Харриер XU60 урд тормосны дэвсгэр, керамик', 'багц', 65000, admin_user_id),
    (gen_random_uuid(), org_id, 'Тормосны дэвсгэр – Хойд (Harrier XU60)', 'BRK-PAD-HAR60-R', 'Тормос', 'Харриер XU60 хойд тормосны дэвсгэр, керамик', 'багц', 55000, admin_user_id),
    (gen_random_uuid(), org_id, 'Тормосны дэвсгэр – Урд (Lexus RX AL20)', 'BRK-PAD-RX20-F', 'Тормос', 'Lexus RX AL20 урд тормосны дэвсгэр, керамик', 'багц', 85000, admin_user_id),
    (gen_random_uuid(), org_id, 'Тормосны дэвсгэр – Хойд (Lexus RX AL20)', 'BRK-PAD-RX20-R', 'Тормос', 'Lexus RX AL20 хойд тормосны дэвсгэр', 'багц', 72000, admin_user_id),
    (gen_random_uuid(), org_id, 'Тормосны дэвсгэр – Урд (Highlander/Kluger XU70)', 'BRK-PAD-HIG70-F', 'Тормос', 'Highlander/Kluger XU70 урд тормосны дэвсгэр', 'багц', 75000, admin_user_id),
    (gen_random_uuid(), org_id, 'Тормосны диск – Урд (Harrier XU60)', 'BRK-DIS-HAR60-F', 'Тормос', 'Харриер XU60 урд тормосны диск, 296mm', 'ш', 95000, admin_user_id),
    (gen_random_uuid(), org_id, 'Тормосны диск – Урд (Lexus RX AL20)', 'BRK-DIS-RX20-F', 'Тормос', 'Lexus RX AL20 урд тормосны диск, 328mm', 'ш', 130000, admin_user_id),
    (gen_random_uuid(), org_id, 'Тормосны шингэн DOT4', 'BRK-FLUID-DOT4', 'Тос, шингэн', 'Тормосны шингэн DOT4, 1л', 'шил', 15000, admin_user_id),

    -- Suspension
    (gen_random_uuid(), org_id, 'Амортизатор – Урд (Harrier XU60)', 'SUS-SHOCK-HAR60-F', 'Пүрх, пневматик', 'Харриер XU60 урд амортизатор', 'ш', 180000, admin_user_id),
    (gen_random_uuid(), org_id, 'Амортизатор – Урд (Lexus RX AL20)', 'SUS-SHOCK-RX20-F', 'Пүрх, пневматик', 'Lexus RX AL20 урд амортизатор', 'ш', 250000, admin_user_id),
    (gen_random_uuid(), org_id, 'Сайлентблок – урд гар (Toyota/Lexus)', 'SUS-SILENT-TOY', 'Пүрх, пневматик', 'Урд гарны сайлентблок, Toyota/Lexus', 'ш', 18000, admin_user_id),
    (gen_random_uuid(), org_id, 'Сайлентблок – хойд гар (Toyota/Lexus)', 'SUS-SILENT2-TOY', 'Пүрх, пневматик', 'Хойд гарны сайлентблок, Toyota/Lexus', 'ш', 16000, admin_user_id),

    -- Spark plugs, ignition
    (gen_random_uuid(), org_id, 'Лаа – Iridium (Toyota 2.0/2.5)', 'IGN-PLUG-IRID', 'Асаагуур', 'Iridium лаа, 4ш багц. Harrier, Camry, Highlander', 'багц', 48000, admin_user_id),
    (gen_random_uuid(), org_id, 'Лаа – Iridium (Lexus 3.5L)', 'IGN-PLUG-IRID-L', 'Асаагуур', 'Iridium лаа, 6ш багц. RX350, ES350', 'багц', 72000, admin_user_id),

    -- Cooling
    (gen_random_uuid(), org_id, 'Антифриз – Toyota Super Long Life (5L)', 'COL-COOL-TOY5L', 'Тос, шингэн', 'Toyota SLLC улаан антифриз, 5л', 'сав', 38000, admin_user_id),
    (gen_random_uuid(), org_id, 'Радиаторын таг (стандарт)', 'COL-CAP-TOY', 'Хөргөлт', 'Радиаторын таг, 1.3 бар, Toyota', 'ш', 8000, admin_user_id),

    -- Wiper blades
    (gen_random_uuid(), org_id, 'Салхины шилний арчигч – Урд (Harrier)', 'WIP-FRONT-HAR', 'Арчигч', 'Харриер урд салхины шилний арчигч, 2ш', 'багц', 22000, admin_user_id),
    (gen_random_uuid(), org_id, 'Салхины шилний арчигч – Урд (Lexus RX)', 'WIP-FRONT-RX', 'Арчигч', 'Lexus RX урд салхины шилний арчигч, 2ш', 'багц', 28000, admin_user_id),

    -- Filters / belts
    (gen_random_uuid(), org_id, 'Бүс – поли V (Harrier 2.0L)', 'BELT-ALT-HAR20', 'Бүс', 'Альтернаторын бүс, Harrier 2.0L', 'ш', 22000, admin_user_id),
    (gen_random_uuid(), org_id, 'Бүс – поли V (Lexus RX 3.5L)', 'BELT-ALT-RX35', 'Бүс', 'Альтернаторын бүс, Lexus RX 350', 'ш', 28000, admin_user_id),

    -- Transmission
    (gen_random_uuid(), org_id, 'Дамжуулагчийн тос – ATF WS (4L)', 'ATF-WS-4L', 'Тос, шингэн', 'Toyota ATF WS автомат дамжуулагчийн тос, 4л', 'сав', 65000, admin_user_id),
    (gen_random_uuid(), org_id, 'Дамжуулагчийн тос – CVT (4L)', 'CVT-FLUID-4L', 'Тос, шингэн', 'Toyota CVT дамжуулагчийн тос, 4л', 'сав', 72000, admin_user_id),

    -- Bulbs, lights
    (gen_random_uuid(), org_id, 'Гэрлийн чийдэн – LED хийх гэрэл (H11)', 'LIGHT-LED-H11', 'Гэрэл', 'LED хийх гэрэл H11, 6000K, 2ш багц', 'багц', 35000, admin_user_id),
    (gen_random_uuid(), org_id, 'Гэрлийн чийдэн – LED H7', 'LIGHT-LED-H7', 'Гэрэл', 'LED H7, 6000K, 2ш багц', 'багц', 32000, admin_user_id),

    -- Battery
    (gen_random_uuid(), org_id, 'Аккумулятор – 55Ah (Harrier, Camry)', 'BATT-55AH', 'Аккумулятор', '55Ah аккумулятор, Toyota загварууд', 'ш', 150000, admin_user_id),
    (gen_random_uuid(), org_id, 'Аккумулятор – 75Ah (Highlander, RX)', 'BATT-75AH', 'Аккумулятор', '75Ah аккумулятор, Highlander, Lexus RX', 'ш', 185000, admin_user_id),

    -- Other
    (gen_random_uuid(), org_id, 'Шилийг угаах шингэн (5L)', 'WASH-FLUID-5L', 'Тос, шингэн', 'Шилийг угаах шингэн, өвлийн, 5л', 'сав', 12000, admin_user_id),
    (gen_random_uuid(), org_id, 'Хөдөлгүүрийн тагийн жийргэвч (Harrier 2.0L)', 'GASKET-VC-HAR20', 'Жийргэвч', 'Хөдөлгүүрийн тагийн жийргэвч, Harrier 2.0L', 'ш', 15000, admin_user_id),
    (gen_random_uuid(), org_id, 'Термостат (Harrier, Highlander 2.0/2.5)', 'THERMO-TOY', 'Хөргөлт', 'Термостат, 82°C, Toyota 2.0/2.5L', 'ш', 22000, admin_user_id),
    (gen_random_uuid(), org_id, 'Хөдөлгүүрийн тос 5W-30 (1L)', 'TOS-5W30-1L', 'Тос, шингэн', 'Toyota 5W-30 синтетик хөдөлгүүрийн тос, 1л', 'ш', 12000, admin_user_id)
  on conflict do nothing;

  -- ═════════════════════════════════════════════════════════════
  -- VEHICLE MODEL PARTS (which parts fit which models)
  -- ═════════════════════════════════════════════════════════════

  -- Note: vehicle_model_ids are dynamic because of gen_random_uuid().
  -- We need to look them up. We'll use a subquery approach.

  -- Oil filter fits all Toyotas
  insert into public.vehicle_model_parts (id, organization_id, vehicle_model_id, part_id, notes, created_by)
  select gen_random_uuid(), org_id, vm.id, pc.id, pc.name, admin_user_id
  from public.vehicle_models vm
  cross join public.parts_catalog pc
  where vm.organization_id = org_id
    and pc.organization_id = org_id
    and pc.part_number in ('FIL-OIL-TOY', 'TOS-5W30-4L', 'TOS-0W20-4L', 'FIL-FUEL-TOY', 'BRK-FLUID-DOT4', 'COL-COOL-TOY5L', 'WASH-FLUID-5L', 'COL-CAP-TOY', 'BATT-55AH', 'IGN-PLUG-IRID', 'ATF-WS-4L')
  on conflict do nothing;

  -- Air filter specific to Harrier XU60
  insert into public.vehicle_model_parts (id, organization_id, vehicle_model_id, part_id, notes, created_by)
  select gen_random_uuid(), org_id, vm.id, pc.id, 'Оригинал', admin_user_id
  from public.vehicle_models vm
  cross join public.parts_catalog pc
  where vm.organization_id = org_id and pc.organization_id = org_id
    and vm.make = 'Toyota' and vm.model = 'Harrier' and vm.generation like 'XU60%'
    and pc.part_number = 'FIL-AIR-HAR60'
  on conflict do nothing;

  -- Cabin filter for all Toyota
  insert into public.vehicle_model_parts (id, organization_id, vehicle_model_id, part_id, notes, created_by)
  select gen_random_uuid(), org_id, vm.id, pc.id, 'Бүх загварт тохирно', admin_user_id
  from public.vehicle_models vm
  cross join public.parts_catalog pc
  where vm.organization_id = org_id and pc.organization_id = org_id
    and vm.make = 'Toyota'
    and pc.part_number = 'FIL-CAB-TOY'
  on conflict do nothing;

  -- Brake pads for Harrier XU60
  insert into public.vehicle_model_parts (id, organization_id, vehicle_model_id, part_id, notes, created_by)
  select gen_random_uuid(), org_id, vm.id, pc.id, 'Урд', admin_user_id
  from public.vehicle_models vm
  cross join public.parts_catalog pc
  where vm.organization_id = org_id and pc.organization_id = org_id
    and vm.make = 'Toyota' and vm.model = 'Harrier' and vm.generation like 'XU60%'
    and pc.part_number in ('BRK-PAD-HAR60-F', 'BRK-DIS-HAR60-F', 'SUS-SHOCK-HAR60-F')
  on conflict do nothing;

  -- Brake pads for Lexus RX AL20
  insert into public.vehicle_model_parts (id, organization_id, vehicle_model_id, part_id, notes, created_by)
  select gen_random_uuid(), org_id, vm.id, pc.id, 'Урд керамик', admin_user_id
  from public.vehicle_models vm
  cross join public.parts_catalog pc
  where vm.organization_id = org_id and pc.organization_id = org_id
    and vm.make = 'Lexus' and vm.model = 'RX' and vm.generation like 'AL20%'
    and pc.part_number in ('BRK-PAD-RX20-F', 'BRK-DIS-RX20-F', 'SUS-SHOCK-RX20-F')
  on conflict do nothing;

  -- Brake pads for Highlander/Kluger XU70
  insert into public.vehicle_model_parts (id, organization_id, vehicle_model_id, part_id, notes, created_by)
  select gen_random_uuid(), org_id, vm.id, pc.id, 'Урд', admin_user_id
  from public.vehicle_models vm
  cross join public.parts_catalog pc
  where vm.organization_id = org_id and pc.organization_id = org_id
    and vm.model in ('Highlander', 'Kluger') and vm.generation like 'XU70%'
    and pc.part_number in ('BRK-PAD-HIG70-F', 'FIL-AIR-HIG70')
  on conflict do nothing;

  -- Wiper blades
  insert into public.vehicle_model_parts (id, organization_id, vehicle_model_id, part_id, notes, created_by)
  select gen_random_uuid(), org_id, vm.id, pc.id, 'Урд', admin_user_id
  from public.vehicle_models vm
  cross join public.parts_catalog pc
  where vm.organization_id = org_id and pc.organization_id = org_id
    and vm.make = 'Toyota' and vm.model = 'Harrier'
    and pc.part_number = 'WIP-FRONT-HAR'
  on conflict do nothing;

  -- Spark plugs 3.5L for Lexus
  insert into public.vehicle_model_parts (id, organization_id, vehicle_model_id, part_id, notes, created_by)
  select gen_random_uuid(), org_id, vm.id, pc.id, '6ш багц', admin_user_id
  from public.vehicle_models vm
  cross join public.parts_catalog pc
  where vm.organization_id = org_id and pc.organization_id = org_id
    and vm.make = 'Lexus'
    and pc.part_number = 'IGN-PLUG-IRID-L'
  on conflict do nothing;

  -- ═════════════════════════════════════════════════════════════
  -- SUPPLIERS
  -- ═════════════════════════════════════════════════════════════
  insert into public.suppliers (id, organization_id, branch_id, name, contact_person, phone, email, payment_terms, notes, created_by) values
    (gen_random_uuid(), org_id, branch_id_val, 'Тоёта Моторс Монголиа', 'Баярсайхан Н', '11-345678', 'parts@toyota.mn', '14 хоног', 'Албан ёсны Toyota дистрибьютор', admin_user_id),
    (gen_random_uuid(), org_id, branch_id_val, 'Лексус Монголиа', 'Энхбат D', '11-456789', 'parts@lexus.mn', '14 хоног', 'Lexus Монгол дахь дилер', admin_user_id),
    (gen_random_uuid(), org_id, branch_id_val, 'Авто Сэлбэг ХХК', 'Ганзориг Т', '99001234', 'info@autoselbeg.mn', 'Урьдчилсан төлбөр', 'Тойота/Лексусын сэлбэгийн импортлогч', admin_user_id),
    (gen_random_uuid(), org_id, branch_id_val, 'Женко Трейд', 'Мөнхбат Г', '99112233', 'sales@zenkocompany.mn', '7 хоног', 'Японы сэлбэгийн импортлогч', admin_user_id),
    (gen_random_uuid(), org_id, branch_id_val, 'Монгол Суул ХХК', 'Баттулга N', '99770011', 'info@monoolsul.mn', '30 хоног', 'Тос, шингэн, аккумулятор', admin_user_id),
    (gen_random_uuid(), org_id, branch_id_val, 'Юнитек Авто Партс', 'Сарантуяа D', '99887766', 'sales@unitckauto.mn', '14 хоног', 'Керамик тоормос, гэрлийн чийдэн', admin_user_id),
    (gen_random_uuid(), org_id, branch_id_val, 'Баянбогд Авто Сэлбэг', 'Болд J', '95001122', 'bold@bayanbold.mn', 'Бэлэн мөнгө', 'Тойота сэлбэг, бичил сэлбэг', admin_user_id),
    (gen_random_uuid(), org_id, branch_id_val, 'Эм Жи Эйч Моторс', 'Ганболд S', '99123455', 'gmh@motor.mn', '21 хоног', 'Hyundai/Kia/Тойота сэлбэг', admin_user_id)
  on conflict (id) do nothing;

  -- ═════════════════════════════════════════════════════════════
  -- PURCHASE ORDERS
  -- ═════════════════════════════════════════════════════════════

  -- PO-001: Oil & filters from Монгол Суул (fully received)
  declare
    po1_id uuid := gen_random_uuid();
    po2_id uuid := gen_random_uuid();
    po3_id uuid := gen_random_uuid();
    po4_id uuid := gen_random_uuid();
    po5_id uuid := gen_random_uuid();
    supplier1_id uuid;
    supplier2_id uuid;
    supplier3_id uuid;
    supplier4_id uuid;
    oil_filter_id uuid;
    oil_5w30_id uuid;
    oil_0w20_id uuid;
    air_har60_id uuid;
    air_rx20_id uuid;
    cabin_fil_id uuid;
    coolant_id uuid;
    wash_id uuid;
    atf_ws_id uuid;
    brake_pad_har_f_id uuid;
    brake_pad_rx_f_id uuid;
    brake_pad_high_f_id uuid;
    brake_disc_rx_f_id uuid;
    spark_irid_id uuid;
    spark_irid_l_id uuid;
    shock_har_f_id uuid;
    batt_55_id uuid;
    batt_75_id uuid;
    therm_id uuid;
  begin
    -- Get supplier IDs
    select id into supplier1_id from public.suppliers where organization_id = org_id and name = 'Монгол Суул ХХК' limit 1;
    select id into supplier2_id from public.suppliers where organization_id = org_id and name = 'Авто Сэлбэг ХХК' limit 1;
    select id into supplier3_id from public.suppliers where organization_id = org_id and name = 'Женко Трейд' limit 1;
    select id into supplier4_id from public.suppliers where organization_id = org_id and name = 'Юнитек Авто Партс' limit 1;

    -- Get part IDs
    select id into oil_filter_id from public.parts_catalog where organization_id = org_id and part_number = 'FIL-OIL-TOY' limit 1;
    select id into oil_5w30_id from public.parts_catalog where organization_id = org_id and part_number = 'TOS-5W30-4L' limit 1;
    select id into oil_0w20_id from public.parts_catalog where organization_id = org_id and part_number = 'TOS-0W20-4L' limit 1;
    select id into air_har60_id from public.parts_catalog where organization_id = org_id and part_number = 'FIL-AIR-HAR60' limit 1;
    select id into air_rx20_id from public.parts_catalog where organization_id = org_id and part_number = 'FIL-AIR-RX20' limit 1;
    select id into cabin_fil_id from public.parts_catalog where organization_id = org_id and part_number = 'FIL-CAB-TOY' limit 1;
    select id into coolant_id from public.parts_catalog where organization_id = org_id and part_number = 'COL-COOL-TOY5L' limit 1;
    select id into wash_id from public.parts_catalog where organization_id = org_id and part_number = 'WASH-FLUID-5L' limit 1;
    select id into atf_ws_id from public.parts_catalog where organization_id = org_id and part_number = 'ATF-WS-4L' limit 1;
    select id into brake_pad_har_f_id from public.parts_catalog where organization_id = org_id and part_number = 'BRK-PAD-HAR60-F' limit 1;
    select id into brake_pad_rx_f_id from public.parts_catalog where organization_id = org_id and part_number = 'BRK-PAD-RX20-F' limit 1;
    select id into brake_pad_high_f_id from public.parts_catalog where organization_id = org_id and part_number = 'BRK-PAD-HIG70-F' limit 1;
    select id into brake_disc_rx_f_id from public.parts_catalog where organization_id = org_id and part_number = 'BRK-DIS-RX20-F' limit 1;
    select id into spark_irid_id from public.parts_catalog where organization_id = org_id and part_number = 'IGN-PLUG-IRID' limit 1;
    select id into spark_irid_l_id from public.parts_catalog where organization_id = org_id and part_number = 'IGN-PLUG-IRID-L' limit 1;
    select id into shock_har_f_id from public.parts_catalog where organization_id = org_id and part_number = 'SUS-SHOCK-HAR60-F' limit 1;
    select id into batt_55_id from public.parts_catalog where organization_id = org_id and part_number = 'BATT-55AH' limit 1;
    select id into batt_75_id from public.parts_catalog where organization_id = org_id and part_number = 'BATT-75AH' limit 1;
    select id into therm_id from public.parts_catalog where organization_id = org_id and part_number = 'THERMO-TOY' limit 1;

    -- PO-001: Received — oils, filters, fluids
    insert into public.purchase_orders (id, organization_id, branch_id, supplier_id, order_number, status, order_date, expected_at, received_at, notes, total_amount, created_by)
    values (po1_id, org_id, branch_id_val, supplier1_id, 'PO-2026-001', 'received', '2026-04-01', '2026-04-05', '2026-04-04 14:30:00+08', 'Сарын эхний захиалга — тос, шүүрүүр', 585000, admin_user_id);

    insert into public.purchase_order_items (id, organization_id, purchase_order_id, part_id, quantity_ordered, quantity_received, unit_cost, created_by) values
      (gen_random_uuid(), org_id, po1_id, oil_filter_id, 20, 20, 8000, admin_user_id),
      (gen_random_uuid(), org_id, po1_id, oil_5w30_id, 15, 15, 32000, admin_user_id),
      (gen_random_uuid(), org_id, po1_id, oil_0w20_id, 10, 10, 40000, admin_user_id),
      (gen_random_uuid(), org_id, po1_id, cabin_fil_id, 10, 10, 18000, admin_user_id),
      (gen_random_uuid(), org_id, po1_id, coolant_id, 8, 8, 28000, admin_user_id),
      (gen_random_uuid(), org_id, po1_id, wash_id, 12, 12, 8000, admin_user_id);

    insert into public.inventory_movements (id, organization_id, branch_id, part_id, movement_type, quantity, unit_cost, reference_type, reference_id, notes, created_by)
    select gen_random_uuid(), org_id, branch_id_val, poi.part_id, 'purchase', poi.quantity_received, poi.unit_cost, 'purchase_order', po1_id, 'PO-2026-001 хүлээн авсан', admin_user_id
    from public.purchase_order_items poi
    where poi.purchase_order_id = po1_id;

    -- PO-002: Received — brake parts from Юнитек
    insert into public.purchase_orders (id, organization_id, branch_id, supplier_id, order_number, status, order_date, expected_at, received_at, notes, total_amount, created_by)
    values (po2_id, org_id, branch_id_val, supplier4_id, 'PO-2026-002', 'received', '2026-04-10', '2026-04-15', '2026-04-16 10:00:00+08', 'Тормосны сэлбэг — Harrier, RX, Highlander', 1715000, admin_user_id);

    insert into public.purchase_order_items (id, organization_id, purchase_order_id, part_id, quantity_ordered, quantity_received, unit_cost, created_by) values
      (gen_random_uuid(), org_id, po2_id, brake_pad_har_f_id, 10, 10, 50000, admin_user_id),
      (gen_random_uuid(), org_id, po2_id, brake_pad_rx_f_id, 8, 8, 65000, admin_user_id),
      (gen_random_uuid(), org_id, po2_id, brake_pad_high_f_id, 6, 6, 58000, admin_user_id),
      (gen_random_uuid(), org_id, po2_id, brake_disc_rx_f_id, 4, 4, 95000, admin_user_id),
      (gen_random_uuid(), org_id, po2_id, spark_irid_id, 10, 10, 38000, admin_user_id),
      (gen_random_uuid(), org_id, po2_id, spark_irid_l_id, 5, 5, 55000, admin_user_id);

    insert into public.inventory_movements (id, organization_id, branch_id, part_id, movement_type, quantity, unit_cost, reference_type, reference_id, notes, created_by)
    select gen_random_uuid(), org_id, branch_id_val, poi.part_id, 'purchase', poi.quantity_received, poi.unit_cost, 'purchase_order', po2_id, 'PO-2026-002 хүлээн авсан', admin_user_id
    from public.purchase_order_items poi
    where poi.purchase_order_id = po2_id;

    -- PO-003: Received — shocks, air filters from Авто Сэлбэг
    insert into public.purchase_orders (id, organization_id, branch_id, supplier_id, order_number, status, order_date, expected_at, received_at, notes, total_amount, created_by)
    values (po3_id, org_id, branch_id_val, supplier2_id, 'PO-2026-003', 'received', '2026-04-18', '2026-04-25', '2026-04-24 16:45:00+08', 'Пүрх, агаарын шүүрүүр, амортизатор', 2140000, admin_user_id);

    insert into public.purchase_order_items (id, organization_id, purchase_order_id, part_id, quantity_ordered, quantity_received, unit_cost, created_by) values
      (gen_random_uuid(), org_id, po3_id, shock_har_f_id, 4, 4, 140000, admin_user_id),
      (gen_random_uuid(), org_id, po3_id, air_har60_id, 8, 8, 14000, admin_user_id),
      (gen_random_uuid(), org_id, po3_id, air_rx20_id, 6, 6, 17000, admin_user_id),
      (gen_random_uuid(), org_id, po3_id, batt_55_id, 5, 5, 110000, admin_user_id),
      (gen_random_uuid(), org_id, po3_id, batt_75_id, 3, 3, 140000, admin_user_id);

    insert into public.inventory_movements (id, organization_id, branch_id, part_id, movement_type, quantity, unit_cost, reference_type, reference_id, notes, created_by)
    select gen_random_uuid(), org_id, branch_id_val, poi.part_id, 'purchase', poi.quantity_received, poi.unit_cost, 'purchase_order', po3_id, 'PO-2026-003 хүлээн авсан', admin_user_id
    from public.purchase_order_items poi
    where poi.purchase_order_id = po3_id;

    -- PO-004: Ordered (not yet received) — more parts from Женко
    insert into public.purchase_orders (id, organization_id, branch_id, supplier_id, order_number, status, order_date, expected_at, notes, total_amount, created_by)
    values (po4_id, org_id, branch_id_val, supplier3_id, 'PO-2026-004', 'ordered', '2026-05-10', '2026-05-18', 'Хүлээгдэж буй — тос, шүүрүүр, арчигч', 524000, admin_user_id);

    insert into public.purchase_order_items (id, organization_id, purchase_order_id, part_id, quantity_ordered, quantity_received, unit_cost, created_by) values
      (gen_random_uuid(), org_id, po4_id, oil_filter_id, 30, 0, 8000, admin_user_id),
      (gen_random_uuid(), org_id, po4_id, oil_5w30_id, 10, 0, 32000, admin_user_id),
      (gen_random_uuid(), org_id, po4_id, atf_ws_id, 5, 0, 48000, admin_user_id);

    -- PO-005: Draft — batteries (not yet ordered)
    insert into public.purchase_orders (id, organization_id, branch_id, supplier_id, order_number, status, order_date, notes, total_amount, created_by)
    values (po5_id, org_id, branch_id_val, supplier1_id, 'PO-2026-005', 'draft', '2026-05-12', 'Төлөвлөгөө — аккумулятор, термостат', 0, admin_user_id);

    insert into public.purchase_order_items (id, organization_id, purchase_order_id, part_id, quantity_ordered, quantity_received, unit_cost, created_by) values
      (gen_random_uuid(), org_id, po5_id, batt_55_id, 8, 0, 110000, admin_user_id),
      (gen_random_uuid(), org_id, po5_id, batt_75_id, 5, 0, 140000, admin_user_id),
      (gen_random_uuid(), org_id, po5_id, therm_id, 6, 0, 15000, admin_user_id);
  end;

  -- ═════════════════════════════════════════════════════════════
  -- STOCK THRESHOLDS
  -- ═════════════════════════════════════════════════════════════
  insert into public.stock_thresholds (id, organization_id, branch_id, part_id, minimum_quantity, maximum_quantity, notes)
  select gen_random_uuid(), org_id, branch_id_val, pc.id, tmp.minimum, tmp.maximum, tmp.note
  from public.parts_catalog pc
  cross join (values
    ('FIL-OIL-TOY', 10, 30, 'Түргэн зарцуулалттай — байнга нөөцлөх'),
    ('FIL-AIR-HAR60', 3, 10, null),
    ('FIL-CAB-TOY', 5, 15, null),
    ('TOS-5W30-4L', 8, 20, 'Хамгийн их зарагддаг тос'),
    ('TOS-0W20-4L', 5, 15, null),
    ('BRK-PAD-HAR60-F', 3, 10, null),
    ('BRK-PAD-RX20-F', 2, 8, null),
    ('BRK-PAD-HIG70-F', 2, 6, null),
    ('BRK-FLUID-DOT4', 5, 15, null),
    ('COL-COOL-TOY5L', 4, 10, null),
    ('BATT-55AH', 2, 6, null),
    ('BATT-75AH', 1, 4, null),
    ('IGN-PLUG-IRID', 4, 12, null),
    ('WASH-FLUID-5L', 6, 20, null)
  ) as tmp(pn, minimum, maximum, note)
  where pc.part_number = tmp.pn and pc.organization_id = org_id
  on conflict (organization_id, branch_id, part_id) do nothing;

  -- ═════════════════════════════════════════════════════════════
  -- SERVICE CATALOG
  -- ═════════════════════════════════════════════════════════════
  insert into public.service_catalog (id, organization_id, name, description, default_price, category, created_by) values
    (gen_random_uuid(), org_id, 'Тос солих', 'Хөдөлгүүрийн тос + шүүрүүр солих. Багтана: тос 5W-30 (4л), тосны шүүрүүр, хөдөлмөр', 85000, 'Тогтмол засвар үйлчилгээ', admin_user_id),
    (gen_random_uuid(), org_id, 'Тос солих (0W-20)', 'Хөдөлгүүрийн тос 0W-20 + шүүрүүр солих', 95000, 'Тогтмол засвар үйлчилгээ', admin_user_id),
    (gen_random_uuid(), org_id, 'Тормосны дэвсгэр солих — Урд', 'Урд тормосны дэвсгэр солих, тохируулга, тосолгоо', 60000, 'Тормос', admin_user_id),
    (gen_random_uuid(), org_id, 'Тормосны дэвсгэр солих — Хойд', 'Хойд тормосны дэвсгэр солих, тохируулга', 50000, 'Тормос', admin_user_id),
    (gen_random_uuid(), org_id, 'Тормосны диск + дэвсгэр солих — Урд', 'Урд тормосны диск + дэвсгэр бүрэн солих', 120000, 'Тормос', admin_user_id),
    (gen_random_uuid(), org_id, 'Агаарын шүүрүүр солих', 'Хөдөлгүүрийн агаарын шүүрүүр солих', 15000, 'Тогтмол засвар үйлчилгээ', admin_user_id),
    (gen_random_uuid(), org_id, 'Салонны шүүрүүр солих', 'Салонны (кабины) шүүрүүр солих', 15000, 'Тогтмол засвар үйлчилгээ', admin_user_id),
    (gen_random_uuid(), org_id, 'Оношилгоо (OBD-II)', 'Компьютер оношилгоо, бүх системийг шалгах', 35000, 'Оношилгоо', admin_user_id),
    (gen_random_uuid(), org_id, 'Лаа солих', 'Хөдөлгүүрийн лаа бүрэн солих (4 цилиндр)', 40000, 'Асаагуур', admin_user_id),
    (gen_random_uuid(), org_id, 'Лаа солих (6 цилиндр)', 'Хөдөлгүүрийн лаа бүрэн солих (6 цилиндр)', 55000, 'Асаагуур', admin_user_id),
    (gen_random_uuid(), org_id, 'Амортизатор солих — 1ш', 'Урд/хойд амортизатор солих, нэг дугуй', 50000, 'Пүрх, пневматик', admin_user_id),
    (gen_random_uuid(), org_id, 'Аккумулятор солих', 'Аккумулятор солих, терминал цэвэрлэх', 15000, 'Аккумулятор', admin_user_id),
    (gen_random_uuid(), org_id, 'Антифриз солих', 'Хөргөлтийн шингэн солих, систем агаар гаргах', 30000, 'Хөргөлт', admin_user_id),
    (gen_random_uuid(), org_id, 'Газрын тосны шүүрүүр солих', 'Газрын тосны шүүрүүр солих', 20000, 'Тогтмол засвар үйлчилгээ', admin_user_id),
    (gen_random_uuid(), org_id, 'Бүс солих (поли V)', 'Альтернаторын поли V бүс солих', 35000, 'Хөдөлгүүр', admin_user_id),
    (gen_random_uuid(), org_id, 'Дамжуулагчийн тос солих (ATF)', 'Автомат хурдны хайрцгийн тос солих (4л)', 55000, 'Хурдны хайрцаг', admin_user_id),
    (gen_random_uuid(), org_id, 'Иж бүрэн үзлэг', '80 цэгийн иж бүрэн үзлэг — тос, шүүрүүр, тормос, гэрэл, дугуй, түдгэлзүүр', 150000, 'Үзлэг', admin_user_id),
    (gen_random_uuid(), org_id, 'Салхины шилний арчигч солих', 'Урд арчигч солих', 10000, 'Арчигч', admin_user_id),
    (gen_random_uuid(), org_id, 'Дугуй солих (1ш)', 'Нэг дугуй солих, тэнцвэржүүлэх', 15000, 'Дугуй', admin_user_id),
    (gen_random_uuid(), org_id, 'LED гэрэл солих', 'LED хийх гэрэл солих (2ш багц)', 15000, 'Гэрэл', admin_user_id)
  on conflict do nothing;

  -- ═════════════════════════════════════════════════════════════
  -- WORK ORDERS — on real vehicles showing feature completeness
  -- ═════════════════════════════════════════════════════════════

  declare
    wo1_id constant uuid := 'a0000001-0000-0000-0000-000000000001';
    wo2_id constant uuid := 'a0000001-0000-0000-0000-000000000002';
    wo3_id constant uuid := 'a0000001-0000-0000-0000-000000000003';
    wo4_id constant uuid := 'a0000001-0000-0000-0000-000000000004';
    wo5_id constant uuid := 'a0000001-0000-0000-0000-000000000005';
    wo6_id constant uuid := 'a0000001-0000-0000-0000-000000000006';
    wo7_id constant uuid := 'a0000001-0000-0000-0000-000000000007';
    wo8_id constant uuid := 'a0000001-0000-0000-0000-000000000008';
    wo9_id constant uuid := 'a0000001-0000-0000-0000-000000000009';
    wo10_id constant uuid := 'a0000001-0000-0000-0000-000000000010';
    harrier_plate_id uuid;
    rx_plate_id uuid;
    highlander_plate_id uuid;
    kluger_plate_id uuid;
    camry_plate_id uuid;
    land_cruiser_id uuid;
    civic_id uuid;
    oil_service_id uuid;
    brake_front_service_id uuid;
    brake_disc_service_id uuid;
    diag_service_id uuid;
    inspection_service_id uuid;
    spark_service_id uuid;
    air_filter_service_id uuid;
    cabin_filter_service_id uuid;
    suspension_service_id uuid;
    battery_service_id uuid;
    coolant_service_id uuid;
    atf_service_id uuid;
    wiper_service_id uuid;
    fuel_filter_service_id uuid;
    light_service_id uuid;
    belt_service_id uuid;
    oil_filter_part_id uuid;
    oil_5w30_part_id uuid;
    oil_0w20_part_id uuid;
    brake_pad_har_f_part_id uuid;
    brake_pad_rx_f_part_id uuid;
    brake_pad_high_f_part_id uuid;
    disc_rx_f_part_id uuid;
    air_har60_part_id uuid;
    air_rx20_part_id uuid;
    cabin_fil_part_id uuid;
    spark_irid_part_id uuid;
    shock_har_f_part_id uuid;
    batt_55_part_id uuid;
    coolant_part_id uuid;
    atf_ws_part_id uuid;
    wash_fl_part_id uuid;
    wiper_har_part_id uuid;
    belt_har20_part_id uuid;
    light_h11_part_id uuid;
    fuel_fil_part_id uuid;
    brake_dot4_part_id uuid;
    customer_bat_id uuid;
    customer_sara_id uuid;
    customer_dorj_id uuid;
    customer_nomin_id uuid;
    customer_bold_id uuid;
    customer_gkha_id uuid;
    customer_erdem_id uuid;
    customer_altan_id uuid;
    customer_amar_id uuid;
    customer_munkhbat_id uuid;
  begin
    -- Customer IDs
    select id into customer_bat_id from public.customers where organization_id = org_id and phone = '99123456' limit 1;
    select id into customer_sara_id from public.customers where organization_id = org_id and phone = '95551234' limit 1;
    select id into customer_dorj_id from public.customers where organization_id = org_id and phone = '88123456' limit 1;
    select id into customer_nomin_id from public.customers where organization_id = org_id and phone = '99234567' limit 1;
    select id into customer_bold_id from public.customers where organization_id = org_id and phone = '96678901' limit 1;
    select id into customer_gkha_id from public.customers where organization_id = org_id and phone = '98345678' limit 1;
    select id into customer_erdem_id from public.customers where organization_id = org_id and phone = '91234567' limit 1;
    select id into customer_altan_id from public.customers where organization_id = org_id and phone = '94445678' limit 1;
    select id into customer_amar_id from public.customers where organization_id = org_id and phone = '96789012' limit 1;
    select id into customer_munkhbat_id from public.customers where organization_id = org_id and phone = '97789012' limit 1;

    -- Vehicle plates — find real ones
    select id into harrier_plate_id from public.vehicles where organization_id = org_id and plate_number = '4747 УБА' limit 1;  -- Lexus RX
    select id into rx_plate_id from public.vehicles where organization_id = org_id and plate_number = '4747 УБА' limit 1;  -- Lexus RX (same plate — first one)
    select id into highlander_plate_id from public.vehicles where organization_id = org_id and plate_number = '4404 УБА' limit 1;  -- Highlander
    select id into kluger_plate_id from public.vehicles where organization_id = org_id and plate_number = '4404 УБА' limit 1;  -- Actually a Highlander plate — same vehicle
    select id into camry_plate_id from public.vehicles where organization_id = org_id and plate_number = '0101 УБА' limit 1;  -- Camry
    select id into land_cruiser_id from public.vehicles where organization_id = org_id and plate_number = '5505 УБА' limit 1;  -- Land Cruiser
    select id into civic_id from public.vehicles where organization_id = org_id and plate_number = '1515 УБА' limit 1;  -- Civic

    -- Service IDs
    select id into oil_service_id from public.service_catalog where organization_id = org_id and name like 'Тос солих%' and default_price = 85000 limit 1;
    select id into brake_front_service_id from public.service_catalog where organization_id = org_id and name = 'Тормосны дэвсгэр солих — Урд' limit 1;
    select id into brake_disc_service_id from public.service_catalog where organization_id = org_id and name = 'Тормосны диск + дэвсгэр солих — Урд' limit 1;
    select id into diag_service_id from public.service_catalog where organization_id = org_id and name = 'Оношилгоо (OBD-II)' limit 1;
    select id into inspection_service_id from public.service_catalog where organization_id = org_id and name like 'Иж бүрэн үзлэг%' limit 1;
    select id into spark_service_id from public.service_catalog where organization_id = org_id and name = 'Лаа солих' limit 1;
    select id into air_filter_service_id from public.service_catalog where organization_id = org_id and name = 'Агаарын шүүрүүр солих' limit 1;
    select id into cabin_filter_service_id from public.service_catalog where organization_id = org_id and name = 'Салонны шүүрүүр солих' limit 1;
    select id into suspension_service_id from public.service_catalog where organization_id = org_id and name = 'Амортизатор солих — 1ш' limit 1;
    select id into battery_service_id from public.service_catalog where organization_id = org_id and name = 'Аккумулятор солих' limit 1;
    select id into coolant_service_id from public.service_catalog where organization_id = org_id and name = 'Антифриз солих' limit 1;
    select id into atf_service_id from public.service_catalog where organization_id = org_id and name like 'Дамжуулагчийн тос солих%' limit 1;
    select id into wiper_service_id from public.service_catalog where organization_id = org_id and name like 'Арчигч солих%' limit 1;
    select id into fuel_filter_service_id from public.service_catalog where organization_id = org_id and name like 'Газрын тосны шүүрүүр%' limit 1;
    select id into light_service_id from public.service_catalog where organization_id = org_id and name like 'LED гэрэл%' limit 1;
    select id into belt_service_id from public.service_catalog where organization_id = org_id and name like 'Бүс солих%' limit 1;

    -- Part IDs
    select id into oil_filter_part_id from public.parts_catalog where organization_id = org_id and part_number = 'FIL-OIL-TOY' limit 1;
    select id into oil_5w30_part_id from public.parts_catalog where organization_id = org_id and part_number = 'TOS-5W30-4L' limit 1;
    select id into oil_0w20_part_id from public.parts_catalog where organization_id = org_id and part_number = 'TOS-0W20-4L' limit 1;
    select id into brake_pad_har_f_part_id from public.parts_catalog where organization_id = org_id and part_number = 'BRK-PAD-HAR60-F' limit 1;
    select id into brake_pad_rx_f_part_id from public.parts_catalog where organization_id = org_id and part_number = 'BRK-PAD-RX20-F' limit 1;
    select id into brake_pad_high_f_part_id from public.parts_catalog where organization_id = org_id and part_number = 'BRK-PAD-HIG70-F' limit 1;
    select id into disc_rx_f_part_id from public.parts_catalog where organization_id = org_id and part_number = 'BRK-DIS-RX20-F' limit 1;
    select id into air_har60_part_id from public.parts_catalog where organization_id = org_id and part_number = 'FIL-AIR-HAR60' limit 1;
    select id into air_rx20_part_id from public.parts_catalog where organization_id = org_id and part_number = 'FIL-AIR-RX20' limit 1;
    select id into cabin_fil_part_id from public.parts_catalog where organization_id = org_id and part_number = 'FIL-CAB-TOY' limit 1;
    select id into spark_irid_part_id from public.parts_catalog where organization_id = org_id and part_number = 'IGN-PLUG-IRID' limit 1;
    select id into shock_har_f_part_id from public.parts_catalog where organization_id = org_id and part_number = 'SUS-SHOCK-HAR60-F' limit 1;
    select id into batt_55_part_id from public.parts_catalog where organization_id = org_id and part_number = 'BATT-55AH' limit 1;
    select id into coolant_part_id from public.parts_catalog where organization_id = org_id and part_number = 'COL-COOL-TOY5L' limit 1;
    select id into atf_ws_part_id from public.parts_catalog where organization_id = org_id and part_number = 'ATF-WS-4L' limit 1;
    select id into wash_fl_part_id from public.parts_catalog where organization_id = org_id and part_number = 'WASH-FLUID-5L' limit 1;
    select id into wiper_har_part_id from public.parts_catalog where organization_id = org_id and part_number = 'WIP-FRONT-HAR' limit 1;
    select id into belt_har20_part_id from public.parts_catalog where organization_id = org_id and part_number = 'BELT-ALT-HAR20' limit 1;
    select id into light_h11_part_id from public.parts_catalog where organization_id = org_id and part_number = 'LIGHT-LED-H11' limit 1;
    select id into fuel_fil_part_id from public.parts_catalog where organization_id = org_id and part_number = 'FIL-FUEL-TOY' limit 1;
    select id into brake_dot4_part_id from public.parts_catalog where organization_id = org_id and part_number = 'BRK-FLUID-DOT4' limit 1;

    -- ═══════════════════════════════════════════════════════════
    -- WO-001: Lexus RX — oil change + inspection (completed)
    -- ═══════════════════════════════════════════════════════════
    insert into public.work_orders (id, organization_id, branch_id, customer_id, vehicle_id, status, description, notes, mechanic_id, started_at, completed_at, created_by, created_at)
    values (wo1_id, org_id, branch_id_val, customer_bat_id, harrier_plate_id, 'Completed', 'Тос солих + иж бүрэн үзлэг', 'Харилцагч 5000км-д тос солиулахаар ирсэн. Үзлэг хийхэд тоормосны шингэн хуучин болсон тул солихыг зөвлөсөн.', admin_user_id, now() - interval '25 days', now() - interval '24 days', admin_user_id, now() - interval '25 days') on conflict (id) do nothing;

    insert into public.work_order_services (id, work_order_id, service_catalog_id, name, base_price, final_price, quantity, created_by)
    values
      (gen_random_uuid(), wo1_id, oil_service_id, 'Тос солих 5W-30', 85000, 85000, 1, admin_user_id),
      (gen_random_uuid(), wo1_id, inspection_service_id, 'Иж бүрэн үзлэг', 150000, 120000, 1, admin_user_id);

    insert into public.work_order_parts (id, work_order_id, part_name, part_number, quantity, unit_price, final_price, created_by)
    values
      (gen_random_uuid(), wo1_id, 'Хөдөлгүүрийн тос 5W-30 (4L)', 'TOS-5W30-4L', 1, 45000, 45000, admin_user_id),
      (gen_random_uuid(), wo1_id, 'Тосны шүүрүүр', 'FIL-OIL-TOY', 1, 12000, 12000, admin_user_id),
      (gen_random_uuid(), wo1_id, 'Тормосны шингэн DOT4', 'BRK-FLUID-DOT4', 1, 15000, 15000, admin_user_id),
      (gen_random_uuid(), wo1_id, 'Шилийг угаах шингэн', 'WASH-FLUID-5L', 1, 12000, 12000, admin_user_id);

    -- Record inventory consumption
    insert into public.inventory_movements (id, organization_id, branch_id, part_id, movement_type, quantity, unit_cost, reference_type, reference_id, notes, created_by)
    values
      (gen_random_uuid(), org_id, branch_id_val, oil_5w30_part_id, 'sale', -1, 32000, 'work_order', wo1_id, 'WO-001 тос зарцуулалт', admin_user_id),
      (gen_random_uuid(), org_id, branch_id_val, oil_filter_part_id, 'sale', -1, 8000, 'work_order', wo1_id, 'WO-001 шүүрүүр', admin_user_id),
      (gen_random_uuid(), org_id, branch_id_val, brake_dot4_part_id, 'sale', -1, 10000, 'work_order', wo1_id, 'WO-001 тоормосны шингэн', admin_user_id);

    insert into public.work_order_status_history (id, work_order_id, organization_id, previous_status, new_status, changed_by, created_at)
    values
      (gen_random_uuid(), wo1_id, org_id, null, 'New', admin_user_id, now() - interval '25 days'),
      (gen_random_uuid(), wo1_id, org_id, 'New', 'Diagnosing', admin_user_id, now() - interval '25 days'),
      (gen_random_uuid(), wo1_id, org_id, 'Diagnosing', 'In Progress', admin_user_id, now() - interval '25 days'),
      (gen_random_uuid(), wo1_id, org_id, 'In Progress', 'Ready for Pickup', admin_user_id, now() - interval '24 days'),
      (gen_random_uuid(), wo1_id, org_id, 'Ready for Pickup', 'Completed', admin_user_id, now() - interval '24 days');

    -- ═══════════════════════════════════════════════════════════
    -- WO-002: Highlander — brake pads replacement (completed)
    -- ═══════════════════════════════════════════════════════════
    insert into public.work_orders (id, organization_id, branch_id, customer_id, vehicle_id, status, description, notes, mechanic_id, started_at, completed_at, created_by, created_at)
    values (wo2_id, org_id, branch_id_val, customer_nomin_id, highlander_plate_id, 'Completed', 'Урд тормосны дэвсгэр солих', 'Харилцагчын урд тормосны дэвсгэр хуучирч, дуугарч байсан. Керамик дэвсгэрээр солив. Дискний зузаан хэвийн.', admin_user_id, now() - interval '18 days', now() - interval '17 days', admin_user_id, now() - interval '18 days') on conflict (id) do nothing;

    insert into public.work_order_services (id, work_order_id, service_catalog_id, name, base_price, final_price, quantity, created_by)
    values
      (gen_random_uuid(), wo2_id, brake_front_service_id, 'Урд тормосны дэвсгэр солих', 60000, 60000, 1, admin_user_id);

    insert into public.work_order_parts (id, work_order_id, part_name, part_number, quantity, unit_price, final_price, created_by)
    values
      (gen_random_uuid(), wo2_id, 'Тормосны дэвсгэр – Урд (Highlander/Kluger XU70)', 'BRK-PAD-HIG70-F', 1, 75000, 75000, admin_user_id);

    insert into public.inventory_movements (id, organization_id, branch_id, part_id, movement_type, quantity, unit_cost, reference_type, reference_id, notes, created_by)
    values
      (gen_random_uuid(), org_id, branch_id_val, brake_pad_high_f_part_id, 'sale', -1, 58000, 'work_order', wo2_id, 'WO-002 дэвсгэр', admin_user_id);

    insert into public.work_order_status_history (id, work_order_id, organization_id, previous_status, new_status, changed_by, created_at)
    values
      (gen_random_uuid(), wo2_id, org_id, null, 'New', admin_user_id, now() - interval '18 days'),
      (gen_random_uuid(), wo2_id, org_id, 'New', 'In Progress', admin_user_id, now() - interval '18 days'),
      (gen_random_uuid(), wo2_id, org_id, 'In Progress', 'Ready for Pickup', admin_user_id, now() - interval '17 days'),
      (gen_random_uuid(), wo2_id, org_id, 'Ready for Pickup', 'Completed', admin_user_id, now() - interval '17 days');

    -- ═══════════════════════════════════════════════════════════
    -- WO-003: Lexus RX — brake discs + pads + diagnosis (completed)
    -- ═══════════════════════════════════════════════════════════
    insert into public.work_orders (id, organization_id, branch_id, customer_id, vehicle_id, status, description, notes, mechanic_id, started_at, completed_at, created_by, created_at)
    values (wo3_id, org_id, branch_id_val, customer_sara_id, rx_plate_id, 'Completed', 'Урд тоормосны диск + дэвсгэр солих, оношилгоо', 'Lexus RX 350 — тоормосны диск хэт нимгэрч, дэвсгэр хуучирсан. Диск + дэвсгэр бүрэн солив. Мөн хөдөлгүүрийн лаа солихыг зөвлөсөн.', admin_user_id, now() - interval '12 days', now() - interval '11 days', admin_user_id, now() - interval '12 days') on conflict (id) do nothing;

    insert into public.work_order_services (id, work_order_id, service_catalog_id, name, base_price, final_price, quantity, created_by)
    values
      (gen_random_uuid(), wo3_id, brake_disc_service_id, 'Урд тоормосны диск + дэвсгэр солих', 120000, 120000, 1, admin_user_id),
      (gen_random_uuid(), wo3_id, diag_service_id, 'Оношилгоо', 35000, 35000, 1, admin_user_id);

    insert into public.work_order_parts (id, work_order_id, part_name, part_number, quantity, unit_price, final_price, created_by)
    values
      (gen_random_uuid(), wo3_id, 'Тормосны дэвсгэр – Урд (Lexus RX AL20)', 'BRK-PAD-RX20-F', 1, 85000, 85000, admin_user_id),
      (gen_random_uuid(), wo3_id, 'Тормосны диск – Урд (Lexus RX AL20)', 'BRK-DIS-RX20-F', 2, 130000, 260000, admin_user_id);

    insert into public.inventory_movements (id, organization_id, branch_id, part_id, movement_type, quantity, unit_cost, reference_type, reference_id, notes, created_by)
    values
      (gen_random_uuid(), org_id, branch_id_val, brake_pad_rx_f_part_id, 'sale', -1, 65000, 'work_order', wo3_id, 'WO-003 дэвсгэр', admin_user_id),
      (gen_random_uuid(), org_id, branch_id_val, disc_rx_f_part_id, 'sale', -2, 95000, 'work_order', wo3_id, 'WO-003 диск x2', admin_user_id);

    insert into public.work_order_status_history (id, work_order_id, organization_id, previous_status, new_status, changed_by, created_at)
    values
      (gen_random_uuid(), wo3_id, org_id, null, 'New', admin_user_id, now() - interval '12 days'),
      (gen_random_uuid(), wo3_id, org_id, 'New', 'Diagnosing', admin_user_id, now() - interval '12 days'),
      (gen_random_uuid(), wo3_id, org_id, 'Diagnosing', 'In Progress', admin_user_id, now() - interval '12 days'),
      (gen_random_uuid(), wo3_id, org_id, 'In Progress', 'Ready for Pickup', admin_user_id, now() - interval '11 days'),
      (gen_random_uuid(), wo3_id, org_id, 'Ready for Pickup', 'Completed', admin_user_id, now() - interval '11 days');

    -- ═══════════════════════════════════════════════════════════
    -- WO-004: Camry — oil change, air filter, cabin filter (completed)
    -- ═══════════════════════════════════════════════════════════
    insert into public.work_orders (id, organization_id, branch_id, customer_id, vehicle_id, status, description, notes, mechanic_id, started_at, completed_at, created_by, created_at)
    values (wo4_id, org_id, branch_id_val, customer_erdem_id, camry_plate_id, 'Completed', 'Тос солих + агаарын шүүрүүр, салонны шүүрүүр солих', '30,000км-ийн засвар үйлчилгээ. Бүх шүүрүүр солигдсон.', admin_user_id, now() - interval '10 days', now() - interval '9 days', admin_user_id, now() - interval '10 days') on conflict (id) do nothing;

    insert into public.work_order_services (id, work_order_id, service_catalog_id, name, base_price, final_price, quantity, created_by)
    values
      (gen_random_uuid(), wo4_id, oil_service_id, 'Тос солих 5W-30', 85000, 85000, 1, admin_user_id),
      (gen_random_uuid(), wo4_id, air_filter_service_id, 'Агаарын шүүрүүр солих', 15000, 15000, 1, admin_user_id),
      (gen_random_uuid(), wo4_id, cabin_filter_service_id, 'Салонны шүүрүүр солих', 15000, 15000, 1, admin_user_id);

    insert into public.work_order_parts (id, work_order_id, part_name, part_number, quantity, unit_price, final_price, created_by)
    values
      (gen_random_uuid(), wo4_id, 'Хөдөлгүүрийн тос 5W-30 (4L)', 'TOS-5W30-4L', 1, 45000, 45000, admin_user_id),
      (gen_random_uuid(), wo4_id, 'Тосны шүүрүүр', 'FIL-OIL-TOY', 1, 12000, 12000, admin_user_id),
      (gen_random_uuid(), wo4_id, 'Агаарын шүүрүүр', 'FIL-AIR-HAR60', 1, 18500, 18500, admin_user_id),
      (gen_random_uuid(), wo4_id, 'Салонны шүүрүүр', 'FIL-CAB-TOY', 1, 25000, 25000, admin_user_id);

    insert into public.inventory_movements (id, organization_id, branch_id, part_id, movement_type, quantity, unit_cost, reference_type, reference_id, notes, created_by)
    values
      (gen_random_uuid(), org_id, branch_id_val, oil_5w30_part_id, 'sale', -1, 32000, 'work_order', wo4_id, 'WO-004 тос', admin_user_id),
      (gen_random_uuid(), org_id, branch_id_val, oil_filter_part_id, 'sale', -1, 8000, 'work_order', wo4_id, 'WO-004 тосны шүүрүүр', admin_user_id),
      (gen_random_uuid(), org_id, branch_id_val, air_har60_part_id, 'sale', -1, 14000, 'work_order', wo4_id, 'WO-004 агаарын шүүрүүр', admin_user_id),
      (gen_random_uuid(), org_id, branch_id_val, cabin_fil_part_id, 'sale', -1, 18000, 'work_order', wo4_id, 'WO-004 салонны шүүрүүр', admin_user_id);

    insert into public.work_order_status_history (id, work_order_id, organization_id, previous_status, new_status, changed_by, created_at)
    values
      (gen_random_uuid(), wo4_id, org_id, null, 'New', admin_user_id, now() - interval '10 days'),
      (gen_random_uuid(), wo4_id, org_id, 'New', 'In Progress', admin_user_id, now() - interval '10 days'),
      (gen_random_uuid(), wo4_id, org_id, 'In Progress', 'Ready for Pickup', admin_user_id, now() - interval '9 days'),
      (gen_random_uuid(), wo4_id, org_id, 'Ready for Pickup', 'Completed', admin_user_id, now() - interval '9 days');

    -- ═══════════════════════════════════════════════════════════
    -- WO-005: Land Cruiser — diagnosis + suspension (in progress)
    -- ═══════════════════════════════════════════════════════════
    insert into public.work_orders (id, organization_id, branch_id, customer_id, vehicle_id, status, description, notes, mechanic_id, started_at, created_by, created_at)
    values (wo5_id, org_id, branch_id_val, customer_gkha_id, land_cruiser_id, 'In Progress', 'Урд амортизатор дуугарч байна — оношилгоо', 'Land Cruiser 2017 — урд амортизатор гоожиж, дуугарч байна. Оношилгоо хийж, амортизатор солих шаардлагатай.', admin_user_id, now() - interval '1 day', admin_user_id, now() - interval '2 days') on conflict (id) do nothing;

    insert into public.work_order_services (id, work_order_id, service_catalog_id, name, base_price, final_price, quantity, created_by)
    values
      (gen_random_uuid(), wo5_id, diag_service_id, 'Оношилгоо', 35000, 35000, 1, admin_user_id),
      (gen_random_uuid(), wo5_id, suspension_service_id, 'Урд амортизатор солих', 50000, 50000, 2, admin_user_id);

    insert into public.work_order_status_history (id, work_order_id, organization_id, previous_status, new_status, changed_by, created_at)
    values
      (gen_random_uuid(), wo5_id, org_id, null, 'New', admin_user_id, now() - interval '2 days'),
      (gen_random_uuid(), wo5_id, org_id, 'New', 'Diagnosing', admin_user_id, now() - interval '2 days'),
      (gen_random_uuid(), wo5_id, org_id, 'Diagnosing', 'In Progress', admin_user_id, now() - interval '1 day');

    -- ═══════════════════════════════════════════════════════════
    -- WO-006: Civic — oil change (new, awaiting bay)
    -- ═══════════════════════════════════════════════════════════
    insert into public.work_orders (id, organization_id, branch_id, customer_id, vehicle_id, status, description, notes, created_by, created_at)
    values (wo6_id, org_id, branch_id_val, customer_altan_id, civic_id, 'New', 'Тос солих 0W-20', 'Honda Civic 2022 — 0W-20 тосоор тос солих. Харилцагч хүлээж байна.', admin_user_id, now() - interval '6 hours') on conflict (id) do nothing;

    insert into public.work_order_services (id, work_order_id, service_catalog_id, name, base_price, final_price, quantity, created_by)
    values
      (gen_random_uuid(), wo6_id, null, 'Тос солих 0W-20', 95000, 95000, 1, admin_user_id);

    insert into public.work_order_status_history (id, work_order_id, organization_id, previous_status, new_status, changed_by, created_at)
    values
      (gen_random_uuid(), wo6_id, org_id, null, 'New', admin_user_id, now() - interval '6 hours');

    -- ═══════════════════════════════════════════════════════════
    -- WO-007: Highlander — ATF change + spark plugs (completed)
    -- ═══════════════════════════════════════════════════════════
    insert into public.work_orders (id, organization_id, branch_id, customer_id, vehicle_id, status, description, notes, mechanic_id, started_at, completed_at, created_by, created_at)
    values (wo7_id, org_id, branch_id_val, customer_dorj_id, highlander_plate_id, 'Completed', 'Дамжуулагчийн тос солих + лаа солих', 'Highlander 2018 — 80,000км-ийн засвар үйлчилгээ. ATF тос, iridium лаа солив.', admin_user_id, now() - interval '8 days', now() - interval '7 days', admin_user_id, now() - interval '8 days') on conflict (id) do nothing;

    insert into public.work_order_services (id, work_order_id, service_catalog_id, name, base_price, final_price, quantity, created_by)
    values
      (gen_random_uuid(), wo7_id, atf_service_id, 'Дамжуулагчийн тос солих', 55000, 55000, 1, admin_user_id),
      (gen_random_uuid(), wo7_id, spark_service_id, 'Лаа солих', 40000, 40000, 1, admin_user_id);

    insert into public.work_order_parts (id, work_order_id, part_name, part_number, quantity, unit_price, final_price, created_by)
    values
      (gen_random_uuid(), wo7_id, 'Дамжуулагчийн тос ATF WS', 'ATF-WS-4L', 1, 65000, 65000, admin_user_id),
      (gen_random_uuid(), wo7_id, 'Лаа – Iridium (4ш)', 'IGN-PLUG-IRID', 1, 48000, 48000, admin_user_id);

    insert into public.inventory_movements (id, organization_id, branch_id, part_id, movement_type, quantity, unit_cost, reference_type, reference_id, notes, created_by)
    values
      (gen_random_uuid(), org_id, branch_id_val, atf_ws_part_id, 'sale', -1, 48000, 'work_order', wo7_id, 'WO-007 ATF тос', admin_user_id),
      (gen_random_uuid(), org_id, branch_id_val, spark_irid_part_id, 'sale', -1, 38000, 'work_order', wo7_id, 'WO-007 лаа 4ш', admin_user_id);

    insert into public.work_order_status_history (id, work_order_id, organization_id, previous_status, new_status, changed_by, created_at)
    values
      (gen_random_uuid(), wo7_id, org_id, null, 'New', admin_user_id, now() - interval '8 days'),
      (gen_random_uuid(), wo7_id, org_id, 'New', 'In Progress', admin_user_id, now() - interval '8 days'),
      (gen_random_uuid(), wo7_id, org_id, 'In Progress', 'Ready for Pickup', admin_user_id, now() - interval '7 days'),
      (gen_random_uuid(), wo7_id, org_id, 'Ready for Pickup', 'Completed', admin_user_id, now() - interval '7 days');

    -- ═══════════════════════════════════════════════════════════
    -- WO-008: Land Cruiser — battery replacement (ready for pickup)
    -- ═══════════════════════════════════════════════════════════
    insert into public.work_orders (id, organization_id, branch_id, customer_id, vehicle_id, status, description, notes, mechanic_id, started_at, completed_at, created_by, created_at)
    values (wo8_id, org_id, branch_id_val, customer_bold_id, land_cruiser_id, 'Ready for Pickup', 'Аккумулятор солих', 'Land Cruiser 2017 — аккумулятор муудсан. 75Ah аккумулятораар солив.', admin_user_id, now() - interval '1 day', now() - interval '12 hours', admin_user_id, now() - interval '2 days') on conflict (id) do nothing;

    insert into public.work_order_services (id, work_order_id, service_catalog_id, name, base_price, final_price, quantity, created_by)
    values
      (gen_random_uuid(), wo8_id, battery_service_id, 'Аккумулятор солих', 15000, 15000, 1, admin_user_id);

    insert into public.work_order_parts (id, work_order_id, part_name, part_number, quantity, unit_price, final_price, created_by)
    values
      (gen_random_uuid(), wo8_id, 'Аккумулятор 75Ah', 'BATT-75AH', 1, 185000, 185000, admin_user_id);

    insert into public.inventory_movements (id, organization_id, branch_id, part_id, movement_type, quantity, unit_cost, reference_type, reference_id, notes, created_by)
    values
      (gen_random_uuid(), org_id, branch_id_val, batt_55_part_id, 'sale', -1, 110000, 'work_order', wo8_id, 'WO-008 аккумулятор', admin_user_id);

    insert into public.work_order_status_history (id, work_order_id, organization_id, previous_status, new_status, changed_by, created_at)
    values
      (gen_random_uuid(), wo8_id, org_id, null, 'New', admin_user_id, now() - interval '2 days'),
      (gen_random_uuid(), wo8_id, org_id, 'New', 'In Progress', admin_user_id, now() - interval '1 day'),
      (gen_random_uuid(), wo8_id, org_id, 'In Progress', 'Ready for Pickup', admin_user_id, now() - interval '12 hours');

    -- ═══════════════════════════════════════════════════════════
    -- WO-009: Lexus RX — coolant flush + belts (diagnosing)
    -- ═══════════════════════════════════════════════════════════
    insert into public.work_orders (id, organization_id, branch_id, customer_id, vehicle_id, status, description, notes, mechanic_id, started_at, created_by, created_at)
    values (wo9_id, org_id, branch_id_val, customer_amar_id, rx_plate_id, 'Diagnosing', 'Хөдөлгүүр халж байна, антифриз гоождог', 'Lexus RX 2020 — хөргөлтийн систем шалгах, термостат солих шаардлагатай байж болно.', admin_user_id, now() - interval '3 hours', admin_user_id, now() - interval '5 hours') on conflict (id) do nothing;

    insert into public.work_order_services (id, work_order_id, service_catalog_id, name, base_price, final_price, quantity, created_by)
    values
      (gen_random_uuid(), wo9_id, diag_service_id, 'Оношилгоо', 35000, 35000, 1, admin_user_id);

    insert into public.work_order_status_history (id, work_order_id, organization_id, previous_status, new_status, changed_by, created_at)
    values
      (gen_random_uuid(), wo9_id, org_id, null, 'New', admin_user_id, now() - interval '5 hours'),
      (gen_random_uuid(), wo9_id, org_id, 'New', 'Diagnosing', admin_user_id, now() - interval '3 hours');

    -- ═══════════════════════════════════════════════════════════
    -- WO-010: Civic — wiper + HID lights (new)
    -- ═══════════════════════════════════════════════════════════
    insert into public.work_orders (id, organization_id, branch_id, customer_id, vehicle_id, status, description, created_by, created_at)
    values (wo10_id, org_id, branch_id_val, customer_munkhbat_id, civic_id, 'New', 'Арчигч солих, LED гэрэл солих', admin_user_id, now() - interval '1 hour') on conflict (id) do nothing;

    insert into public.work_order_services (id, work_order_id, service_catalog_id, name, base_price, final_price, quantity, created_by)
    values
      (gen_random_uuid(), wo10_id, wiper_service_id, 'Арчигч солих', 10000, 10000, 1, admin_user_id),
      (gen_random_uuid(), wo10_id, light_service_id, 'LED гэрэл солих', 15000, 15000, 1, admin_user_id);

    insert into public.work_order_parts (id, work_order_id, part_name, part_number, quantity, unit_price, final_price, created_by)
    values
      (gen_random_uuid(), wo10_id, 'LED гэрлийн чийдэн H11', 'LIGHT-LED-H11', 1, 35000, 35000, admin_user_id);

    insert into public.work_order_status_history (id, work_order_id, organization_id, previous_status, new_status, changed_by, created_at)
    values
      (gen_random_uuid(), wo10_id, org_id, null, 'New', admin_user_id, now() - interval '1 hour');

    -- ═══════════════════════════════════════════════════════════
    -- REPORTING DATA: service_price_history
    -- ═══════════════════════════════════════════════════════════
    insert into public.service_price_history (id, organization_id, service_catalog_id, vehicle_make, vehicle_model, base_price, discount_amount_mnt, final_price, work_order_id, mechanic_id, created_by, created_at)
    select gen_random_uuid(), org_id, wos.service_catalog_id, v.make, v.model, wos.base_price, 0, wos.final_price, wo.id, wo.mechanic_id, admin_user_id, wo.completed_at
    from public.work_orders wo
    join public.vehicles v on v.id = wo.vehicle_id
    join public.work_order_services wos on wos.work_order_id = wo.id
    where wo.organization_id = org_id and wos.service_catalog_id is not null and wo.completed_at is not null
    on conflict do nothing;

    -- ═══════════════════════════════════════════════════════════
    -- REPORTING DATA: part_price_history
    -- ═══════════════════════════════════════════════════════════
    insert into public.part_price_history (id, organization_id, part_name, part_number, vehicle_make, vehicle_model, quantity, unit_price, final_price, work_order_id, mechanic_id, created_by, created_at)
    select gen_random_uuid(), org_id, wop.part_name, wop.part_number, v.make, v.model, wop.quantity, wop.unit_price, wop.final_price, wo.id, wo.mechanic_id, admin_user_id, wo.completed_at
    from public.work_orders wo
    join public.vehicles v on v.id = wo.vehicle_id
    join public.work_order_parts wop on wop.work_order_id = wo.id
    where wo.organization_id = org_id and wo.completed_at is not null
    on conflict do nothing;

  end;
end $$;
