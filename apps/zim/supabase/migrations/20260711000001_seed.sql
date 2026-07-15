-- zim — seed data: regions, default pricing, settings, FX rate

insert into regions (slug, name_en, name_mn, kind, country_code, sort_order) values
  ('china', 'China', 'Хятад', 'country', 'CN', 10),
  ('japan', 'Japan', 'Япон', 'country', 'JP', 20),
  ('south-korea', 'South Korea', 'Өмнөд Солонгос', 'country', 'KR', 30),
  ('thailand', 'Thailand', 'Тайланд', 'country', 'TH', 40),
  ('vietnam', 'Vietnam', 'Вьетнам', 'country', 'VN', 50),
  ('singapore', 'Singapore', 'Сингапур', 'country', 'SG', 60),
  ('turkey', 'Turkey', 'Турк', 'country', 'TR', 70),
  ('asia', 'Asia (regional)', 'Ази (бүсийн)', 'regional', null, 80),
  ('europe', 'Europe (regional)', 'Европ (бүсийн)', 'regional', null, 90),
  ('global', 'Global', 'Глобал', 'global', null, 100);

-- Default global markup: 20%
insert into pricing_rules (scope, markup_percent, note)
  values ('global', 20.00, 'Default global markup');

-- Settings: 10% min margin floor, ceil-to-₮500 rounding, 30-min order TTL
insert into app_settings (key, value) values
  ('min_margin_percent', '10'),
  ('rounding', '{"mode": "ceil_to", "step": 500}'),
  ('order_ttl_minutes', '30');

-- Initial manual FX rate (USD → MNT); admin updates via /admin/fx
insert into fx_rates (pair, rate, source) values ('USD_MNT', 3450.0000, 'manual');
