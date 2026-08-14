-- Re-insert all global catalog seed data after clearing duplicates
-- This runs as a single migration to ensure atomicity

-- Parts - Engine Oil System
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Engine Oil Filter', 'Тосны шүүлтүүр', '90915-YZZN1', 'Engine', 'Standard oil filter', 'piece'),
  ('Premium Oil Filter', 'Өндөр чанарын тосны шүүлтүүр', '90915-YZZD1', 'Engine', 'Extended life oil filter', 'piece'),
  ('Oil Drain Plug Gasket', 'Тосны зайлуулагчийн жийргэвч', '90430-Z2025', 'Engine', 'Crush washer', 'piece'),
  ('Oil Pan Gasket', 'Тосны савны жийргэвч', NULL, 'Engine', 'Oil pan seal', 'piece'),
  ('Oil Pressure Sensor', 'Тосны даралтын мэдрэгч', '83530-YZZ01', 'Engine', 'Oil pressure sending unit', 'piece'),
  ('Oil Level Sensor', 'Тосны түвшний мэдрэгч', NULL, 'Engine', 'Electronic oil level sensor', 'piece'),
  ('Oil Cooler Assembly', 'Тосны хөргүүр', NULL, 'Engine', 'Engine oil cooler', 'piece')
ON CONFLICT DO NOTHING;

-- Parts - Engine Air Intake
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Engine Air Filter', 'Хөдөлгүүрийн агаарын шүүлтүүр', '17801-F0010', 'Engine', 'Engine intake air filter', 'piece'),
  ('Sports Air Filter', 'Спорт агаарын шүүлтүүр', NULL, 'Engine', 'High-flow cone air filter', 'piece'),
  ('Intake Manifold Gasket', 'Оролтын коллекторын жийргэвч', NULL, 'Engine', 'Intake manifold gasket set', 'set'),
  ('Mass Air Flow Sensor', 'Агаарын урсгалын мэдрэгч', NULL, 'Engine', 'MAF sensor', 'piece'),
  ('MAP Sensor', 'Үнэмлэхүй даралтын мэдрэгч', NULL, 'Engine', 'Manifold absolute pressure sensor', 'piece'),
  ('Throttle Body', 'Тохируулагч хаалт', NULL, 'Engine', 'Throttle body assembly', 'piece'),
  ('Throttle Position Sensor', 'Тохируулагч хаалтын мэдрэгч', NULL, 'Engine', 'TP sensor', 'piece'),
  ('Idle Air Control Valve', 'Тэнцвэрийн агаарын тохируулагч', NULL, 'Engine', 'IAC valve', 'piece')
ON CONFLICT DO NOTHING;

-- Parts - Engine Ignition
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Spark Plug Set (4) Iridium', 'Очлуур багц (4ш) Иридиум', NULL, 'Engine', 'Iridium spark plugs set of 4', 'set'),
  ('Spark Plug Set (6) Iridium', 'Очлуур багц (6ш) Иридиум', NULL, 'Engine', 'Iridium spark plugs set of 6', 'set'),
  ('Spark Plug Set (4) Platinum', 'Очлуур багц (4ш) Платинум', NULL, 'Engine', 'Platinum spark plugs set of 4', 'set'),
  ('Ignition Coil', 'Очлуурны ороомог', NULL, 'Engine', 'Single ignition coil pack', 'piece'),
  ('Ignition Coil Set (4)', 'Очлуурны ороомог багц (4ш)', NULL, 'Engine', 'Set of 4 ignition coils', 'set'),
  ('Distributor Cap', 'Дистрибьюторын таг', NULL, 'Engine', 'Distributor cap', 'piece'),
  ('Spark Plug Wire Set', 'Очлуурны утас багц', NULL, 'Engine', 'Ignition wire set', 'set')
ON CONFLICT DO NOTHING;

-- Parts - Engine Valvetrain & Timing
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Valve Cover Gasket Set', 'Хавхлагын тагны жийргэвч багц', NULL, 'Engine', 'Valve cover gasket set', 'set'),
  ('Camshaft Position Sensor', 'Камфентрийн байрлалын мэдрэгч', NULL, 'Engine', 'CMP sensor', 'piece'),
  ('Timing Belt', 'Цагийн бүс', NULL, 'Engine', 'Camshaft timing belt', 'piece'),
  ('Timing Belt Kit', 'Цагийн бүс иж бүрдэл', NULL, 'Engine', 'Timing belt tensioner idler', 'set'),
  ('Timing Chain', 'Цагийн гинж', NULL, 'Engine', 'Camshaft timing chain', 'piece'),
  ('Timing Chain Tensioner', 'Цагийн гинжний чангалагч', NULL, 'Engine', 'Timing chain tensioner', 'piece'),
  ('Serpentine Belt', 'Поли V бүс', NULL, 'Engine', 'Drive serpentine belt', 'piece'),
  ('Accessory Belt Tensioner', 'Бүсний чангалагч', NULL, 'Engine', 'Belt tensioner assembly', 'piece')
ON CONFLICT DO NOTHING;

-- Parts - Engine Cooling
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Water Pump', 'Усны шахуурга', NULL, 'Engine', 'Engine coolant water pump', 'piece'),
  ('Thermostat (82C)', 'Термостат (82C)', NULL, 'Engine', 'Coolant thermostat 82C', 'piece'),
  ('Thermostat (88C)', 'Термостат (88C)', NULL, 'Engine', 'Coolant thermostat 88C', 'piece'),
  ('Coolant Temperature Sensor', 'Хөргөлтийн температурын мэдрэгч', NULL, 'Engine', 'ECT sensor', 'piece'),
  ('Radiator', 'Радиатор', NULL, 'Engine', 'Engine cooling radiator', 'piece'),
  ('Radiator Cap (1.1 bar)', 'Радиаторын таг (1.1 бар)', NULL, 'Engine', 'Radiator cap 1.1 bar', 'piece'),
  ('Radiator Fan Motor', 'Радиаторын сэнсний мотор', NULL, 'Engine', 'Cooling fan motor', 'piece'),
  ('Coolant Hose Upper', 'Хөргөлтийн шланг Дээд', NULL, 'Engine', 'Upper radiator hose', 'piece'),
  ('Coolant Hose Lower', 'Хөргөлтийн шланг Доод', NULL, 'Engine', 'Lower radiator hose', 'piece'),
  ('Heater Hose', 'Халаагуурын шланг', NULL, 'Engine', 'Heater core hose', 'piece')
ON CONFLICT DO NOTHING;

-- Parts - Engine Fuel System
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Fuel Filter', 'Түлшний шүүлтүүр', '23300-YZZ01', 'Engine', 'Fuel line filter', 'piece'),
  ('Fuel Pump Assembly', 'Түлшний шахуурга', '23220-YZZ01', 'Engine', 'Fuel pump with sender', 'piece'),
  ('Fuel Injector (1pc)', 'Түлшний цацагч (1ш)', NULL, 'Engine', 'Fuel injector', 'piece'),
  ('Fuel Pressure Regulator', 'Түлшний даралт тохируулагч', NULL, 'Engine', 'Fuel rail regulator', 'piece'),
  ('Fuel Cap', 'Түлшний таг', NULL, 'Engine', 'Gas cap', 'piece'),
  ('Fuel Hose', 'Түлшний шланг', NULL, 'Engine', 'Fuel line hose per meter', 'meter'),
  ('EVAP Purge Valve', 'EVAP цэвэрлэгч хавхлага', NULL, 'Engine', 'Evaporative emission purge valve', 'piece')
ON CONFLICT DO NOTHING;

-- Parts - Engine Gaskets & Sensors
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Head Gasket Set', 'Цилиндрийн толгойн жийргэвч багц', NULL, 'Engine', 'Complete head gasket set', 'set'),
  ('Exhaust Manifold Gasket', 'Угаарын коллекторын жийргэвч', NULL, 'Engine', 'Exhaust manifold gasket', 'piece'),
  ('Front Crankshaft Seal', 'Тахир голын урд чигжээс', NULL, 'Engine', 'Front main seal', 'piece'),
  ('Rear Main Seal', 'Тахир голын хойд чигжээс', NULL, 'Engine', 'Rear main seal', 'piece'),
  ('Oxygen Sensor Upstream', 'Хүчилтөрөгчийн мэдрэгч Дээд', NULL, 'Engine', 'Upstream O2 sensor', 'piece'),
  ('Oxygen Sensor Downstream', 'Хүчилтөрөгчийн мэдрэгч Доод', NULL, 'Engine', 'Downstream O2 sensor', 'piece'),
  ('Crankshaft Position Sensor', 'Тахир голын байрлалын мэдрэгч', NULL, 'Engine', 'CKP sensor', 'piece'),
  ('Knock Sensor', 'Тогших мэдрэгч', NULL, 'Engine', 'Knock detonation sensor', 'piece'),
  ('EGR Valve', 'EGR хавхлага', NULL, 'Engine', 'Exhaust gas recirculation valve', 'piece'),
  ('PCV Valve', 'PCV хавхлага', NULL, 'Engine', 'Positive crankcase ventilation valve', 'piece')
ON CONFLICT DO NOTHING;

-- Parts - Engine Mounts & Turbo
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Turbocharger Assembly', 'Турбо цэнэглэгч', NULL, 'Engine', 'Turbocharger complete unit', 'piece'),
  ('Engine Oil Cooler', 'Хөдөлгүүрийн тос хөргүүр', NULL, 'Engine', 'Oil cooler assembly', 'piece'),
  ('Variable Valve Timing Solenoid', 'VVT соленоид', NULL, 'Engine', 'Variable valve timing solenoid', 'piece'),
  ('Oil Pressure Switch', 'Тосны даралтын унтраалга', NULL, 'Engine', 'Oil pressure switch', 'piece'),
  ('Crankshaft Harmonic Balancer', 'Тахир голын дампуулагч', NULL, 'Engine', 'Crankshaft pulley damper', 'piece'),
  ('Engine Mount Front', 'Хөдөлгүүрийн суурь Урд', '12305-YZZ01', 'Engine', 'Front engine mount', 'piece'),
  ('Engine Mount Rear', 'Хөдөлгүүрийн суурь Арын', NULL, 'Engine', 'Rear engine mount', 'piece'),
  ('Engine Mount Left', 'Хөдөлгүүрийн суурь Зүүн', NULL, 'Engine', 'Left engine mount', 'piece'),
  ('Engine Mount Right', 'Хөдөлгүүрийн суурь Баруун', NULL, 'Engine', 'Right engine mount', 'piece'),
  ('Transmission Mount', 'Дамжуулагчийн суурь', NULL, 'Engine', 'Transmission support mount', 'piece'),
  ('Torque Strut Mount', 'Эргүүлэх моментийн суурь', NULL, 'Engine', 'Torque strut mount', 'piece')
ON CONFLICT DO NOTHING;

-- Parts - Brakes Pads & Rotors
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Brake Pads Front Economy', 'Тоормосны дэвсгэр Урд Энгийн', '04465-YZZAG', 'Brakes', 'Standard front brake pad set', 'set'),
  ('Brake Pads Front Ceramic', 'Тоормосны дэвсгэр Урд Керамик', NULL, 'Brakes', 'Ceramic front brake pads low dust', 'set'),
  ('Brake Pads Rear Economy', 'Тоормосны дэвсгэр Арын Энгийн', '04466-YZZAK', 'Brakes', 'Standard rear brake pad set', 'set'),
  ('Brake Pads Rear Ceramic', 'Тоормосны дэвсгэр Арын Керамик', NULL, 'Brakes', 'Ceramic rear brake pads', 'set'),
  ('Brake Rotor Front Standard', 'Тоормосны диск Урд Энгийн', '43512-YZZ11', 'Brakes', 'Front standard brake disc', 'piece'),
  ('Brake Rotor Front Drilled', 'Тоормосны диск Урд Цоолбор', NULL, 'Brakes', 'Front drilled brake rotor', 'piece'),
  ('Brake Rotor Rear Standard', 'Тоормосны диск Арын Энгийн', '42431-YZZ12', 'Brakes', 'Rear standard brake disc', 'piece'),
  ('Brake Drum Rear', 'Тоормосны бөмбөр Арын', NULL, 'Brakes', 'Rear brake drum', 'piece'),
  ('Brake Shoe Set Rear', 'Тоормосны дотор дэвсгэр багц Арын', NULL, 'Brakes', 'Rear brake shoe set', 'set')
ON CONFLICT DO NOTHING;

-- Parts - Brakes Calipers & Hydraulics
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Brake Caliper Front Left', 'Тоормосны калипер Урд зүүн', NULL, 'Brakes', 'Front left brake caliper', 'piece'),
  ('Brake Caliper Front Right', 'Тоормосны калипер Урд баруун', NULL, 'Brakes', 'Front right brake caliper', 'piece'),
  ('Brake Caliper Rear Left', 'Тоормосны калипер Арын зүүн', NULL, 'Brakes', 'Rear left brake caliper', 'piece'),
  ('Brake Caliper Rear Right', 'Тоормосны калипер Арын баруун', NULL, 'Brakes', 'Rear right brake caliper', 'piece'),
  ('Brake Master Cylinder', 'Тоормосны үндсэн шахуурга', NULL, 'Brakes', 'Brake master cylinder', 'piece'),
  ('Brake Booster', 'Тоормосны өсгөгч', NULL, 'Brakes', 'Brake vacuum booster', 'piece'),
  ('ABS Sensor Front', 'ABS мэдрэгч Урд', NULL, 'Brakes', 'Front ABS wheel speed sensor', 'piece'),
  ('ABS Sensor Rear', 'ABS мэдрэгч Арын', NULL, 'Brakes', 'Rear ABS wheel speed sensor', 'piece')
ON CONFLICT DO NOTHING;

-- Parts - Suspension Shocks & Struts
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Shock Absorber Front', 'Амортизатор Урд', NULL, 'Suspension', 'Front shock absorber', 'piece'),
  ('Shock Absorber Rear', 'Амортизатор Арын', NULL, 'Suspension', 'Rear shock absorber', 'piece'),
  ('Strut Assembly Front Complete', 'Струт Урд Бүрэн', NULL, 'Suspension', 'Complete front strut with spring', 'piece'),
  ('Strut Mount Front', 'Струтын суурь Урд', NULL, 'Suspension', 'Front strut mount', 'piece'),
  ('Coil Spring Front', 'Пүрх Урд', NULL, 'Suspension', 'Front coil spring', 'piece'),
  ('Coil Spring Rear', 'Пүрх Арын', NULL, 'Suspension', 'Rear coil spring', 'piece'),
  ('Lowering Spring Set', 'Багасгасан пүрх багц', NULL, 'Suspension', 'Lowering spring set 4', 'set'),
  ('Air Spring Rear', 'Агаарын пүрх Арын', NULL, 'Suspension', 'Rear air suspension bag', 'piece'),
  ('Air Suspension Compressor', 'Агаарын компрессор', NULL, 'Suspension', 'Air suspension pump', 'piece')
ON CONFLICT DO NOTHING;

-- Parts - Suspension Arms & Joints
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Control Arm Front Lower Left', 'Удирдлагын гар Урд доод Зүүн', '48069-YZZ01', 'Suspension', 'Front left lower control arm', 'piece'),
  ('Control Arm Front Lower Right', 'Удирдлагын гар Урд доод Баруун', '48070-YZZ01', 'Suspension', 'Front right lower control arm', 'piece'),
  ('Ball Joint Front Lower Left', 'Бөмбөлөг нугас Урд доод Зүүн', '43330-YZZ01', 'Suspension', 'Front left lower ball joint', 'piece'),
  ('Ball Joint Front Lower Right', 'Бөмбөлөг нугас Урд доод Баруун', NULL, 'Suspension', 'Front right lower ball joint', 'piece'),
  ('Tie Rod End Outer Left', 'Татуургын төгсгөл Гадна Зүүн', NULL, 'Suspension', 'Left outer tie rod end', 'piece'),
  ('Tie Rod End Outer Right', 'Татуургын төгсгөл Гадна Баруун', NULL, 'Suspension', 'Right outer tie rod end', 'piece'),
  ('Sway Bar Link', 'Тэнцвэржүүлэгч холбогч', NULL, 'Suspension', 'Stabilizer sway bar link', 'piece'),
  ('Wheel Bearing Front', 'Дугуйн холхивч Урд', NULL, 'Suspension', 'Front wheel bearing', 'piece'),
  ('Wheel Bearing Rear', 'Дугуйн холхивч Арын', NULL, 'Suspension', 'Rear wheel bearing', 'piece'),
  ('Wheel Hub Assembly Front', 'Дугуйн аяга Урд', NULL, 'Suspension', 'Front wheel hub with bearing', 'piece'),
  ('Wheel Hub Assembly Rear', 'Дугуйн аяга Арын', NULL, 'Suspension', 'Rear wheel hub with bearing', 'piece')
ON CONFLICT DO NOTHING;

-- Parts - Steering
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Power Steering Pump', 'Удирдлагын шахуурга', NULL, 'Steering', 'Power steering pump', 'piece'),
  ('Steering Rack', 'Удирдлагын тросс', NULL, 'Steering', 'Steering rack assembly', 'piece'),
  ('Power Steering Reservoir', 'Удирдлагын тосны сав', NULL, 'Steering', 'PS fluid reservoir', 'piece'),
  ('Power Steering Hose Pressure', 'Удирдлагын шланг Даралт', NULL, 'Steering', 'High pressure PS hose', 'piece'),
  ('Power Steering Hose Return', 'Удирдлагын шланг Буцах', NULL, 'Steering', 'Low pressure PS return hose', 'piece'),
  ('Steering Column', 'Удирдлагын багана', NULL, 'Steering', 'Steering column assembly', 'piece'),
  ('Clock Spring', 'Клок спринг', NULL, 'Steering', 'Steering wheel clock spring', 'piece'),
  ('Steering Angle Sensor', 'Жолооны өнцгийн мэдрэгч', NULL, 'Steering', 'Steering angle sensor', 'piece')
ON CONFLICT DO NOTHING;

-- Parts - Electrical Battery & Charging
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Battery 45Ah', 'Аккумулятор 45Ah', NULL, 'Electrical', '12V 45Ah lead-acid battery', 'piece'),
  ('Battery 55Ah', 'Аккумулятор 55Ah', NULL, 'Electrical', '12V 55Ah battery', 'piece'),
  ('Battery 65Ah', 'Аккумулятор 65Ah', NULL, 'Electrical', '12V 65Ah battery', 'piece'),
  ('Battery 75Ah', 'Аккумулятор 75Ah', NULL, 'Electrical', '12V 75Ah battery', 'piece'),
  ('Battery 100Ah', 'Аккумулятор 100Ah', NULL, 'Electrical', '12V 100Ah heavy duty battery', 'piece'),
  ('Battery Terminal Set', 'Аккумуляторын терминал багц', NULL, 'Electrical', 'Battery terminal connectors', 'set'),
  ('Alternator 90A', 'Генератор 90A', '27060-YZZ01', 'Electrical', '90 Amp alternator', 'piece'),
  ('Alternator 120A', 'Генератор 120A', NULL, 'Electrical', '120 Amp alternator', 'piece'),
  ('Starter Motor', 'Эхлүүлэгч мотор', NULL, 'Electrical', 'Starter motor', 'piece')
ON CONFLICT DO NOTHING;

-- Parts - Electrical Motors & Actuators
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Window Motor Front Left', 'Цонхны мотор Урд зүүн', NULL, 'Electrical', 'Front left power window motor', 'piece'),
  ('Window Motor Front Right', 'Цонхны мотор Урд баруун', NULL, 'Electrical', 'Front right window motor', 'piece'),
  ('Window Motor Rear Left', 'Цонхны мотор Арын зүүн', NULL, 'Electrical', 'Rear left window motor', 'piece'),
  ('Window Motor Rear Right', 'Цонхны мотор Арын баруун', NULL, 'Electrical', 'Rear right window motor', 'piece'),
  ('Door Lock Actuator Front Left', 'Хаалганы түгжээ Урд зүүн', NULL, 'Electrical', 'Front left door lock actuator', 'piece'),
  ('Door Lock Actuator Front Right', 'Хаалганы түгжээ Урд баруун', NULL, 'Electrical', 'Front right door lock actuator', 'piece'),
  ('Door Lock Actuator Rear Left', 'Хаалганы түгжээ Арын зүүн', NULL, 'Electrical', 'Rear left door lock actuator', 'piece'),
  ('Door Lock Actuator Rear Right', 'Хаалганы түгжээ Арын баруун', NULL, 'Electrical', 'Rear right door lock actuator', 'piece'),
  ('Wiper Motor Front', 'Арчигчийн мотор Урд', NULL, 'Electrical', 'Front wiper motor', 'piece'),
  ('Heater Blower Motor', 'Халаагуурын сэнсний мотор', NULL, 'Electrical', 'HVAC blower motor', 'piece')
ON CONFLICT DO NOTHING;

-- Parts - Electrical Relays Fuses Switches
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Main Relay EFI', 'Үндсэн реле', NULL, 'Electrical', 'EFI main relay', 'piece'),
  ('Fuel Pump Relay', 'Түлшний шахуургын реле', NULL, 'Electrical', 'Fuel pump relay', 'piece'),
  ('AC Relay', 'Кондишннер реле', NULL, 'Electrical', 'AC compressor relay', 'piece'),
  ('Fuse Box Engine Compartment', 'Гал хамгаалагчийн хайрцаг', NULL, 'Electrical', 'Engine compartment fuse box', 'piece'),
  ('Fuse Box Cabin', 'Гал хамгаалагчийн хайрцаг Савлон', NULL, 'Electrical', 'Interior fuse box', 'piece'),
  ('Mini Fuse Assortment', 'Мини гал хамгаалагч багц', NULL, 'Electrical', 'Assorted mini blade fuse kit', 'set'),
  ('Relay Assortment Kit', 'Реле багц', NULL, 'Electrical', 'Set of common relays', 'set'),
  ('Ignition Switch', 'Гал асаах унтраалга', NULL, 'Electrical', 'Ignition switch assembly', 'piece'),
  ('Brake Light Switch', 'Тоормосны гэрлийн унтраалга', NULL, 'Electrical', 'Stop lamp switch', 'piece'),
  ('Parking Sensor Set', 'Зогсоолын мэдрэгч багц', NULL, 'Electrical', 'Rear parking sensor kit 4', 'set')
ON CONFLICT DO NOTHING;

-- Parts - Lighting
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Headlight Assembly Left', 'Урд гэрлийн угсрагдал Зүүн', NULL, 'Lighting', 'Left headlight assembly', 'piece'),
  ('Headlight Assembly Right', 'Урд гэрлийн угсрагдал Баруун', NULL, 'Lighting', 'Right headlight assembly', 'piece'),
  ('Headlight Bulb H1', 'Урд гэрлийн чийдэн H1', NULL, 'Lighting', 'H1 single filament bulb', 'piece'),
  ('Headlight Bulb H4', 'Урд гэрлийн чийдэн H4', NULL, 'Lighting', 'H4 dual filament halogen', 'piece'),
  ('Headlight Bulb H7', 'Урд гэрлийн чийдэн H7', NULL, 'Lighting', 'H7 halogen', 'piece'),
  ('Headlight Bulb H11', 'Урд гэрлийн чийдэн H11', NULL, 'Lighting', 'H11 halogen', 'piece'),
  ('LED Conversion Kit H4', 'LED хувиргагч багц H4', NULL, 'Lighting', 'H4 LED conversion kit 2 bulbs', 'set'),
  ('LED Conversion Kit H7', 'LED хувиргагч багц H7', NULL, 'Lighting', 'H7 LED conversion kit', 'set'),
  ('HID Kit 35W', 'HID багц 35W', NULL, 'Lighting', 'HID conversion kit 35W', 'set'),
  ('Tail Light Assembly Left', 'Арын гэрлийн угсрагдал Зүүн', NULL, 'Lighting', 'Rear tail light assembly', 'piece'),
  ('Tail Light Assembly Right', 'Арын гэрлийн угсрагдал Баруун', NULL, 'Lighting', 'Rear tail light assembly', 'piece'),
  ('Fog Light Assembly Left', 'Манангийн гэрэл Зүүн', NULL, 'Lighting', 'Left fog light assembly', 'piece'),
  ('Fog Light Assembly Right', 'Манангийн гэрэл Баруун', NULL, 'Lighting', 'Right fog light assembly', 'piece'),
  ('Dome Interior Light', 'Савлонны гэрэл', NULL, 'Lighting', 'Interior dome light', 'piece'),
  ('License Plate Light Assembly', 'Регистрийн дугаарын гэрэл', NULL, 'Lighting', 'License plate light', 'piece')
ON CONFLICT DO NOTHING;

-- Parts - AC System
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('AC Compressor', 'Кондишннер компрессор', '88320-YZZ01', 'AC System', 'Air conditioning compressor', 'piece'),
  ('AC Condenser', 'Кондишннер конденсор', '88460-YZZ01', 'AC System', 'AC condenser radiator', 'piece'),
  ('AC Evaporator', 'Кондишннер ууршуулагч', NULL, 'AC System', 'AC evaporator core', 'piece'),
  ('AC Expansion Valve', 'Өргөтгөх хавхлага', NULL, 'AC System', 'AC expansion valve', 'piece'),
  ('AC Receiver Drier', 'Хуурайшуулагч', NULL, 'AC System', 'AC receiver drier', 'piece'),
  ('AC Pressure Switch', 'Даралтын унтраалга', NULL, 'AC System', 'AC pressure switch', 'piece'),
  ('Cabin Air Filter Standard', 'Савлонны шүүлтүүр Энгийн', '87139-YZZ20', 'AC System', 'Standard cabin filter', 'piece'),
  ('Cabin Air Filter Carbon', 'Савлонны шүүлтүүр Нүүрс', NULL, 'AC System', 'Activated carbon cabin filter', 'piece'),
  ('Heater Core', 'Халаагуурын гол', NULL, 'AC System', 'Heater core assembly', 'piece'),
  ('Blower Motor Resistor', 'Сэнсний резистор', NULL, 'AC System', 'Blower motor resistor module', 'piece'),
  ('AC Refrigerant R134a 13oz', 'Хөргөлтийн шингэн R134a', NULL, 'AC System', 'R134a refrigerant 13oz can', 'can'),
  ('AC Refrigerant R1234yf 10oz', 'Хөргөлтийн шингэн R1234yf', NULL, 'AC System', 'R1234yf refrigerant can', 'can')
ON CONFLICT DO NOTHING;

-- Parts - Transmission & Drivetrain
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('ATF Dexron III 1L', 'Автомат тос Dexron III 1L', NULL, 'Transmission', 'Dexron III ATF 1L', 'liter'),
  ('ATF Toyota WS 4L', 'Автомат тос Toyota WS 4L', NULL, 'Transmission', 'Toyota ATF WS 4L', 'container'),
  ('CVT Fluid 4L', 'CVT тос 4L', NULL, 'Transmission', 'CVT transmission fluid', 'container'),
  ('Manual Gear Oil 75W-90 1L', 'Гарын хайрцгийн тос 75W-90', NULL, 'Transmission', '75W-90 gear oil', 'liter'),
  ('Clutch Kit Standard', 'Муфтны багц Энгийн', NULL, 'Transmission', 'Clutch disc pressure plate bearing', 'set'),
  ('Clutch Disc', 'Муфтын диск', NULL, 'Transmission', 'Clutch friction disc', 'piece'),
  ('Clutch Pressure Plate', 'Муфтын даралтын хавтан', NULL, 'Transmission', 'Clutch pressure plate', 'piece'),
  ('Clutch Release Bearing', 'Муфтын суллах холхивч', NULL, 'Transmission', 'Clutch throwout bearing', 'piece'),
  ('Clutch Master Cylinder', 'Муфтын үндсэн шахуурга', NULL, 'Transmission', 'Clutch master cylinder', 'piece'),
  ('Clutch Slave Cylinder', 'Муфтын дугарах шахуурга', NULL, 'Transmission', 'Clutch slave cylinder', 'piece'),
  ('CV Axle Left', 'CV тэнхлэг Зүүн', NULL, 'Transmission', 'Left drive axle shaft', 'piece'),
  ('CV Axle Right', 'CV тэнхлэг Баруун', NULL, 'Transmission', 'Right drive axle shaft', 'piece'),
  ('CV Joint Boot Kit', 'CV холбоосын бүрээс багц', NULL, 'Transmission', 'CV boot with clamps', 'set'),
  ('Differential Oil 75W-90 1L', 'Дифференциалын тос 75W-90', NULL, 'Transmission', 'LSD gear oil 75W-90', 'liter')
ON CONFLICT DO NOTHING;

-- Parts - Cooling System
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Coolant Antifreeze Ready-mix 5L', 'Антифриз Бэлэн 5L', NULL, 'Cooling', 'Ready-to-use coolant 5L', 'container'),
  ('Coolant Toyota SLLC Pink 5L', 'Антифриз Toyota SLLC 5L', NULL, 'Cooling', 'Toyota Super Long Life Coolant', 'container'),
  ('Coolant Expansion Tank', 'Хөргөлтийн тэлэлтийн сав', NULL, 'Cooling', 'Coolant overflow tank', 'piece'),
  ('Intercooler', 'Интеркулер', NULL, 'Cooling', 'Turbo intercooler', 'piece')
ON CONFLICT DO NOTHING;

-- Parts - Exhaust
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Catalytic Converter Universal', 'Каталитик шүүлтүүр Универсал', NULL, 'Exhaust', 'Universal catalytic converter', 'piece'),
  ('Muffler Standard', 'Дуу намсгагч Энгийн', NULL, 'Exhaust', 'Standard muffler', 'piece'),
  ('Muffler Performance', 'Дуу намсгагч Спорт', NULL, 'Exhaust', 'Performance muffler', 'piece'),
  ('Flex Pipe', 'Уян угаарын хоолой', NULL, 'Exhaust', 'Flexible exhaust pipe', 'piece'),
  ('Exhaust Manifold', 'Угаарын коллектор', NULL, 'Exhaust', 'Exhaust manifold', 'piece'),
  ('Exhaust Hanger Kit', 'Угаарын өлгүүр багц', NULL, 'Exhaust', 'Rubber exhaust hangers set', 'set')
ON CONFLICT DO NOTHING;

-- Parts - Wheels Tires
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Tire 185/65R15', 'Дугуй 185/65R15', NULL, 'Wheels & Tires', 'Economy car tire', 'piece'),
  ('Tire 195/65R15', 'Дугуй 195/65R15', NULL, 'Wheels & Tires', 'Mid-size sedan tire', 'piece'),
  ('Tire 205/55R16', 'Дугуй 205/55R16', NULL, 'Wheels & Tires', 'Standard passenger tire', 'piece'),
  ('Tire 205/60R16', 'Дугуй 205/60R16', NULL, 'Wheels & Tires', 'Family sedan tire', 'piece'),
  ('Tire 215/60R16', 'Дугуй 215/60R16', NULL, 'Wheels & Tires', 'SUV standard tire', 'piece'),
  ('Tire 215/55R17', 'Дугуй 215/55R17', NULL, 'Wheels & Tires', 'Premium sedan tire', 'piece'),
  ('Tire 215/60R17', 'Дугуй 215/60R17', NULL, 'Wheels & Tires', 'Crossover SUV tire', 'piece'),
  ('Tire 225/45R17', 'Дугуй 225/45R17', NULL, 'Wheels & Tires', 'Sport sedan tire', 'piece'),
  ('Tire 225/55R17', 'Дугуй 225/55R17', NULL, 'Wheels & Tires', 'Mid-size luxury tire', 'piece'),
  ('Tire 225/55R18', 'Дугуй 225/55R18', NULL, 'Wheels & Tires', 'Large SUV tire', 'piece'),
  ('Tire 225/65R17', 'Дугуй 225/65R17', NULL, 'Wheels & Tires', 'SUV tire', 'piece'),
  ('Alloy Rim 16', 'Хайлшин аяга 16', NULL, 'Wheels & Tires', '16 inch alloy rim', 'piece'),
  ('Alloy Rim 17', 'Хайлшин аяга 17', NULL, 'Wheels & Tires', '17 inch alloy rim', 'piece'),
  ('Alloy Rim 18', 'Хайлшин аяга 18', NULL, 'Wheels & Tires', '18 inch alloy rim', 'piece'),
  ('Wheel Lug Nut Set 20pcs', 'Дугуйн толгой багц 20ш', NULL, 'Wheels & Tires', 'Lug nut set', 'set'),
  ('Wheel Center Cap Set 4', 'Дугуйн тогтоош багц 4ш', NULL, 'Wheels & Tires', 'Center caps set', 'set'),
  ('TPMS Sensor Universal', 'Даралтын мэдрэгч', NULL, 'Wheels & Tires', 'Programmable TPMS sensor', 'piece'),
  ('Tire Pressure Gauge', 'Дугуйн даралт хэмжигч', NULL, 'Wheels & Tires', 'Digital tire pressure gauge', 'piece')
ON CONFLICT DO NOTHING;

-- Parts - Body
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Wiper Blade 24 Driver', 'Арчигч 24', NULL, 'Body', '24 inch wiper blade', 'piece'),
  ('Wiper Blade 20 Passenger', 'Арчигч 20', NULL, 'Body', '20 inch wiper blade', 'piece'),
  ('Wiper Blade Rear', 'Арчигч Арын', NULL, 'Body', 'Rear wiper blade', 'piece'),
  ('Windshield', 'Салхины шил', NULL, 'Body', 'Front windshield glass', 'piece'),
  ('Side Mirror Left Electric', 'Толь Зүүн Цахилгаан', NULL, 'Body', 'Left power side mirror', 'piece'),
  ('Side Mirror Right Electric', 'Толь Баруун Цахилгаан', NULL, 'Body', 'Right power side mirror', 'piece'),
  ('Door Handle Front Left', 'Хаалганы бариул Урд зүүн', NULL, 'Body', 'Front left door handle', 'piece'),
  ('Door Handle Front Right', 'Хаалганы бариул Урд баруун', NULL, 'Body', 'Front right door handle', 'piece'),
  ('Hood Latch', 'Мотоны түгжээ', NULL, 'Body', 'Hood latch assembly', 'piece'),
  ('Hood Strut', 'Мотоны өргөгч', NULL, 'Body', 'Hood gas strut pair', 'piece'),
  ('Trunk Strut', 'Тээшийн өргөгч', NULL, 'Body', 'Trunk gas strut pair', 'piece'),
  ('Mud Flap Set', 'Шавар хамгаалах дэвсгэр 4ш', NULL, 'Body', 'Set of 4 mud flaps', 'set'),
  ('Door Weatherstrip', 'Хаалганы чигжээс', NULL, 'Body', 'Door rubber seal', 'piece'),
  ('Hood Insulation Pad', 'Мотоны дулаалга', NULL, 'Body', 'Under-hood insulation pad', 'piece')
ON CONFLICT DO NOTHING;

-- Parts - Fluids Chemicals
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('Engine Oil 5W-30 1L', 'Хөдөлгүүрийн тос 5W-30 1L', NULL, 'Fluids & Chemicals', 'Synthetic 5W-30 engine oil 1L', 'liter'),
  ('Engine Oil 5W-30 4L', 'Хөдөлгүүрийн тос 5W-30 4L', NULL, 'Fluids & Chemicals', 'Synthetic 5W-30 engine oil 4L', 'container'),
  ('Engine Oil 0W-20 1L', 'Хөдөлгүүрийн тос 0W-20 1L', NULL, 'Fluids & Chemicals', 'Full synthetic 0W-20 1L', 'liter'),
  ('Engine Oil 0W-20 4L', 'Хөдөлгүүрийн тос 0W-20 4L', NULL, 'Fluids & Chemicals', 'Full synthetic 0W-20 4L', 'container'),
  ('Engine Oil 10W-40 4L', 'Хөдөлгүүрийн тос 10W-40 4L', NULL, 'Fluids & Chemicals', 'Mineral 10W-40 4L', 'container'),
  ('Engine Oil Diesel 15W-40 5L', 'Дизель тос 15W-40 5L', NULL, 'Fluids & Chemicals', 'Diesel engine oil 5L', 'container'),
  ('Brake Fluid DOT4 500ml', 'Тоормосны шингэн DOT4 500мл', NULL, 'Fluids & Chemicals', 'DOT4 brake fluid 500ml', 'bottle'),
  ('Brake Fluid DOT4 1L', 'Тоормосны шингэн DOT4 1L', NULL, 'Fluids & Chemicals', 'DOT4 brake fluid 1L', 'bottle'),
  ('Power Steering Fluid 1L', 'Удирдлагын тос 1L', NULL, 'Fluids & Chemicals', 'Power steering fluid', 'liter'),
  ('Windshield Washer Winter 5L', 'Шилийг угаах шингэн Өвөл 5L', NULL, 'Fluids & Chemicals', 'Winter -30C washer fluid', 'container'),
  ('Windshield Washer Summer 5L', 'Шилийг угаах шингэн Зун 5L', NULL, 'Fluids & Chemicals', 'Summer washer fluid', 'container'),
  ('Brake Parts Cleaner', 'Тоормосны цэвэрлэгч', NULL, 'Fluids & Chemicals', 'Aerosol brake cleaner', 'can'),
  ('Fuel Injector Cleaner', 'Түлшний цацагч цэвэрлэгч', NULL, 'Fluids & Chemicals', 'Fuel injector cleaner', 'bottle'),
  ('Penetrating Oil WD-40', 'Нэвтрэх тос WD-40', NULL, 'Fluids & Chemicals', 'Multi-purpose lubricant', 'can'),
  ('Dielectric Grease', 'Диэлектрик тос', NULL, 'Fluids & Chemicals', 'Dielectric grease for connectors', 'tube')
ON CONFLICT DO NOTHING;

-- Parts - Consumables
INSERT INTO global_parts_catalog (name, name_mn, part_number, category, description, unit) VALUES
  ('RTV Silicone Gasket Maker', 'RTV силикон жийргэвч', NULL, 'Consumables', 'High-temp RTV silicone', 'tube'),
  ('Threadlocker Blue Medium', 'Утасны түгжээ Цэнхэр', NULL, 'Consumables', 'Medium threadlocker', 'bottle'),
  ('Threadlocker Red High', 'Утасны түгжээ Улаан', NULL, 'Consumables', 'High strength threadlocker', 'bottle'),
  ('Anti-seize Compound', 'Наалдалтаас сэргийлэгч', NULL, 'Consumables', 'Copper anti-seize', 'tube'),
  ('Zip Tie Assortment', 'Холбогч багц', NULL, 'Consumables', 'Assorted zip ties', 'set'),
  ('Electrical Tape', 'Цахилгаан тууз', NULL, 'Consumables', 'PVC electrical tape', 'roll'),
  ('Nitrile Gloves L', 'Нийтрил бээлий L', NULL, 'Consumables', 'Disposable gloves large', 'box')
ON CONFLICT DO NOTHING;
