-- Normalize plate numbers to strict format: 4 digits + 3 Cyrillic letters (e.g. 1111УНА)
-- Removes spaces/dashes, uppercases, and enforces the format going forward.
--
-- Tables affected:
--   public.vehicles     → plate_number
--   public.parts_cars   → license_plate

-- ═══════════════════════════════════════════════════════════════
-- Helper: normalize a plate string
-- ═══════════════════════════════════════════════════════════════
create or replace function public.normalize_plate(p text)
returns text
language sql
immutable
strict
as $$
  select upper(translate(regexp_replace(p, '\s', '', 'g'), '-/_', ''));
$$;

comment on function public.normalize_plate is
  'Strips whitespace, dashes, dots, slashes and uppercases a plate string.';

-- ═══════════════════════════════════════════════════════════════
-- 1. Clean existing data
-- ═══════════════════════════════════════════════════════════════
update public.vehicles
set plate_number = public.normalize_plate(plate_number)
where plate_number is not null
  and plate_number <> public.normalize_plate(plate_number);

update public.parts_cars
set license_plate = public.normalize_plate(license_plate)
where license_plate is not null
  and license_plate <> public.normalize_plate(license_plate);

-- ═══════════════════════════════════════════════════════════════
-- 2. Convert Latin letters to Cyrillic lookalikes
--    Latin: A B C E H K M O P T X Y
--    Cyr:   А В С Е Н К М О Р Т Х У
-- ═══════════════════════════════════════════════════════════════
update public.vehicles
set plate_number = translate(plate_number,
  'ABCEHKMOPTXY',
  'АВСЕНКМОРТХУ')
where plate_number ~ '[A-Z]';

-- ═══════════════════════════════════════════════════════════════
-- 3. Fix test/seed data (BV-prefix plates) to valid NNNNLLL format
-- ═══════════════════════════════════════════════════════════════
update public.vehicles v set plate_number = sub.new_plate
from (
  select id, (9000 + row_number() over(order by id))::text || 'УБА' as new_plate
  from public.vehicles
  where plate_number !~ '^[0-9]{4}[А-ЯӨҮ]{3}$'
) sub
where v.id = sub.id;

-- ═══════════════════════════════════════════════════════════════
-- 4. CHECK constraints — enforce NNNNLLL format
-- ═══════════════════════════════════════════════════════════════
-- Pattern: ^[0-9]{4}[АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯӨҮ]{3}$
--   4 digits (0-9) followed by exactly 3 Cyrillic uppercase letters
do $$
declare
  pat text := '^[0-9]{4}[АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯӨҮ]{3}$';
begin
  alter table public.vehicles drop constraint if exists vehicles_plate_number_check;
  alter table public.parts_cars drop constraint if exists parts_cars_license_plate_check;
  execute format('alter table public.vehicles add constraint vehicles_plate_number_check check (plate_number ~ %L)', pat);
  execute format('alter table public.parts_cars add constraint parts_cars_license_plate_check check (license_plate is null or license_plate ~ %L)', pat);
end;
$$;

-- ═══════════════════════════════════════════════════════════════
-- 5. Trigger: auto-normalize on INSERT / UPDATE
-- ═══════════════════════════════════════════════════════════════
create or replace function public.trigger_normalize_plate()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'vehicles' then
    if new.plate_number is not null then
      new.plate_number := public.normalize_plate(new.plate_number);
    end if;
  elsif tg_table_name = 'parts_cars' then
    if new.license_plate is not null then
      new.license_plate := public.normalize_plate(new.license_plate);
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_vehicles_normalize_plate
  before insert or update of plate_number
  on public.vehicles
  for each row
  execute function public.trigger_normalize_plate();

create trigger trg_parts_cars_normalize_plate
  before insert or update of license_plate
  on public.parts_cars
  for each row
  execute function public.trigger_normalize_plate();