-- ============================================================================
-- Migration: Expand global catalogs with missing services and parts
-- Adds: Cleaning, Paint/Body, Roadside services + missing parts
-- ============================================================================

-- ── Cleaning Services (Цэвэрлэгээ) ─────────────────────────────────────────

INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('Exterior Wash', 'Гадаад угаалга', 'Cleaning', 'Basic exterior wash with soap and rinse', 30, NULL, NULL),
  ('Interior Detailing', 'Дотоод цэвэрлэгээ', 'Cleaning', 'Full interior vacuum, shampoo, wipe down', 120, NULL, NULL),
  ('Full Detail Package', 'Бүрэн цэвэрлэгээ', 'Cleaning', 'Complete interior + exterior detail', 240, NULL, NULL),
  ('Engine Bay Cleaning', 'Хөдөлгүүрийн тасалгаа цэвэрлэгээ', 'Cleaning', 'Degrease and wash engine compartment', 60, NULL, NULL),
  ('Odor Removal / Ozone Treatment', 'Анхилуун үнэртэй цэвэрлэгээ', 'Cleaning', 'Ozone treatment to eliminate odors', 90, NULL, NULL),
  ('Stain Removal', 'Шатсан толбыг арилгах', 'Cleaning', 'Remove stubborn stains from upholstery', 60, NULL, NULL),
  ('Wax / Sealant Application', 'Лак хамгаалах бүрхүүл', 'Cleaning', 'Apply wax or paint sealant for protection', 60, NULL, NULL),
  ('Ceramic Coating', 'Керамик бүрхүүл', 'Cleaning', 'Apply ceramic coating for long-term paint protection', 360, NULL, NULL),
  ('Paint Protection Film (PPF)', 'Бүрхүүл хамгаалах кино', 'Cleaning', 'Apply PPF to protect paint from chips and scratches', 480, NULL, NULL),
  ('Window Tinting', 'Хуруум шилний хамгаалалт', 'Cleaning', 'Apply window tint film', 180, NULL, NULL),
  ('Underbody Wash', 'Доод угаалга', 'Cleaning', 'High-pressure undercarriage wash', 20, NULL, NULL),
  ('Wash & Wax Package', 'Угаалга + арчилгаа', 'Cleaning', 'Exterior wash followed by wax application', 60, NULL, NULL),
  ('Leather Conditioning', 'Арьсан арчилгаа', 'Cleaning', 'Clean and condition leather seats', 60, NULL, NULL),
  ('Headlight Restoration', 'Гэрлийн нүх цэвэрлэгээ', 'Cleaning', 'Restore cloudy/yellowed headlight lenses', 45, NULL, NULL),
  ('Convertible Top Cleaning', 'Зөөлөн дээвэр цэвэрлэгээ', 'Cleaning', 'Clean and treat soft top / convertible roof', 60, NULL, NULL)
ON CONFLICT DO NOTHING;

-- ── Paint & Body Services (Бүрхүүл) ────────────────────────────────────────

INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('Paintless Dent Removal (PDR)', 'Засварлах (Дент арилгах)', 'Paint & Body', 'Remove dents without repainting', 120, NULL, NULL),
  ('Full Panel Paint', 'Бүтэн панель будалт', 'Paint & Body', 'Paint one full body panel', 240, NULL, NULL),
  ('Bumper Repair & Paint', 'Мөрөн засварлах', 'Paint & Body', 'Repair and paint bumper damage', 180, NULL, NULL),
  ('Paint Correction / Polishing', 'Лак цэвэрлэх', 'Paint & Body', 'Machine polish to remove swirl marks and scratches', 180, NULL, NULL),
  ('Windshield Replacement', 'Салхины шил солих', 'Paint & Body', 'Remove and replace windshield glass', 90, NULL, NULL),
  ('Side Window Replacement', 'Хажуугийн шил солих', 'Paint & Body', 'Replace door glass', 60, NULL, NULL),
  ('Rear Window Replacement', 'Арын шил солих', 'Paint & Body', 'Replace rear windshield glass', 60, NULL, NULL),
  ('Mirror Glass Replacement', 'Толийн шил солих', 'Paint & Body', 'Replace broken mirror glass', 15, NULL, NULL),
  ('Door Handle Replacement', 'Хаалганы бариул солих', 'Paint & Body', 'Replace interior or exterior door handle', 30, NULL, NULL),
  ('Weatherstrip Replacement', 'Хүрэн утас солих', 'Paint & Body', 'Replace door/window weather seals', 45, NULL, NULL),
  ('Mud Flap Installation', 'Лянхуа суулгах', 'Paint & Body', 'Install mud flaps / splash guards', 20, NULL, NULL),
  ('Trunk / Hood Strut Replacement', 'Багажны хаалганы түшүүр солих', 'Paint & Body', 'Replace gas struts for trunk or hood', 20, NULL, NULL),
  ('Full Body Paint', 'Бүтэн машин будалт', 'Paint & Body', 'Complete vehicle repaint', 1440, NULL, NULL),
  ('Rust Treatment', 'Зэврэлт эмчилгээ', 'Paint & Body', 'Treat and prevent rust spots', 120, NULL, NULL),
  ('Plastic Trim Restoration', 'Пластик засварлах', 'Paint & Body', 'Restore faded black plastic trim', 60, NULL, NULL)
ON CONFLICT DO NOTHING;

-- ── Roadside / Additional Services (Нэмэлт) ───────────────────────────────

INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('Towing Service', 'Машин тээвэрлэх', 'Additional', 'Tow vehicle to garage or destination', 60, NULL, NULL),
  ('Jump Start / Battery Boost', 'Аккумулятор цэнэглэх', 'Additional', 'Jump start a dead battery', 15, NULL, NULL),
  ('Fuel Delivery', 'Түлш хүргэх', 'Additional', 'Deliver emergency fuel to stranded vehicle', 30, NULL, NULL),
  ('Tire Change (Spare)', 'Нэмэлт дугуй солих', 'Additional', 'Install spare tire on roadside', 20, NULL, NULL),
  ('Lockout Service', 'Хаалга онгойлгох', 'Additional', 'Unlock vehicle when keys are locked inside', 20, NULL, NULL),
  ('Winch / Recovery', 'Ачааны машин аврах', 'Additional', 'Winch stuck vehicle out of mud/snow', 45, NULL, NULL)
ON CONFLICT DO NOTHING;

-- ── Additional Engine Services ─────────────────────────────────────────────

INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('Engine Rebuild', 'Хөдөлгүүр засварлах', 'Engine', 'Full engine teardown and rebuild', 1440, NULL, NULL),
  ('Turbo Rebuild / Replacement', 'Турбо засварлах', 'Engine', 'Rebuild or replace turbocharger', 360, NULL, NULL),
  ('Compression Test', 'Компрессор шалгах', 'Engine', 'Dry and wet compression test on all cylinders', 60, NULL, NULL),
  ('Oil Pressure Test', 'Тосны даралт шалгах', 'Engine', 'Measure oil pressure at idle and high RPM', 30, NULL, NULL),
  ('Emissions Test', 'Газын утаас шалгах', 'Engine', 'Test exhaust emissions against standards', 30, NULL, NULL),
  ('Valve Adjustment', 'Клапан тохируулах', 'Engine', 'Adjust valve clearances (shim or rocker)', 120, NULL, NULL),
  ('Head Gasket Replacement', 'Цилинрийн толийн жийргэвч солих', 'Engine', 'Replace blown head gasket', 480, NULL, NULL),
  ('Intake Manifold Replacement', 'Оролтын коллектор солих', 'Engine', 'Remove and replace intake manifold', 120, NULL, NULL),
  ('Exhaust Manifold Replacement', 'Гаралтын коллектор солих', 'Engine', 'Remove and replace exhaust manifold', 120, NULL, NULL),
  ('Engine Mount Replacement', 'Хөдөлгүүрийн суурь солих', 'Engine', 'Replace engine mount(s)', 120, NULL, NULL),
  ('PCV Valve Replacement', 'PCV хавхлага солих', 'Engine', 'Replace positive crankcase ventilation valve', 15, NULL, NULL),
  ('Thermostat Replacement', 'Термостат солих', 'Engine', 'Replace engine coolant thermostat', 60, NULL, NULL)
ON CONFLICT DO NOTHING;

-- ── Additional Electrical Services ─────────────────────────────────────────

INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('ECU Programming / Tuning', 'ECU уншиж тохируулах', 'Electrical', 'Read, flash, or tune engine control unit', 90, NULL, NULL),
  ('Key Programming', 'Түлхүүр хуулбарлах', 'Electrical', 'Program new key / transponder / smart key', 60, NULL, NULL),
  ('Backup Camera Installation', 'Камерийн систем суулгах', 'Electrical', 'Install rearview or 360° camera system', 180, NULL, NULL),
  ('Headlight Alignment', 'Гэрлийн тохиргоо', 'Electrical', 'Aim headlight beams to correct angle', 30, NULL, NULL),
  ('Horn Replacement', 'Дуут систем солих', 'Electrical', 'Replace vehicle horn', 20, NULL, NULL),
  ('Power Window Motor Replacement', 'Цонхны мотор солих', 'Electrical', 'Replace power window regulator/motor', 60, NULL, NULL),
  ('Power Lock Actuator Replacement', 'Хаалганы мотор солих', 'Electrical', 'Replace door lock actuator', 45, NULL, NULL),
  ('Mirror Motor Replacement', 'Толины мотор солих', 'Electrical', 'Replace power mirror motor/assembly', 45, NULL, NULL),
  ('Seat Heater Element Replacement', 'Суудлын халаагуур солих', 'Electrical', 'Replace seat heating element', 60, NULL, NULL),
  ('Aftermarket Stereo Installation', 'Чигжүүр суулгах', 'Electrical', 'Install aftermarket head unit / stereo', 120, NULL, NULL),
  ('Dashcam Installation', 'Бичлэгийн камер суулгах', 'Electrical', 'Install front and/or rear dashcam', 60, NULL, NULL),
  ('Parking Sensor Installation', 'Паркинг мэдрэгч суулгах', 'Electrical', 'Install ultrasonic parking sensors', 90, NULL, NULL)
ON CONFLICT DO NOTHING;

-- ── Additional Tire & Wheel Services ───────────────────────────────────────

INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('TPMS Sensor Reset', 'Дугуйн даралт мэдрэгч тохируулах', 'Wheel & Tire', 'Reset tire pressure monitoring system', 15, NULL, NULL),
  ('TPMS Sensor Replacement', 'Дугуйн даралт мэдрэгч солих', 'Wheel & Tire', 'Replace faulty TPMS sensor', 30, NULL, NULL),
  ('Wheel Alignment (4-wheel)', 'Дугуйн зүсэлт (4 дугуй)', 'Wheel & Tire', 'Four-wheel computer alignment', 60, NULL, NULL),
  ('Wheel Alignment (2-wheel)', 'Дугуйн зүсэлт (2 дугуй)', 'Wheel & Tire', 'Front two-wheel alignment', 30, NULL, NULL),
  ('Wheel Balancing', 'Дугуйн баланс', 'Wheel & Tire', 'Balance wheel and tire assembly', 20, NULL, NULL),
  ('Tire Rotation', 'Дугуйн ээлжлэлт', 'Wheel & Tire', 'Rotate tires front-to-back / side-to-side', 20, 6, 10000),
  ('Flat Tire Repair', 'Дугуйн засвар', 'Wheel & Tire', 'Patch or plug punctured tire', 20, NULL, NULL),
  ('Rim Repair / Straightening', 'Хэрм засварлах', 'Wheel & Tire', 'Repair bent or damaged alloy rim', 60, NULL, NULL),
  ('Rim Powder Coating', 'Хэрм будалт', 'Wheel & Tire', 'Powder coat wheels for custom finish', 240, NULL, NULL),
  ('Spare Tire Inspection', 'Нэмэлт дугуй шалгах', 'Wheel & Tire', 'Inspect and inflate spare tire', 10, NULL, NULL)
ON CONFLICT DO NOTHING;

-- ── Additional Diagnostics Services ────────────────────────────────────────

INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('ADAS Calibration', 'ADAS тохиргоо', 'Diagnostics', 'Recalibrate advanced driver assistance cameras/sensors', 120, NULL, NULL),
  ('Battery Capacity Test', 'Аккумулятор багтаамж шалгах', 'Diagnostics', 'Conductance test to measure battery health', 15, NULL, NULL),
  ('Cooling System Pressure Test', 'Хөргөлтийн системийн даралт шалгалт', 'Diagnostics', 'Pressure test cooling system for leaks', 20, NULL, NULL),
  ('Fuel Injector Testing', 'Түлшний шүүрүүр шалгах', 'Diagnostics', 'Flow test and clean fuel injectors', 60, NULL, NULL),
  ('Wheel Bearing Noise Diagnosis', 'Дугуйн ачааны шалгалт', 'Diagnostics', 'Diagnose wheel bearing noise and play', 30, NULL, NULL),
  ('Electrical Draw Test', 'Цахилгаан зарцуулалт шалгах', 'Diagnostics', 'Find parasitic battery drain', 60, NULL, NULL)
ON CONFLICT DO NOTHING;

-- ── Additional Transmission Services ───────────────────────────────────────

INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('Transmission Flush', 'Хурдны хайрцгийн цэвэрлэгээ', 'Transmission & Drivetrain', 'Full transmission flush and fluid replacement', 90, NULL, 50000),
  ('CV Boot Replacement', 'CV утасны бүрхүүл солих', 'Transmission & Drivetrain', 'Replace torn CV joint boot', 60, NULL, NULL),
  ('Drive Shaft Balance', 'Дамжуулагчийн баланс', 'Transmission & Drivetrain', 'Balance propeller/driveshaft', 60, NULL, NULL),
  ('Transfer Case Fluid Change', 'Шилжүүрийн хайрцгийн тос солих', 'Transmission & Drivetrain', 'Change transfer case fluid (4WD/AWD)', 30, NULL, 50000),
  ('Transmission Mount Replacement', 'Хурдны хайрцгийн суурь солих', 'Transmission & Drivetrain', 'Replace transmission mount', 90, NULL, NULL),
  ('Clutch Hydraulic Bleed', 'Компакт гидравлик цэвэрлэгээ', 'Transmission & Drivetrain', 'Bleed clutch hydraulic system', 30, NULL, NULL)
ON CONFLICT DO NOTHING;

-- ── Additional AC & Heating Services ───────────────────────────────────────

INSERT INTO global_services_catalog (name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km) VALUES
  ('AC Performance Check', 'Агааржуулалтын шалгалт', 'AC & Heating', 'Check AC system performance and pressures', 30, NULL, NULL),
  ('Cabin Filter Upgrade (HEPA)', 'Салонны шүүлтүүр (HEPA)', 'AC & Heating', 'Install HEPA cabin filter upgrade', 10, NULL, 15000),
  ('Heater Core Replacement', 'Халаагуурын цөм солих', 'AC & Heating', 'Replace heater core (dash removal required)', 480, NULL, NULL),
  ('Blower Motor Replacement', 'Салонны сэнсний мотор солих', 'AC & Heating', 'Replace HVAC blower motor', 60, NULL, NULL),
  ('AC Compressor Clutch Replacement', 'Агааржуулалтын компрессорын зүүлт солих', 'AC & Heating', 'Replace AC compressor clutch assembly', 120, NULL, NULL)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTS
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Cleaning Supplies & Chemicals ──────────────────────────────────────────

INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Car Wash Soap', 'Машин угаалгын саван', NULL, 'Cleaning', 'pH-neutral car wash shampoo', 'liter'),
  ('Interior Cleaner', 'Дотоод цэвэрлэгээч', NULL, 'Cleaning', 'All-purpose interior cleaning solution', 'liter'),
  ('Glass Cleaner', 'Шил цэвэрлэгээч', NULL, 'Cleaning', 'Auto glass cleaning solution', 'liter'),
  ('Leather Cleaner & Conditioner', 'Арьсан цэвэрлэгээч', NULL, 'Cleaning', 'Clean and condition leather surfaces', 'liter'),
  ('Dashboard Protectant', 'Аяганы хамгаалагч', NULL, 'Cleaning', 'UV protectant for dashboard and trim', 'liter'),
  ('Tire Shine / Dressing', 'Дугуйн гялалзуулагч', NULL, 'Cleaning', 'Tire sidewall dressing for showroom finish', 'liter'),
  ('Clay Bar Kit', 'Шавар кит', NULL, 'Cleaning', 'Detailing clay bar for paint decontamination', 'set'),
  ('Microfiber Towels (Pack)', 'Микроfiber алчуур (10ш)', NULL, 'Cleaning', 'Pack of 10 microfiber detailing towels', 'set'),
  ('Foam Cannon Soap', 'Дуслын саван', NULL, 'Cleaning', 'High-foam soap for foam cannon application', 'liter'),
  ('Ceramic Coating Kit', 'Керамик бүрхүүл кит', NULL, 'Cleaning', 'Professional ceramic coating with applicator', 'set'),
  ('PPF Sheet (Roll)', 'Бүрхүүл хамгаалах кино (ролик)', NULL, 'Cleaning', 'Paint protection film roll (2m x 10m)', 'piece'),
  ('Window Tint Film (Roll)', 'Хуруум шилний кино (ролик)', NULL, 'Cleaning', 'Window tint film roll (1.5m x 10m)', 'piece'),
  ('Ozone Generator Rental', 'Озоны генератор түрээс', NULL, 'Cleaning', 'Ozone machine for odor elimination', 'piece'),
  ('Polish Compound', 'Полиш нэгдэл', NULL, 'Cleaning', 'Cutting / finishing polish compound', 'liter'),
  ('Pad (Polishing)', 'Полиш дэр', NULL, 'Cleaning', 'Foam or wool polishing pad', 'piece')
ON CONFLICT DO NOTHING;

-- ── Hoses & Lines (missing) ───────────────────────────────────────────────

INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Upper Radiator Hose', 'Дээд радиаторын шланг', NULL, 'Cooling', 'Upper radiator coolant hose', 'piece'),
  ('Lower Radiator Hose', 'Доод радиаторын шланг', NULL, 'Cooling', 'Lower radiator coolant hose', 'piece'),
  ('Heater Hose', 'Халаагуурын шланг', NULL, 'Cooling', 'Heater core coolant hose', 'piece'),
  ('Coolant Bypass Hose', 'Хөргөлтийн шланг', NULL, 'Cooling', 'Coolant bypass / return hose', 'piece'),
  ('Radiator Cap', 'Радиаторын даралтын таг', NULL, 'Cooling', 'Pressurized radiator cap', 'piece'),
  ('Coolant Overflow Tank', 'Хөргөлтийн сав', NULL, 'Cooling', 'Coolant expansion / overflow tank', 'piece'),
  ('Fuel Hose (In--tank)', 'Түлшний шланг (дотор)', NULL, 'Engine', 'Submersible fuel hose for in-tank pump', 'meter'),
  ('Fuel Hose (Engine Bay)', 'Түлшний шланг (хөдөлгүүр)', NULL, 'Engine', 'Fuel line for engine bay routing', 'meter'),
  ('Brake Hose (Front)', 'Тормосны шланг (урд)', NULL, 'Brakes', 'Flexible brake hose, front axle', 'piece'),
  ('Brake Hose (Rear)', 'Тормосны шланг (хойд)', NULL, 'Brakes', 'Flexible brake hose, rear axle', 'piece'),
  ('Brake Hard Line', 'Тормосны хатуу лаг', NULL, 'Brakes', 'Brake hard line / steel tube', 'meter'),
  ('Power Steering Hose (High)', 'Гарын хүрдний шланг (өндөр)', NULL, 'Steering', 'High-pressure power steering hose', 'piece'),
  ('Power Steering Hose (Return)', 'Гарын хүрдний шланг (буцах)', NULL, 'Steering', 'Return / low-pressure power steering hose', 'piece'),
  ('Transmission Cooler Line', 'Хурдны хайрцгийн хөргүүрийн шланг', NULL, 'Transmission', 'Transmission cooler / oil cooler line', 'piece'),
  ('Vacuum Hose', 'Вакуум шланг', NULL, 'Engine', 'Vacuum hose for various systems', 'meter'),
  ('Intercooler Hose', 'Интеркулер шланг', NULL, 'Engine', 'Turbo intercooler hose / pipe', 'piece'),
  ('Windshield Washer Hose', 'Шил арчигчийн шланг', NULL, 'Body', 'Washer fluid delivery hose', 'piece')
ON CONFLICT DO NOTHING;

-- ── Electrical Connectors & Switches ───────────────────────────────────────

INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Oxygen Sensor (Upstream)', 'Хүчилтөрөгчийн мэдрэгч (урд)', NULL, 'Engine', 'Upstream / pre-cat O2 sensor', 'piece'),
  ('Oxygen Sensor (Downstream)', 'Хүчилтөрөгчийн мэдрэгч (хойд)', NULL, 'Engine', 'Downstream / post-cat O2 sensor', 'piece'),
  ('Crankshaft Position Sensor', 'Мөрний байрлалын мэдрэгч', NULL, 'Engine', 'Crankshaft position sensor', 'piece'),
  ('Camshaft Position Sensor', 'Камшийфтын байрлалын мэдрэгч', NULL, 'Engine', 'Camshaft position sensor', 'piece'),
  ('Coolant Temperature Sensor', 'Хөргөлтийн температурын мэдрэгч', NULL, 'Engine', 'Engine coolant temperature sensor', 'piece'),
  ('Knock Sensor', 'Дуу чимээний мэдрэгч', NULL, 'Engine', 'Engine knock / detonation sensor', 'piece'),
  ('Vehicle Speed Sensor', 'Хурдын мэдрэгч', NULL, 'Engine', 'Vehicle speed sensor (VSS)', 'piece'),
  ('ABS Wheel Speed Sensor', 'ABS дугуйн хурдын мэдрэгч', NULL, 'Electrical', 'ABS wheel speed sensor', 'piece'),
  ('Ignition Coil', 'Игнитенийн бобин', NULL, 'Engine', 'Ignition coil pack', 'piece'),
  ('Coil-on-Plug Boot', 'Игнитенийн резин', NULL, 'Engine', 'Ignition coil rubber boot / sleeve', 'piece'),
  ('Starter Motor', 'Эхлүүлэгч мотор', NULL, 'Electrical', 'Starter motor assembly', 'piece'),
  ('Alternator', 'Гүйдэл үүсгүүр', NULL, 'Electrical', 'Alternator assembly', 'piece'),
  ('Window Switch (Driver)', 'Цонхны хяналтын товч (жолооч)', NULL, 'Electrical', 'Master window switch, driver side', 'piece'),
  ('Window Switch (Passenger)', 'Цонхны хяналтын товч (зочин)', NULL, 'Electrical', 'Window switch, passenger side', 'piece'),
  ('Door Lock Actuator', 'Хаалганы түгжээний мотор', NULL, 'Electrical', 'Power door lock actuator', 'piece'),
  ('Headlight Switch', 'Гэрлийн унтраалга', NULL, 'Electrical', 'Headlight on/off / dimmer switch', 'piece'),
  ('Wiper Switch', 'Шил арчигчийн унтраалга', NULL, 'Electrical', 'Wiper on/off / interval switch', 'piece'),
  ('Horn (Universal)', 'Дуут ( UNIVERSAL)', NULL, 'Electrical', 'Universal 12V horn', 'piece'),
  ('Relay (12V 30A)', 'Реле (12V 30A)', NULL, 'Electrical', 'Standard 12V 30A automotive relay', 'piece'),
  ('Fuse Box Cover', 'Нүүрний хамгаалагч', NULL, 'Electrical', 'Replacement fuse box cover', 'piece'),
  ('Fuse Assortment Kit', 'Нүүрний кит', NULL, 'Electrical', 'Assorted blade fuses (mini + standard)', 'set'),
  ('Electrical Tape (Roll)', 'Цахилгааны орооцог (ролик)', NULL, 'Consumables', 'PVC electrical insulation tape', 'piece'),
  ('Wire Connector Kit', 'Утасны холбогч кит', NULL, 'Consumables', 'Crimp connectors, butt splices, terminals', 'set'),
  ('Split Loom Tubing', 'Утасны хамгаалагч', NULL, 'Consumables', 'Split corrugated wire loom tubing', 'meter'),
  ('Solder Kit', 'Гар утасны кит', NULL, 'Consumables', 'Solder wire + flux paste', 'set'),
  ('Heat Shrink Tubing Kit', 'Дулааны хамгаалагч кит', NULL, 'Consumables', 'Assorted heat shrink tubing', 'set')
ON CONFLICT DO NOTHING;

-- ── Body Parts (missing) ──────────────────────────────────────────────────

INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Floor Mats (Rubber, Universal)', 'Хивс (Резин, универсал)', NULL, 'Body', 'Universal rubber floor mats (set of 4)', 'set'),
  ('Floor Mats (Carpet, Universal)', 'Хивс (Шаахай, универсал)', NULL, 'Body', 'Universal carpet floor mats (set of 4)', 'set'),
  ('Seat Covers (Universal)', 'Бүрхүүл (суудал, универсал)', NULL, 'Body', 'Universal seat cover set', 'set'),
  ('Car Cover (Indoor)', 'Машин бүрхүүл (дотор)', NULL, 'Body', 'Indoor dust-proof car cover', 'piece'),
  ('Car Cover (Outdoor)', 'Машин бүрхүүл (гадаа)', NULL, 'Body', 'Outdoor waterproof car cover', 'piece'),
  ('Sun Shade (Windshield)', 'Нарны сүүдэр (салхины шил)', NULL, 'Body', 'Foldable windshield sun shade', 'piece'),
  ('Steering Wheel Cover', 'Руль бүрхүүл', NULL, 'Body', 'Universal steering wheel cover', 'piece'),
  ('Antenna (Universal)', 'Антень (универсал)', NULL, 'Body', 'Universal replacement antenna', 'piece'),
  ('License Plate Frame', 'Улсын дугаарын хүрээ', NULL, 'Body', 'License plate mounting frame', 'piece'),
  ('License Plate Light', 'Улсын дугаарын гэрэл', NULL, 'Body', 'License plate illumination light', 'piece'),
  ('Tow Hook (Front)', 'Нүх (урд)', NULL, 'Body', 'Front tow hook / recovery point', 'piece'),
  ('Tow Hook (Rear)', 'Нүх (хойд)', NULL, 'Body', 'Rear tow hook / recovery point', 'piece'),
  ('Door Trim Clip', 'Хаалганы бүрхүүлийн хавчаар', NULL, 'Body', 'Interior door panel retaining clip', 'piece'),
  ('Fender Liner', 'Дугуйн хамгаалагч', NULL, 'Body', 'Inner fender liner / splash shield', 'piece'),
  ('Grille (Replacement)', 'Шүүлүүр (солих)', NULL, 'Body', 'Replacement front grille', 'piece'),
  ('Hood Insulation Pad', 'Хөдөлгүүрийн дулаалга', NULL, 'Body', 'Under-hood sound insulation pad', 'piece'),
  ('Trunk Mat', 'Багажны хивс', NULL, 'Body', 'Trunk / cargo area protective mat', 'piece'),
  ('Door Seal / Weatherstrip', 'Хаалганы бүрхүүл', NULL, 'Body', 'Replacement door rubber seal', 'meter'),
  ('Sound Deadening Mat', 'Дуу чимээний хамгаалалт', NULL, 'Body', 'Butyl sound deadening / vibration mat', 'piece'),
  ('Cup Holder Insert', 'Аяга тавиур', NULL, 'Body', 'Replacement cup holder insert / adapter', 'piece'),
  ('Ashtray (Universal)', 'Тамхины сав (универсал)', NULL, 'Body', 'Universal car ashtray', 'piece'),
  ('Garbage Can (Car)', 'Хогийн сав (машин)', NULL, 'Body', 'Mini car trash can', 'piece'),
  ('Phone Mount', 'Утасны тавиур', NULL, 'Body', 'Dashboard / vent phone mount', 'piece'),
  ('Dash Cam Mount', 'Бичлэгийн камерын тавиур', NULL, 'Body', 'Dashcam mounting bracket', 'piece'),
  ('Air Freshener (Clip)', 'Агаар шүүрүүр (хавчаар)', NULL, 'Body', 'Vent-clip car air freshener', 'piece'),
  ('Air Freshener (Hanging)', 'Агаар шүүрүүр (өлгөөтэй)', NULL, 'Body', 'Hanging car air freshener', 'piece'),
  ('Cargo Net', 'Ачааны сүлжээ', NULL, 'Body', 'Trunk cargo net / organizer', 'piece'),
  ('Roof Rack Cross Bars', 'Дээврийн тавиур', NULL, 'Body', 'Roof rack cross bars (pair)', 'set'),
  ('Bike Rack (Hitch)', 'Дугуйн тавиур (холбогч)', NULL, 'Body', 'Hitch-mounted bike carrier', 'piece'),
  ('Trunk Organizer', 'Багажны зохион байгуулагч', NULL, 'Body', 'Collapsible trunk storage organizer', 'piece')
ON CONFLICT DO NOTHING;

-- ── Hardware & Fasteners ───────────────────────────────────────────────────

INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Bolt M6x20 (Stainless)', 'Болт M6x20 (зэврэхгүй)', NULL, 'Consumables', 'M6 x 20mm stainless steel bolt', 'piece'),
  ('Bolt M8x25 (Stainless)', 'Болт M8x25 (зэврэхгүй)', NULL, 'Consumables', 'M8 x 25mm stainless steel bolt', 'piece'),
  ('Bolt M10x30 (Stainless)', 'Болт M10x30 (зэврэхгүй)', NULL, 'Consumables', 'M10 x 30mm stainless steel bolt', 'piece'),
  ('Nut M6 (Stainless)', 'Эрэг M6 (зэврэхгүй)', NULL, 'Consumables', 'M6 stainless steel hex nut', 'piece'),
  ('Nut M8 (Stainless)', 'Эрэг M8 (зэврэхгүй)', NULL, 'Consumables', 'M8 stainless steel hex nut', 'piece'),
  ('Nut M10 (Stainless)', 'Эрэг M10 (зэврэхгүй)', NULL, 'Consumables', 'M10 stainless steel hex nut', 'piece'),
  ('Washer M6 (Stainless)', 'Хавтан M6 (зэврэхгүй)', NULL, 'Consumables', 'M6 flat washer, stainless steel', 'piece'),
  ('Washer M8 (Stainless)', 'Хавтан M8 (зэврэхгүй)', NULL, 'Consumables', 'M8 flat washer, stainless steel', 'piece'),
  ('Washer M10 (Stainless)', 'Хавтан M10 (зэврэхгүй)', NULL, 'Consumables', 'M10 flat washer, stainless steel', 'piece'),
  ('Clip assortment kit (Automotive)', 'Хавчаар кит (автомашин)', NULL, 'Consumables', 'Assorted automotive trim clips and fasteners', 'set'),
  ('Push Pin Rivet Kit', 'Түрэх хавчаар кит', NULL, 'Consumables', 'Assorted push-pin rivets for body panels', 'set'),
  ('Zip Tie Assortment (UV-resistant)', 'Олгойн оосор ( нарны хамгаалалттай)', NULL, 'Consumables', 'UV-resistant cable ties, assorted sizes', 'set'),
  ('Hose Clamp Kit', 'Хавтангийн хавчаар кит', NULL, 'Consumables', 'Assorted stainless steel hose clamps', 'set'),
  ('Threadlocker (Blue, Medium)', 'Эрэгний пийс (цэнхэр)', NULL, 'Consumables', 'Medium-strength threadlocker (removable)', 'piece'),
  ('Threadlocker (Red, High)', 'Эрэгний пийс (улаан)', NULL, 'Consumables', 'High-strength threadlocker (permanent)', 'piece'),
  ('RTV Silicone Gasket Maker', 'Силикон жийргэвч', NULL, 'Consumables', 'RTV silicone sealant for gaskets', 'piece'),
  ('Penetrating Oil (WD-40 type)', 'Нэвтэрдэг тос', NULL, 'Consumables', 'Penetrating oil for rusted bolts', 'piece'),
  ('Brake Parts Cleaner', 'Тормосны цэвэрлэгээч', NULL, 'Consumables', 'Non-chlorinated brake cleaner spray', 'piece'),
  ('Contact Cleaner', 'Холбогч цэвэрлэгээч', NULL, 'Consumables', 'Electronic contact cleaner spray', 'piece'),
  ('Carburetor Cleaner', 'Карбюратор цэвэрлэгээч', NULL, 'Consumables', 'Carburetor and throttle body cleaner', 'piece'),
  ('Silicone Spray', 'Силикон цэвэрлэгээч', NULL, 'Consumables', 'Silicone lubricant spray for rubber and trim', 'piece'),
  ('Anti-seize Compound', 'Хөндийрөлтийн нэгдэл', NULL, 'Consumables', 'Anti-seize lubricant for bolts and threads', 'piece'),
  ('Copper Grease', 'Зэс тос', NULL, 'Consumables', 'Copper-based high-temperature grease', 'piece'),
  ('Dielectric Grease', 'Цахилгааны тос', NULL, 'Consumables', 'Dielectric grease for electrical connectors', 'piece'),
  ('Gloves (Nitrile, Box of 100)', 'Бээлий (нитрил, 100ш)', NULL, 'Consumables', 'Disposable nitrile gloves, medium', 'box'),
  ('Shop Towels (Roll)', 'Алчуур (ролик)', NULL, 'Consumables', 'Disposable shop towels / paper towels', 'roll'),
  ('Safety Glasses', 'Аюулгүйн нүдний шил', NULL, 'Consumables', 'Safety glasses / goggles', 'piece'),
  ('Fender Cover', 'Капотын хамгаалагч', NULL, 'Consumables', 'Magnetic fender cover to protect paint', 'piece'),
  ('Drain Pan', 'Тосны сав', NULL, 'Consumables', 'Oil drain pan with pour spout', 'piece'),
  ('Funnel Set', 'Шүүрүүрийн кит', NULL, 'Consumables', 'Assorted funnels for fluids', 'set'),
  ('Jack Stand (3-ton)', 'Түшүүр (3 тонн)', NULL, 'Consumables', 'Jack stand, 3-ton capacity', 'piece'),
  ('Torque Wrench', 'Хүчний хэрэгсэл', NULL, 'Consumables', 'Click-type torque wrench (40-200 Nm)', 'piece'),
  ('Wheel Lug Nut Set', 'Дугуйн эрэг кит', NULL, 'Wheels', 'Set of 20 wheel lug nuts', 'set'),
  ('Wheel Spacer (5mm)', 'Дугуйн зайн тавиур (5мм)', NULL, 'Wheels', '5mm wheel spacer / adapter', 'set'),
  ('Wheel Spacer (10mm)', 'Дугуйн зайн тавиур (10мм)', NULL, 'Wheels', '10mm wheel spacer / adapter', 'set'),
  ('TPMS Sensor (Universal)', 'Дугуйн даралт мэдрэгч (универсал)', NULL, 'Wheels', 'Universal TPMS sensor (433MHz)', 'piece'),
  ('Valve Cap (Chrome)', 'Клапаны таг (хром)', NULL, 'Wheels', 'Chrome tire valve stem caps', 'set'),
  ('Valve Core (Schrader)', 'Клапаны цөм', NULL, 'Wheels', 'Schrader valve core for tire inflation', 'piece'),
  ('Tire Repair Plug Kit', 'Дугуйн засвар кит', NULL, 'Wheels', 'Tire plug / patch repair kit', 'set'),
  ('Tire Inflator (Portable)', 'Дугуйн дүүргүүр (зөөврийн)', NULL, 'Wheels', 'Portable 12V tire inflator / compressor', 'piece'),
  ('Tire Pressure Gauge', 'Дугуйн даралтын хэмжүүр', NULL, 'Wheels', 'Digital tire pressure gauge', 'piece'),
  ('Wheel Weight Set', 'Дугуйн жин кит', NULL, 'Wheels', 'Adhesive wheel weights for balancing', 'set'),
  ('Rim Protector Ring', 'Хэрм хамгаалагч', NULL, 'Wheels', 'Rim edge protector ring', 'piece')
ON CONFLICT DO NOTHING;
