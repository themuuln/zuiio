# List Virtualization Research Report — Tolom

> **Date:** 2026-07-11  
> **Stack:** Next.js 16.3 + React 19.2.7 + TanStack Query v5 + TanStack Table v8 + shadcn/ui + Tailwind v4  
> **React Compiler:** `turbopackRustReactCompiler: true` (Rust variant)  
> **Context:** Zero virtualization currently. Lists: work orders, customers, mechanics, inventory/parts, service reminders.

---

## 1. Recommended Library: `@tanstack/react-virtual` v3.x

### Why TanStack Virtual

| Factor | Rationale |
|---|---|
| **Ecosystem fit** | You already use TanStack Query v5 + TanStack Table v8. Adding `@tanstack/react-virtual` is the [officially recommended pattern](https://tanstack.com/table/v8/docs/guide/virtualization) for virtualizing TanStack Table rows. Same headless philosophy, same maintainer. |
| **Bundle size** | ~5KB gzipped vs 17KB for react-virtuoso. Critical for a performance-sensitive auto repair app. |
| **Headless API** | Aligns with your shadcn/ui approach — you own the markup, the library only calculates positions. |
| **Dynamic row heights** | `measureElement` ref-based API auto-measures after render — no height pre-calculation needed. |
| **Framework-agnostic core** | `@tanstack/virtual-core` powers React, Vue, Solid, Svelte — shared mental model if you expand the platform. |
| **React Compiler workaround** | Well-documented, clean, one-line fix. See §6 Pitfalls. |
| **Community** | ~1.3M weekly downloads, 7K GitHub stars, actively maintained by TanStack/Tanner Linsley. |

### Why NOT react-virtuoso (the alternative)

react-virtuoso (~2.1M downloads, ~17KB) is a fine library with richer out-of-the-box features (built-in infinite scroll, grouped lists, `TableVirtuoso`). However:

- It introduces a **second mental model** alongside your TanStack stack — components vs hooks.
- 17KB vs 5KB — 12KB difference is ~3x the virtualization logic cost.
- You'd use TanStack Table for column/sorting/filtering logic anyway, so react-virtuoso's `TableVirtuoso` overlaps.
- The pkgpulse.com 2026 comparison confirms: *"Choose @tanstack/react-virtual when you're already in the TanStack ecosystem."*

**Fallback:** If the React Compiler workaround proves problematic in production, react-virtuoso is the safe alternative. No known compiler memoization issues.

---

## 2. Bundle Size Comparison

| Library | Bundle (gzip) | Weekly Downloads | Last Release | Maintenance |
|---|---|---|---|---|
| `@tanstack/react-virtual` | **~5KB** | ~1.3M | v3.x (2024) | ✅ Active |
| `@tanstack/virtual-core` | ~4KB | ~1.3M | v3.x (2024) | ✅ Active |
| `react-virtuoso` | ~17KB | ~2.1M | v4.x (2024) | ✅ Active |
| `react-window` | ~6KB | ~1.9M | v1.8 (2019) | ⚠️ Maintenance mode |
| `react-virtualized` | ~40KB+ | Declining | v9.x (old) | ⛔ Deprecated |

> **Performance note:** For 100K items, all three active libraries achieve 60 FPS scroll with ~20 DOM nodes in viewport. The bottleneck shifts to your item renderer complexity, not the library.

---

## 3. React 19 / Next.js 16 Compatibility Matrix

| Library | React 19 | React Compiler (Rust) | React Compiler (Babel) | Next.js App Router SSR | Known Issues |
|---|---|---|---|---|---|
| `@tanstack/react-virtual` | ✅ | ⚠️ **Workaround needed** | ⚠️ **Workaround needed** | ✅ (client components) | #743: compiler caches `getVirtualItems()` |
| `react-virtuoso` | ✅ | ✅ No reported issues | ✅ No reported issues | ✅ (client components) | None known |
| `react-window` | ✅ | ✅ N/A (no memo deps) | ✅ N/A | ✅ (client components) | Dead project |

### The React Compiler Issue (Critical for Tolom)

**Issue [#743](https://github.com/TanStack/virtual/issues/743):** The React Compiler (both Rust and Babel variants) caches `getVirtualItems()` results based on the virtualizer instance reference. Since the instance reference doesn't change between renders, the compiler hoists/memoizes the call, causing it to always return stale (often empty) results.

**Status as of July 2026:** PR [#851](https://github.com/TanStack/virtual/pull/851) proposed a fix using `useSyncExternalStore` + `Object.create` but was **closed** (May 2025) as incomplete. **No official fix has been merged.**

**Three workarounds (ranked by recommendation):**

1. **`'use no memo'` directive** (recommended by TanStack maintainer):
   ```typescript
   const useNoMemo = <const T>(factory: () => T): T => {
     'use no memo';
     return factory();
   }
   
   // Usage:
   const virtualItems = useNoMemo(() => virtualizer.getVirtualItems());
   ```
   De-opts _just_ the `getVirtualItems()` call without affecting the rest of the component.

2. **Store in a ref:**
   ```typescript
   const virtualizer = useVirtualizer({ ... });
   const virtualizerRef = useRef(virtualizer);
   // Use virtualizerRef.current.getVirtualItems()
   ```
   Some users report this doesn't always work reliably.

3. **Disable compiler for the file:**
   ```typescript
   'use no memo';
   ```
   At file level — de-opts the entire component. Too coarse.

---

## 4. Implementation Pattern — Architecture for Tolom

### 4.1 Package Installation

```bash
pnpm add @tanstack/react-virtual
```

### 4.2 Core Architecture

```
src/
├── hooks/
│   ├── use-virtual-list.ts        # Generic virtual list hook (wraps useVirtualizer)
│   ├── use-virtual-table.ts       # Virtual table hook (combines TanStack Table + Virtual)
│   └── use-infinite-virtual.ts    # Infinite scroll + virtualization combo
├── components/
│   ├── virtual-list.tsx           # Generic <VirtualList> component
│   ├── virtual-table.tsx          # Virtualized data table (wraps shadcn <Table>)
│   └── virtual-sentinel.tsx       # Intersection observer for infinite loading
└── app/
    └── [locale]/dashboard/
        ├── work-orders/
        │   └── page.tsx           # Uses <VirtualTable> with work order query
        ├── customers/
        │   └── page.tsx           # Uses <VirtualList> with customer query
        └── ...
```

### 4.3 Infinite Scroll + Virtualization Pattern

This is the primary pattern for Tolom — all lists load data via TanStack Query:

```typescript
// hooks/use-infinite-virtual.ts
"use client";

import { useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface UseInfiniteVirtualOptions<T> {
  /** Flat array of all loaded items */
  items: T[];
  /** Whether more pages are available */
  hasNextPage: boolean;
  /** Whether the next page is currently loading */
  isFetchingNextPage: boolean;
  /** Trigger to load the next page */
  fetchNextPage: () => void;
  /** Estimated item height in px */
  estimatedItemHeight?: number;
  /** Number of items to render outside viewport */
  overscan?: number;
}

/**
 * Combines @tanstack/react-virtual with useInfiniteQuery pattern.
 * Adds a sentinel row at the end that triggers fetchNextPage when scrolled into view.
 */
export function useInfiniteVirtual<T>({
  items,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  estimatedItemHeight = 48,
  overscan = 5,
}: UseInfiniteVirtualOptions<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  // +1 for the sentinel row that triggers loading
  const count = hasNextPage ? items.length + 1 : items.length;

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedItemHeight,
    overscan,
  });

  // Trigger fetch when the sentinel row becomes visible
  const virtualItems = virtualizer.getVirtualItems();
  const lastItem = virtualItems[virtualItems.length - 1];

  useEffect(() => {
    if (!lastItem) return;
    if (lastItem.index >= items.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [lastItem, items.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    parentRef,
    virtualizer,
    virtualItems,
    totalSize: virtualizer.getTotalSize(),
    isSentinel: (index: number) => index >= items.length,
  };
}
```

### 4.4 Virtual Table (TanStack Table + Virtual + shadcn/ui)

This is the exact pattern for your work orders, parts inventory, and customer tables:

```typescript
// components/virtual-table.tsx
"use client";

import { useRef } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VirtualTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  /** Scroll container height */
  height?: string;
  /** Estimated row height in px */
  rowHeight?: number;
  /** Number of rows to render outside viewport */
  overscan?: number;
}

export function VirtualTable<TData>({
  data,
  columns,
  height = "600px",
  rowHeight = 48,
  overscan = 5,
}: VirtualTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // Padding above/below to maintain scroll position
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - virtualRows[virtualRows.length - 1].end
      : 0;

  return (
    <div
      ref={parentRef}
      className="overflow-auto rounded-md border"
      style={{ height }}
    >
      <Table className="grid">
        <TableHeader className="sticky top-0 z-10 bg-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="flex w-full">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: header.getSize() }}
                  className="flex-shrink-0"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody
          className="relative grid w-full"
          style={{ height: `${totalSize}px` }}
        >
          {/* Top spacer for rows above viewport */}
          {paddingTop > 0 && (
            <TableRow
              className="flex"
              style={{ height: `${paddingTop}px` }}
              aria-hidden
            />
          )}

          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            if (!row) return null;

            return (
              <TableRow
                key={row.id}
                data-index={virtualRow.index}
                ref={(node) => {
                  if (node) virtualizer.measureElement(node);
                }}
                className="flex items-center"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                }}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                    className="flex-shrink-0"
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}

          {/* Bottom spacer for rows below viewport */}
          {paddingBottom > 0 && (
            <TableRow
              className="flex"
              style={{ height: `${paddingBottom}px` }}
              aria-hidden
            />
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

### 4.5 Usage in Page Components

```typescript
// app/[locale]/dashboard/work-orders/page.tsx
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useInfiniteVirtual } from "@/hooks/use-infinite-virtual";
import { VirtualTable } from "@/components/virtual-table";
import { workOrderColumns } from "./columns";

export default function WorkOrdersPage() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["work-orders"],
    queryFn: ({ pageParam }) => fetchWorkOrders({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const allOrders = data?.pages.flatMap((page) => page.orders) ?? [];

  const { parentRef, virtualItems } = useInfiniteVirtual({
    items: allOrders,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
    estimatedItemHeight: 64,
  });

  // ...render with parentRef on scroll container, virtualItems for rows
}
```

### 4.6 Window Mode vs Container Mode

| Mode | When to use | How |
|---|---|---|
| **Container mode** (recommended for Tolom) | Dashboard pages with fixed layout, sidebar navigation | Scroll element is a `<div ref={parentRef}>` with explicit `height` and `overflow: auto` |
| **Window mode** | Full-page lists, chat interfaces, feeds | Use `useWindowVirtualizer` instead — scrolls with the browser window |

For Tolom's dashboard layout, **container mode is correct** — the sidebar + header chrome occupy space, and each page has its own scroll region.

---

## 5. Migration Strategy — Incremental Rollout

### Phase 1: Foundation (no page changes)
1. Install `@tanstack/react-virtual`
2. Create `hooks/use-infinite-virtual.ts` and `components/virtual-table.tsx`
3. Add the `'use no memo'` helper hook to work around the React Compiler issue
4. Verify the helper compiles correctly with `turbopackRustReactCompiler: true`

### Phase 2: Highest-impact pages first
Start with the list that causes the most DOM pressure — likely **work orders** or **customers** (these tend to accumulate the most rows):
1. Wrap existing query in `useInfiniteQuery` (if not already)
2. Replace raw `.map()` rendering with `<VirtualTable>`
3. Test scroll performance, keyboard navigation, loading states

### Phase 3: Remaining lists
Roll out to mechanics, inventory/parts, service reminders — same pattern.

### Phase 4: Polish
1. Add skeleton loading states for virtual lists
2. Ensure keyboard navigation works (arrow keys scroll the virtual list)
3. Add `aria-rowcount`, `aria-rowindex` for screen readers
4. Test on mobile (touch scrolling behavior)

### What does NOT need to change
- Server Components remain untouched — virtualization is always in client components
- API routes stay the same — you're just rendering differently on the client
- TanStack Query setup stays the same — you're adding `useInfiniteQuery` where needed
- shadcn/ui `<Table>` components stay the same — Virtual Table wraps them

---

## 6. Pitfalls to Avoid

### 🔴 CRITICAL: React Compiler + `getVirtualItems()`

The React Compiler (Rust variant via `turbopackRustReactCompiler: true`) will cache `getVirtualItems()` results, causing the virtualizer to return empty arrays or stale data.

**Fix:** Always wrap `getVirtualItems()` in the `useNoMemo` helper:

```typescript
const useNoMemo = <const T>(factory: () => T): T => {
  'use no memo';
  return factory();
};

// In your component:
const virtualRows = useNoMemo(() => virtualizer.getVirtualItems());
```

This de-opts _only_ the `getVirtualItems()` call, not the entire component.

**Tracking:** [TanStack/virtual#743](https://github.com/TanStack/virtual/issues/743) — no official fix merged as of July 2026.

### 🟡 Scroll Container Must Have Explicit Height

```tsx
// ❌ BROKEN — no height, virtualizer can't calculate viewport
<div ref={parentRef} className="overflow-auto">

// ✅ WORKS
<div ref={parentRef} className="overflow-auto" style={{ height: "600px" }}>
```

The virtualizer needs to know the viewport size. Without it, `getScrollElement()` returns a 0-height element.

### 🟡 Memoize Item Renderers

If your row components re-render on every parent state change, virtualization provides no benefit:

```tsx
// ❌ BAD — re-renders all visible rows on any state change
{virtualRows.map(vr => <WorkOrderRow order={orders[vr.index]} />)}

// ✅ GOOD — React.memo prevents unnecessary re-renders
const MemoizedRow = React.memo(WorkOrderRow);
{virtualRows.map(vr => <MemoizedRow key={vr.key} order={orders[vr.index]} />)}
```

### 🟡 Accessibility: Virtual Lists Are Not Inert

Screen readers see DOM nodes that exist. When items are virtualized away, they're gone from the DOM and unreachable by assistive technology.

**Mitigation:**
- Add `role="grid"` or `role="list"` to the container
- Add `aria-rowcount={totalItems}` to indicate total size
- Add `aria-rowindex={rowIndex + 1}` to each visible row
- Ensure keyboard focus can reach all rows via arrow key navigation
- Consider `aria-label` on the scroll container

### 🟡 `estimateSize` Accuracy Matters

If your `estimateSize` is way off (e.g., estimating 48px for rows that are actually 120px), users will see visible "jumping" as rows are measured after first render.

**Fix:** Set `estimateSize` close to the average real row height. For Tolom's tables with compact rows, `48-64px` is typical. For expandable cards, `80-120px`.

### 🟢 Don't Virtualize Short Lists

If a list has <50 items, virtualization adds complexity for no benefit. The DOM overhead of ~50 rows is negligible. Set a threshold:

```typescript
const shouldVirtualize = items.length > 50;
```

### 🟢 SSR Compatibility

`@tanstack/react-virtual` works with SSR because:
- It's a client-side hook (`"use client"` required)
- It doesn't render anything on the server
- The virtualizer initializes on mount via `useEffect`/`useLayoutEffect`

In Next.js App Router, virtualized lists MUST be in client components. This is fine for Tolom — all interactive list pages are already client components.

---

## Sources

| Source | URL | Key Insight |
|---|---|---|
| PkgPulse 2026 Comparison | [pkgpulse.com](https://www.pkgpulse.com/guides/tanstack-virtual-vs-react-window-vs-react-virtuoso-2026) | Comprehensive library comparison with benchmarks |
| TanStack Virtual #743 | [GitHub](https://github.com/TanStack/virtual/issues/743) | React Compiler caching bug — workarounds documented |
| TanStack Virtual PR #851 | [GitHub](https://github.com/TanStack/virtual/pull/851) | Proposed `useSyncExternalStore` fix (closed as incomplete) |
| TanStack Table Virtualization Guide | [tanstack.com](https://tanstack.com/table/v8/docs/guide/virtualization) | Official pattern for Table + Virtual integration |
| Viprasol: Infinite Scroll 2026 | [viprasol.com](https://viprasol.com/blog/react-virtualized-infinite/) | Complete implementation pattern with `useInfiniteQuery` |
| Dev.to: Virtualized Table + shadcn | [dev.to](https://dev.to/ainayeem/building-an-efficient-virtualized-table-with-tanstack-virtual-and-react-query-with-shadcn-2hhl) | Step-by-step shadcn/ui integration |
| W3C ARIA Keyboard Interface | [w3.org](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) | Accessibility patterns for composite widgets |
