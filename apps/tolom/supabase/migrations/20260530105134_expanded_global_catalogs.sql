-- ============================================================
-- Expanded global catalogs seed — 500+ parts, 150+ services
-- All entries include proper Mongolian translations.
-- Replaces the old seed data with corrected, production data.
-- ============================================================

-- Replace old data with new comprehensive catalog
DELETE FROM global_parts_vehicle_models;
DELETE FROM global_parts_catalog;
DELETE FROM global_services_catalog;

-- ═══════════════════════════════════════════════════════════════
-- GLOBAL PARTS CATALOG — 500+ parts by category
-- ═══════════════════════════════════════════════════════════════

-- ── Engine — Oil System ───────────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Engine Oil Filter', 'Тосны шүүлтүүр', '90915-YZZN1', 'Engine', 'Standard oil filter for most vehicles', 'piece'),
  ('Premium Oil Filter', 'Өндөр чанарын тосны шүүлтүүр', '90915-YZZD1', 'Engine', 'High-efficiency extended life oil filter', 'piece'),
  ('Oil Drain Plug Gasket', 'Тосны зайлуулагчийн жийргэвч', '90430-Z2025', 'Engine', 'Crush washer for oil drain plug', 'piece'),
  ('Oil Pan', 'Тосны сав', NULL, 'Engine', 'Engine oil sump/pan', 'piece'),
  ('Oil Pan Gasket', 'Тосны савны жийргэвч', NULL, 'Engine', 'Oil pan gasket/seal', 'piece'),
  ('Oil Cooler Assembly', 'Тосны хөргүүр', NULL, 'Engine', 'Engine oil cooler assembly', 'piece'),
  ('Oil Pressure Sensor', 'Тосны даралтын мэдрэгч', '83530-YZZ01', 'Engine', 'Oil pressure sending unit', 'piece'),
  ('Oil Level Sensor', 'Тосны түвшний мэдрэгч', NULL, 'Engine', 'Electronic oil level sensor', 'piece');

-- ── Engine — Air Intake ───────────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Engine Air Filter', 'Хөдөлгүүрийн агаарын шүүлтүүр', '17801-F0010', 'Engine', 'Engine intake air filter', 'piece'),
  ('Sports Air Filter', 'Спорт агаарын шүүлтүүр', NULL, 'Engine', 'High-flow cone air filter', 'piece'),
  ('Intake Hose / Duct', 'Агаарын оролтын шланг', NULL, 'Engine', 'Air intake hose/duct', 'piece'),
  ('Intake Manifold', 'Оролтын коллектор', NULL, 'Engine', 'Intake manifold assembly', 'piece'),
  ('Intake Manifold Gasket', 'Оролтын коллекторын жийргэвч', NULL, 'Engine', 'Intake manifold gasket set', 'set'),
  ('Mass Air Flow Sensor', 'Агаарын урсгалын мэдрэгч', NULL, 'Engine', 'MAF sensor', 'piece'),
  ('MAP Sensor', 'Үнэмлэхүй даралтын мэдрэгч', NULL, 'Engine', 'Manifold absolute pressure sensor', 'piece'),
  ('Throttle Body', 'Тохируулагч хаалт', NULL, 'Engine', 'Throttle body assembly', 'piece'),
  ('Throttle Position Sensor', 'Тохируулагч хаалтын мэдрэгч', NULL, 'Engine', 'TP sensor', 'piece'),
  ('Idle Air Control Valve', 'Тэнцвэрийн агаарын тохируулагч', NULL, 'Engine', 'IAC valve', 'piece');

-- ── Engine — Ignition ─────────────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Spark Plug Set (4) — Iridium', 'Очлуур багц (4ш) — Иридиум', NULL, 'Engine', 'Iridium spark plugs, set of 4', 'set'),
  ('Spark Plug Set (6) — Iridium', 'Очлуур багц (6ш) — Иридиум', NULL, 'Engine', 'Iridium spark plugs, set of 6', 'set'),
  ('Spark Plug Set (4) — Platinum', 'Очлуур багц (4ш) — Платинум', NULL, 'Engine', 'Platinum spark plugs, set of 4', 'set'),
  ('Spark Plug Set (6) — Platinum', 'Очлуур багц (6ш) — Платинум', NULL, 'Engine', 'Platinum spark plugs, set of 6', 'set'),
  ('Spark Plug Set (4) — Standard', 'Очлуур багц (4ш) — Стандарт', NULL, 'Engine', 'Copper spark plugs, set of 4', 'set'),
  ('Ignition Coil', 'Очлуурны ороомог', NULL, 'Engine', 'Single ignition coil pack', 'piece'),
  ('Ignition Coil Set (4)', 'Очлуурны ороомог багц (4ш)', NULL, 'Engine', 'Set of 4 ignition coils', 'set'),
  ('Ignition Coil Set (6)', 'Очлуурны ороомог багц (6ш)', NULL, 'Engine', 'Set of 6 ignition coils', 'set'),
  ('Distributor Cap', 'Дистрибьюторын таг', NULL, 'Engine', 'Distributor cap', 'piece'),
  ('Distributor Rotor', 'Дистрибьюторын ротор', NULL, 'Engine', 'Distributor rotor', 'piece'),
  ('Spark Plug Wire Set', 'Очлуурны утас багц', NULL, 'Engine', 'Ignition wire set', 'set');

-- ── Engine — Valvetrain ───────────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Valve Cover Gasket Set', 'Хавхлагын тагны жийргэвч багц', NULL, 'Engine', 'Valve cover gasket set', 'set'),
  ('Valve Stem Seal Set', 'Хавхлагын чигжээс багц', NULL, 'Engine', 'Valve stem oil seals set', 'set'),
  ('Hydraulic Lifter / Tappet', 'Гидравлик өргөгч', NULL, 'Engine', 'Hydraulic valve lifter (1pc)', 'piece'),
  ('Camshaft Position Sensor', 'Камфентрийн байрлалын мэдрэгч', NULL, 'Engine', 'CMP sensor', 'piece'),
  ('Timing Belt', 'Цагийн бүс', NULL, 'Engine', 'Camshaft timing belt', 'piece'),
  ('Timing Belt Kit', 'Цагийн бүс иж бүрдэл', NULL, 'Engine', 'Timing belt + tensioner + idler', 'set'),
  ('Timing Chain', 'Цагийн гинж', NULL, 'Engine', 'Camshaft timing chain', 'piece'),
  ('Timing Chain Guide', 'Цагийн гинжний чиглүүлэгч', NULL, 'Engine', 'Timing chain guide rail', 'piece'),
  ('Timing Chain Tensioner', 'Цагийн гинжний чангалагч', NULL, 'Engine', 'Timing chain tensioner', 'piece'),
  ('Camshaft Sprocket', 'Камфентрийн араа', NULL, 'Engine', 'Camshaft timing sprocket', 'piece'),
  ('Crankshaft Sprocket', 'Тахир голын араа', NULL, 'Engine', 'Crankshaft timing sprocket', 'piece'),
  ('Serpentine Belt', 'Поли V бүс', NULL, 'Engine', 'Drive/serpentine belt', 'piece'),
  ('Accessory Belt Tensioner', 'Бүсний чангалагч', NULL, 'Engine', 'Belt tensioner assembly', 'piece'),
  ('Drive Belt Idler Pulley', 'Бүсний чангалагч дамар', NULL, 'Engine', 'Belt idler pulley', 'piece');

-- ── Engine — Cooling System ───────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Water Pump', 'Усны шахуурга', NULL, 'Engine', 'Engine coolant water pump', 'piece'),
  ('Water Pump Gasket', 'Усны шахуургын жийргэвч', NULL, 'Engine', 'Water pump gasket', 'piece'),
  ('Thermostat (82°C)', 'Термостат (82°C)', NULL, 'Engine', 'Engine coolant thermostat 82°C', 'piece'),
  ('Thermostat (88°C)', 'Термостат (88°C)', NULL, 'Engine', 'Engine coolant thermostat 88°C', 'piece'),
  ('Thermostat Housing', 'Термостатын суудал', NULL, 'Engine', 'Thermostat housing assembly', 'piece'),
  ('Coolant Temperature Sensor', 'Хөргөлтийн шингэний температурын мэдрэгч', NULL, 'Engine', 'ECT sensor', 'piece'),
  ('Radiator', 'Радиатор', NULL, 'Engine', 'Engine cooling radiator', 'piece'),
  ('Radiator Cap (1.1 bar)', 'Радиаторын таг (1.1 бар)', NULL, 'Engine', 'Radiator cap 1.1 bar', 'piece'),
  ('Radiator Cap (1.3 bar)', 'Радиаторын таг (1.3 бар)', NULL, 'Engine', 'Radiator cap 1.3 bar', 'piece'),
  ('Radiator Fan Motor', 'Радиаторын сэнсний мотор', NULL, 'Engine', 'Cooling fan motor', 'piece'),
  ('Radiator Fan Shroud', 'Радиаторын сэнсний бүрхүүл', NULL, 'Engine', 'Fan shroud', 'piece'),
  ('Coolant Hose — Upper', 'Хөргөлтийн шланг — Дээд', NULL, 'Engine', 'Upper radiator hose', 'piece'),
  ('Coolant Hose — Lower', 'Хөргөлтийн шланг — Доод', NULL, 'Engine', 'Lower radiator hose', 'piece'),
  ('Heater Hose', 'Халаагуурын шланг', NULL, 'Engine', 'Heater core inlet/outlet hose', 'piece'),
  ('Water Outlet / Neck', 'Усны гаргалт', NULL, 'Engine', 'Water outlet neck', 'piece');

-- ── Engine — Fuel System ──────────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Fuel Filter', 'Түлшний шүүлтүүр', '23300-YZZ01', 'Engine', 'Fuel line filter', 'piece'),
  ('Fuel Pump Assembly', 'Түлшний шахуурга', '23220-YZZ01', 'Engine', 'Fuel pump with sender unit', 'piece'),
  ('Fuel Pump', 'Түлшний шахуурга (зөвхөн)', NULL, 'Engine', 'Fuel pump only', 'piece'),
  ('Fuel Injector (1pc)', 'Түлшний цацагч (1ш)', NULL, 'Engine', 'Fuel injector', 'piece'),
  ('Fuel Injector Set (4)', 'Түлшний цацагч багц (4ш)', NULL, 'Engine', 'Set of 4 fuel injectors', 'set'),
  ('Fuel Injector Set (6)', 'Түлшний цацагч багц (6ш)', NULL, 'Engine', 'Set of 6 fuel injectors', 'set'),
  ('Fuel Pressure Regulator', 'Түлшний даралт тохируулагч', NULL, 'Engine', 'Fuel rail pressure regulator', 'piece'),
  ('Fuel Rail', 'Түлшний коллектор', NULL, 'Engine', 'Fuel rail assembly', 'piece'),
  ('Fuel Cap', 'Түлшний таг', NULL, 'Engine', 'Gas/fuel cap', 'piece'),
  ('Fuel Hose', 'Түлшний шланг', NULL, 'Engine', 'Fuel line hose', 'meter'),
  ('EVAP Purge Valve', 'EVAP цэвэрлэгч хавхлага', NULL, 'Engine', 'Evaporative emission purge valve', 'piece'),
  ('EVAP Canister', 'EVAP сав', NULL, 'Engine', 'Charcoal canister', 'piece');

-- ── Engine — Gaskets & Seals ──────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Head Gasket Set', 'Цилиндрийн толгойн жийргэвч багц', NULL, 'Engine', 'Complete head gasket set', 'set'),
  ('Head Gasket (Single)', 'Цилиндрийн толгойн жийргэвч (1ш)', NULL, 'Engine', 'Single head gasket', 'piece'),
  ('Exhaust Manifold Gasket', 'Угаарын коллекторын жийргэвч', NULL, 'Engine', 'Exhaust manifold gasket', 'piece'),
  ('Exhaust Manifold', 'Угаарын коллектор', NULL, 'Engine', 'Exhaust manifold', 'piece'),
  ('Front Crankshaft Seal', 'Тахир голын урд чигжээс', NULL, 'Engine', 'Front main seal', 'piece'),
  ('Rear Main Seal', 'Тахир голын хойд чигжээс', NULL, 'Engine', 'Rear main seal', 'piece'),
  ('Camshaft Seal', 'Камфентрийн чигжээс', NULL, 'Engine', 'Camshaft oil seal', 'piece');

-- ── Engine — Sensors & Management ─────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Oxygen Sensor — Upstream', 'Хүчилтөрөгчийн мэдрэгч — Дээд', NULL, 'Engine', 'Upstream O2/lambda sensor', 'piece'),
  ('Oxygen Sensor — Downstream', 'Хүчилтөрөгчийн мэдрэгч — Доод', NULL, 'Engine', 'Downstream O2/lambda sensor', 'piece'),
  ('Crankshaft Position Sensor', 'Тахир голын байрлалын мэдрэгч', NULL, 'Engine', 'CKP sensor', 'piece'),
  ('Knock Sensor', 'Тогших мэдрэгч', NULL, 'Engine', 'Engine knock/detonation sensor', 'piece'),
  ('EGR Valve', 'EGR хавхлага', NULL, 'Engine', 'Exhaust gas recirculation valve', 'piece'),
  ('PCV Valve', 'PCV хавхлага', NULL, 'Engine', 'Positive crankcase ventilation valve', 'piece'),
  ('EGR Cooler', 'EGR хөргүүр', NULL, 'Engine', 'EGR cooler assembly', 'piece'),
  ('Turbocharger Assembly', 'Турбо цэнэглэгч', NULL, 'Engine', 'Turbocharger complete unit', 'piece'),
  ('Engine Oil Cooler', 'Хөдөлгүүрийн тос хөргүүр', NULL, 'Engine', 'Engine oil cooler assembly', 'piece'),
  ('Oil Cooler Line Kit', 'Тосны хөргүүрийн шланг багц', NULL, 'Engine', 'Oil cooler hose/line set', 'set'),
  ('Intake Air Temperature Sensor', 'Агаарын температурын мэдрэгч', NULL, 'Engine', 'IAT sensor', 'piece'),
  ('Variable Valve Timing Solenoid', 'VVT соленоид', NULL, 'Engine', 'Variable valve timing control solenoid', 'piece'),
  ('Oil Pressure Switch', 'Тосны даралтын унтраалга', NULL, 'Engine', 'Oil pressure switch (on/off)', 'piece'),
  ('Crankshaft Harmonic Balancer', 'Тахир голын чичиргээ дампуулагч', NULL, 'Engine', 'Crankshaft pulley/damper', 'piece'),
  ('Camshaft Position Actuator', 'Камфентрийн байрлал тохируулагч', NULL, 'Engine', 'Variable cam timing actuator', 'piece'),
  ('Direct Injection High-Pressure Pump', 'Шууд шахалтын насос', NULL, 'Engine', 'High-pressure fuel pump (GDI)', 'piece'),
  ('Turbo Oil Feed Line', 'Турбогийн тосны шланг', NULL, 'Engine', 'Turbocharger oil feed line', 'piece'),
  ('Wastegate Actuator', 'Хаягын тохируулагч', NULL, 'Engine', 'Turbo wastegate actuator', 'piece'),
  ('Boost Pressure Sensor', 'Өгөгдсөн даралтын мэдрэгч', NULL, 'Engine', 'Turbo boost sensor', 'piece'),
  ('Vacuum Hose Set', 'Вакуум шланг багц', NULL, 'Engine', 'Assorted vacuum lines', 'set'),
  ('Engine Wire Harness', 'Хөдөлгүүрийн утасны бүрдэл', NULL, 'Engine', 'Engine wiring harness', 'piece'),
  ('Engine Mount — Front', 'Хөдөлгүүрийн суурь — Урд', '12305-YZZ01', 'Engine', 'Front engine mount', 'piece'),
  ('Engine Mount — Rear', 'Хөдөлгүүрийн суурь — Арын', NULL, 'Engine', 'Rear engine mount', 'piece'),
  ('Engine Mount — Left', 'Хөдөлгүүрийн суурь — Зүүн', NULL, 'Engine', 'Left engine mount', 'piece'),
  ('Engine Mount — Right', 'Хөдөлгүүрийн суурь — Баруун', NULL, 'Engine', 'Right engine mount', 'piece'),
  ('Transmission Mount', 'Дамжуулагчийн суурь', NULL, 'Engine', 'Transmission support mount', 'piece'),
  ('Torque Strut Mount', 'Эргүүлэх моментийн суурь', NULL, 'Engine', 'Torque strut/dogbone mount', 'piece');

-- ── Brakes — Pads ─────────────────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Brake Pads — Front (Economy)', 'Тоормосны дэвсгэр — Урд (Энгийн)', '04465-YZZAG', 'Brakes', 'Standard front brake pad set', 'set'),
  ('Brake Pads — Front (Ceramic)', 'Тоормосны дэвсгэр — Урд (Керамик)', NULL, 'Brakes', 'Ceramic front brake pad set, low dust', 'set'),
  ('Brake Pads — Front (Premium)', 'Тоормосны дэвсгэр — Урд (Өндөр чанар)', NULL, 'Brakes', 'Premium semi-metallic front pads', 'set'),
  ('Brake Pads — Rear (Economy)', 'Тоормосны дэвсгэр — Арын (Энгийн)', '04466-YZZAK', 'Brakes', 'Standard rear brake pad set', 'set'),
  ('Brake Pads — Rear (Ceramic)', 'Тоормосны дэвсгэр — Арын (Керамик)', NULL, 'Brakes', 'Ceramic rear brake pad set', 'set'),
  ('Brake Pads — Rear (Premium)', 'Тоормосны дэвсгэр — Арын (Өндөр чанар)', NULL, 'Brakes', 'Premium rear brake pad set', 'set');

-- ── Brakes — Rotors ───────────────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Brake Rotor — Front (Standard)', 'Тоормосны диск — Урд (Энгийн)', '43512-YZZ11', 'Brakes', 'Front standard brake disc/rotor', 'piece'),
  ('Brake Rotor — Front (Drilled)', 'Тоормосны диск — Урд (Цоолбор)', NULL, 'Brakes', 'Front drilled brake rotor', 'piece'),
  ('Brake Rotor — Front (Slotted)', 'Тоормосны диск — Урд (Ховил)', NULL, 'Brakes', 'Front slotted brake rotor', 'piece'),
  ('Brake Rotor — Rear (Standard)', 'Тоормосны диск — Арын (Энгийн)', '42431-YZZ12', 'Brakes', 'Rear standard brake disc/rotor', 'piece'),
  ('Brake Rotor — Rear (Drilled)', 'Тоормосны диск — Арын (Цоолбор)', NULL, 'Brakes', 'Rear drilled brake rotor', 'piece'),
  ('Brake Rotor — Rear (Slotted)', 'Тоормосны диск — Арын (Ховил)', NULL, 'Brakes', 'Rear slotted brake rotor', 'piece'),
  ('Brake Drum — Rear', 'Тоормосны бөмбөр — Арын', NULL, 'Brakes', 'Rear brake drum', 'piece'),
  ('Brake Shoe Set — Rear', 'Тоормосны дотор дэвсгэр багц — Арын', NULL, 'Brakes', 'Rear brake shoe set', 'set');

-- ── Brakes — Calipers ─────────────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Brake Caliper — Front Left', 'Тоормосны калипер — Урд зүүн', NULL, 'Brakes', 'Front left brake caliper', 'piece'),
  ('Brake Caliper — Front Right', 'Тоормосны калипер — Урд баруун', NULL, 'Brakes', 'Front right brake caliper', 'piece'),
  ('Brake Caliper — Rear Left', 'Тоормосны калипер — Арын зүүн', NULL, 'Brakes', 'Rear left brake caliper', 'piece'),
  ('Brake Caliper — Rear Right', 'Тоормосны калипер — Арын баруун', NULL, 'Brakes', 'Rear right brake caliper', 'piece'),
  ('Brake Caliper Bracket — Front', 'Тоормосны калиперын бэхэлгээ — Урд', NULL, 'Brakes', 'Front caliper bracket', 'piece'),
  ('Brake Caliper Bracket — Rear', 'Тоормосны калиперын бэхэлгээ — Арын', NULL, 'Brakes', 'Rear caliper bracket', 'piece');

-- ── Brakes — Hydraulics & Lines ───────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Brake Master Cylinder', 'Тоормосны үндсэн шахуурга', NULL, 'Brakes', 'Brake master cylinder assembly', 'piece'),
  ('Brake Booster', 'Тоормосны өсгөгч', NULL, 'Brakes', 'Brake vacuum booster', 'piece'),
  ('Brake Proportioning Valve', 'Тоормосны хуваарилах хавхлага', NULL, 'Brakes', 'Brake pressure proportioning valve', 'piece'),
  ('ABS Sensor — Front', 'ABS мэдрэгч — Урд', NULL, 'Brakes', 'Front ABS wheel speed sensor', 'piece'),
  ('ABS Sensor — Rear', 'ABS мэдрэгч — Арын', NULL, 'Brakes', 'Rear ABS wheel speed sensor', 'piece'),
  ('ABS Pump Module', 'ABS насос модуль', NULL, 'Brakes', 'ABS pump / hydraulic unit', 'piece'),
  ('Brake Hose — Front', 'Тоормосны шланг — Урд', NULL, 'Brakes', 'Front flexible brake hose', 'piece'),
  ('Brake Hose — Rear', 'Тоормосны шланг — Арын', NULL, 'Brakes', 'Rear flexible brake hose', 'piece'),
  ('Brake Line — Hard Pipe', 'Тоормосны хоолой — Хатуу', NULL, 'Brakes', 'Metal brake line pipe', 'piece'),
  ('Parking Brake Cable — Front', 'Зогсоолын тоормосны утас — Урд', NULL, 'Brakes', 'Front parking brake cable', 'piece'),
  ('Parking Brake Cable — Rear', 'Зогсоолын тоормосны утас — Арын', NULL, 'Brakes', 'Rear parking brake cable', 'piece'),
  ('Parking Brake Shoe Kit', 'Зогсоолын тоормосны дэвсгэр багц', NULL, 'Brakes', 'Parking brake shoe set with hardware', 'set');

-- ── Brakes — Hardware ─────────────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Brake Pad Clip Kit — Front', 'Тоормосны дэвсгэрийн хавчаар — Урд', NULL, 'Brakes', 'Front brake pad retention clips', 'set'),
  ('Brake Pad Clip Kit — Rear', 'Тоормосны дэвсгэрийн хавчаар — Арын', NULL, 'Brakes', 'Rear brake pad retention clips', 'set'),
  ('Brake Caliper Bolt Kit', 'Тоормосны калиперын боолт багц', NULL, 'Brakes', 'Caliper mounting bolt set', 'set'),
  ('Brake Grease / Anti-squeal', 'Тоормосны тос / Дуугүй болгогч', NULL, 'Brakes', 'Brake lubricant and anti-squeal compound', 'piece');

-- ── Suspension — Shocks & Struts ──────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Shock Absorber — Front', 'Амортизатор — Урд', NULL, 'Suspension', 'Front shock absorber', 'piece'),
  ('Shock Absorber — Rear', 'Амортизатор — Арын', NULL, 'Suspension', 'Rear shock absorber', 'piece'),
  ('Shock Absorber — Front (Gas)', 'Амортизатор — Урд (Хий)', NULL, 'Suspension', 'Gas-charged front shock', 'piece'),
  ('Shock Absorber — Rear (Gas)', 'Амортизатор — Арын (Хий)', NULL, 'Suspension', 'Gas-charged rear shock', 'piece'),
  ('Strut Assembly — Front (Complete)', 'Струт угсрагдал — Урд (Бүрэн)', NULL, 'Suspension', 'Complete front strut with spring', 'piece'),
  ('Strut Mount — Front', 'Струтын суурь — Урд', NULL, 'Suspension', 'Front strut mount', 'piece'),
  ('Strut Bearing — Front', 'Струтын холхивч — Урд', NULL, 'Suspension', 'Front strut bearing/seat', 'piece'),
  ('Strut Boot / Bellow', 'Струтын бүрээс', NULL, 'Suspension', 'Strut dust boot/bellow', 'piece'),
  ('Strut Assembly — Rear (Complete)', 'Струт угсрагдал — Арын (Бүрэн)', NULL, 'Suspension', 'Complete rear strut with spring', 'piece'),
  ('Strut Mount — Rear', 'Струтын суурь — Арын', NULL, 'Suspension', 'Rear strut mount', 'piece');

-- ── Suspension — Springs & Air ────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Coil Spring — Front', 'Пүрх — Урд', NULL, 'Suspension', 'Front coil spring', 'piece'),
  ('Coil Spring — Rear', 'Пүрх — Арын', NULL, 'Suspension', 'Rear coil spring', 'piece'),
  ('Lowering Spring Set', 'Багасгасан пүрх багц', NULL, 'Suspension', 'Lowering spring set (4)', 'set'),
  ('Air Spring — Rear', 'Агаарын пүрх — Арын', NULL, 'Suspension', 'Rear air suspension bag', 'piece'),
  ('Air Suspension Compressor', 'Агаарын түдгэлзүүрийн компрессор', NULL, 'Suspension', 'Air suspension pump/compressor', 'piece'),
  ('Air Suspension Valve Block', 'Агаарын түдгэлзүүрийн хавхлаг блок', NULL, 'Suspension', 'Air suspension valve assembly', 'piece');

-- ── Suspension — Control Arms & Joints ────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Control Arm — Front Lower (Left)', 'Удирдлагын гар — Урд доод (Зүүн)', '48069-YZZ01', 'Suspension', 'Front left lower control arm', 'piece'),
  ('Control Arm — Front Lower (Right)', 'Удирдлагын гар — Урд доод (Баруун)', '48070-YZZ01', 'Suspension', 'Front right lower control arm', 'piece'),
  ('Control Arm — Rear Lower', 'Удирдлагын гар — Арын доод', NULL, 'Suspension', 'Rear lower control arm', 'piece'),
  ('Control Arm — Upper', 'Удирдлагын гар — Дээд', NULL, 'Suspension', 'Upper control arm', 'piece'),
  ('Trailing Arm', 'Сүүлэг гар', NULL, 'Suspension', 'Trailing arm assembly', 'piece'),
  ('Ball Joint — Front Lower (Left)', 'Бөмбөлөг нугас — Урд доод (Зүүн)', '43330-YZZ01', 'Suspension', 'Front left lower ball joint', 'piece'),
  ('Ball Joint — Front Lower (Right)', 'Бөмбөлөг нугас — Урд доод (Баруун)', NULL, 'Suspension', 'Front right lower ball joint', 'piece'),
  ('Ball Joint — Front Upper', 'Бөмбөлөг нугас — Урд дээд', NULL, 'Suspension', 'Front upper ball joint', 'piece'),
  ('Ball Joint — Rear', 'Бөмбөлөг нугас — Арын', NULL, 'Suspension', 'Rear ball joint', 'piece');

-- ── Suspension — Tie Rods & Steering Links ────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Tie Rod End — Outer (Left)', 'Татуургын төгсгөл — Гадна (Зүүн)', NULL, 'Suspension', 'Left outer tie rod end', 'piece'),
  ('Tie Rod End — Outer (Right)', 'Татуургын төгсгөл — Гадна (Баруун)', NULL, 'Suspension', 'Right outer tie rod end', 'piece'),
  ('Tie Rod End — Inner (Left)', 'Татуургын төгсгөл — Дотор (Зүүн)', NULL, 'Suspension', 'Left inner tie rod end', 'piece'),
  ('Tie Rod End — Inner (Right)', 'Татуургын төгсгөл — Дотор (Баруун)', NULL, 'Suspension', 'Right inner tie rod end', 'piece'),
  ('Tie Rod Assembly — Left', 'Татуурга — Зүүн', NULL, 'Suspension', 'Left complete tie rod assembly', 'piece'),
  ('Tie Rod Assembly — Right', 'Татуурга — Баруун', NULL, 'Suspension', 'Right complete tie rod assembly', 'piece');

-- ── Suspension — Bushings & Stabilizer ────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Control Arm Bushing Set', 'Удирдлагын гарны сайлентблок багц', NULL, 'Suspension', 'Control arm bushing set (2 pcs)', 'set'),
  ('Sway Bar Bushing Set', 'Тэнцвэржүүлэгч сайлентблок багц', NULL, 'Suspension', 'Sway bar bushing set', 'set'),
  ('Strut Mount Bushing', 'Струтын суурийн сайлентблок', NULL, 'Suspension', 'Strut mount bushing', 'piece'),
  ('Trailing Arm Bushing', 'Сүүлэг гарны сайлентблок', NULL, 'Suspension', 'Trailing arm bushing', 'piece'),
  ('Sway Bar Link — Front (Left)', 'Тэнцвэржүүлэгч холбогч — Урд (Зүүн)', NULL, 'Suspension', 'Front left sway bar link', 'piece'),
  ('Sway Bar Link — Front (Right)', 'Тэнцвэржүүлэгч холбогч — Урд (Баруун)', NULL, 'Suspension', 'Front right sway bar link', 'piece'),
  ('Sway Bar Link — Rear', 'Тэнцвэржүүлэгч холбогч — Арын', NULL, 'Suspension', 'Rear sway bar link', 'piece'),
  ('Sway Bar — Front', 'Тэнцвэржүүлэгч — Урд', NULL, 'Suspension', 'Front sway bar', 'piece'),
  ('Sway Bar — Rear', 'Тэнцвэржүүлэгч — Арын', NULL, 'Suspension', 'Rear sway bar', 'piece');

-- ── Suspension — Wheel Bearings ───────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Wheel Bearing — Front', 'Дугуйн холхивч — Урд', NULL, 'Suspension', 'Front wheel bearing', 'piece'),
  ('Wheel Bearing — Rear', 'Дугуйн холхивч — Арын', NULL, 'Suspension', 'Rear wheel bearing', 'piece'),
  ('Wheel Hub Assembly — Front', 'Дугуйн аяга — Урд', NULL, 'Suspension', 'Front wheel hub with bearing', 'piece'),
  ('Wheel Hub Assembly — Rear', 'Дугуйн аяга — Арын', NULL, 'Suspension', 'Rear wheel hub with bearing', 'piece'),
  ('Coilover / Lowering Kit', 'Коилполвер (буулгасан багц)', NULL, 'Suspension', 'Full coilover suspension kit', 'set'),
  ('Camber Adjustment Kit', 'Камбер тохируулгын багц', NULL, 'Suspension', 'Camber adjustment bolt/bushing kit', 'set'),
  ('Subframe Bushing', 'Дэд хүрээний сайлентблок', NULL, 'Suspension', 'Subframe mount bushing', 'piece');

-- ── Steering ──────────────────────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Power Steering Pump', 'Удирдлагын шахуурга', NULL, 'Steering', 'Power steering pump', 'piece'),
  ('Power Steering Pump Pulley', 'Удирдлагын шахуургын дамар', NULL, 'Steering', 'PS pump pulley', 'piece'),
  ('Steering Rack', 'Удирдлагын тросс', NULL, 'Steering', 'Steering rack assembly', 'piece'),
  ('Steering Rack — Rebuilt', 'Удирдлагын тросс — Шинэчлэгдсэн', NULL, 'Steering', 'Rebuilt steering rack with seals', 'piece'),
  ('Steering Gearbox', 'Удирдлагын хурдны хайрцаг', NULL, 'Steering', 'Steering gearbox (truck/SUV)', 'piece'),
  ('Power Steering Cooler', 'Удирдлагын тосны хөргүүр', NULL, 'Steering', 'PS cooler/radiator', 'piece'),
  ('Power Steering Reservoir', 'Удирдлагын тосны сав', NULL, 'Steering', 'PS fluid reservoir', 'piece'),
  ('Power Steering Hose — Pressure', 'Удирдлагын шланг — Даралт', NULL, 'Steering', 'High pressure PS hose', 'piece'),
  ('Power Steering Hose — Return', 'Удирдлагын шланг — Буцах', NULL, 'Steering', 'Low pressure PS return hose', 'piece'),
  ('EPS Control Module', 'EPS хяналтын модуль', NULL, 'Steering', 'Electric power steering control module', 'piece'),
  ('Steering Column', 'Удирдлагын багана', NULL, 'Steering', 'Steering column assembly', 'piece'),
  ('Steering Column Joint', 'Удирдлагын баганын холбоос', NULL, 'Steering', 'Steering coupler/universal joint', 'piece'),
  ('Clock Spring', 'Клок спринг', NULL, 'Steering', 'Steering wheel clock spring', 'piece'),
  ('Steering Angle Sensor', 'Жолооны өнцгийн мэдрэгч', NULL, 'Steering', 'Steering angle sensor', 'piece'),
  ('Steering Knuckle — Left', 'Жолооны нугас — Зүүн', NULL, 'Steering', 'Left steering knuckle', 'piece'),
  ('Steering Knuckle — Right', 'Жолооны нугас — Баруун', NULL, 'Steering', 'Right steering knuckle', 'piece');

-- ── Electrical — Battery & Charging ───────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Battery 45Ah', 'Аккумулятор 45Ah', NULL, 'Electrical', '12V 45Ah lead-acid battery', 'piece'),
  ('Battery 55Ah', 'Аккумулятор 55Ah', NULL, 'Electrical', '12V 55Ah lead-acid battery', 'piece'),
  ('Battery 65Ah', 'Аккумулятор 65Ah', NULL, 'Electrical', '12V 65Ah lead-acid battery', 'piece'),
  ('Battery 75Ah', 'Аккумулятор 75Ah', NULL, 'Electrical', '12V 75Ah lead-acid battery', 'piece'),
  ('Battery 100Ah', 'Аккумулятор 100Ah', NULL, 'Electrical', '12V 100Ah heavy duty battery', 'piece'),
  ('Battery Terminal Set', 'Аккумуляторын терминал багц', NULL, 'Electrical', 'Battery terminal connectors', 'set'),
  ('Battery Hold-down', 'Аккумуляторын бэхэлгээ', NULL, 'Electrical', 'Battery clamp/frame', 'piece'),
  ('Battery Cable — Positive', 'Аккумуляторын утас — Эерэг', NULL, 'Electrical', 'Positive battery cable', 'piece'),
  ('Battery Cable — Negative', 'Аккумуляторын утас — Сөрөг', NULL, 'Electrical', 'Negative battery cable', 'piece'),
  ('Ground Strap', 'Газрын холбоос', NULL, 'Electrical', 'Engine/chassis ground strap', 'piece'),
  ('Alternator (90A)', 'Генератор (90A)', '27060-YZZ01', 'Electrical', '90 Amp charging alternator', 'piece'),
  ('Alternator (120A)', 'Генератор (120A)', NULL, 'Electrical', '120 Amp charging alternator', 'piece'),
  ('Alternator (150A)', 'Генератор (150A)', NULL, 'Electrical', '150 Amp high-output alternator', 'piece'),
  ('Alternator Pulley', 'Генераторын дамар', NULL, 'Electrical', 'Alternator pulley (OAP)', 'piece'),
  ('Alternator Voltage Regulator', 'Генераторын хүчдэл тохируулагч', NULL, 'Electrical', 'Internal voltage regulator', 'piece'),
  ('Starter Motor', 'Эхлүүлэгч мотор', NULL, 'Electrical', 'Starter motor', 'piece'),
  ('Starter Solenoid', 'Эхлүүлэгчийн соленоид', NULL, 'Electrical', 'Starter solenoid', 'piece'),
  ('Starter Relay', 'Эхлүүлэгчийн реле', NULL, 'Electrical', 'Starter relay/switch', 'piece');

-- ── Electrical — Motors & Actuators ───────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Window Motor — Front Left', 'Цонхны мотор — Урд зүүн', NULL, 'Electrical', 'Front left power window motor', 'piece'),
  ('Window Motor — Front Right', 'Цонхны мотор — Урд баруун', NULL, 'Electrical', 'Front right power window motor', 'piece'),
  ('Window Motor — Rear Left', 'Цонхны мотор — Арын зүүн', NULL, 'Electrical', 'Rear left power window motor', 'piece'),
  ('Window Motor — Rear Right', 'Цонхны мотор — Арын баруун', NULL, 'Electrical', 'Rear right power window motor', 'piece'),
  ('Door Lock Actuator — Front Left', 'Хаалганы түгжээ — Урд зүүн', NULL, 'Electrical', 'Front left door lock actuator', 'piece'),
  ('Door Lock Actuator — Front Right', 'Хаалганы түгжээ — Урд баруун', NULL, 'Electrical', 'Front right door lock actuator', 'piece'),
  ('Door Lock Actuator — Rear Left', 'Хаалганы түгжээ — Арын зүүн', NULL, 'Electrical', 'Rear left door lock actuator', 'piece'),
  ('Door Lock Actuator — Rear Right', 'Хаалганы түгжээ — Арын баруун', NULL, 'Electrical', 'Rear right door lock actuator', 'piece'),
  ('Wiper Motor — Front', 'Арчигчийн мотор — Урд', NULL, 'Electrical', 'Front windshield wiper motor', 'piece'),
  ('Wiper Motor — Rear', 'Арчигчийн мотор — Арын', NULL, 'Electrical', 'Rear windshield wiper motor', 'piece'),
  ('Sunroof Motor', 'Нарны халхлагчийн мотор', NULL, 'Electrical', 'Sunroof/moonroof motor', 'piece'),
  ('Heater Blower Motor', 'Халаагуурын сэнсний мотор', NULL, 'Electrical', 'HVAC blower motor', 'piece'),
  ('Blower Motor Resistor', 'Сэнсний резистор', NULL, 'Electrical', 'Blower motor resistor / module', 'piece'),
  ('Cooling Fan Motor', 'Хөргөлтийн сэнсний мотор', NULL, 'Electrical', 'Radiator/condenser fan motor', 'piece'),
  ('Mirror Motor', 'Толины мотор', NULL, 'Electrical', 'Side mirror adjustment motor', 'piece');

-- ── Electrical — Relays & Fuses ──────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Main Relay (EFI)', 'Үндсэн реле (EFI)', NULL, 'Electrical', 'EFI main relay', 'piece'),
  ('Fuel Pump Relay', 'Түлшний шахуургын реле', NULL, 'Electrical', 'Fuel pump relay', 'piece'),
  ('AC Relay', 'Кондишннер реле', NULL, 'Electrical', 'AC compressor relay', 'piece'),
  ('Radiator Fan Relay', 'Сэнсний реле', NULL, 'Electrical', 'Radiator fan relay', 'piece'),
  ('ABS Relay', 'ABS реле', NULL, 'Electrical', 'ABS system relay', 'piece'),
  ('Starter Cut Relay', 'Эхлүүлэгчийг таслах реле', NULL, 'Electrical', 'Starter cut relay', 'piece'),
  ('Horn Relay', 'Эвэр/сигналын реле', NULL, 'Electrical', 'Horn relay', 'piece'),
  ('Fuse Box — Engine Compartment', 'Гал хамгаалагчийн хайрцаг — Хөдөлгүүр', NULL, 'Electrical', 'Engine compartment fuse box', 'piece'),
  ('Fuse Box — Cabin', 'Гал хамгаалагчийн хайрцаг — Савлон', NULL, 'Electrical', 'Interior/cabin fuse box', 'piece'),
  ('Mini Fuse Assortment', 'Мини гал хамгаалагч багц', NULL, 'Electrical', 'Assorted mini blade fuse kit', 'set'),
  ('MAXI Fuse Assortment', 'Макси гал хамгаалагч багц', NULL, 'Electrical', 'Assorted MAXI fuse kit', 'set'),
  ('Relay Assortment Kit', 'Реле багц', NULL, 'Electrical', 'Set of common automotive relays', 'set');

-- ── Electrical — Switches & Sensors ───────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Ignition Switch', 'Гал асаах унтраалга', NULL, 'Electrical', 'Ignition switch assembly', 'piece'),
  ('Power Window Switch — Driver', 'Цонхны унтраалга — Жолооч', NULL, 'Electrical', 'Driver side master window switch', 'piece'),
  ('Power Window Switch — Passenger', 'Цонхны унтраалга — Зорчигч', NULL, 'Electrical', 'Passenger window switch', 'piece'),
  ('Light Switch / Combination Switch', 'Гэрлийн унтраалга', NULL, 'Electrical', 'Headlight/turn signal combo switch', 'piece'),
  ('Wiper Switch', 'Арчигчийн унтраалга', NULL, 'Electrical', 'Wiper speed/interval switch', 'piece'),
  ('Hazard Switch', 'Аюултай дохионы унтраалга', NULL, 'Electrical', 'Hazard light switch', 'piece'),
  ('Brake Light Switch', 'Тоормосны гэрлийн унтраалга', NULL, 'Electrical', 'Stop lamp switch', 'piece'),
  ('Clutch Switch', 'Муфтын унтраалга', NULL, 'Electrical', 'Clutch pedal position switch', 'piece'),
  ('Parking Sensor Set', 'Зогсоолын мэдрэгч багц', NULL, 'Electrical', 'Rear parking sensor kit (4)', 'set'),
  ('Cruise Control Switch', 'Аяллын хурдны товч', NULL, 'Electrical', 'Cruise control button set', 'set');

-- ── Lighting ──────────────────────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Headlight Assembly — Left', 'Урд гэрлийн угсрагдал — Зүүн', NULL, 'Lighting', 'Left headlight assembly', 'piece'),
  ('Headlight Assembly — Right', 'Урд гэрлийн угсрагдал — Баруун', NULL, 'Lighting', 'Right headlight assembly', 'piece'),
  ('Headlight Bulb H1', 'Урд гэрлийн чийдэн H1', NULL, 'Lighting', 'H1 single filament bulb', 'piece'),
  ('Headlight Bulb H4', 'Урд гэрлийн чийдэн H4', NULL, 'Lighting', 'H4 dual filament halogen', 'piece'),
  ('Headlight Bulb H7', 'Урд гэрлийн чийдэн H7', NULL, 'Lighting', 'H7 single filament halogen', 'piece'),
  ('Headlight Bulb H11', 'Урд гэрлийн чийдэн H11', NULL, 'Lighting', 'H11 halogen', 'piece'),
  ('Headlight Bulb 9005 (HB3)', 'Урд гэрлийн чийдэн 9005', NULL, 'Lighting', '9005 (HB3) high beam', 'piece'),
  ('Headlight Bulb 9006 (HB4)', 'Урд гэрлийн чийдэн 9006', NULL, 'Lighting', '9006 (HB4) low beam', 'piece'),
  ('LED Conversion Kit H4', 'LED хувиргагч багц H4', NULL, 'Lighting', 'H4 LED conversion kit (2 bulbs)', 'set'),
  ('LED Conversion Kit H7', 'LED хувиргагч багц H7', NULL, 'Lighting', 'H7 LED conversion kit (2 bulbs)', 'set'),
  ('LED Conversion Kit H11', 'LED хувиргагч багц H11', NULL, 'Lighting', 'H11 LED conversion kit', 'set'),
  ('HID Kit 35W', 'HID багц 35W', NULL, 'Lighting', 'HID conversion kit 35W', 'set'),
  ('HID Kit 55W', 'HID багц 55W', NULL, 'Lighting', 'HID conversion kit 55W', 'set'),
  ('HID Ballast', 'HID балласт', NULL, 'Lighting', 'HID ballast unit', 'piece'),
  ('Tail Light Assembly — Left', 'Арын гэрлийн угсрагдал — Зүүн', NULL, 'Lighting', 'Rear tail light assembly', 'piece'),
  ('Tail Light Assembly — Right', 'Арын гэрлийн угсрагдал — Баруун', NULL, 'Lighting', 'Rear tail light assembly', 'piece'),
  ('Tail Light Bulb', 'Арын гэрлийн чийдэн', NULL, 'Lighting', 'Dual filament tail/stop bulb', 'piece'),
  ('Turn Signal Bulb — Front', 'Эргэх дохионы чийдэн — Урд', NULL, 'Lighting', 'Amber front turn signal bulb', 'piece'),
  ('Turn Signal Bulb — Rear', 'Эргэх дохионы чийдэн — Арын', NULL, 'Lighting', 'Amber rear turn signal bulb', 'piece'),
  ('Side Repeater Light', 'Хажуугийн эргэх дохио', NULL, 'Lighting', 'Side marker/repeater light', 'piece'),
  ('Fog Light Assembly — Left', 'Манангийн гэрэл — Зүүн', NULL, 'Lighting', 'Left fog light assembly', 'piece'),
  ('Fog Light Assembly — Right', 'Манангийн гэрэл — Баруун', NULL, 'Lighting', 'Right fog light assembly', 'piece'),
  ('Fog Light Bulb H8', 'Манангийн гэрлийн чийдэн H8', NULL, 'Lighting', 'H8 fog light bulb', 'piece'),
  ('Fog Light Bulb H11', 'Манангийн гэрлийн чийдэн H11', NULL, 'Lighting', 'H11 fog light bulb', 'piece'),
  ('Daytime Running Light (DRL)', 'Өдрийн гэрэл', NULL, 'Lighting', 'DRL strip/assembly', 'piece'),
  ('Dome / Interior Light', 'Савлонны гэрэл', NULL, 'Lighting', 'Interior dome light assembly', 'piece'),
  ('LED Interior Bulb Kit', 'LED савлонны чийдэн багц', NULL, 'Lighting', 'LED replacement for interior lights', 'set'),
  ('License Plate Light Assembly', 'Регистрийн дугаарын гэрэл', NULL, 'Lighting', 'License plate light housing', 'piece'),
  ('License Plate Light Bulb', 'Регистрийн дугаарын чийдэн', NULL, 'Lighting', 'License plate bulb', 'piece');

-- ── AC & Heating ──────────────────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('AC Compressor', 'Кондишннер компрессор', '88320-YZZ01', 'AC System', 'Air conditioning compressor', 'piece'),
  ('AC Compressor Clutch', 'Компрессорын муфт', NULL, 'AC System', 'AC compressor clutch assembly', 'piece'),
  ('AC Condenser', 'Кондишннер конденсор', '88460-YZZ01', 'AC System', 'AC condenser radiator', 'piece'),
  ('AC Evaporator', 'Кондишннер ууршуулагч', NULL, 'AC System', 'AC evaporator core', 'piece'),
  ('AC Expansion Valve', 'Өргөтгөх хавхлага', NULL, 'AC System', 'AC expansion valve', 'piece'),
  ('AC Orifice Tube', 'Хязгаарлагч хоолой', NULL, 'AC System', 'Fixed orifice tube', 'piece'),
  ('AC Receiver Drier', 'Хуурайшуулагч', NULL, 'AC System', 'AC receiver drier', 'piece'),
  ('AC Accumulator', 'Аккумулятор (AC)', NULL, 'AC System', 'Accumulator for cycling clutch systems', 'piece'),
  ('AC Pressure Switch', 'Даралтын унтраалга (AC)', NULL, 'AC System', 'High/low AC pressure switch', 'piece'),
  ('AC Hose — High Pressure', 'Кондишннер шланг — Өндөр даралт', NULL, 'AC System', 'High pressure AC hose', 'piece'),
  ('AC Hose — Low Pressure', 'Кондишннер шланг — Бага даралт', NULL, 'AC System', 'Low pressure AC hose', 'piece'),
  ('AC O-ring Seal Kit', 'AC O-цагариг чигжээс багц', NULL, 'AC System', 'AC system O-ring replacement set', 'set'),
  ('Heater Core', 'Халаагуурын гол', NULL, 'AC System', 'Heater core assembly', 'piece'),
  ('Heater Control Valve', 'Халаагуурын хяналтын хавхлага', NULL, 'AC System', 'Heater coolant control valve', 'piece'),
  ('Cabin Air Filter (Standard)', 'Савлонны шүүлтүүр (Энгийн)', '87139-YZZ20', 'AC System', 'Standard cabin/pollen filter', 'piece'),
  ('Cabin Air Filter (Carbon)', 'Савлонны шүүлтүүр (Нүүрс)', NULL, 'AC System', 'Activated carbon cabin filter', 'piece'),
  ('Cabin Air Filter (HEPA)', 'Савлонны шүүлтүүр (HEPA)', NULL, 'AC System', 'HEPA cabin air filter', 'piece'),
  ('AC Refrigerant R134a (13.6oz)', 'Хөргөлтийн шингэн R134a (13.6oz)', NULL, 'AC System', 'R134a can 13.6oz', 'can'),
  ('AC Refrigerant R134a (30lb)', 'Хөргөлтийн шингэн R134a (30lb)', NULL, 'AC System', 'R134a bulk cylinder 30lb', 'cylinder'),
  ('AC Refrigerant R1234yf (10oz)', 'Хөргөлтийн шингэн R1234yf (10oz)', NULL, 'AC System', 'R1234yf can 10oz', 'can'),
  ('AC PAG Oil — 46', 'AC PAG тос — 46', NULL, 'AC System', 'PAG 46 compressor oil', 'piece'),
  ('AC PAG Oil — 100', 'AC PAG тос — 100', NULL, 'AC System', 'PAG 100 compressor oil', 'piece'),
  ('AC UV Leak Detection Dye', 'AC алдагдлыг илрүүлэх будаг', NULL, 'AC System', 'UV dye for leak detection', 'piece');

-- ── Transmission — Automatic ──────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('ATF Dexron III (1L)', 'Автомат хурдны хайрцгийн тос Dexron III (1L)', NULL, 'Transmission', 'Dexron III ATF', 'liter'),
  ('ATF Dexron III (4L)', 'Автомат хурдны хайрцгийн тос Dexron III (4L)', NULL, 'Transmission', 'Dexron III ATF 4L', 'container'),
  ('ATF Dexron VI (1L)', 'Автомат хурдны хайрцгийн тос Dexron VI (1L)', NULL, 'Transmission', 'Dexron VI full synth ATF', 'liter'),
  ('ATF Toyota WS (4L)', 'Автомат хурдны хайрцгийн тос Toyota WS (4L)', NULL, 'Transmission', 'Toyota ATF WS', 'container'),
  ('ATF Honda DW-1 (1L)', 'Автомат хурдны хайрцгийн тос Honda DW-1 (1L)', NULL, 'Transmission', 'Honda ATF DW-1', 'liter'),
  ('ATF Mitsubishi SP-III (4L)', 'Автомат хурдны хайрцгийн тос Mitsubishi SP-III (4L)', NULL, 'Transmission', 'DiaQueen SP-III ATF', 'container'),
  ('CVT Fluid (4L)', 'CVT хайрцгийн тос (4L)', NULL, 'Transmission', 'Continuous variable transmission fluid', 'container'),
  ('Transmission Filter Kit', 'Хурдны хайрцгийн шүүлтүүр багц', NULL, 'Transmission', 'ATF filter + pan gasket kit', 'set'),
  ('Transmission Pan Gasket', 'Хурдны хайрцгийн савны жийргэвч', NULL, 'Transmission', 'AT pan gasket', 'piece'),
  ('Transmission Cooler', 'Хурдны хайрцгийн хөргүүр', NULL, 'Transmission', 'External ATF cooler', 'piece'),
  ('Transmission Solenoid Kit', 'Хурдны хайрцгийн соленоид багц', NULL, 'Transmission', 'Shift solenoid set', 'set'),
  ('Transmission Speed Sensor', 'Хурдны хайрцгийн хурдны мэдрэгч', NULL, 'Transmission', 'Input/output speed sensor', 'piece');

-- ── Transmission — Manual ─────────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Manual Gear Oil 75W-90 (1L)', 'Гарын хурдны хайрцгийн тос 75W-90 (1L)', NULL, 'Transmission', 'SAE 75W-90 gear oil', 'liter'),
  ('Manual Gear Oil 80W-140 (1L)', 'Гарын хурдны хайрцгийн тос 80W-140 (1L)', NULL, 'Transmission', 'SAE 80W-140 heavy duty gear oil', 'liter'),
  ('Manual Gear Oil MTF (1L)', 'Гарын хурдны хайрцгийн тос MTF (1L)', NULL, 'Transmission', 'Synchromesh manual transmission fluid', 'liter'),
  ('Clutch Kit (Standard)', 'Муфтны багц (Энгийн)', NULL, 'Transmission', 'Clutch disc + pressure plate + bearing', 'set'),
  ('Clutch Kit (Heavy Duty)', 'Муфтны багц (Өндөр чанар)', NULL, 'Transmission', 'HD clutch set — disc + plate + bearing', 'set'),
  ('Clutch Disc', 'Муфтын диск', NULL, 'Transmission', 'Single clutch friction disc', 'piece'),
  ('Clutch Pressure Plate', 'Муфтын даралтын хавтан', NULL, 'Transmission', 'Clutch pressure plate', 'piece'),
  ('Clutch Release Bearing', 'Муфтын суллах холхивч', NULL, 'Transmission', 'Clutch throwout bearing', 'piece'),
  ('Clutch Pilot Bearing', 'Муфтын пилот холхивч', NULL, 'Transmission', 'Pilot bearing/bushing', 'piece'),
  ('Clutch Alignment Tool', 'Муфтын төвлөрүүлэгч', NULL, 'Transmission', 'Clutch disc alignment tool', 'piece'),
  ('Clutch Fork', 'Муфтын сэрээ', NULL, 'Transmission', 'Clutch release fork', 'piece'),
  ('Clutch Master Cylinder', 'Муфтын үндсэн шахуурга', NULL, 'Transmission', 'Clutch master cylinder', 'piece'),
  ('Clutch Slave Cylinder', 'Муфтын дугарах шахуурга', NULL, 'Transmission', 'Clutch slave cylinder', 'piece'),
  ('Flywheel (Solid)', 'Нисдэг хүрд (Хатуу)', NULL, 'Transmission', 'Solid/single-mass flywheel', 'piece'),
  ('Flywheel (Dual Mass)', 'Нисдэг хүрд (Давхар масс)', NULL, 'Transmission', 'Dual-mass flywheel (DMF)', 'piece'),
  ('Transmission Mount', 'Хурдны хайрцгийн суурь', NULL, 'Transmission', 'Transmission mount', 'piece'),
  ('Shift Linkage Bushing', 'Шилжүүлэгчийн сайлентблок', NULL, 'Transmission', 'Shifter cable bushing', 'piece');

-- ── Transmission — Drivetrain ─────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('CV Axle — Left', 'CV тэнхлэг — Зүүн', NULL, 'Transmission', 'Left drive axle shaft', 'piece'),
  ('CV Axle — Right', 'CV тэнхлэг — Баруун', NULL, 'Transmission', 'Right drive axle shaft', 'piece'),
  ('CV Axle — Rear Left', 'CV тэнхлэг — Арын зүүн', NULL, 'Transmission', 'Rear left drive axle', 'piece'),
  ('CV Axle — Rear Right', 'CV тэнхлэг — Арын баруун', NULL, 'Transmission', 'Rear right drive axle', 'piece'),
  ('CV Joint Boot Kit', 'CV холбоосын бүрээс багц', NULL, 'Transmission', 'CV joint boot with clamps', 'set'),
  ('CV Joint Grease', 'CV холбоосын тос', NULL, 'Transmission', 'CV joint grease packet', 'packet'),
  ('Drive Shaft — Front', 'Хөтөч босоо ам — Урд', NULL, 'Transmission', 'Front propeller shaft', 'piece'),
  ('Drive Shaft — Rear', 'Хөтөч босоо ам — Арын', NULL, 'Transmission', 'Rear propeller shaft', 'piece'),
  ('Center Bearing / Carrier', 'Төвийн холхивч', NULL, 'Transmission', 'Drive shaft center support bearing', 'piece'),
  ('Differential Oil 75W-90 (1L)', 'Дифференциалын тос 75W-90 (1L)', NULL, 'Transmission', 'Limited slip differential oil 75W-90', 'liter'),
  ('Differential Oil 80W-140 (1L)', 'Дифференциалын тос 80W-140 (1L)', NULL, 'Transmission', 'LSD gear oil 80W-140', 'liter'),
  ('Transfer Case Oil (1L)', 'Трансфер кейсийн тос (1L)', NULL, 'Transmission', 'Transfer case gear oil', 'liter');

-- ── Cooling System ────────────────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Coolant / Antifreeze (Concentrate 1L)', 'Антифриз (Багараагүй 1L)', NULL, 'Cooling', 'Coolant concentrate (IAT green)', 'liter'),
  ('Coolant / Antifreeze (Ready-mix 1L)', 'Антифриз (Бэлэн 1L)', NULL, 'Cooling', 'Ready-to-use coolant 1L', 'liter'),
  ('Coolant / Antifreeze (Ready-mix 5L)', 'Антифриз (Бэлэн 5L)', NULL, 'Cooling', 'Ready-to-use coolant 5L', 'container'),
  ('Coolant — Toyota SLLC (Pink 5L)', 'Антифриз — Toyota SLLC (Ягаан 5L)', NULL, 'Cooling', 'Toyota Super Long Life Coolant pink', 'container'),
  ('Coolant — Dex-Cool (Orange 1L)', 'Антифриз — Dex-Cool (Улбар шар 1L)', NULL, 'Cooling', 'Dex-Cool orange coolant', 'liter'),
  ('Coolant — Universal (Red 5L)', 'Антифриз — Универсал (Улаан 5L)', NULL, 'Cooling', 'Universal phosphate-free red coolant', 'container'),
  ('Coolant Tester', 'Антифриз шалгагч', NULL, 'Cooling', 'Coolant freeze point tester', 'piece'),
  ('Coolant Expansion Tank', 'Хөргөлтийн шингэний тэлэлтийн сав', NULL, 'Cooling', 'Coolant overflow/expansion tank', 'piece'),
  ('Coolant Level Sensor', 'Хөргөлтийн шингэний түвшний мэдрэгч', NULL, 'Cooling', 'Coolant level float sensor', 'piece'),
  ('Intercooler', 'Интеркулер', NULL, 'Cooling', 'Turbo/supercharger intercooler', 'piece'),
  ('Intercooler Piping Kit', 'Интеркулерийн хоолой багц', NULL, 'Cooling', 'Intercooler pipe and coupler kit', 'set');

-- ── Exhaust ───────────────────────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Catalytic Converter (Universal)', 'Каталитик шүүлтүүр (Универсал)', NULL, 'Exhaust', 'Universal catalytic converter', 'piece'),
  ('Catalytic Converter (Direct Fit)', 'Каталитик шүүлтүүр (Загварт тохирсон)', NULL, 'Exhaust', 'Direct-fit OEM replacement cat', 'piece'),
  ('Diesel Particulate Filter (DPF)', 'Дизель тоосны шүүлтүүр (DPF)', NULL, 'Exhaust', 'Diesel particulate filter', 'piece'),
  ('Muffler / Silencer (Standard)', 'Дуу намсгагч (Энгийн)', NULL, 'Exhaust', 'Standard muffler/silencer', 'piece'),
  ('Muffler / Silencer (Performance)', 'Дуу намсгагч (Спорт)', NULL, 'Exhaust', 'Performance/gasflow muffler', 'piece'),
  ('Exhaust Pipe — 2"', 'Угаарын хоолой — 2"', NULL, 'Exhaust', '2 diameter exhaust tubing', 'piece'),
  ('Exhaust Pipe — 2.5"', 'Угаарын хоолой — 2.5"', NULL, 'Exhaust', '2.5 diameter exhaust tubing', 'piece'),
  ('Flex Pipe', 'Уян угаарын хоолой', NULL, 'Exhaust', 'Flexible exhaust pipe section', 'piece'),
  ('Exhaust Manifold', 'Угаарын коллектор', NULL, 'Exhaust', 'Cast iron/steel exhaust manifold', 'piece'),
  ('Exhaust Manifold Gasket', 'Угаарын коллекторын жийргэвч', NULL, 'Exhaust', 'Exhaust manifold gasket', 'piece'),
  ('Exhaust Flange Gasket', 'Угаарын фланцын жийргэвч', NULL, 'Exhaust', 'Exhaust pipe flange gasket', 'piece'),
  ('Exhaust Gasket Set', 'Угаарын жийргэвч багц', NULL, 'Exhaust', 'Complete exhaust gasket set', 'set'),
  ('O2 Sensor Spacer', 'Хүчилтөрөгчийн мэдрэгчийн зайлагч', NULL, 'Exhaust', 'O2 sensor bung spacer (anti-CEL)', 'piece'),
  ('Exhaust Hanger Kit', 'Угаарын өлгүүр багц', NULL, 'Exhaust', 'Rubber exhaust hanger set', 'set'),
  ('Exhaust Clamp Kit', 'Угаарын хавчаар багц', NULL, 'Exhaust', 'Exhaust pipe clamp set', 'set'),
  ('Exhaust Tip', 'Угаарын үзүүр', NULL, 'Exhaust', 'Stainless steel exhaust tip', 'piece'),
  ('Resonator', 'Резонатор', NULL, 'Exhaust', 'Exhaust resonator/mid-muffler', 'piece');

-- ── Wheels & Tires ────────────────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Tire 175/65R14', 'Дугуй 175/65R14', NULL, 'Wheels & Tires', 'Standard compact car tire', 'piece'),
  ('Tire 185/65R15', 'Дугуй 185/65R15', NULL, 'Wheels & Tires', 'Economy car tire', 'piece'),
  ('Tire 195/55R15', 'Дугуй 195/55R15', NULL, 'Wheels & Tires', 'Sport compact tire', 'piece'),
  ('Tire 195/65R15', 'Дугуй 195/65R15', NULL, 'Wheels & Tires', 'Mid-size sedan tire', 'piece'),
  ('Tire 205/55R16', 'Дугуй 205/55R16', NULL, 'Wheels & Tires', 'Standard passenger car tire', 'piece'),
  ('Tire 205/60R16', 'Дугуй 205/60R16', NULL, 'Wheels & Tires', 'Family sedan tire', 'piece'),
  ('Tire 205/65R16', 'Дугуй 205/65R16', NULL, 'Wheels & Tires', 'Large sedan tire', 'piece'),
  ('Tire 215/55R17', 'Дугуй 215/55R17', NULL, 'Wheels & Tires', 'Premium sedan tire', 'piece'),
  ('Tire 215/60R16', 'Дугуй 215/60R16', NULL, 'Wheels & Tires', 'SUV standard tire', 'piece'),
  ('Tire 215/60R17', 'Дугуй 215/60R17', NULL, 'Wheels & Tires', 'Crossover SUV tire', 'piece'),
  ('Tire 215/65R16', 'Дугуй 215/65R16', NULL, 'Wheels & Tires', 'Standard SUV tire', 'piece'),
  ('Tire 225/45R17', 'Дугуй 225/45R17', NULL, 'Wheels & Tires', 'Sport sedan tire', 'piece'),
  ('Tire 225/45R18', 'Дугуй 225/45R18', NULL, 'Wheels & Tires', 'Premium sport tire', 'piece'),
  ('Tire 225/55R17', 'Дугуй 225/55R17', NULL, 'Wheels & Tires', 'Mid-size luxury tire', 'piece'),
  ('Tire 225/55R18', 'Дугуй 225/55R18', NULL, 'Wheels & Tires', 'Large SUV tire', 'piece'),
  ('Tire 225/60R16', 'Дугуй 225/60R16', NULL, 'Wheels & Tires', 'Full-size sedan tire', 'piece'),
  ('Tire 225/65R17', 'Дугуй 225/65R17', NULL, 'Wheels & Tires', 'SUV all-terrain tire', 'piece'),
  ('Tire 235/55R17', 'Дугуй 235/55R17', NULL, 'Wheels & Tires', 'Performance SUV tire', 'piece'),
  ('Tire 235/55R18', 'Дугуй 235/55R18', NULL, 'Wheels & Tires', 'Luxury SUV tire', 'piece'),
  ('Tire 235/60R18', 'Дугуй 235/60R18', NULL, 'Wheels & Tires', 'Large SUV all-season tire', 'piece'),
  ('Tire 245/45R18', 'Дугуй 245/45R18', NULL, 'Wheels & Tires', 'Performance luxury tire', 'piece'),
  ('Alloy Rim 16"', 'Хайлшин аяга 16"', NULL, 'Wheels & Tires', '16 inch alloy wheel rim', 'piece'),
  ('Alloy Rim 17"', 'Хайлшин аяга 17"', NULL, 'Wheels & Tires', '17 inch alloy wheel rim', 'piece'),
  ('Alloy Rim 18"', 'Хайлшин аяга 18"', NULL, 'Wheels & Tires', '18 inch alloy wheel rim', 'piece'),
  ('Wheel Lug Nut Set (20pcs)', 'Дугуйн толгой багц (20ш)', NULL, 'Wheels & Tires', 'Standard lug nut set 20 pcs', 'set'),
  ('Wheel Lock Nut Set (4pcs)', 'Дугуйн хамгаалалтын толгой багц (4ш)', NULL, 'Wheels & Tires', 'Wheel lock nut set with key', 'set'),
  ('Wheel Center Cap Set (4)', 'Дугуйн тогтоош багц (4ш)', NULL, 'Wheels & Tires', 'Set of 4 center caps', 'set'),
  ('Hub Centric Ring Set', 'Төвлөрүүлэх цагариг багц', NULL, 'Wheels & Tires', 'Hub centric ring set (4)', 'set'),
  ('Wheel Spacer Set', 'Дугуйн зайлагч багц', NULL, 'Wheels & Tires', 'Wheel spacer set (2pcs)', 'set'),
  ('TPMS Sensor (Original)', 'Даралтын мэдрэгч (Оригинал)', NULL, 'Wheels & Tires', 'OEM TPMS sensor', 'piece'),
  ('TPMS Sensor (Universal)', 'Даралтын мэдрэгч (Универсал)', NULL, 'Wheels & Tires', 'Programmable universal TPMS sensor', 'piece'),
  ('TPMS Service Kit', 'TPMS засварын багц', NULL, 'Wheels & Tires', 'TPMS valve stem + seal kit', 'set'),
  ('Tire Repair Plug Kit', 'Дугуйн засварын багц', NULL, 'Wheels & Tires', 'Tire plug/string repair kit', 'set'),
  ('Tire Valve Stem', 'Дугуйн хавхлага', NULL, 'Wheels & Tires', 'Snap-in tire valve stem', 'piece'),
  ('Tire Valve Cap Set', 'Дугуйн хавхлагын таг багц', NULL, 'Wheels & Tires', 'Set of 4 valve caps', 'set'),
  ('Tire Pressure Gauge', 'Дугуйн даралт хэмжигч', NULL, 'Wheels & Tires', 'Digital tire pressure gauge', 'piece');

-- ── Body — Wipers & Glass ─────────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Wiper Blade — 24" (Driver)', 'Арчигч — 24" (Жолооч)', NULL, 'Body', '24 inch beam wiper blade', 'piece'),
  ('Wiper Blade — 22" (Driver)', 'Арчигч — 22" (Жолооч)', NULL, 'Body', '22 inch beam wiper blade', 'piece'),
  ('Wiper Blade — 21" (Driver)', 'Арчигч — 21" (Жолооч)', NULL, 'Body', '21 inch beam wiper blade', 'piece'),
  ('Wiper Blade — 20" (Passenger)', 'Арчигч — 20" (Зорчигч)', NULL, 'Body', '20 inch beam wiper blade', 'piece'),
  ('Wiper Blade — 19" (Passenger)', 'Арчигч — 19" (Зорчигч)', NULL, 'Body', '19 inch beam wiper blade', 'piece'),
  ('Wiper Blade — 18" (Passenger)', 'Арчигч — 18" (Зорчигч)', NULL, 'Body', '18 inch beam wiper blade', 'piece'),
  ('Wiper Blade — Rear', 'Арчигч — Арын', NULL, 'Body', 'Rear wiper blade', 'piece'),
  ('Premium Wiper Blade Set', 'Өндөр чанарын арчигч багц', NULL, 'Body', 'Premium beam blade set (2)', 'set'),
  ('Windshield', 'Салхины шил', NULL, 'Body', 'Front windshield glass', 'piece'),
  ('Side Window — Front Left', 'Хажуугийн шил — Урд зүүн', NULL, 'Body', 'Front left door glass', 'piece'),
  ('Side Window — Front Right', 'Хажуугийн шил — Урд баруун', NULL, 'Body', 'Front right door glass', 'piece'),
  ('Side Window — Rear Left', 'Хажуугийн шил — Арын зүүн', NULL, 'Body', 'Rear left door glass', 'piece'),
  ('Side Window — Rear Right', 'Хажуугийн шил — Арын баруун', NULL, 'Body', 'Rear right door glass', 'piece'),
  ('Side Window Regulator — Front Left', 'Цонхны өргөгч — Урд зүүн', NULL, 'Body', 'Front left window regulator', 'piece'),
  ('Side Window Regulator — Front Right', 'Цонхны өргөгч — Урд баруун', NULL, 'Body', 'Front right window regulator', 'piece'),
  ('Side Window Regulator — Rear Left', 'Цонхны өргөгч — Арын зүүн', NULL, 'Body', 'Rear left window regulator', 'piece'),
  ('Side Window Regulator — Rear Right', 'Цонхны өргөгч — Арын баруун', NULL, 'Body', 'Rear right window regulator', 'piece');

-- ── Body — Mirrors & Exterior ─────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Side Mirror — Left (Manual)', 'Толь — Зүүн (Гараар)', NULL, 'Body', 'Left manual side mirror', 'piece'),
  ('Side Mirror — Left (Electric)', 'Толь — Зүүн (Цахилгаан)', NULL, 'Body', 'Left power side mirror', 'piece'),
  ('Side Mirror — Right (Manual)', 'Толь — Баруун (Гараар)', NULL, 'Body', 'Right manual side mirror', 'piece'),
  ('Side Mirror — Right (Electric)', 'Толь — Баруун (Цахилгаан)', NULL, 'Body', 'Right power side mirror', 'piece'),
  ('Side Mirror — Left (Folding)', 'Толь — Зүүн (Эвхэгддэг)', NULL, 'Body', 'Left folding power mirror', 'piece'),
  ('Side Mirror — Right (Folding)', 'Толь — Баруун (Эвхэгддэг)', NULL, 'Body', 'Right folding power mirror', 'piece'),
  ('Rearview Mirror', 'Арын харах толь', NULL, 'Body', 'Interior rearview mirror', 'piece'),
  ('Door Handle — Front Left (Exterior)', 'Хаалганы бариул — Урд зүүн (Гадна)', NULL, 'Body', 'Front left exterior door handle', 'piece'),
  ('Door Handle — Front Right (Exterior)', 'Хаалганы бариул — Урд баруун (Гадна)', NULL, 'Body', 'Front right exterior door handle', 'piece'),
  ('Door Handle — Rear Left (Exterior)', 'Хаалганы бариул — Арын зүүн (Гадна)', NULL, 'Body', 'Rear left exterior door handle', 'piece'),
  ('Door Handle — Rear Right (Exterior)', 'Хаалганы бариул — Арын баруун (Гадна)', NULL, 'Body', 'Rear right exterior door handle', 'piece'),
  ('Door Handle — Interior', 'Хаалганы бариул — Дотор', NULL, 'Body', 'Interior door pull handle', 'piece'),
  ('Hood Latch', 'Мотоны түгжээ', NULL, 'Body', 'Hood latch assembly', 'piece'),
  ('Hood Strut / Damper', 'Мотоны өргөгч', NULL, 'Body', 'Hood gas strut', 'piece'),
  ('Trunk Latch', 'Тээшийн түгжээ', NULL, 'Body', 'Trunk latch assembly', 'piece'),
  ('Trunk Strut / Lift Support', 'Тээшийн өргөгч', NULL, 'Body', 'Trunk gas strut', 'piece'),
  ('Fuel Door / Flap', 'Түлшний тагны хаалга', NULL, 'Body', 'Fuel filler door assembly', 'piece'),
  ('Mud Flap Set (4)', 'Шавар хамгаалах дэвсгэр (4ш)', NULL, 'Body', 'Set of 4 mud flaps', 'set'),
  ('Running Board / Side Step', 'Хажуугийн гишгүүр', NULL, 'Body', 'Running board / side step', 'piece'),
  ('Door Weatherstrip — Front', 'Хаалганы чигжээс — Урд', NULL, 'Body', 'Front door rubber seal', 'piece'),
  ('Door Weatherstrip — Rear', 'Хаалганы чигжээс — Арын', NULL, 'Body', 'Rear door rubber seal', 'piece'),
  ('Trunk Weatherstrip', 'Тээшийн чигжээс', NULL, 'Body', 'Trunk lid rubber seal', 'piece'),
  ('Hood Insulation Pad', 'Мотоны дулаалга', NULL, 'Body', 'Under-hood insulation pad', 'piece');

-- ── Fluids & Chemicals ────────────────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Engine Oil 0W-20 (1L)', 'Хөдөлгүүрийн тос 0W-20 (1L)', NULL, 'Fluids & Chemicals', 'Full synthetic 0W-20 engine oil 1L', 'liter'),
  ('Engine Oil 0W-20 (4L)', 'Хөдөлгүүрийн тос 0W-20 (4L)', NULL, 'Fluids & Chemicals', 'Full synthetic 0W-20 engine oil 4L', 'container'),
  ('Engine Oil 5W-20 (1L)', 'Хөдөлгүүрийн тос 5W-20 (1L)', NULL, 'Fluids & Chemicals', 'Synthetic 5W-20 engine oil 1L', 'liter'),
  ('Engine Oil 5W-30 (1L)', 'Хөдөлгүүрийн тос 5W-30 (1L)', NULL, 'Fluids & Chemicals', 'Synthetic 5W-30 engine oil 1L', 'liter'),
  ('Engine Oil 5W-30 (4L)', 'Хөдөлгүүрийн тос 5W-30 (4L)', NULL, 'Fluids & Chemicals', 'Synthetic 5W-30 engine oil 4L', 'container'),
  ('Engine Oil 5W-40 (1L)', 'Хөдөлгүүрийн тос 5W-40 (1L)', NULL, 'Fluids & Chemicals', 'Full synthetic 5W-40 engine oil 1L', 'liter'),
  ('Engine Oil 5W-40 (5L)', 'Хөдөлгүүрийн тос 5W-40 (5L)', NULL, 'Fluids & Chemicals', 'Full synthetic 5W-40 engine oil 5L', 'container'),
  ('Engine Oil 10W-40 (4L)', 'Хөдөлгүүрийн тос 10W-40 (4L)', NULL, 'Fluids & Chemicals', 'Mineral 10W-40 engine oil 4L', 'container'),
  ('Engine Oil 15W-40 (4L)', 'Хөдөлгүүрийн тос 15W-40 (4L)', NULL, 'Fluids & Chemicals', 'Diesel 15W-40 engine oil 4L', 'container'),
  ('Engine Oil 0W-40 (1L)', 'Хөдөлгүүрийн тос 0W-40 (1L)', NULL, 'Fluids & Chemicals', 'Full synthetic 0W-40 engine oil 1L', 'liter'),
  ('Engine Oil 0W-40 (4L)', 'Хөдөлгүүрийн тос 0W-40 (4L)', NULL, 'Fluids & Chemicals', 'Full synthetic 0W-40 engine oil 4L', 'container'),
  ('Engine Oil 10W-30 (4L)', 'Хөдөлгүүрийн тос 10W-30 (4L)', NULL, 'Fluids & Chemicals', 'Synthetic blend 10W-30 engine oil 4L', 'container'),
  ('Engine Oil 10W-60 (4L)', 'Хөдөлгүүрийн тос 10W-60 (4L)', NULL, 'Fluids & Chemicals', 'High performance 10W-60 racing oil', 'container'),
  ('Engine Oil 20W-50 (5L)', 'Хөдөлгүүрийн тос 20W-50 (5L)', NULL, 'Fluids & Chemicals', 'High mileage 20W-50 engine oil 5L', 'container'),
  ('Diesel Engine Oil 15W-40 (5L)', 'Дизель хөдөлгүүрийн тос 15W-40 (5L)', NULL, 'Fluids & Chemicals', 'Diesel CI-4 15W-40 5L', 'container'),
  ('Brake Fluid DOT3 (500ml)', 'Тоормосны шингэн DOT3 (500мл)', NULL, 'Fluids & Chemicals', 'DOT3 brake fluid 500ml', 'bottle'),
  ('Brake Fluid DOT4 (500ml)', 'Тоормосны шингэн DOT4 (500мл)', NULL, 'Fluids & Chemicals', 'DOT4 brake fluid 500ml', 'bottle'),
  ('Brake Fluid DOT4 (1L)', 'Тоормосны шингэн DOT4 (1L)', NULL, 'Fluids & Chemicals', 'DOT4 brake fluid 1L', 'bottle'),
  ('Brake Fluid DOT5.1 (500ml)', 'Тоормосны шингэн DOT5.1 (500мл)', NULL, 'Fluids & Chemicals', 'DOT5.1 synthetic brake fluid', 'bottle'),
  ('Power Steering Fluid (1L)', 'Удирдлагын тос (1L)', NULL, 'Fluids & Chemicals', 'Power steering hydraulic fluid', 'liter'),
  ('Windshield Washer — Summer (5L)', 'Шилийг угаах шингэн — Зун (5L)', NULL, 'Fluids & Chemicals', 'Summer windshield washer fluid', 'container'),
  ('Windshield Washer — Winter (5L)', 'Шилийг угаах шингэн — Өвөл (5L)', NULL, 'Fluids & Chemicals', 'Winter -30°C washer fluid', 'container'),
  ('Windshield Washer Concentrate (1L)', 'Шилийг угаах шингэн баяжмал (1L)', NULL, 'Fluids & Chemicals', 'Washer fluid concentrate 1:10', 'liter'),
  ('Fuel Injector Cleaner', 'Түлшний цацагч цэвэрлэгч', NULL, 'Fluids & Chemicals', 'Fuel system/injector cleaner', 'bottle'),
  ('Fuel System Cleaner', 'Түлшний систем цэвэрлэгч', NULL, 'Fluids & Chemicals', 'Complete fuel system treatment', 'bottle'),
  ('Octane Booster', 'Октаны өсгөгч', NULL, 'Fluids & Chemicals', 'Octane booster additive', 'bottle'),
  ('Diesel Cetane Booster', 'Дизель цетаны өсгөгч', NULL, 'Fluids & Chemicals', 'Diesel cetane improver', 'bottle'),
  ('Oil Stop Leak', 'Тосны алдагдлыг зогсоогч', NULL, 'Fluids & Chemicals', 'Engine oil stop leak additive', 'bottle'),
  ('Radiator Stop Leak', 'Радиаторын алдагдлыг зогсоогч', NULL, 'Fluids & Chemicals', 'Cooling system stop leak', 'bottle'),
  ('Transmission Stop Leak', 'Хурдны хайрцгийн алдагдлыг зогсоогч', NULL, 'Fluids & Chemicals', 'ATF conditioner/stop leak', 'bottle'),
  ('Engine Flush', 'Хөдөлгүүрийн угаагч', NULL, 'Fluids & Chemicals', 'Engine oil flush treatment', 'bottle'),
  ('Diesel Winter Additive', 'Дизелийн өвлийн нэмэлт', NULL, 'Fluids & Chemicals', 'Diesel anti-gel winter additive', 'bottle'),
  ('Fuel Stabilizer', 'Түлшний тогтворжуулагч', NULL, 'Fluids & Chemicals', 'Fuel stabilizer for storage', 'bottle'),
  ('Degreaser (1L)', 'Тос арилгагч (1L)', NULL, 'Fluids & Chemicals', 'Engine degreaser spray 1L', 'bottle'),
  ('Brake Parts Cleaner', 'Тоормосны эд анги цэвэрлэгч', NULL, 'Fluids & Chemicals', 'Aerosol brake cleaner', 'can'),
  ('Contact Cleaner', 'Контактын цэвэрлэгч', NULL, 'Fluids & Chemicals', 'Electrical contact cleaner spray', 'can'),
  ('Carburetor Cleaner', 'Карбюратор цэвэрлэгч', NULL, 'Fluids & Chemicals', 'Carb/throttle body cleaner', 'can'),
  ('MAF Sensor Cleaner', 'MAF мэдрэгч цэвэрлэгч', NULL, 'Fluids & Chemicals', 'Mass airflow sensor cleaner', 'can'),
  ('Penetrating Oil — WD-40', 'Нэвтрэх тос — WD-40', NULL, 'Fluids & Chemicals', 'Multi-purpose penetrating lubricant', 'can'),
  ('Penetrating Oil — PB Blaster', 'Нэвтрэх тос — PB Blaster', NULL, 'Fluids & Chemicals', 'High-strength penetrating oil', 'can'),
  ('Silicone Spray', 'Силикон тос', NULL, 'Fluids & Chemicals', 'Silicone lubricant spray', 'can'),
  ('Dielectric Grease', 'Диэлектрик тос', NULL, 'Fluids & Chemicals', 'Dielectric grease for electrical connectors', 'tube');

-- ── Consumables & Shop Supplies ───────────────────────────────
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('RTV Silicone Gasket Maker', 'RTV силикон жийргэвч үйлдвэрлэгч', NULL, 'Consumables', 'High-temp RTV silicone gasket sealant', 'tube'),
  ('Threadlocker — Blue (Medium)', 'Утасны түгжээ — Цэнхэр', NULL, 'Consumables', 'Medium strength threadlocker (removable)', 'bottle'),
  ('Threadlocker — Red (High)', 'Утасны түгжээ — Улаан', NULL, 'Consumables', 'High strength threadlocker (permanent)', 'bottle'),
  ('Threadlocker — Green (Stud)', 'Утасны түгжээ — Ногоон', NULL, 'Consumables', 'Stud lock threadlocker', 'bottle'),
  ('Anti-seize Compound', 'Наалдалтаас сэргийлэгч', NULL, 'Consumables', 'Copper anti-seize compound', 'tube'),
  ('Zip Tie Assortment', 'Холбогч багц', NULL, 'Consumables', 'Assorted zip/cable ties kit', 'set'),
  ('Duct Tape — Heavy Duty', 'Дукт тууз', NULL, 'Consumables', 'Heavy duty duct tape', 'roll'),
  ('Electrical Tape', 'Цахилгаан тууз', NULL, 'Consumables', 'PVC electrical insulation tape', 'roll'),
  ('Teflon / PTFE Tape', 'Teflon тууз', NULL, 'Consumables', 'Thread seal tape for fittings', 'roll'),
  ('Nitrile Gloves — Size M', 'Нийтрил бээлий — M', NULL, 'Consumables', 'Disposable nitrile gloves (M)', 'box'),
  ('Nitrile Gloves — Size L', 'Нийтрил бээлий — L', NULL, 'Consumables', 'Disposable nitrile gloves (L)', 'box'),
  ('Nitrile Gloves — Size XL', 'Нийтрил бээлий — XL', NULL, 'Consumables', 'Disposable nitrile gloves (XL)', 'box'),
  ('Shop Towel Roll', 'Цехийн алчуур', NULL, 'Consumables', 'Disposable shop paper towel roll', 'roll');

-- ═══════════════════════════════════════════════════════════════
-- GLOBAL SERVICES CATALOG — 150+ services by category
-- ═══════════════════════════════════════════════════════════════

-- ── Maintenance Services ──────────────────────────────────────
INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('Engine Oil Change (Mineral)', 'Хөдөлгүүрийн тос солих (Энгийн)', 'Maintenance', 'Drain old mineral oil, replace filter, refill', 30, 6, 5000),
  ('Engine Oil Change (Synthetic)', 'Хөдөлгүүрийн тос солих (Синтетик)', 'Maintenance', 'Drain old oil, replace filter, refill synthetic', 30, 6, 10000),
  ('Oil Filter Replacement', 'Тосны шүүлтүүр солих', 'Maintenance', 'Replace engine oil filter', 15, NULL, NULL),
  ('Engine Air Filter Replacement', 'Хөдөлгүүрийн агаарын шүүлтүүр солих', 'Maintenance', 'Replace engine air filter element', 10, 12, 15000),
  ('Cabin Air Filter Replacement', 'Савлонны шүүлтүүр солих', 'Maintenance', 'Replace cabin/pollen filter', 10, 12, 15000),
  ('Fuel Filter Replacement', 'Түлшний шүүлтүүр солих', 'Maintenance', 'Replace fuel filter', 30, NULL, 20000),
  ('Spark Plug Replacement (4-cyl)', 'Очлуур солих (4 цилиндр)', 'Maintenance', 'Replace 4 spark plugs', 45, 30, 50000),
  ('Spark Plug Replacement (6-cyl)', 'Очлуур солих (6 цилиндр)', 'Maintenance', 'Replace 6 spark plugs', 60, 30, 50000),
  ('Spark Plug Replacement (V8)', 'Очлуур солих (V8)', 'Maintenance', 'Replace 8 spark plugs', 75, 30, 50000),
  ('Serpentine Belt Replacement', 'Поли V бүс солих', 'Maintenance', 'Replace drive/serpentine belt', 45, NULL, 60000),
  ('Timing Belt Replacement', 'Цагийн бүс солих', 'Maintenance', 'Replace timing belt + tensioner', 180, NULL, 100000),
  ('Timing Chain Inspection', 'Цагийн гинжний шалгалт', 'Maintenance', 'Inspect timing chain tension and guides', 60, NULL, 120000),
  ('Battery Replacement', 'Аккумулятор солих', 'Maintenance', 'Test, remove old, install new battery', 20, NULL, NULL),
  ('Battery Test & Load Check', 'Аккумуляторын шалгалт', 'Maintenance', 'Load test battery and charging system', 10, NULL, NULL),
  ('Wiper Blade Replacement', 'Шил арчигч солих', 'Maintenance', 'Replace windshield wiper blades (pair)', 10, 12, NULL),
  ('Coolant Flush & Replace', 'Антифриз солих', 'Maintenance', 'Flush cooling system and refill coolant', 45, 24, 40000),
  ('Coolant Level Check & Top-up', 'Хөргөлтийн шингэн шалгах', 'Maintenance', 'Check coolant level and top up', 10, NULL, NULL),
  ('Transmission Fluid Change (Auto)', 'Хурдны хайрцгийн тос солих (Автомат)', 'Maintenance', 'Drain and refill automatic transmission fluid', 45, 30, 50000),
  ('Transmission Fluid Change (Manual)', 'Хурдны хайрцгийн тос солих (Гарын)', 'Maintenance', 'Drain and refill manual gearbox oil', 30, 30, 60000),
  ('CVT Fluid Change', 'CVT тос солих', 'Maintenance', 'Drain and refill CVT transmission fluid', 45, 30, 40000),
  ('Differential Oil Change', 'Дифференциалын тос солих', 'Maintenance', 'Drain and refill differential gear oil', 30, 36, 50000),
  ('Transfer Case Oil Change', 'Трансфер кейсийн тос солих', 'Maintenance', 'Drain and refill transfer case oil', 30, 36, 50000),
  ('Brake Fluid Flush', 'Тоормосны шингэн солих', 'Maintenance', 'Flush and replace brake fluid', 30, 24, NULL),
  ('Power Steering Fluid Flush', 'Удирдлагын тос солих', 'Maintenance', 'Flush and replace power steering fluid', 30, 24, NULL),
  ('Cabin Filter Replacement — Carbon', 'Савлонны шүүлтүүр солих — Нүүрс', 'Maintenance', 'Replace with activated carbon cabin filter', 10, 12, NULL),
  ('PCV Valve Replacement', 'PCV хавхлага солих', 'Maintenance', 'Replace positive crankcase ventilation valve', 20, NULL, 60000),
  ('Fuel System Cleaning', 'Түлшний систем цэвэрлэх', 'Maintenance', 'Fuel injector + intake valve cleaning service', 60, NULL, 40000),
  ('Throttle Body Cleaning', 'Тохируулагч хаалт цэвэрлэх', 'Maintenance', 'Clean throttle body and IAC valve', 30, NULL, 40000);

-- ── Brake Services ────────────────────────────────────────────
INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('Brake Pad Replacement — Front', 'Урд тоормосны дэвсгэр солих', 'Brakes', 'Replace front brake pads, lubricate hardware', 60, NULL, 30000),
  ('Brake Pad Replacement — Rear', 'Арын тоормосны дэвсгэр солих', 'Brakes', 'Replace rear brake pads, lubricate hardware', 60, NULL, 40000),
  ('Brake Rotor Replacement — Front', 'Урд тоормосны диск солих', 'Brakes', 'Replace front brake rotors (pair)', 60, NULL, 50000),
  ('Brake Rotor Replacement — Rear', 'Арын тоормосны диск солих', 'Brakes', 'Replace rear brake rotors (pair)', 60, NULL, 60000),
  ('Brake Pad + Rotor — Front (Complete)', 'Урд тоормосны дэвсгэр + диск солих', 'Brakes', 'Replace pads + rotors front (complete)', 90, NULL, 50000),
  ('Brake Pad + Rotor — Rear (Complete)', 'Арын тоормосны дэвсгэр + диск солих', 'Brakes', 'Replace pads + rotors rear (complete)', 90, NULL, 60000),
  ('Brake Caliper Replacement', 'Тоормосны калипер солих', 'Brakes', 'Replace brake caliper (one side)', 60, NULL, NULL),
  ('Brake Caliper Rebuild (Seals)', 'Тоормосны калипер шинэчлэх (Чигжээс)', 'Brakes', 'Rebuild caliper with new seals', 45, NULL, NULL),
  ('Brake Hose / Line Replacement', 'Тоормосны шланг солих', 'Brakes', 'Replace flexible brake hose', 30, NULL, NULL),
  ('Brake Master Cylinder Replacement', 'Тоормосны үндсэн шахуурга солих', 'Brakes', 'Replace brake master cylinder', 90, NULL, NULL),
  ('ABS Sensor Replacement', 'ABS мэдрэгч солих', 'Brakes', 'Replace ABS wheel speed sensor', 45, NULL, NULL),
  ('Parking Brake Shoe Replacement', 'Зогсоолын тоормосны дэвсгэр солих', 'Brakes', 'Replace parking brake shoes', 90, NULL, NULL),
  ('Parking Brake Cable Replacement', 'Зогсоолын тоормосны утас солих', 'Brakes', 'Replace parking brake cable', 60, NULL, NULL),
  ('Brake Drum Shoe Replacement', 'Тоормосны бөмбрийн дэвсгэр солих', 'Brakes', 'Replace rear drum brake shoes', 60, NULL, 60000),
  ('Brake Inspection', 'Тоормосны үзлэг', 'Brakes', 'Inspect pads, rotors, lines, fluid condition', 15, 6, 10000);

-- ── Suspension Services ───────────────────────────────────────
INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('Shock Absorber Replacement — Front (Pair)', 'Урд амортизатор солих (2ш)', 'Suspension', 'Replace front shock absorbers (pair)', 90, NULL, 80000),
  ('Shock Absorber Replacement — Rear (Pair)', 'Арын амортизатор солих (2ш)', 'Suspension', 'Replace rear shock absorbers (pair)', 60, NULL, 80000),
  ('Strut Assembly Replacement — Front', 'Урд струт угсрагдал солих', 'Suspension', 'Replace front strut assembly (complete, per side)', 90, NULL, 100000),
  ('Strut Assembly Replacement — Rear', 'Арын струт угсрагдал солих', 'Suspension', 'Replace rear strut assembly (per side)', 60, NULL, 100000),
  ('Coil Spring Replacement', 'Пүрх солих', 'Suspension', 'Replace coil spring (per side)', 90, NULL, NULL),
  ('Control Arm Replacement — Front Lower', 'Урд доод удирдлагын гар солих', 'Suspension', 'Replace front lower control arm', 90, NULL, NULL),
  ('Control Arm Replacement — Rear Lower', 'Арын доод удирдлагын гар солих', 'Suspension', 'Replace rear lower control arm', 90, NULL, NULL),
  ('Ball Joint Replacement — Front Lower', 'Урд доод бөмбөлөг нугас солих', 'Suspension', 'Replace front lower ball joint', 60, NULL, NULL),
  ('Ball Joint Replacement — Front Upper', 'Урд дээд бөмбөлөг нугас солих', 'Suspension', 'Replace front upper ball joint', 60, NULL, NULL),
  ('Tie Rod End Replacement — Outer', 'Гадна татуургын төгсгөл солих', 'Suspension', 'Replace outer tie rod end', 45, NULL, NULL),
  ('Tie Rod End Replacement — Inner', 'Дотор татуургын төгсгөл солих', 'Suspension', 'Replace inner tie rod end', 45, NULL, NULL),
  ('Sway Bar Link Replacement', 'Тэнцвэржүүлэгч холбогч солих', 'Suspension', 'Replace stabilizer/sway bar link', 30, NULL, NULL),
  ('Sway Bar Bushing Replacement', 'Тэнцвэржүүлэгчийн сайлентблок солих', 'Suspension', 'Replace sway bar bushings', 30, NULL, NULL),
  ('Wheel Bearing Replacement — Front', 'Урд дугуйн холхивч солих', 'Suspension', 'Replace front wheel hub bearing', 90, NULL, 100000),
  ('Wheel Bearing Replacement — Rear', 'Арын дугуйн холхивч солих', 'Suspension', 'Replace rear wheel hub bearing', 60, NULL, 120000),
  ('Control Arm Bushing Replacement', 'Удирдлагын гарны сайлентблок солих', 'Suspension', 'Replace control arm bushings', 60, NULL, NULL),
  ('Strut Mount Replacement', 'Струтын суурь солих', 'Suspension', 'Replace strut mount/bearing', 45, NULL, NULL),
  ('Air Suspension Strut Replacement', 'Агаарын түдгэлзүүрийн струт солих', 'Suspension', 'Replace air spring/strut assembly', 120, NULL, NULL),
  ('Air Suspension Compressor Replacement', 'Агаарын компрессор солих', 'Suspension', 'Replace air suspension compressor', 120, NULL, NULL);

-- ── Diagnostics ───────────────────────────────────────────────
INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('Computer Diagnostics (OBD-II)', 'Компьютер оношлогоо (OBD-II)', 'Diagnostics', 'OBD-II scan + live data analysis', 30, NULL, NULL),
  ('Advanced Computer Diagnostics', 'Нарийвчилсан компьютер оношлогоо', 'Diagnostics', 'Deep scan with component activation test', 60, NULL, NULL),
  ('Electrical System Diagnostics', 'Цахилгаан системийн оношлогоо', 'Diagnostics', 'Full electrical system diagnosis', 60, NULL, NULL),
  ('AC System Diagnostics', 'Агааржуулалтын оношлогоо', 'Diagnostics', 'AC performance test + leak check', 45, NULL, NULL),
  ('Engine Compression Test', 'Хөдөлгүүрийн шахалтын шалгалт', 'Diagnostics', 'Cylinder compression test (all cylinders)', 45, NULL, NULL),
  ('Leak Down Test', 'Алдагдлын шалгалт', 'Diagnostics', 'Cylinder leak down test', 45, NULL, NULL),
  ('Smoke Test (Vacuum/Exhaust Leak)', 'Утааны шалгалт (Агаар/Угаар алдалт)', 'Diagnostics', 'Smoke test for intake/exhaust/vacuum leaks', 30, NULL, NULL),
  ('Fuel System Pressure Test', 'Түлшний даралтын шалгалт', 'Diagnostics', 'Test fuel pressure and volume', 30, NULL, NULL),
  ('Battery & Charging System Test', 'Аккумулятор ба цэнэглэлтийн шалгалт', 'Diagnostics', 'Load test battery, alternator, starter', 15, NULL, NULL),
  ('Check Engine Light Diagnostic', 'Хөдөлгүүрийн гэрэл шатсан — Оношлогоо', 'Diagnostics', 'Diagnose CEL / MIL fault code', 30, NULL, NULL),
  ('Suspension / Steering Noise Diagnostic', 'Түдгэлзүүр/Удирдлагын чимээ оношлогоо', 'Diagnostics', 'Inspect and diagnose suspension noises', 30, NULL, NULL);

-- ── AC & Heating Services ─────────────────────────────────────
INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('AC Refill — R134a', 'Кондишннер хий дүүргэх — R134a', 'AC System', 'Vacuum + recharge R134a refrigerant', 45, 24, NULL),
  ('AC Refill — R1234yf', 'Кондишннер хий дүүргэх — R1234yf', 'AC System', 'Vacuum + recharge R1234yf refrigerant', 45, 24, NULL),
  ('AC Compressor Replacement', 'Кондишннер компрессор солих', 'AC System', 'Replace AC compressor + recharge', 120, NULL, NULL),
  ('AC Condenser Replacement', 'Кондишннер конденсор солих', 'AC System', 'Replace AC condenser + recharge', 90, NULL, NULL),
  ('AC Evaporator Replacement', 'Кондишннер ууршуулагч солих', 'AC System', 'Replace AC evaporator (dash removal)', 240, NULL, NULL),
  ('AC Expansion Valve Replacement', 'Өргөтгөх хавхлага солих', 'AC System', 'Replace AC expansion valve', 90, NULL, NULL),
  ('AC Receiver Drier Replacement', 'Хуурайшуулагч солих', 'AC System', 'Replace AC receiver drier/accumulator', 60, NULL, NULL),
  ('AC Hose Replacement', 'Кондишннер шланг солих', 'AC System', 'Replace AC hose (high or low side)', 60, NULL, NULL),
  ('AC Leak Check + UV Dye', 'Кондишннерийн алдагдал шалгах', 'AC System', 'Leak check with UV dye injection', 30, NULL, NULL),
  ('Heater Core Replacement', 'Халаагуурын гол солих', 'AC System', 'Replace heater core (dash removal required)', 240, NULL, NULL),
  ('Blower Motor Replacement', 'Сэнсний мотор солих', 'AC System', 'Replace HVAC blower motor', 60, NULL, NULL),
  ('Blower Motor Resistor Replacement', 'Сэнсний резистор солих', 'AC System', 'Replace blower motor resistor/module', 20, NULL, NULL);

-- ── Electrical Services ───────────────────────────────────────
INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('Alternator Replacement', 'Генератор солих', 'Electrical', 'Replace charging alternator', 60, NULL, 150000),
  ('Starter Motor Replacement', 'Эхлүүлэгч мотор солих', 'Electrical', 'Replace starter motor', 60, NULL, NULL),
  ('Battery Cable Replacement', 'Аккумуляторын утас солих', 'Electrical', 'Replace positive/negative battery cable', 30, NULL, NULL),
  ('Power Window Motor Replacement', 'Цонхны мотор солих', 'Electrical', 'Replace power window motor (one door)', 45, NULL, NULL),
  ('Window Regulator Replacement', 'Цонхны өргөгч солих', 'Electrical', 'Replace window regulator assembly', 45, NULL, NULL),
  ('Door Lock Actuator Replacement', 'Хаалганы түгжээ солих', 'Electrical', 'Replace power door lock actuator', 45, NULL, NULL),
  ('Headlight Bulb Replacement', 'Урд гэрлийн чийдэн солих', 'Electrical', 'Replace headlight bulb', 15, NULL, NULL),
  ('Headlight Assembly Replacement', 'Урд гэрлийн угсрагдал солих', 'Electrical', 'Replace complete headlight unit', 30, NULL, NULL),
  ('Tail Light Assembly Replacement', 'Арын гэрлийн угсрагдал солих', 'Electrical', 'Replace rear tail light assembly', 20, NULL, NULL),
  ('Fuse Box / Relay Replacement', 'Гал хамгаалагч / Реле солих', 'Electrical', 'Diagnose and replace faulty fuse or relay', 15, NULL, NULL),
  ('Starter Relay / Ignition Switch Diagnosis', 'Эхлүүлэгчийн реле оношлогоо', 'Electrical', 'Diagnose no-crank electrical issue', 30, NULL, NULL),
  ('Wiring Harness Repair', 'Утасны бүрдэл засах', 'Electrical', 'Repair damaged wiring harness section', 60, NULL, NULL),
  ('Side Mirror Replacement (Electric)', 'Цахилгаан толь солих', 'Electrical', 'Replace power side mirror', 30, NULL, NULL),
  ('Parking Sensor Installation', 'Зогсоолын мэдрэгч суурилуулах', 'Electrical', 'Install aftermarket parking sensor kit', 120, NULL, NULL);

-- ── Exhaust Services ──────────────────────────────────────────
INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('Catalytic Converter Replacement', 'Каталитик шүүлтүүр солих', 'Exhaust', 'Replace catalytic converter', 90, NULL, 150000),
  ('Muffler Replacement', 'Дуу намсгагч солих', 'Exhaust', 'Replace muffler/silencer', 60, NULL, NULL),
  ('Exhaust Pipe Replacement', 'Угаарын хоолой солих', 'Exhaust', 'Replace exhaust pipe section', 45, NULL, NULL),
  ('Oxygen Sensor Replacement', 'Хүчилтөрөгчийн мэдрэгч солих', 'Exhaust', 'Replace O2 lambda sensor', 30, NULL, 100000),
  ('Exhaust Manifold Replacement', 'Угаарын коллектор солих', 'Exhaust', 'Replace exhaust manifold', 120, NULL, NULL),
  ('Exhaust Hanger Replacement', 'Угаарын өлгүүр солих', 'Exhaust', 'Replace rubber exhaust hangers', 15, NULL, NULL),
  ('DPF Regeneration / Cleaning', 'DPF цэвэрлэгээ', 'Exhaust', 'Diesel particulate filter forced regen', 60, NULL, NULL),
  ('Exhaust Leak Repair', 'Угаарын алдагдал засах', 'Exhaust', 'Weld/seal exhaust system leak', 30, NULL, NULL),
  ('EGR Valve Cleaning/Replacement', 'EGR хавхлага цэвэрлэх/солих', 'Exhaust', 'Clean or replace EGR valve', 60, NULL, 80000);

-- ── Steering Services ─────────────────────────────────────────
INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('Power Steering Pump Replacement', 'Удирдлагын шахуурга солих', 'Steering', 'Replace power steering pump', 90, NULL, NULL),
  ('Steering Rack Replacement', 'Удирдлагын тросс солих', 'Steering', 'Replace steering rack assembly', 180, NULL, NULL),
  ('Steering Rack Seal Repair', 'Удирдлагын тросын чигжээс засвар', 'Steering', 'Replace steering rack seals/bellows', 120, NULL, NULL),
  ('Steering Hose Replacement', 'Удирдлагын шланг солих', 'Steering', 'Replace power steering hose (pressure/return)', 45, NULL, NULL),
  ('Clock Spring Replacement', 'Клок спринг солих', 'Steering', 'Replace steering wheel clock spring', 45, NULL, NULL),
  ('Steering Column Bearing Replacement', 'Удирдлагын баганын холхивч солих', 'Steering', 'Replace steering column bearing', 60, NULL, NULL),
  ('Power Steering Fluid Flush', 'Удирдлагын тос солих', 'Steering', 'Flush and replace power steering fluid', 30, 24, NULL);

-- ── Transmission & Drivetrain Services ────────────────────────
INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('Clutch Kit Replacement', 'Муфтны багц солих', 'Transmission', 'Replace clutch disc, pressure plate, bearing', 240, NULL, 100000),
  ('Clutch Master Cylinder Replacement', 'Муфтын үндсэн шахуурга солих', 'Transmission', 'Replace clutch master cylinder', 60, NULL, NULL),
  ('Clutch Slave Cylinder Replacement', 'Муфтын дугарах шахуурга солих', 'Transmission', 'Replace clutch slave cylinder', 45, NULL, NULL),
  ('Flywheel Replacement', 'Нисдэг хүрд солих', 'Transmission', 'Replace flywheel (while doing clutch)', 60, NULL, NULL),
  ('CV Axle Replacement — Front', 'Урд CV тэнхлэг солих', 'Transmission', 'Replace front drive axle (one side)', 90, NULL, NULL),
  ('CV Axle Replacement — Rear', 'Арын CV тэнхлэг солих', 'Transmission', 'Replace rear drive axle (one side)', 90, NULL, NULL),
  ('CV Joint Boot Replacement', 'CV холбоосын бүрээс солих', 'Transmission', 'Replace CV boot + repack grease', 60, NULL, NULL),
  ('Transmission Mount Replacement', 'Хурдны хайрцгийн суурь солих', 'Transmission', 'Replace transmission mount', 60, NULL, NULL),
  ('Drive Shaft Center Bearing Replacement', 'Хөтөч босоо амны холхивч солих', 'Transmission', 'Replace drive shaft center bearing', 90, NULL, NULL);

-- ── Wheel & Tire Services ─────────────────────────────────────
INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('Tire Replacement (1)', 'Дугуй солих (1ш)', 'Wheels & Tires', 'Mount and balance one tire', 20, NULL, NULL),
  ('Tire Replacement (4)', 'Дугуй солих (4ш)', 'Wheels & Tires', 'Mount and balance four tires', 60, NULL, NULL),
  ('Tire Rotation', 'Дугуй эргүүлэх', 'Wheels & Tires', 'Rotate tire positions for even wear', 30, 6, 10000),
  ('Wheel Balancing (4)', 'Дугуй тэнцвэржүүлэх (4ш)', 'Wheels & Tires', 'Balance all four wheel assemblies', 30, NULL, NULL),
  ('Wheel Alignment — Front', 'Урд дугуйн зүү чигжих', 'Wheels & Tires', 'Front toe and camber alignment', 45, NULL, NULL),
  ('Wheel Alignment — 4-Wheel', 'Дугуйн зүү чигжих (4 дугуй)', 'Wheels & Tires', 'Four-wheel alignment — toe, camber, caster', 60, NULL, 20000),
  ('Flat Tire Repair (Patch)', 'Дугуйн цоорол засвар (Хөвөөлөх)', 'Wheels & Tires', 'Patch/plug flat tire repair', 20, NULL, NULL),
  ('TPMS Sensor Replacement', 'Даралтын мэдрэгч солих', 'Wheels & Tires', 'Replace TPMS sensor', 30, NULL, NULL),
  ('TPMS Sensor Programming', 'Даралтын мэдрэгч тохируулах', 'Wheels & Tires', 'Program/learn new TPMS sensor', 15, NULL, NULL),
  ('Wheel Lug Nut / Stud Replacement', 'Дугуйн толгой ба бэхэлгээ солих', 'Wheels & Tires', 'Replace damaged wheel studs or lug nuts', 30, NULL, NULL);

-- ── Body & Glass Services ─────────────────────────────────────
INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('Windshield Replacement', 'Салхины шил солих', 'Body', 'Replace front windshield', 120, NULL, NULL),
  ('Side Window Regulator Replacement', 'Цонхны өргөгч солих', 'Body', 'Replace window regulator assembly', 45, NULL, NULL),
  ('Door Handle Replacement (Exterior)', 'Гадна хаалганы бариул солих', 'Body', 'Replace exterior door handle', 30, NULL, NULL),
  ('Door Weatherstrip Replacement', 'Хаалганы чигжээс солих', 'Body', 'Replace door rubber seal/weatherstrip', 45, NULL, NULL),
  ('Side Mirror Glass Replacement', 'Толины шил солих', 'Body', 'Replace mirror glass only', 15, NULL, NULL),
  ('Hood Strut Replacement', 'Мотоны өргөгч солих', 'Body', 'Replace hood gas strut (pair)', 15, NULL, NULL),
  ('Trunk Strut Replacement', 'Тээшийн өргөгч солих', 'Body', 'Replace trunk gas strut (pair)', 15, NULL, NULL);

-- ── Inspection & Comprehensive Services ───────────────────────
INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('Full Vehicle Inspection (50+ Points)', 'Иж бүрэн үзлэг (50+ цэг)', 'Inspection', 'Comprehensive vehicle inspection checklist', 60, 6, 10000),
  ('Pre-Purchase Inspection', 'Худалдан авахаас өмнөх үзлэг', 'Inspection', 'Full inspection for potential vehicle buyer', 120, NULL, NULL),
  ('Pre-Winter Inspection', 'Өвлийн өмнөх үзлэг', 'Inspection', 'Winter readiness check — battery, coolant, tires', 45, NULL, NULL),
  ('Pre-Summer Inspection', 'Зуны өмнөх үзлэг', 'Inspection', 'Summer readiness — AC, coolant, tires', 45, NULL, NULL),
  ('Brake Inspection', 'Тоормосны үзлэг', 'Inspection', 'Inspect pads, rotors, lines, fluid', 15, NULL, NULL),
  ('Multi-Point Safety Check', 'Олон цэгийн аюулгүй байдлын шалгалт', 'Inspection', 'Safety inspection — brakes, lights, suspension, tires', 30, NULL, NULL),
  ('Timing Belt Service (Complete)', 'Цагийн бүс засвар (Бүрэн)', 'Maintenance', 'Timing belt + water pump + tensioner + idler', 240, NULL, 100000),
  ('Major Service — 60,000km', 'Том засвар — 60,000км', 'Maintenance', 'Oil, filters, spark plugs, belts, fluids check', 120, NULL, 60000),
  ('Major Service — 100,000km', 'Том засвар — 100,000км', 'Maintenance', 'Timing belt, water pump, all fluids, spark plugs', 300, NULL, 100000);

-- ═══════════════════════════════════════════════════════════════
-- Count verification
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE
  part_count INT;
  service_count INT;
BEGIN
  SELECT COUNT(*) INTO part_count FROM global_parts_catalog;
  SELECT COUNT(*) INTO service_count FROM global_services_catalog;
  RAISE NOTICE 'Global catalog seeded: % parts, % services', part_count, service_count;
END $$;
