/// Mongolian administrative location data — aimags and sums.
///
/// Note: 'Хамын' (line 34) is a known typo preserved for database seed data
/// compatibility. The source list in [RegionSelectionPage._regions] now uses
/// the correct spelling 'Хөвсгөл' — but this list and the Supabase seed data
/// must stay as 'Хамын' to match existing records.
library;
/// All 21 Mongolian aimags plus the capital Улаанбаатар (22 entries).
///
/// Matches [RegionSelectionPage._regions] exactly (after the Баян-Өлгий and
/// Хөвсгөл fixes). The mongolian_locations seed data uses these aimag names.
const kAimagList = <String>[
  'Улаанбаатар',
  'Төв',
  'Хэнтий',
  'Булган',
  'Сэлэнгэ',
  'Дархан-Уул',
  'Орхон',
  'Архангай',
  'Өвөрхангай',
  'Баянхонгор',
  'Говь-Алтай',
  'Ховд',
  'Увс',
  'Завхан',
  'Дундговь',
  'Говьсүмбэр',
  'Дорнод',
  'Хамын',
  'Сүхбаатар',
  'Дорноговь',
  'Өмнөговь',
  'Баян-Өлгий',
];

/// Maximum length for location free-text fields (баг, газрын нэр).
const kMaxLocationFieldLength = 200;
