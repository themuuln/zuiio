-- ============================================================
-- Add user rank to profiles
-- Version: 15 (2026-06-11)
--
-- Уяачийн алдар цол нэмэх — Mongolian uyach rank hierarchy.
-- Stores the user's trainer/herder rank for display on profiles
-- and marketplace listings.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rank TEXT
    CHECK (rank IN (
      'no_rank',
      'zalu_uu',
      'sum_aldart',
      'aimag_aldart',
      'uls_aldart',
      'manlai',
      'tod_manlai',
      'myangat'
    ))
    DEFAULT 'no_rank';

COMMENT ON COLUMN profiles.rank IS
  'Уяачийн алдар цол — Mongolian uyach/herder rank. '
  'Values: no_rank (Адуучин), zalu_uu (Залуу уяач), '
  'sum_aldart (Сумын алдарт), aimag_aldart (Аймгийн алдарт), '
  'uls_aldart (Улсын алдарт), manlai (Манлай), '
  'tod_manlai (Тод манлай), myangat (Мянгат малчин)';
