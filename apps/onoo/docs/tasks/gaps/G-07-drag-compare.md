---
**ID:** `G-07`
**Name:** Drag-to-Compare Players
**Priority:** `P1`
**Status:** `⬜`
**Effort:** `M` (1-2d)
**Tags:** `frontend`, `drag-and-drop`, `comparison`, `leaders`
**DB Readiness:** `✅` Fully supported by current schema

---

## Goal

From the leaders page, drag a player card onto another to open a head-to-head comparison. On any player page, drag their hero card to a "compare zone" to open comparison. The compare page shows side-by-side radar charts that animate into each other, a stat table with delta highlighting, and season arc overlays.

## Why

Player comparison is one of the most common fan actions ("is player A better than player B?"). The current page requires navigating to a separate compare page and manually typing/selecting IDs. Drag-to-compare makes this tactile and immediate — a "drop to compare" interaction that feels natural and reduces friction.

## Technical Approach

### Drag Entry Points

**1. Leaders page:**
- Each player card in the leader list becomes draggable via `@dnd-kit/core` `useDraggable`
- A drop zone overlay appears at the bottom of the screen when drag starts: "Drop another player to compare"
- Accepts drops. On drop, navigate to `/players/compare?p1=<draggedId>&p2=<droppedId>`

**2. Player page:**
- The player hero card (identity card) is draggable
- When dragging, a floating "compare zone" pill appears: "Drop here to compare"
- Any other player card on the page (recent games, related players) becomes a drop target
- On drop → navigate to compare page

### DnD Architecture

```
<DndContext onDragEnd={handleDragEnd}>
  <DragOverlay>
    {/* Ghost of the dragged player card */}
  </DragOverlay>

  {/* Leaders page structure */}
  {players.map(p => (
    <DraggablePlayerCard key={p.id} player={p} />
  ))}

  {/* Drop zone appears when dragging */}
  {isDragging && <CompareDropZone />}
</DndContext>
```

- Use `@dnd-kit/core` (Tolom already uses it in bay view)
- `useDraggable` on player cards
- `useDroppable` on the compare zone / other player cards
- `DragOverlay` renders the card being dragged (reduces to a compact pill)
- On `onDragEnd`: if `over` exists and is a valid player, navigate to compare

### Compare Page Enhancement

The `compare-players-client.tsx` already exists. Enhancements:
- **Animated radar overlay:** Show both radars starting from the center, then expanding to their shapes
- **Side-by-side stat table** with delta:
  - Green row background: player A significantly better
  - Red: player B significantly better
  - Neutral: within 10% difference
- **Season arc overlay:** Show both players' season arcs on the same chart
- Accept query params `?p1=<id>&p2=<id>` and load both players' stats

## Data Dependencies

| Entity | Access | Purpose |
|--------|--------|---------|
| `/api/stats/compare-players` | Already exists | Returns side-by-side stat comparison |
| `getPlayerById` | Already exists | Full player profiles |
| `v_public_leaders` | Already loaded | Player cards on leaders page |

No database changes needed.

## Implementation Steps

1. **Install `@dnd-kit/core` + `@dnd-kit/sortable` if not present:**
   ```bash
   pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```
   Tolom already uses these — check if they're already in the monorepo's shared packages.

2. **Make leader cards draggable:**
   - Wrap each card with `useDraggable`
   - Add drag handle (grip icon) or make the whole card draggable
   - `DragOverlay` shows compact player pill

3. **Add drop zone:**
   - Drop zone overlay appears when `isDragging` is true
   - Position: fixed bottom with backdrop blur
   - Accepts player drops

4. **Add drag-from-player-page:**
   - Hero card gets `useDraggable`
   - Floating compare zone appears on drag start
   - Other player cards are drop targets

5. **Enhance compare page:**
   - Side-by-side radar with entrance animation
   - Stat table with delta highlighting
   - Season arc overlay

6. **Test:**
   - Drag from leaders → drop → compare page opens with correct players
   - Drag from player page → drop on a recent games player → compare opens
   - Cancel drag (drop outside) → no navigation

## Implementation Complexity & Effort

**Complexity:** Medium. ~300 lines for drag UX + compare page enhancements. The data layer is fully ready.

**Effort:** M (1-2 days)
- DnD setup (context, draggable, droppable): 2-3h
- Leaders page integration: 1-2h
- Player page integration: 1-2h
- Compare page enhancements: 3-4h
- Testing + polish: 1-2h

## Dependencies / Prereqs

**Blocked by:** None
**Prereqs:** `@dnd-kit/core` available (Tolom pattern). Compare page exists (`players/compare/`). `getPlayerById` and compare API exist.

## Design Decisions

- **Full card is draggable (not a handle-only).** Reduces friction — users naturally grab the whole card. The grip icon is a visual hint, not a constraint.
- **Drop zone appears as overlay, not permanent UI element.** Keeps the page clean when not dragging. The overlay is a full-width fixed bar at the bottom with backdrop blur.
- **Compare page already exists** — this enhancement makes reaching it effortless, not building it from scratch.
- **Radar entrance animation** (grow from center) makes the comparison visually satisfying, reinforcing the "these two players are being weighed" metaphor.

## Risks & Gotchas

- **Touch device drag:** `@dnd-kit` supports `TouchSensor` and `PointerSensor`. Ensure mobile drag works — Tolom has `_types.tsx` with TouchSensor/PointerSensor setup to reuse.
- **Drag ghost visibility on mobile:** The `DragOverlay` should position above the finger, not below it (prevents finger obstruction).
- **Compare page loads two data sets in parallel.** Ensure both queries are independent and both handle loading/error states individually.
- **Accessibility:** Drag is not keyboard-accessible by default. Provide an alternative "Compare" button on each card as fallback.

## Verification

```bash
# Type check
pnpm exec tsc --noEmit

# Build
pnpm build
```

### Done When

- [ ] Dragging a player card from leaders page shows drop zone overlay
- [ ] Dropping on a valid target navigates to compare page with correct IDs
- [ ] Dragging from player page hero card shows floating compare zone
- [ ] Compare page renders with both players' data
- [ ] Side-by-side stat table shows green/red delta highlighting
- [ ] Works on touch devices (mobile/tablet)
- [ ] Fallback compare button available for keyboard users
- [ ] Cancel drag (drop outside) does not navigate
- [ ] TypeScript compilation passes

---

_Last updated: 2026-07-21 | Status: ⬜_
