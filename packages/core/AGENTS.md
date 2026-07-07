# @zuiio/core

Framework-agnostic TypeScript utilities for the zuiio monorepo. No React, no DOM — pure functions and types that run in Node.js API routes, server actions, Edge runtimes, and (where noted) the browser.

## Exports

| Module | Description |
|---|---|
| `array` | `groupBy`, `chunk`, `uniqueBy`, `sumBy`, `sortBy` — generic array transforms |
| `compress-image` | Client-side image compression to WebP via canvas (browser only) |
| `date-ranges` | Preset date ranges: `thisMonth`, `lastQuarter`, `lastNDays`, etc. |
| `discount` | `calculateDiscount` — percentage/fixed-amount discounts with product/category conditions |
| `domain-rules` | Mongolian business validation: phone (`+976`), plates (`4444УНА`), VIN, vehicle year |
| `errors` | `AppError` hierarchy (`NotFoundError`, `UnauthorizedError`, etc.) + `toApiErrorResponse` |
| `form-validation` | `flattenFieldErrors` (Zod → field map), `ActionState<T>` type for server actions |
| `format` | `formatCurrency` (₮), `formatDate`, `slugify` |
| `image-optimizer` | Server-side sharp-based resize/compress/thumbnail (Node.js only, not Edge) |
| `logger` | `Logger` interface + `createChildLogger` — pino-compatible, console fallback |
| `lookup` | `createLookup` (O(1) Map from array) and `createAggregatedLookup` (sum/count by key) |
| `money` | `parseCurrencyInput`, `formatCurrencyCompact` (₮1.2M), `clamp`, `round` |
| `name` | `getCompactName` — "Boldbaatar Tsengel" → "B. Tsengel" |
| `paginate` | `paginate` (Supabase `.range()` args), `totalPages`, `hasNextPage` |
| `rate-limit` | In-memory sliding-window rate limiter with Mongolian error messages |
| `timezone` | Ulaanbaatar (`Asia/Ulaanbaatar`) date formatters: `formatInUB`, `formatRelative`, `formatDateRange` |
| `types` | Shared domain types: `ProductOption`, `LineItem`, `ActionResult<T>`, `CartItemData` |
| `utils` | `cn()` — clsx + tailwind-merge class merger |
| `uuid` | `generateUUID` — crypto.randomUUID with polyfill fallback |
| `validation` | `requireEmail`, `requirePassword`, `getString`, `normalizePhone`, `sanitizeRedirectPath`, `escapeHtml` |

## Key Utilities

### `createLookup` / `createAggregatedLookup`

Replace O(n) `Array.find()` / `Array.filter().length` with O(1) `Map.get()` in hot paths:

```ts
import { createLookup, createAggregatedLookup } from "@zuiio/core";

// O(1) product lookup by id
const byId = createLookup(products, (p) => p.id);
const product = byId.get(productId);

// With value projection (skip full object)
const names = createLookup(products, (p) => p.id, (p) => p.name);

// Sum quantities per product (for cart badges)
const qtys = createAggregatedLookup(cartItems, (i) => i.productId, (i) => i.quantity);
```

### `AppError` hierarchy

Structured errors for API routes. Throw in services; catch with `toApiErrorResponse` in route handlers:

```ts
import { NotFoundError, ForbiddenError, toApiErrorResponse } from "@zuiio/core";

// In a service
throw new NotFoundError("Sale not found", { saleId });

// In a Next.js API route
try { ... }
catch (e) { return NextResponse.json(...toApiErrorResponse(e)); }
```

### `domain-rules`

Mongolian-specific validation — phone normalization, plate transliteration (Latin → Cyrillic via Buuz phonetic layout), VIN and vehicle year checks:

```ts
import { isValidMongolianPhone, normalizeMongolianPlate } from "@zuiio/core";

isValidMongolianPhone("+976 99112233"); // true
normalizeMongolianPlate("4444 una");     // "4444УНА"
```

## Dependencies

`date-fns` (date manipulation), `clsx` + `tailwind-merge` (class merging via `cn()`). The `image-optimizer` module additionally requires `sharp` (Node.js only). Zero React dependency.

## Tasks (Agent Router)

Use this section to find the right context for your task.

### Common tasks

- **Format currency** → `formatCurrency()` from `format` module
- **Validate Mongolian phone** → `isValidMongolianPhone()` from `domain-rules`
- **Normalize plate** → `normalizeMongolianPlate()` from `domain-rules`
- **Create lookup map** → `createLookup()` or `createAggregatedLookup()` from `lookup`
- **Throw structured error** → Use `AppError` hierarchy from `errors`
- **Flatten Zod errors** → `flattenFieldErrors()` from `form-validation`
- **Paginate Supabase query** → `paginate()` from `paginate`
- **Rate limit API** → `createRateLimiter()` from `rate-limit`
- **Format Ulaanbaatar date** → `formatInUB()` from `timezone`
- **Compress image (browser)** → `compressImage()` from `compress-image`
- **Compress image (server)** → `optimizeImage()` from `image-optimizer`
