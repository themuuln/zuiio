/// Mongolian administrative location data — aimags and sums.
///
/// The aimag list is based on
/// `RegionSelectionPage._regions` with Баян-Өлгий added (the one
/// missing aimag from that list) so that all 21 aimags + Улаанбаатар
/// (22 entries total) are represented.
///
/// Note: 'Хамын' is a known typo in the source list; the seed data
/// in `mongolian_locations` maps it to Хөвсгөл's official sums.
library;

/// All 21 Mongolian aimags plus the capital Улаанбаатар (22 entries).
///
/// Based on `RegionSelectionPage._regions` with Баян-Өлгий added.
/// The mongolian_locations seed data uses these exact aimag names.
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
