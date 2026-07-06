# @zuiio/core — Framework-Agnostic Utilities

Shared pure functions — no React, no DOM. Usable in server actions, scripts, CLI, and components.

## Lookup (Map builders)

Replace O(n) `Array.find()` with O(1) `Map.get()`:

| Function | Returns | Use case |
|---|---|---|
| `createLookup(items, keyFn, valueFn?)` | `Map<Key, Value>` | ID/barcode/code → object lookup |
| `createAggregatedLookup(items, keyFn, valueFn)` | `Map<Key, number>` | Sum/count by key (cart quantities, category counts) |

```ts
import { createLookup, createAggregatedLookup } from "@zuiio/core";

const byId = createLookup(products, p => p.id);
const barcodeMap = createLookup(products, p => p.barcode?.toLowerCase(), { skipNull: true });

const qtys = createAggregatedLookup(cartItems, i => i.productId, i => i.quantity);
```

See `src/lookup.ts` for full overloads and `{ skipNull }` option.

## Other modules

| Module | Key exports |
|---|---|
| `array.ts` | `groupBy`, `chunk`, `uniqueBy`, `sumBy`, `sortBy`, `range`, `shuffle` |
| `compress-image.ts` | `compressImage` |
| `date-ranges.ts` | `thisMonth`, `lastMonth`, `thisQuarter`, `lastNDays`, `DateRange` |
| `discount.ts` | `calculateDiscount`, `DiscountParams`, `DiscountResult` |
| `domain-rules.ts` | Mongolian validators: phone, plate, VIN, vehicle year |
| `errors.ts` | `AppError`, `NotFoundError`, `UnauthorizedError`, `ValidationError` |
| `format.ts` | `formatDate`, `formatRouteDate`, `slugify` |
| `logger.ts` | `defaultLogger`, `createChildLogger`, `Logger` |
| `money.ts` | `parseCurrencyInput`, `formatCurrencyCompact`, `clamp`, `round` |
| `name.ts` | `getCompactName` |
| `paginate.ts` | `paginate`, `totalPages`, `hasNextPage` |
| `rate-limit.ts` | `createRateLimiter`, `rateLimit`, `resetRateLimit` |
| `timezone.ts` | `formatInUB`, `formatShortDate`, `formatFullDateTime`, `TOLOM_TZ` |
| `types.ts` | `ProductOption`, `CustomerOption`, `SupplierOption`, `ActionResult`, `ok`, `err` |
| `utils.ts` | `cn`, `formatCurrency`, `formatMNT`, `getInitials`, `stableStringify` |
| `uuid.ts` | `generateUUID` |
| `validation.ts` | `requireEmail`, `requirePassword`, `escapeHtml`, `normalizePhone` |
| `form-validation.ts` | `flattenFieldErrors`, `ActionState` |
