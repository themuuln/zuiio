-- Add Latin→Cyrillic transliteration to plate normalization.
-- Previously, normalize_plate() only stripped whitespace/case — Latin letters
-- like D, F, Q, W passed through untranslated and hit the CHECK constraint.
--
-- This mirrors the LATIN_TO_CYRILLIC map in src/lib/form-validation.ts.

-- ═══════════════════════════════════════════════════════════════
-- 1. translate_plate(): Latin → Cyrillic for all 26 letters
-- ═══════════════════════════════════════════════════════════════
create or replace function public.translate_plate(p text)
returns text
language sql
immutable
strict
as $$
  select upper(translate(
    p,
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'АБЦДЕФГХИЖКЛМНОӨПРСТУВҮХЫЗ'
  ));
$$;

comment on function public.translate_plate is
  'Transliterates Latin letters to Cyrillic using the Buuz phonetic layout. Every A-Z maps to a Cyrillic equivalent.';

-- ═══════════════════════════════════════════════════════════════
-- 2. Update normalize_plate() to chain: strip → transliterate
-- ═══════════════════════════════════════════════════════════════
create or replace function public.normalize_plate(p text)
returns text
language sql
immutable
strict
as $$
  select public.translate_plate(
    upper(regexp_replace(p, '[\s\-–—._/\\]', '', 'g'))
  );
$$;

comment on function public.normalize_plate is
  'Strips separators, uppercases, and transliterates Latin→Cyrillic for Mongolian plates.';

-- ═══════════════════════════════════════════════════════════════
-- 3. Fix existing data that has untranslated Latin letters
-- ═══════════════════════════════════════════════════════════════
update public.vehicles
set plate_number = public.normalize_plate(plate_number)
where plate_number is not null
  and plate_number ~ '[A-Z]';

update public.parts_cars
set license_plate = public.normalize_plate(license_plate)
where license_plate is not null
  and license_plate ~ '[A-Z]';
