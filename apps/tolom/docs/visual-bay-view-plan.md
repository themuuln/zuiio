# Visual Bay View — Reception Slot Management

> Creative, game-like garage floor for tablet-first MVP. Drag vehicles, assign mechanics, see your shop at a glance.

---

## 1. Concept

**"Bay View"** — a visual garage floor that replaces the boring list of work orders with a spatial, draggable, color-coded grid of your actual service bays.

Think of it like a **lightweight tycoon/sim game**: each bay is a slot, vehicles are the "pieces," mechanics are avatars you drag onto them. The floor gives instant visual answers:

- Which bays are occupied? Empty?
- Who's working on what?
- What's taking too long? (color shifts to red after threshold)
- What's ready for pickup?

---

## 2. Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│  [← sidebar]  Bay View                    [+ Add Bay]   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              🏪 GARAGE FLOOR                     │   │
│  │                                                  │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐          │   │
│  │  │ BAY 1   │  │ BAY 2   │  │ BAY 3   │          │   │
│  │  │ ┌─────┐ │  │ ┌─────┐ │  │         │          │   │
│  │  │ │🚗    │ │  │ │🚙    │ │  │  EMPTY  │          │   │
│  │  │ │9999  │ │  │ │7700  │ │  │         │          │   │
│  │  │ │UNA   │ │  │ │UBA   │ │  │  drop   │          │   │
│  │  │ │Prius │ │  │ │Land  │ │  │ vehicle │          │   │
│  │  │ │      │ │  │ │Cr.   │ │  │  here   │          │   │
│  │  │ │👨‍🔧 Bataa│ │  │ │      │ │  │         │          │   │
│  │  │ │⏱ 1.5h │ │  │ │⏱ 3h  │ │  │         │          │   │
│  │  │ └─────┘ │  │ └─────┘ │  │         │          │   │
│  │  │ IN PROG │  │ │DIAGNOSE│  │         │          │   │
│  │  └─────────┘  └─────────┘  └─────────┘          │   │
│  │                                                  │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐          │   │
│  │  │ BAY 4   │  │ BAY 5   │  │ BAY 6   │          │   │
│  │  │ ┌─────┐ │  │         │  │         │          │   │
│  │  │ │🚛    │ │  │  EMPTY  │  │  EMPTY  │          │   │
│  │  │ │4400  │ │  │         │  │         │          │   │
│  │  │ │UBT   │ │  │         │  │         │          │   │
│  │  │ │Kia   │ │  │         │  │         │          │   │
│  │  │ │      │ │  │         │  │         │          │   │
│  │  │ │👩‍🔧 Saraa│ │  │         │  │         │          │   │
│  │  │ │⏱ 0.5h │ │  │         │  │         │          │   │
│  │  │ └─────┘ │  │         │  │         │          │   │
│  │  │READY    │  │         │  │         │          │   │
│  │  └─────────┘  └─────────┘  └─────────┘          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────┐ ┌──────────────────────────┐  │
│  │ 👥 MECHANICS (drag) │ │ 🚗 WAITING QUEUE (drag)  │  │
│  │                      │ │                          │  │
│  │ 🟢 Bataa   [3 jobs] │ │ 7700UBA Lexus RX        │  │
│  │ 🟡 Saraa   [1 job]  │ │ 1234УБ Hyundai Porter   │  │
│  │ ⚪ Boldoo  [0]      │ │ 5678УН Toyota Camry     │  │
│  │                      │ │ ...                      │  │
│  └──────────────────────┘ └──────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

- **Garage Floor**: responsive CSS grid, 2–4 columns depending on screen width
- **Bay Card**: shows vehicle card inside, mechanic badge, status pill, elapsed time
- **Bottom panels**: collapsible drawers for mechanics roster and unassigned vehicle queue
- **Bay count**: configurable per branch (org setting `bay_count`, default 6)

---

## 3. Bay Card States & Colors

| State | Card Border | Bg Tint | Animation | Meaning |
|-------|------------|---------|-----------|---------|
| Empty | dashed gray | transparent | none | Slot available |
| Waiting | solid yellow | yellow/10 | subtle pulse | Vehicle assigned, no mechanic yet |
| Diagnosing | solid blue | blue/10 | none | Inspection phase |
| In Progress | solid amber | amber/10 | slow wave | Active work |
| Ready (new) | solid green | green/10 | glow pulse | Just completed, attention grab |
| Ready | solid green | green/5 | none | Waiting for pickup |
| Overdue | solid red | red/10 | fast pulse | Exceeded time estimate |

**Time tracking**: each bay shows elapsed time since vehicle was placed. Color shifts amber → red if exceeding the estimated duration (configurable per service type). This gives the "game" tension — keep bays green, avoid red.

---

## 4. Drag & Drop Interactions

### MVP with `@dnd-kit`

| Action | How | Result |
|--------|-----|--------|
| Assign vehicle to bay | Drag vehicle from Waiting Queue → drop on empty bay | Creates work order, bay fills |
| Reassign vehicle | Drag vehicle card from one bay → drop on another bay | Swaps or moves the work order |
| Assign mechanic | Drag mechanic avatar → drop on vehicle card in bay | Updates `mechanic_id` on work order |
| Unassign mechanic | Drag mechanic badge off the card → drop anywhere outside | Clears `mechanic_id` |
| Move to waiting queue | Drag vehicle from bay → drop on Waiting Queue | Removes from bay, returns to queue |
| Complete vehicle | Right-click or double-tap the bay card → "Mark Ready" | Status → "Ready for Pickup" |
| Return to bay | Drag from Waiting Queue → drop on occupied bay | Swaps vehicles |

### Technical approach

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- `DndContext` wraps the entire floor
- Each bay is a `useDroppable` zone
- Each vehicle card is `useDraggable`
- Each mechanic avatar is `useDraggable`
- On `onDragEnd`, call a server action to update the work order

This is the most battle-tested React DnD library, touch-friendly (critical for tablet), ~15KB gzipped, and well-typed.

---

## 5. Component Tree

```
BayViewPage
├── BayViewToolbar          (add bay, filter, compact/expanded toggle)
├── GarageFloor             (CSS grid, DndContext wrapper)
│   └── BaySlot[]           (useDroppable, one per bay)
│       ├── EmptyBay        (dashed border, "drop vehicle here" prompt)
│       └── OccupiedBay     (vehicle card + mechanic badge)
│           ├── VehicleCard (useDraggable, plate + make/model + color icon)
│           ├── MechanicBadge (useDraggable, avatar + name)
│           ├── StatusPill  (colored dot + label)
│           └── ElapsedTimer (live-updating duration)
├── MechanicRoster          (collapsible drawer, drag source)
│   └── MechanicChip[]      (useDraggable, avatar + name + current jobs count)
└── WaitingQueue            (collapsible drawer, drag source)
    └── QueuedVehicle[]     (useDraggable, plate + make/model + customer name)
```

---

## 6. Data Model (Minimal New DB Surface)

No new tables needed for MVP. We use the existing schema:

| Concept | Existing Table | Key Column |
|---------|---------------|------------|
| Bay slot | `branches.settings` | `bay_count` (jsonb → `{ bay_count: 6 }`) |
| Vehicle in bay | `work_orders` | `vehicle_id`, `status` IN ('Diagnosing','In Progress','Ready for Pickup') |
| Mechanic on job | `work_orders` | `mechanic_id` |
| Waiting vehicles | `work_orders` | `status = 'New'` (no mechanic, no bay assignment yet) |

**Bay position mapping**: stored in `work_orders` via a new nullable `bay_number` column (integer, 1–N).

### New migration (1 column)

```sql
ALTER TABLE work_orders ADD COLUMN bay_number integer;
-- NULL = not assigned to a bay
-- 1..bay_count = which physical slot
-- UNIQUE constraint: only one active WO per bay
CREATE UNIQUE INDEX idx_work_orders_active_bay 
  ON work_orders (organization_id, bay_number) 
  WHERE bay_number IS NOT NULL AND status NOT IN ('Completed', 'Cancelled');
```

That's it. No new tables. The "bay" is just a position number.

---

## 7. Implementation Steps (MVP ~3 days)

### Day 1 — Foundation (backend + static UI)

1. **Migration**: Add `bay_number` column + unique index to `work_orders`
2. **Server actions** (new file `src/app/dashboard/bay-view/actions.ts`):
   - `getBayViewData(orgId)` → returns all active bays, vehicles, mechanics, waiting queue
   - `assignVehicleToBay(workOrderId, bayNumber)` → sets `bay_number`, updates status to "Diagnosing"
   - `removeVehicleFromBay(workOrderId)` → clears `bay_number`, resets status to "New"
   - `assignMechanic(workOrderId, mechanicId)` → updates `mechanic_id`
   - `updateBayCount(orgId, count)` → updates `branches.settings.bay_count`
3. **Route**: `src/app/dashboard/bay-view/page.tsx` — server component fetching initial data
4. **Navigation**: Add "Bay View" item to `use-navigation.ts` with a `LayoutGrid` or `ParkingSquare` icon from lucide

### Day 2 — Visual UI (components)

5. **Install deps**: `pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
6. **Components** (all in `src/components/bay-view/`):
   - `GarageFloor.tsx` — DndContext + responsive CSS grid of bays
   - `BaySlot.tsx` — single bay (empty vs occupied states)
   - `VehicleCard.tsx` — draggable vehicle display (plate, make, model, color dot)
   - `MechanicBadge.tsx` — draggable avatar chip
   - `StatusPill.tsx` — colored status indicator
   - `ElapsedTimer.tsx` — live timer using `useEffect` + `setInterval`
   - `MechanicRoster.tsx` — collapsible panel of mechanic draggables
   - `WaitingQueue.tsx` — collapsible panel of unassigned vehicle draggables
   - `BayViewToolbar.tsx` — top bar with bay count adjuster
7. **Client page**: Convert `page.tsx` to client component wrapping everything in DndContext

### Day 3 — Polish + Tablet UX

8. **Touch optimization**: large drop targets (min 72px touch areas), haptic-like CSS transitions
9. **Animations**: bay highlight on drag-over, vehicle "snap" on drop (CSS `transition: transform 150ms ease`), status glow pulse
10. **Empty bay styling**: dashed border, drop indicator icon, "Drop vehicle" text
11. **Responsive**: 2 cols on phone, 3 on tablet portrait, 4+ on landscape/desktop
12. **Edge cases**: bay count exceeded warning, same vehicle in two bays prevention, mechanic double-assignment warning
13. **Testing**: drag vehicle → bay, swap bays, assign/unassign mechanic, check DB state

---

## 8. Creative UX Touches (game-like feel)

- **Bay lights up green** with a subtle glow animation when a vehicle is dropped in
- **Mechanic avatars bounce** slightly when dragged (CSS `@keyframes wiggle`)
- **Timer color shift**: green → amber at 50% estimated time, amber → red at 90%, red pulsing when overdue
- **Sound-optional**: a soft "click" when a vehicle snaps into a bay (can be toggled off)
- **Empty bay "breathing"**: subtle opacity pulse to invite dropping a vehicle
- **Confetti-like spark**: when all bays are green (all vehicles ready), show a subtle "clear floor" celebration
- **Drag preview**: when dragging, the vehicle card lifts with a shadow, showing the plate number prominently
- **Mechanic workload**: mechanic chips show a small number badge (current jobs), turn red if overloaded (>3)

---

## 9. What NOT to Build (MVP Scope Guard)

- ❌ Real-time sync (WebSocket/polling) — refresh on drop is enough
- ❌ Bay shape customization (L-shaped, etc.) — always a grid
- ❌ Multi-floor / multi-zone — single flat floor
- ❌ Bay scheduling / time-booking — just live state
- ❌ Permission granularity for bay assignment — admin + mechanic both can use it
- ❌ Mobile mechanic app bay view — tablet web only for now
- ❌ Bay history / analytics — Phase 2
- ❌ Drag from one browser to another — single user session

---

## 10. Sidebar Integration

In `use-navigation.ts`, add:

```typescript
{
  label: "Bay View",
  href: "/dashboard/bay-view",
  icon: LayoutGrid, // from lucide-react
  section: "main",
}
```

Place it right after "Dashboard" and before "Work Orders" — it's the receptionist's primary view.

---

## 11. File Manifest

```
New files:
├── src/app/dashboard/bay-view/
│   ├── page.tsx              (server component shell → client BayViewClient)
│   └── actions.ts            (server actions)
├── src/components/bay-view/
│   ├── bay-view-client.tsx   (main client component, DndContext wrapper)
│   ├── garage-floor.tsx      (grid layout)
│   ├── bay-slot.tsx          (single bay, empty/occupied)
│   ├── vehicle-card.tsx      (draggable vehicle)
│   ├── mechanic-badge.tsx    (draggable mechanic)
│   ├── status-pill.tsx       (colored status indicator)
│   ├── elapsed-timer.tsx     (live timer)
│   ├── mechanic-roster.tsx   (mechanic panel)
│   ├── waiting-queue.tsx     (unassigned vehicles panel)
│   └── bay-view-toolbar.tsx  (top toolbar)
├── supabase/migrations/
│   └── 00003_bay_view.sql    (bay_number column + index)

Modified files:
├── src/hooks/use-navigation.ts  (add Bay View nav item)
└── package.json                 (add @dnd-kit deps)
```

---

## 12. Quick-Start (the "Cheat" MVP — build in 1 day)

If you want the absolute fastest path:

1. Skip `@dnd-kit` — use `<select>` dropdowns on each bay card for vehicle + mechanic assignment
2. Use CSS grid + shadcn `Card` components for the visual layout
3. Add CSS `transition` on status changes for the "game" feel
4. The `ElapsedTimer` is still valuable — just `useEffect` + `setInterval`
5. Add drag-and-drop in a follow-up PR

This gets you a functional Bay View in a single day, with a clear upgrade path to full drag-and-drop.
