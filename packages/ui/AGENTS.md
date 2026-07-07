# @zuiio/ui

Shared UI utilities — search highlighting, toast helpers, form input mappings. Small composable primitives, not full components.
**Peer deps:** `react ^19`, `sonner ^2`

## Exports

| Export | Description |
|---|---|
| `HighlightText` | React component — highlights multi-term search matches via `<mark>`. |
| `searchByFields` | Filters objects by substring match across specified string fields. |
| `toastRetry` | Error toast with "Retry" button that re-runs an async function. |
| `formatMongolianPhone` | Strips non-digits, caps at 8 (Mongolian phone length), strips leading `976`. |
| `formatPlateInput` | Enforces Mongolian plate format: up to 4 digits + 3 Cyrillic/latin letters. |
| `inputProps` | Maps field name → `inputMode` + `autoComplete` for consistent form hints. |

## Usage

```tsx
import {
  HighlightText, searchByFields, toastRetry,
  formatMongolianPhone, formatPlateInput, inputProps,
} from "@zuiio/ui";
```

```tsx
// Highlight search matches
<HighlightText text="Toyota Camry 2020" query="toyo cam" />
// → <mark>Toyo</mark>ta <mark>Cam</mark>ry 2020

// Filter items by substring
const results = searchByFields(vehicles, "camry", ["make", "model"]);

// Error toast with retry (no nested retry on failure)
toastRetry("Failed to save", () => saveInvoice(data));

// Format phone / plate input on change
<input inputMode="tel" value={formatMongolianPhone(raw)} />
<input value={formatPlateInput(raw)} />

// Consistent input hints by field name
const { inputMode, autoComplete } = inputProps("phone");
// → "tel", "tel"
const { inputMode } = inputProps("code", { inputMode: "numeric" });
// → "numeric", "off" (overrides supported)
```

## Notes

- `HighlightText` wraps output in `<span>`; pass `className` for styling.
- `searchByFields` is substring only — for fuzzy search use `useFuzzySearch` from `@zuiio/hooks`.
- `inputProps` matches case-insensitively with partial matching (`"plateNumber"` → `"plate"`).
