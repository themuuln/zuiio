-- Add Latin→Cyrillic transliteration to plate normalization.
-- Previously, normalize_plate() only stripped whitespace/case — Latin letters
-- like D, F, Q, W passed through untranslated and hit the CHECK constraint.
--
-- Mirrors the LATIN_TO_CYRILLIC map in src/lib/form-validation.ts (Buuz phonetic layout).
-- Source: https://github.com/odbayar/buuz

-- ═══════════════════════════════════════════════════════════════
-- 1. translate_plate(): Latin → Cyrillic for all 26 letters
--    Target string must be in A-Z order. Each position maps one Latin
--    letter to its Buuz phonetic Cyrillic equivalent.
-- ═══════════════════════════════════════════════════════════════
--
-- Mapping reference (must match src/lib/form-validation.ts LATIN_TO_CYRILLIC):
--   A→А B→Б C→Ц D→Д E→Э F→Ф G→Г H→Х I→И J→Ж K→К L→Л M→М
--   N→Н O→О P→П Q→Ө R→Р S→С T→Т U→У V→В W→Ү X→Х Y→Ы Z→З
--
create or replace function public.translate_plate(p text)
returns text
language sql
immutable
strict
as $$
  select upper(translate(
    p,
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'АБЦДЭФГХИЖКЛМНОПӨРСТУВҮХЫЗ'
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
-- 3. Fix existing data
--
-- Three categories:
--   (a) Rows still containing Latin letters → normalize directly
--   (b) Rows transliterated by old mapping (20260524114223) that
--       produced DIFFERENT Cyrillic than Buuz (B→В vs Б, C→С vs Ц,
--       E→Е vs Э, H→Н vs Х, X→Х same, Y→У vs Ы) → reverse those
--       specific characters back to Latin, then re-normalize
--   (c) Rows with original Cyrillic (no Latin ever) → untouched
--
-- Note: X→Х is the same in old and new mapping, so no reverse needed.
-- Note: Y→У (old) vs Y→Ы (new) — we reverse У→Y, but this also
--       affects plates with original У or from U→У. Since У is a
--       valid plate letter, we skip this reverse to avoid corruption.
--       Those plates will remain under old mapping (Б/Ц/Э/Н stored
--       where Б/Ц/Э/Н should be — acceptable as they're still valid
--       Mongolian plate letters).
-- ═══════════════════════════════════════════════════════════════

-- (a) Rows with Latin letters → normalize directly
update public.vehicles
set plate_number = public.normalize_plate(plate_number)
where plate_number is not null
  and plate_number ~ '[A-Z]';

update public.parts_cars
set license_plate = public.normalize_plate(license_plate)
where license_plate is not null
  and license_plate ~ '[A-Z]';

-- (b) Old-mapping rows: reverse changed characters, then re-normalize
-- Old mapping (20260524114223): translate('ABCEHKMOPTXY','АВСЕНКМОРТХУ')
-- Changed chars: B→В, C→С, E→Е, H→Н (X→Х same in both, skip)
update public.vehicles
set plate_number = public.normalize_plate(
  translate(plate_number, 'ВСЕН', 'BCEN')
)
where plate_number is not null
  and plate_number ~ '[ВСЕН]';

update public.parts_cars
set license_plate = public.normalize_plate(
  translate(license_plate, 'ВСЕН', 'BCEN')
)
where license_plate is not null
  and license_plate ~ '[ВСЕН]';
