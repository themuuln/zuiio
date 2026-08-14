-- ============================================================
-- Seed data for global reference catalogs
-- Common auto parts and services used in Mongolian workshops
-- ============================================================

-- ── Global Parts ─────────────────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  -- Engine
  ('Engine Oil Filter', 'Газрын тосны шүүрүүр', '90915-YZZN1', 'Engine', 'Standard oil filter for most vehicles', 'piece'),
  ('Engine Air Filter', 'Агаарын шүүрүүр', '17801-F0010', 'Engine', 'Engine intake air filter', 'piece'),
  ('Cabin Air Filter', 'Салоны агаарын шүүрүүр', '87139-YZZ20', 'Engine', 'Cabin pollen/dust filter', 'piece'),
  ('Spark Plug Set (4)', 'Лаавар багц (4ш)', NULL, 'Engine', 'Iridium spark plugs, set of 4', 'set'),
  ('Spark Plug Set (6)', 'Лаавар багц (6ш)', NULL, 'Engine', 'Iridium spark plugs, set of 6', 'set'),
  ('Timing Belt', 'Цагийн бүс', NULL, 'Engine', 'Camshaft timing belt', 'piece'),
  ('Timing Chain', 'Цагийн гинж', NULL, 'Engine', 'Camshaft timing chain', 'piece'),
  ('Serpentine Belt', 'Бүс (поли V)', NULL, 'Engine', 'Drive/serpentine belt', 'piece'),
  ('Engine Mount - Front', 'Хөдөлгүүрийн суурь - Урд', '12305-YZZ01', 'Engine', 'Front engine mount', 'piece'),
  ('Engine Mount - Rear', 'Хөдөлгүүрийн суурь - Арын', NULL, 'Engine', 'Rear engine mount', 'piece'),
  ('Water Pump', 'Усны шахуурга', NULL, 'Engine', 'Engine coolant water pump', 'piece'),
  ('Thermostat', 'Термостат', NULL, 'Engine', 'Engine coolant thermostat', 'piece'),
  ('Radiator', 'Радиатор', NULL, 'Engine', 'Engine cooling radiator', 'piece'),
  ('Ignition Coil', 'Идэвхижүүлэх шүүр', NULL, 'Engine', 'Ignition coil pack', 'piece'),
  ('Fuel Filter', 'Түлшний шүүрүүр', '23300-YZZ01', 'Fuel System', 'Fuel line filter', 'piece'),
  ('Fuel Pump Assembly', 'Түлшний шахуурга', '23220-YZZ01', 'Fuel System', 'Fuel pump with sender unit', 'piece'),
  ('Fuel Injector (1)', 'Түлшний цацуулагч (1ш)', NULL, 'Fuel System', 'Fuel injector', 'piece'),
  ('Fuel Pressure Regulator', 'Түлшний даралт тохируулагч', NULL, 'Fuel System', 'Fuel rail pressure regulator', 'piece'),
  ('Mass Air Flow Sensor', 'Агаарын урсгалын мэдрэгч', NULL, 'Engine', 'MAF sensor', 'piece'),

  -- Brakes
  ('Brake Pads - Front Set', 'Гэмтэлийн элээд - Урд багц', '04465-YZZAG', 'Brakes', 'Front brake pad set (2 axles)', 'set'),
  ('Brake Pads - Rear Set', 'Гэмтэлийн элээд - Арын багц', '04466-YZZAK', 'Brakes', 'Rear brake pad set (2 axles)', 'set'),
  ('Brake Rotor - Front', 'Гэмтлийн ротор - Урд', '43512-YZZ11', 'Brakes', 'Front brake disc/rotor', 'piece'),
  ('Brake Rotor - Rear', 'Гэмтлийн ротор - Арын', '42431-YZZ12', 'Brakes', 'Rear brake disc/rotor', 'piece'),
  ('Brake Caliper - Front', 'Гэмтлийн калипер - Урд', NULL, 'Brakes', 'Front brake caliper', 'piece'),
  ('Brake Caliper - Rear', 'Гэмтлийн калипер - Арын', NULL, 'Brakes', 'Rear brake caliper', 'piece'),
  ('Brake Fluid DOT4', 'Гэмтлийн шингэн DOT4', NULL, 'Brakes', 'DOT4 brake fluid 1L', 'liter'),
  ('Brake Hose - Front', 'Гэмтлийн араатан - Урд', NULL, 'Brakes', 'Front flexible brake hose', 'piece'),
  ('Brake Hose - Rear', 'Гэмтлийн араатан - Арын', NULL, 'Brakes', 'Rear flexible brake hose', 'piece'),
  ('Parking Brake Cable', 'Зогсоолын тоормосны кабель', NULL, 'Brakes', 'Handbrake/parking brake cable', 'piece'),

  -- Suspension
  ('Shock Absorber - Front', 'Амортизатор - Урд', NULL, 'Suspension', 'Front shock absorber', 'piece'),
  ('Shock Absorber - Rear', 'Амортизатор - Арын', NULL, 'Suspension', 'Rear shock absorber', 'piece'),
  ('Strut Assembly - Front', 'Струт угсрагдал - Урд', NULL, 'Suspension', 'Front strut assembly (complete)', 'piece'),
  ('Control Arm - Front Lower', 'Удирдлагын саваа - Урд доод', '48069-YZZ01', 'Suspension', 'Front lower control arm', 'piece'),
  ('Ball Joint - Front Lower', 'Бөмбөлөг нугас - Урд доод', '43330-YZZ01', 'Suspension', 'Front lower ball joint', 'piece'),
  ('Tie Rod End - Outer', 'Татуургын төгсгөл - Гадна', NULL, 'Suspension', 'Outer tie rod end', 'piece'),
  ('Tie Rod End - Inner', 'Татуургын төгсгөл - Дотоод', NULL, 'Suspension', 'Inner tie rod end', 'piece'),
  ('Sway Bar Link', 'Тэнцвэржүүлэх холбогч', NULL, 'Suspension', 'Stabilizer/sway bar link', 'piece'),
  ('Wheel Bearing - Front', 'Дугуйн аяганы угаац - Урд', NULL, 'Suspension', 'Front wheel hub bearing', 'piece'),
  ('Wheel Bearing - Rear', 'Дугуйн аяганы угаац - Арын', NULL, 'Suspension', 'Rear wheel hub bearing', 'piece'),
  ('Spring - Front', 'Пүрх - Урд', NULL, 'Suspension', 'Front coil spring', 'piece'),
  ('Spring - Rear', 'Пүрх - Арын', NULL, 'Suspension', 'Rear coil spring', 'piece'),
  ('Air Spring (Rear)', 'Агаарын пүрх (Арын)', NULL, 'Suspension', 'Rear air suspension bag', 'piece'),

  -- Electrical
  ('Battery 12V', 'Аккумулятор 12V', NULL, 'Electrical', '12V lead-acid battery', 'piece'),
  ('Alternator', 'Генератор', '27060-YZZ01', 'Electrical', 'Charging alternator', 'piece'),
  ('Starter Motor', 'Эхлүүлэх мотор', NULL, 'Electrical', 'Starter motor', 'piece'),
  ('Headlight Bulb (H4)', 'Урд гэрэл (H4)', NULL, 'Electrical', 'H4 halogen headlight bulb', 'piece'),
  ('Headlight Bulb (H7)', 'Урд гэрэл (H7)', NULL, 'Electrical', 'H7 halogen headlight bulb', 'piece'),
  ('Tail Light Assembly', 'Арын гэрэл угсрагдал', NULL, 'Electrical', 'Rear tail light assembly', 'piece'),
  ('Turn Signal Bulb', 'Ишлэлийн гэрэл', NULL, 'Electrical', 'Turn signal indicator bulb', 'piece'),
  ('Fuse Box Set', 'Нүхэн хамгаалагч багц', NULL, 'Electrical', 'Assorted fuse kit', 'set'),
  ('Window Motor', 'Цонхны мотор', NULL, 'Electrical', 'Power window motor', 'piece'),
  ('Door Lock Actuator', 'Хаалганы түгжээ', NULL, 'Electrical', 'Power door lock actuator', 'piece'),

  -- AC System
  ('AC Compressor', 'Компрессор', '88320-YZZ01', 'AC System', 'Air conditioning compressor', 'piece'),
  ('AC Condenser', 'Конденсор', '88460-YZZ01', 'AC System', 'AC condenser radiator', 'piece'),
  ('AC Receiver Drier', 'Хуурайшуулагч', NULL, 'AC System', 'AC receiver drier', 'piece'),
  ('AC Expansion Valve', 'Өргөтгөх капельник', NULL, 'AC System', 'AC expansion valve/orifice tube', 'piece'),
  ('AC Refrigerant R134a', 'Хөргөлтийн шингэн R134a', NULL, 'AC System', 'R134a refrigerant gas', 'kg'),
  ('AC Refrigerant R1234yf', 'Хөргөлтийн шингэн R1234yf', NULL, 'AC System', 'R1234yf refrigerant gas', 'kg'),
  ('Cabin Blower Motor', 'Салоны сэнсний мотор', NULL, 'AC System', 'HVAC blower fan motor', 'piece'),

  -- Transmission
  ('Transmission Fluid ATF', 'Хурдны хайрцагийн тос ATF', NULL, 'Transmission', 'Automatic transmission fluid ATF', 'liter'),
  ('Manual Transmission Gear Oil', 'Хурдны хайрцагийн тос (Гараар)', NULL, 'Transmission', 'Manual gearbox gear oil', 'liter'),
  ('CV Axle / CV Joint', 'Хувьсагч тэнцвэржүүлэгч', NULL, 'Transmission', 'CV axle shaft / CV joint', 'piece'),
  ('Clutch Kit', 'Мөрийн багц', NULL, 'Transmission', 'Clutch disc + pressure plate + bearing', 'set'),
  ('Clutch Master Cylinder', 'Мөрийн эхлэх шүүр', NULL, 'Transmission', 'Clutch master cylinder', 'piece'),
  ('Clutch Slave Cylinder', 'Мөрийн дуусах шүүр', NULL, 'Transmission', 'Clutch slave cylinder', 'piece'),

  -- Cooling
  ('Coolant / Antifreeze', 'Антифриз', NULL, 'Cooling', 'Long-life coolant/antifreeze', 'liter'),
  ('Coolant Hose - Upper', 'Хөргөлтийн араатан - Дээд', NULL, 'Cooling', 'Upper radiator hose', 'piece'),
  ('Coolant Hose - Lower', 'Хөргөлтийн араатан - Доод', NULL, 'Cooling', 'Lower radiator hose', 'piece'),
  ('Coolant Reservoir', 'Хөргөлтийн сав', NULL, 'Cooling', 'Coolant overflow/expansion tank', 'piece'),

  -- Exhaust
  ('Catalytic Converter', 'Каталитик шүүр', NULL, 'Exhaust', 'Catalytic converter', 'piece'),
  ('Muffler / Silencer', 'Дуу чимээ бууруулагч', NULL, 'Exhaust', 'Muffler/silencer', 'piece'),
  ('Oxygen Sensor (O2)', 'Хүчилтөрөгчийн мэдрэгч', NULL, 'Exhaust', 'Oxygen lambda sensor', 'piece'),
  ('Exhaust Pipe', 'Угаар хоолой', NULL, 'Exhaust', 'Exhaust pipe section', 'piece'),

  -- Steering
  ('Power Steering Fluid', 'Удирдлагын тос', NULL, 'Steering', 'Power steering hydraulic fluid', 'liter'),
  ('Power Steering Pump', 'Удирдлагын шахуурга', NULL, 'Steering', 'Power steering pump', 'piece'),
  ('Steering Rack', 'Удирдлагын тросс', NULL, 'Steering', 'Steering rack assembly', 'piece'),

  -- Wheels & Tires
  ('Tire (Standard 205/55R16)', 'Дугуй (205/55R16)', NULL, 'Wheels & Tires', 'Standard passenger car tire', 'piece'),
  ('Tire (Standard 215/60R16)', 'Дугуй (215/60R16)', NULL, 'Wheels & Tires', 'SUV standard tire', 'piece'),
  ('Tire (Standard 225/45R17)', 'Дугуй (225/45R17)', NULL, 'Wheels & Tires', 'Sport sedan tire', 'piece'),
  ('Wheel Rim 16"', 'Дугуйн аяга 16"', NULL, 'Wheels & Tires', '16 inch alloy wheel rim', 'piece'),
  ('Wheel Rim 17"', 'Дугуйн аяга 17"', NULL, 'Wheels & Tires', '17 inch alloy wheel rim', 'piece'),
  ('Wheel Nut Set', 'Дугуйн толгойн багц', NULL, 'Wheels & Tires', 'Wheel lug nut set (20 pcs)', 'set'),
  ('Wheel Cap', 'Дугуйн тогтоош', NULL, 'Wheels & Tires', 'Wheel center cap', 'piece'),
  ('TPMS Sensor', 'Даралтын мэдрэгч', NULL, 'Wheels & Tires', 'Tire pressure monitoring sensor', 'piece'),

  -- Body & Misc
  ('Windshield Wiper Blade (Driver)', 'Шил арчигч (Жолооч)', NULL, 'Body', 'Driver side wiper blade', 'piece'),
  ('Windshield Wiper Blade (Passenger)', 'Шил арчигч (Зорчигч)', NULL, 'Body', 'Passenger side wiper blade', 'piece'),
  ('Side Mirror - Left', 'Толь - Зүүн', NULL, 'Body', 'Left side mirror assembly', 'piece'),
  ('Side Mirror - Right', 'Толь - Баруун', NULL, 'Body', 'Right side mirror assembly', 'piece'),
  ('Door Handle - Front Left', 'Хаалганы бариул - Урд зүүн', NULL, 'Body', 'Front left exterior door handle', 'piece'),
  ('Door Handle - Front Right', 'Хаалганы бариул - Урд баруун', NULL, 'Body', 'Front right exterior door handle', 'piece'),
  ('License Plate Light', 'Регистрийн дугаарын гэрэл', NULL, 'Body', 'License plate illumination light', 'piece'),
  ('Hood Insulation Pad', 'Мотоны дулаалга', NULL, 'Body', 'Under-hood insulation pad', 'piece');


-- ── Global Services ──────────────────────────────────────────
INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  -- Maintenance
  ('Engine Oil Change', 'Газрын тос солих', 'Maintenance', 'Drain old oil, replace filter, refill', 30, 6, 10000),
  ('Oil Filter Replacement', 'Газрын тосны шүүрүүр солих', 'Maintenance', 'Replace engine oil filter', 15, NULL, NULL),
  ('Air Filter Replacement', 'Агаарын шүүрүүр солих', 'Maintenance', 'Replace engine air filter', 10, 12, 15000),
  ('Cabin Air Filter Replacement', 'Салоны шүүрүүр солих', 'Maintenance', 'Replace cabin/pollen filter', 10, 12, 15000),
  ('Coolant Flush & Replace', 'Антифриз солих', 'Maintenance', 'Flush cooling system and refill coolant', 45, 24, 40000),
  ('Transmission Fluid Change', 'Хурдны хайрцагийн тос солих', 'Maintenance', 'Drain and refill transmission fluid', 45, 30, 50000),
  ('Brake Fluid Change', 'Гэмтлийн шингэн солих', 'Maintenance', 'Flush and replace brake fluid', 30, 24, NULL),
  ('Power Steering Fluid Change', 'Удирдлагын тос солих', 'Maintenance', 'Flush and replace power steering fluid', 30, 24, NULL),
  ('Spark Plug Replacement', 'Лаавар солих', 'Maintenance', 'Replace spark plugs (4-cylinder)', 45, 30, 50000),
  ('Serpentine Belt Replacement', 'Бүс солих (поли V)', 'Maintenance', 'Replace drive/serpentine belt', 45, NULL, 60000),
  ('Timing Belt Replacement', 'Цагийн бүс солих', 'Maintenance', 'Replace timing belt + tensioner', 180, NULL, 100000),
  ('Battery Replacement', 'Аккумулятор солих', 'Maintenance', 'Test, remove old, install new battery', 20, NULL, NULL),
  ('Wiper Blade Replacement', 'Шил арчигч солих', 'Maintenance', 'Replace windshield wiper blades', 10, 12, NULL),
  ('Tire Rotation', 'Дугуй эргүүлэх', 'Maintenance', 'Rotate tire positions for even wear', 30, 6, 10000),
  ('Wheel Balancing', 'Дугуй тэнцвэржүүлэх', 'Maintenance', 'Balance wheel assemblies', 30, NULL, NULL),
  ('Wheel Alignment', 'Дугуйн зүү чигжих', 'Maintenance', 'Four-wheel alignment', 60, NULL, 20000),
  ('Coolant Hose Replacement', 'Хөргөлтийн араатан солих', 'Maintenance', 'Replace upper or lower coolant hose', 30, NULL, NULL),

  -- Brakes
  ('Brake Pad Replacement - Front', 'Урд гэмтлийн элээд солих', 'Brakes', 'Replace front brake pads + resurface rotors', 60, NULL, 30000),
  ('Brake Pad Replacement - Rear', 'Арын гэмтлийн элээд солих', 'Brakes', 'Replace rear brake pads + resurface rotors', 60, NULL, 40000),
  ('Brake Rotor Replacement - Front', 'Урд ротор солих', 'Brakes', 'Replace front brake rotors', 60, NULL, 50000),
  ('Brake Rotor Replacement - Rear', 'Арын ротор солих', 'Brakes', 'Replace rear brake rotors', 60, NULL, 60000),
  ('Brake Caliper Replacement', 'Калипер солих', 'Brakes', 'Replace brake caliper assembly', 60, NULL, NULL),
  ('Brake Line Replacement', 'Гэмтлийн хоолой солих', 'Brakes', 'Replace flexible brake hose', 30, NULL, NULL),
  ('Full Brake Service', 'Бүтэн гэмтлийн засвар', 'Brakes', 'Pads, rotors, fluid flush, caliper inspection', 120, NULL, 40000),

  -- Suspension
  ('Shock Absorber Replacement - Front', 'Урд амортизатор солих', 'Suspension', 'Replace front shock absorbers (pair)', 90, NULL, 80000),
  ('Shock Absorber Replacement - Rear', 'Арын амортизатор солих', 'Suspension', 'Replace rear shock absorbers (pair)', 60, NULL, 80000),
  ('Control Arm Replacement', 'Удирдлагын саваа солих', 'Suspension', 'Replace lower control arm', 90, NULL, NULL),
  ('Tie Rod End Replacement', 'Татуургын төгсгөл солих', 'Suspension', 'Replace outer tie rod end', 45, NULL, NULL),
  ('Ball Joint Replacement', 'Бөмбөлөг нугас солих', 'Suspension', 'Replace ball joint', 60, NULL, NULL),
  ('Sway Bar Link Replacement', 'Тэнцвэржүүлэх холбогч солих', 'Suspension', 'Replace stabilizer bar link', 30, NULL, NULL),
  ('Wheel Bearing Replacement', 'Дугуйн угаац солих', 'Suspension', 'Replace wheel hub bearing', 90, NULL, 100000),
  ('Spring Replacement', 'Пүрх солих', 'Suspension', 'Replace coil spring', 60, NULL, NULL),

  -- Diagnostics
  ('Computer Diagnostics', 'Компьютер оношлогоо', 'Diagnostics', 'OBD-II scan + live data analysis', 30, NULL, NULL),
  ('Electrical Diagnostics', 'Цахилгаан оношлогоо', 'Diagnostics', 'Full electrical system diagnosis', 60, NULL, NULL),
  ('AC System Diagnostics', 'Агааржуулалтын оношлогоо', 'Diagnostics', 'AC performance test + leak check', 45, NULL, NULL),
  ('Engine Compression Test', 'Хөдөлгүүрийн шахалтын шалгалт', 'Diagnostics', 'Cylinder compression test', 45, NULL, NULL),
  ('Smoke Test (Vacuum Leak)', 'Утааны шалгалт (Агаар алдалт)', 'Diagnostics', 'Smoke test for vacuum/exhaust leaks', 30, NULL, NULL),

  -- AC Service
  ('AC Gas Refill (R134a)', 'Кондишннер хий (R134a)', 'AC System', 'Vacuum + recharge R134a refrigerant', 45, NULL, NULL),
  ('AC Gas Refill (R1234yf)', 'Кондишннер хий (R1234yf)', 'AC System', 'Vacuum + recharge R1234yf refrigerant', 45, NULL, NULL),
  ('AC Compressor Replacement', 'Компрессор солих', 'AC System', 'Replace AC compressor + recharge', 120, NULL, NULL),
  ('AC Condenser Replacement', 'Конденсор солих', 'AC System', 'Replace AC condenser', 90, NULL, NULL),
  ('AC Evaporator Replacement', 'Буцалуулагч солих', 'AC System', 'Replace AC evaporator (dash removal)', 240, NULL, NULL),

  -- Transmission
  ('Clutch Kit Replacement', 'Мөрийн багц солих', 'Transmission', 'Replace clutch disc, pressure plate, bearing', 240, NULL, 100000),
  ('CV Axle Replacement', 'Хувьсагч тэнцвэржүүлэгч солих', 'Transmission', 'Replace CV axle shaft', 90, NULL, NULL),
  ('Transmission Mount Replacement', 'Хурдны хайрцагийн суурь солих', 'Transmission', 'Replace transmission mount', 60, NULL, NULL),

  -- Electrical
  ('Alternator Replacement', 'Генератор солих', 'Electrical', 'Replace charging alternator', 60, NULL, 150000),
  ('Starter Motor Replacement', 'Эхлүүлэх мотор солих', 'Electrical', 'Replace starter motor', 60, NULL, NULL),
  ('Headlight Replacement', 'Урд гэрэл солих', 'Electrical', 'Replace headlight bulb or assembly', 20, NULL, NULL),
  ('Window Motor Replacement', 'Цонхны мотор солих', 'Electrical', 'Replace power window motor', 45, NULL, NULL),
  ('Door Lock Actuator Replacement', 'Хаалганы түгжээ солих', 'Electrical', 'Replace power door lock actuator', 45, NULL, NULL),

  -- Exhaust
  ('Catalytic Converter Replacement', 'Каталитик шүүр солих', 'Exhaust', 'Replace catalytic converter', 90, NULL, 150000),
  ('Muffler Replacement', 'Дуу чимээ бууруулагч солих', 'Exhaust', 'Replace muffler/silencer', 60, NULL, NULL),
  ('Oxygen Sensor Replacement', 'Хүчилтөрөгчийн мэдрэгч солих', 'Exhaust', 'Replace O2 lambda sensor', 30, NULL, 100000),

  -- Steering
  ('Power Steering Pump Replacement', 'Удирдлагын шахуурга солих', 'Steering', 'Replace power steering pump', 90, NULL, NULL),
  ('Steering Rack Replacement', 'Удирдлагын тросс солих', 'Steering', 'Replace steering rack assembly', 180, NULL, NULL),

  -- Wheels & Tires
  ('Tire Replacement (1)', 'Дугуй солих (1ш)', 'Wheels & Tires', 'Mount and balance one tire', 20, NULL, NULL),
  ('Tire Replacement (4)', 'Дугуй солих (4ш)', 'Wheels & Tires', 'Mount and balance four tires', 60, NULL, NULL),
  ('Flat Tire Repair', 'Дугуйн цоорол засвар', 'Wheels & Tires', 'Patch/plug flat tire repair', 20, NULL, NULL),
  ('TPMS Sensor Programming', 'Даралтын мэдрэгч тохируулах', 'Wheels & Tires', 'Program TPMS sensor', 30, NULL, NULL);
