---
**ID:** `G-11`
**Name:** Drag-to-Reorder Leader Categories
**Priority:** `P2`
**Status:** `⬜`
**Effort:** `S` (2-4h)
**Tags:** `frontend`, `drag-and-drop`, `personalization`, `leaders`
**DB Readiness:** `✅` Fully supported by current schema

---

## Goal

The leader tabs (Points, Rebounds, Assists, etc.) can be reordered by dragging. Users pin their favorite stat categories to the top. Order persists in localStorage.

## Why

Different users care about different stats. A coach might want Assists and Steals first; a fan might care about Points and Rebounds. Letting users reorder the tabs is zero-cost personalization. No accounts, no backend — just localStorage. It makes the leaders page feel like the user's own dashboard.

## Technical Approach

### Sortable Tab Strip

- `<TabsList>` wraps the tabs in a `@dnd-kit/sortable` `SortableContext`
- Each `<TabsTrigger>` is wrapped in a `useSortable` HOC
- A small grip icon (⠿ 6 dots) on the left of each tab signals drag affordance
- On drag end, `onDragEnd` fires → reorder the `CATEGORIES` array in local state
- Animation: `@dnd-kit/sortable` provides built-in `AnimateLayoutChanges` for smooth reordering

### Persistence

```ts
const CATEGORY_ORDER_KEY = 'onoo-leader-order';

// On mount:
const saved = localStorage.getItem(CATEGORY_ORDER_KEY);
const initialOrder = saved ? JSON.parse(saved) : DEFAULT_ORDER;

// On reorder:
localStorage.setItem(CATEGORY_ORDER_KEY, JSON.stringify(newOrder));
```

- Default order: `['pts', 'reb', 'ast', 'stl', 'blk', 'fg_pct', 'fg3_pct', 'ft_pct']`
- User-modified order stored as array of stat keys
- On mount, merge saved order with DEFAULT_ORDER (if new categories were added since last save, append them to the end)

### Context Providers

```tsx
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext items={orderedCategories} strategy={horizontalListSortingStrategy}>
    <TabsList>
      {orderedCategories.map(cat => (
        <SortableTab key={cat.key} category={cat} />
      ))}
    </TabsList>
  </SortableContext>
</DndContext>
```

- Sensors: `PointerSensor` with `activationConstraint: { distance: 8 }` — require 8px drag before activation to avoid accidental reorder on click

### Component Changes

- File: `pages/leaders/page.tsx` or `components/leaders/leader-tabs.tsx`
- Replace the static `<TabsList>` children with `<SortableTab>` components
- Add `DndContext`, `SortableContext` wrapping
- Use `horizontalListSortingStrategy` for horizontal drag

## Data Dependencies

| Entity | Access | Purpose |
|--------|--------|---------|
| `v_public_leaders` | Already loaded | Stat categories derived from column keys |

No database changes needed.

## Implementation Steps

1. **Install `@dnd-kit/sortable` if not already available** (Tolom uses it — check monorepo shared deps)

2. **Refactor leader tabs to use sortable pattern:**
   - Create `SortableTab` component wrapping `TabsTrigger` with `useSortable`
   - Add grip icon to each tab
   - Wrap `TabsList` in `SortableContext`

3. **Add localStorage persistence:**
   - Read saved order on mount
   - Write on every reorder
   - Merge strategy for new categories

4. **Style drag states:**
   - Normal tab: standard appearance
   - Dragging tab: elevated shadow, slight rotation
   - Drag overlay: semi-transparent pill
   - Drop indicator: subtle background on hover target

5. **Test:**
   - Drag tab to new position → tabs reorder smoothly
   - Refresh page → order persists
   - Clear localStorage → default order restored

## Implementation Complexity & Effort

**Complexity:** Low. ~80 lines for sortable wrapper + localStorage persistence.

**Effort:** S (2-4 hours)
- SortableTab component: 1h
- State management + localStorage: 1h
- Styling (+ drag overlay, grip): 30min
- Testing: 30min

## Dependencies / Prereqs

**Blocked by:** None
**Prereqs:** `@dnd-kit/sortable` available in the monorepo (Tolom uses it). Tabs component already renders leader categories.

## Design Decisions

- **Horizontal sort, not vertical.** The tabs are a horizontal strip. `@dnd-kit/sortable` supports `horizontalListSortingStrategy`.
- **8px activation distance** prevents accidental reorder when clicking a tab to view its content.
- **localStorage, not backend.** This is purely cosmetic personalization — no server storage needed. The user expects this preference to be device-specific anyway.
- **Merge saved + default order** handles the case where new stat categories are added later. The user's saved order takes priority, with new categories appended.

## Risks & Gotchas

- **Horizontal overflow + drag.** The tabs may overflow horizontally on small screens. Dragging to reorder while the container scrolls is tricky. Ensure the `DndContext` has `useScrollableOverflow` or constrain to visible items only if scrolling is needed.
- **Content switches on tab click.** Clicking a tab also changes the displayed content. Ensure the `PointerSensor` distance threshold prevents drag from also triggering the tab change.
- **Tabs + sortable + shadcn `TabsTrigger`** may conflict. The `SortableTab` needs to be a `<TabsTrigger>` *or* render one inside the sortable item. Test component composition.
- **Persistent state + SSR:** Ensure localStorage access is guarded with `typeof window !== 'undefined'`. On first render, show default order, then hydrate with saved order.

## Verification

```bash
# Type check
pnpm exec tsc --noEmit

# Build
pnpm build
```

### Done When

- [ ] Leader tabs are draggable and reorder smoothly
- [ ] Grip icon visible on each tab
- [ ] Order persists across page reload (localStorage)
- [ ] Default order restored when localStorage is cleared
- [ ] New stat categories (added later) appear at the end of saved order
- [ ] Clicking a tab switches content without triggering reorder
- [ ] TypeScript compilation passes

---

_Last updated: 2026-07-21 | Status: ⬜_
