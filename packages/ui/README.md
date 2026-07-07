# @zuiio/ui — Shared UI Utilities

Small, focused helpers for search highlighting, toasts, and form input mappings. Utilities only — no full components, no layout, no pages.

**Peer dependencies:** `react` ^19, `sonner` ^2

## Highlights

| Export | Kind | Use case |
|---|---|---|
| `HighlightText` | React component | Wrap text to highlight matching query terms with `<mark>` |
| `searchByFields` | Function | Filter an array of items by substring match against specified fields |
| `toastRetry` | Function | Show an error toast with a "Retry" button that re-runs an async action |
| `formatMongolianPhone` | Function | Strip non-digits and cap at 8 digits (Mongolian phone number) |
| `formatPlateInput` | Function | Enforce Mongolian plate format: 4 digits + 3 Cyrillic letters |
| `inputProps` | Function | Map a field name to `inputMode` and `autoComplete` for consistent form hints |

## Usage

### HighlightText + searchByFields

Multi-term, case-insensitive highlighting. Breaks the query into words and highlights each independently:

```tsx
import { HighlightText, searchByFields } from "@zuiio/ui";

// Filter a list of customers by name or phone
const results = searchByFields(customers, "bat", ["name", "phone"]);

// Render results with highlighted matches
results.map((c) => (
  <div key={c.id}>
    <HighlightText text={c.name} query="bat" />
  </div>
));
```

`HighlightText` renders unmatched segments as plain text and matches inside `<mark>` tags. Pass `className` to override the default highlight styling.

### toastRetry

Shows an error toast with a "Retry" button (via `sonner`). On retry failure, shows a plain error toast — no nested retries to avoid loops:

```ts
import { toastRetry } from "@zuiio/ui";

try {
  await saveOrder(data);
} catch (e) {
  toastRetry("Failed to save order", () => saveOrder(data));
}
```

Third argument is `duration` in ms (default `6000`).

### Mongolian form helpers

```ts
import { formatMongolianPhone, formatPlateInput, inputProps } from "@zuiio/ui";

// Strips non-digits, caps at 8 (drops leading 976 if present)
formatMongolianPhone("976-1234-5678"); // → "12345678"

// Enforces 4 digits + 3 Cyrillic letters while typing
formatPlateInput("1234АБВ"); // → "1234АБВ"
formatPlateInput("12ABС3");  // → "123АБС"  (digits first, then letters)

// Returns inputMode + autoComplete for a field name
const { inputMode, autoComplete } = inputProps("phone");
// → { inputMode: "tel", autoComplete: "tel" }
```

`inputProps` does partial matching — `"plateNumber"` matches `"plate"`, `"firstName"` matches `"firstName"`. Accepts optional overrides:

```ts
const props = inputProps("customField", { inputMode: "decimal", autoComplete: "off" });
```

## Source map

| Module | Exports |
|---|---|
| `highlight-text.tsx` | `HighlightText`, `searchByFields` |
| `toast-retry.ts` | `toastRetry` |
| `form-input-props.ts` | `formatMongolianPhone`, `formatPlateInput`, `inputProps` |
