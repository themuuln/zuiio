# @zuiio/i18n

Internationalization utilities for Mongolian and other languages. Pure functions, no React dependency.

## Exports

| Module | Description |
|--------|-------------|
| `format-date` | Mongolian date formatting with relative time |
| `number-to-words` | Convert numbers to words (Mongolian, English) |
| `ordinal` | Ordinal suffixes (1st, 2nd, 3rd, etc.) |

## Usage

### Date formatting

```ts
import { formatMongolianDate, formatRelativeTime } from "@zuiio/i18n";

// Format date in Mongolian
formatMongolianDate(new Date(), "long"); // "2024 оны 1 дүгээр сарын 15"
formatMongolianDate(new Date(), "short"); // "2024.01.15"

// Relative time
formatRelativeTime(new Date(Date.now() - 3600000)); // "1 цагийн өмнө"
```

### Number to words

```ts
import { numberToWords, numberToWordsMongolian } from "@zuiio/i18n";

numberToWords(123); // "one hundred twenty-three"
numberToWordsMongolian(123); // "нэг зуун хорин гурав"
```

### Ordinals

```ts
import { ordinal } from "@zuiio/i18n";

ordinal(1); // "1st"
ordinal(2); // "2nd"
ordinal(3); // "3rd"
ordinal(21); // "21st"
```

## Dependencies

None — pure TypeScript functions.

## Notes

- Mongolian formatting follows official CJK calendar conventions
- Number-to-words supports large numbers (millions, billions)
- All functions are tree-shakeable
