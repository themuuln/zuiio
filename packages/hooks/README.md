# @zuiio/hooks — Generic React Hooks

React 19 hooks shared across Zer and Tolom. All accept standard React deps arrays.

## Lookup hooks (memoized Map builders)

Replace inline `useMemo(() => new Map(...))` with one-liner hooks:

| Hook | Returns | Use case |
|---|---|---|
| `useLookup(items, keyFn, valueFn?)` | `Map<Key, Value>` | ID/barcode/code → object lookup |
| `useAggregatedLookup(items, keyFn, valueFn)` | `Map<Key, number>` | Sum/count by key (cart quantities, category counts) |

```ts
import { useLookup, useAggregatedLookup } from "@zuiio/hooks";

const barcodeMap = useLookup(products, p => p.barcode?.toLowerCase(), { skipNull: true });
const product = barcodeMap.get(scannedBarcode);

const cartQtys = useAggregatedLookup(
  items.filter(i => !i.variantId),
  i => i.productId,
  i => i.quantity,
);
```

These are `useMemo`-wrapped versions of `createLookup`/`createAggregatedLookup` from `@zuiio/core`. Use the core functions directly in non-React contexts (server actions, CLI scripts).

## Other hooks

| Hook | Description |
|---|---|
| `useCopyToClipboard` | Copy text + brief "copied" feedback |
| `useDebounce(value, delay)` | Debounce a changing value |
| `useDisclosure` | `{ isOpen, onOpen, onClose, onToggle }` |
| `useFuzzySearch(items, query, options?)` | Client-side fuzzy search via Fuse.js |
| `useIntersectionObserver(ref, options?)` | `IntersectionObserver` hook |
| `useLocalStorage(key, initialValue)` | `useState` synced to `localStorage` |
| `useOnlineStatus` | Online/offline `boolean` |
| `useTableFilters` | URL-param-based table filter state (requires `nuqs`) |
