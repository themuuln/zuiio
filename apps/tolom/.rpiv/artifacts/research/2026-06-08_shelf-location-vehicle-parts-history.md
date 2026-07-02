---
date: 2026-06-08T10:30:21+0800
author: Temuulen Undrakhbayar
commit: 13df4954
branch: main
repository: tolom
topic: "Shelf Location for Parts + Vehicle Parts History from Work Orders"
tags: [research, codebase, inventory, vehicles, work-orders]
status: complete
last_updated: 2026-06-08T10:30:21+0800
last_updated_by: Temuulen Undrakhbayar
---

# Research: Shelf Location for Parts + Vehicle Parts History

## Research Question

Implement two inventory improvements from `docs/inventory-improvements.md`:
1. **Shelf Location** — Add a `location` text field to `parts_catalog`, show in parts list, detail page, and form. Support prefix search.
2. **Vehicle Parts History** — Show parts used per vehicle across work orders. When viewing a vehicle, show the history of parts that were used.

## Summary

Both features are straightforward extensions of existing patterns. Shelf location is a single nullable text column requiring the standard 5-7 file touch pattern (migration → types → service → form → display). Vehicle parts history requires extending an existing PostgREST nested select to include `work_order_parts` alongside `work_order_services`, then adding a new interface and render block. No new cache tags, query keys, or API routes are needed. The closest precedent is the `image_url` addition (`3a8e5198`) which followed the identical pattern with zero follow-up fixes.

## Detailed Findings

### Feature 1: Shelf Location

#### Database Layer

`parts_catalog` table has no `location` column today. Created in `supabase/migrations/00003_phase2_parts_catalog.sql:29-44` with columns: `id`, `organization_id`, `name`, `part_number`, `category`, `description`, `unit`, `default_price`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`. Subsequent migrations added `name_mn`, `global_part_id`, `image_url`, `purchase_price`, `last_purchase_price`.

Migration required: `ALTER TABLE parts_catalog ADD COLUMN IF NOT EXISTS location text;`

#### Type Layer (`src/lib/types/inventory.ts`)

Three interfaces must be updated:

1. **`PartsCatalogItem`** (line 17-31): Add `location: string | null` — this is the read model flowing through the entire system
2. **`CreatePartParams`** (line 38-48): Add `location?: string` — optional since quick-add doesn't use it
3. **`UpdatePartParams`** (line 51-63): Add `location?: string | null` — nullable to support clearing

#### Service Layer (`src/lib/services/inventory-service.ts`)

Four service functions have explicit `.select()` string lists. **`location` must be added to all 4** or the field silently returns `undefined`:

| Function | Line | Select Count | Must Add |
|----------|------|-------------|----------|
| `getPartsCatalog` | 70-77 | 14 columns | ✅ |
| `getPart` | 95-105 | 17 columns | ✅ |
| `createPart` | 115-148 | Insert + 16-col select | ✅ (both) |
| `updatePart` | 150-166 | 17-col select | ✅ |

**`partFieldMap`** (line 30-44): Add `location: "location"` to `columns` and `location: (v) => (v as string) || null` to `transforms`. This feeds `buildUpdates()` which powers `updatePart`.

**`createPart` insert object** (line 130): Add `location: params.location?.trim() || null` — follows same pattern as `description`.

**Select string inconsistencies:** The 4 select strings are not identical. `getPartsCatalog` omits `description`, `updated_at`, `created_by`, `updated_by`, `last_purchase_price` that the other 3 include. `getPartsCatalog` includes `deleted_at` that the others omit. This is intentional (list view is slimmer for performance) but `location` must be in all 4.

#### Form Layer (`src/components/inventory/part-form.tsx`)

**Zod schema** (line 36-46): Add `location: z.string().optional()` after `description`.

**`useForm` defaults** (line 73-82): Add `location: initialData?.location ?? ""` after `description`.

**`onSubmit` payload** (line 130-157): Add with mode guard:
```ts
location: currentMode === "full" ? data.location?.trim() || undefined : undefined,
```
Quick mode sends `undefined` → `buildUpdates` skips it → DB untouched.

**UI** (line 274-334, full-mode extras): Add `<Input>` for location in the existing 2-column grid. Place after Unit/Description row.

**`initialData` type:** Props accept `Partial<CreatePartParams>` — once `location` is on `CreatePartParams`, `initialData?.location` works automatically.

#### List Layer (`src/app/[locale]/dashboard/inventory/_components/parts-tab.tsx`)

**Search filter** (line 211-221): Entirely client-side `.filter()` chain. Add one line:
```ts
(p.location?.toLowerCase().includes(q) ?? false)
```
No backend changes for filtering — data already fetched as array via `usePartsCatalog`.

**Sort:** `SortKey` type at `constants.ts:9` is `"name" | "category" | "price" | "stock" | "popularity"`. Adding `"location"` requires: extend type, add `case "location":` in switch (line 226-246), add `<SortKeyHeader>`. **Can be deferred** — non-sortable columns are supported (global catalog already uses limited sort subset).

#### Detail Layer

**`_header.tsx`** (line 96-131): 4-card grid (`sm:grid-cols-4`). Adding a 5th "Shelf Location" card → change to `sm:grid-cols-3 lg:grid-cols-5` or let it wrap.

**`_details-form.tsx`** (line 22-31): Add `location: part.location ?? undefined` to `initialData` object — follows exact same `?? undefined` pattern as all other nullable fields.

#### Hooks & Cache

**`use-inventory.ts`**: No changes needed. `usePartsCatalog` returns `PartsCatalogItem[]` from `createOrgQuery` factory. Type propagation is automatic once the service `.select()` strings include `location`.

**`keys.ts`**: No new cache keys. `location` is part of existing `inventoryKeys.parts(orgId)` cache.

**Optimistic update** (`use-inventory.ts:362-373`): `{ ...p, ...body }` spread preserves existing `p.location` when `body.location` is `undefined`. Correct behavior without changes.

---

### Feature 2: Vehicle Parts History

#### Current Architecture

Vehicle service history follows a different pattern than work order detail:

- **Work order detail** (`work-order-queries.ts:80-85`): Multi-query approach — fetches `work_order_parts` with explicit select, no `parts_catalog` join. Shows parts correctly because it queries them directly.
- **Vehicle service history** (`vehicle-service.ts:463-482`): Single-query PostgREST nested select — `.select("*, work_order_services(*)")`. Only joins services, not parts.

The FK chain exists: `work_order_parts.work_order_id → work_orders.id` (`database.types.ts:4726`). No migration needed.

#### Denormalization Decision

`work_order_parts` stores **snapshots** at write time:
- `part_name: string` — always present, denormalized
- `part_number: string | null` — denormalized
- `part_id: string | null` — nullable FK to `parts_catalog`

**Recommendation: Read denormalized `part_name` from `work_order_parts`.** Reasons:
1. Matches how `work_order_services` already works (service names are denormalized)
2. `part_id` is nullable — many parts may not have catalog links
3. History should show name at time of service, not current name
4. No extra joins, no extra queries
5. Works for parts added without a catalog entry (free-text path)

#### Data Path Changes

**Layer 1: `vehicle-service.ts:470`**
Change select from `"*, work_order_services(*)"` to `"*, work_order_services(*), work_order_parts(*)"`.
Update return type at line 466 to include `work_order_parts: Record<string, unknown>[]`.

**Layer 2: API route** — No structural change needed. Route spreads result directly.

**Layer 3: `vehicle-detail-sheet.tsx:63-82`**
Add interface:
```ts
interface VehiclePartLine {
  id: string;
  part_name: string | null;
  part_number: string | null;
  quantity: number;
  final_price: number;
}
```
Extend `VehicleServiceHistoryItem` with `work_order_parts: VehiclePartLine[]`.

**Layer 4: UI rendering** (`vehicle-detail-sheet.tsx:667-703`)
Inside the `vehicle.service_history.map()` loop, after complaint/description, add parts badges:
```tsx
{wo.work_order_parts?.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-1">
    {wo.work_order_parts.map((p) => (
      <span key={p.id}>{p.part_name}{p.quantity > 1 ? ` ×${p.quantity}` : ""}</span>
    ))}
  </div>
)}
```

#### Bay View Timeline

`bay-view-actions.ts:522-586` (`getVehicleServiceTimeline`) uses a manual batch approach — queries `work_order_services` with `.in("work_order_id", woIds)`. To add parts here, add a parallel `.in("work_order_id", woIds)` query against `work_order_parts`. Extend `ServiceHistoryEntry` at `_vehicle-registration-schema.ts:48-57` with a `parts` array.

#### Cache

No new cache tags needed. Vehicle detail uses `vehicleKeys.detail()` client-side with 30s `staleTime`. Adding `work_order_parts` to the nested select doesn't change query structure. The denormalization decision means catalog renames don't invalidate vehicle history — correct for a history view.

---

## Code References

- `src/lib/types/inventory.ts:17-31` — `PartsCatalogItem` interface (add `location`)
- `src/lib/types/inventory.ts:38-48` — `CreatePartParams` interface (add `location`)
- `src/lib/types/inventory.ts:51-63` — `UpdatePartParams` interface (add `location`)
- `src/lib/services/inventory-service.ts:30-44` — `partFieldMap` (add `location` column + transform)
- `src/lib/services/inventory-service.ts:70-77` — `getPartsCatalog` select string
- `src/lib/services/inventory-service.ts:95-105` — `getPart` select string
- `src/lib/services/inventory-service.ts:115-148` — `createPart` insert + select
- `src/lib/services/inventory-service.ts:150-166` — `updatePart` select
- `src/components/inventory/part-form.tsx:36-46` — Zod schema
- `src/components/inventory/part-form.tsx:73-82` — `useForm` defaults
- `src/components/inventory/part-form.tsx:130-157` — `onSubmit` payload
- `src/components/inventory/part-form.tsx:274-334` — full-mode UI grid
- `src/app/[locale]/dashboard/inventory/_components/parts-tab.tsx:211-221` — search filter
- `src/app/[locale]/dashboard/inventory/_components/constants.ts:9` — `SortKey` type
- `src/app/[locale]/dashboard/inventory/parts/[partId]/_header.tsx:96-131` — detail header card grid
- `src/app/[locale]/dashboard/inventory/parts/[partId]/_details-form.tsx:22-31` — `initialData` passthrough
- `src/lib/services/vehicle-service.ts:463-482` — `getVehicleServiceHistory` query
- `src/components/vehicles/vehicle-detail-sheet.tsx:63-82` — `VehicleServiceHistoryItem` interface
- `src/components/vehicles/vehicle-detail-sheet.tsx:667-703` — service history rendering
- `src/lib/services/bay-view-actions.ts:522-586` — `getVehicleServiceTimeline`
- `src/components/bay-view-v2/_vehicle-registration-schema.ts:48-57` — `ServiceHistoryEntry`
- `src/lib/services/work-order-items-service.ts:106-156` — `addPartToWorkOrder` (denormalization write)
- `src/lib/services/_queries/work-order-queries.ts:80-85` — existing parts fetch (precedent)
- `supabase/migrations/00003_phase2_parts_catalog.sql:29-44` — original table creation

## Integration Points

### Inbound References
- `usePartsCatalog` (`use-inventory.ts:88`) — consumed by `PartsTab` and part detail page
- `useCreatePart` (`use-wizard-data.ts:724`) — consumed by `PartForm`
- `useUpdatePart` (`use-inventory.ts:341`) — consumed by `PartForm`
- `getVehicleServiceHistory` (`vehicle-service.ts:463`) — consumed by vehicle API route, vehicle detail sheet
- `getVehicleServiceTimeline` (`bay-view-actions.ts:522`) — consumed by bay view

### Outbound Dependencies
- `parts_catalog` table — `location` column (new)
- `work_order_parts` table — existing, no changes needed
- `work_order_services` table — existing, no changes needed

### Infrastructure Wiring
- `buildUpdates()` (`build-updates.ts:58-77`) — generic updater, no changes needed
- `inventoryKeys` (`keys.ts:218-226`) — no new keys needed
- `vehicleKeys` (`keys.ts:30-44`) — no new keys needed
- `cacheTags` (`cache/keys.ts`) — no new tags needed

## Architecture Insights

1. **Explicit `.select()` strings are the bottleneck.** Supabase PostgREST only returns listed columns. Missing `location` in even one select creates a type/runtime mismatch. The 4 inventory service functions have non-identical select lists — verify each individually.

2. **Form mode branching pattern:** `PartForm` has quick/full modes. Location is full-mode only, guarded by `currentMode === "full"` in the payload. Quick mode sends `undefined` → `buildUpdates` skips → DB untouched.

3. **Denormalization is the right pattern for history views.** `work_order_parts` snapshots `part_name` at write time. Reading denormalized data preserves historical accuracy and avoids nullable-FK join issues.

4. **PostgREST nested selects scale well.** Adding `work_order_parts(*)` to the vehicle query is a one-line change. The FK already exists. No migration, no new endpoint.

5. **Hooks need no changes for read path.** `usePartsCatalog` uses `createOrgQuery<PartsCatalogItem[]>` factory. Type propagation is automatic once the service selects the field.

## Precedents & Lessons

### Precedent: `image_url` column addition to `parts_catalog`
**Commit(s):** `3a8e5198` — "feat(inventory): add part photo upload with client-side compression" (2026-06-08)
**Blast radius:** 9 files across 4 layers
- `supabase/migrations/20260607000000_part_photos.sql` — migration
- `src/lib/types/inventory.ts` — type
- `src/lib/services/inventory-service.ts` — service
- `src/components/inventory/part-form.tsx` — form
- `src/components/inventory/part-photo-upload.tsx` — new component
- `_details-form.tsx`, `_header.tsx`, `_catalog-combobox.tsx`, `docs/inventory.md`

**Follow-up fixes:** None

**Takeaway:** Most directly analogous precedent — single nullable text column. Same file set, same patterns.

### Precedent: Vehicle detail sheet field additions
**Commit(s):** `915e9307` — "feat: show all vehicle columns in detail sheet" (2026-06-02)
**Blast radius:** 3 files, single-layer
- `vehicle-detail-sheet.tsx` — 7+ locations within same file

**Follow-up fixes:**
- `29670554` — missed `toast.dismiss()` in new mutation handler (2026-06-06)
- `dc82efa5` — minor UI prop fix (2026-06-04)

**Takeaway:** Adding fields to component with form requires updating 7+ locations within same file (interface, empty defaults, sync, display, edit, payload, optimistic).

### Precedent: Schema drift fix
**Commit(s):** `7b8bea69` — "Schema drift fix: 21 missing columns" (2026-05-13)
**Blast radius:** 142 files

**Takeaway:** Always validate migrations against live DB before committing.

### Composite Lessons

1. **Adding a column requires 5-7 files minimum** — migration, types (3 interfaces), service (4 select strings + field map), form (schema + defaults + payload + UI), list (filter + optional sort), detail (header + form passthrough)
2. **Follow-up fixes cluster within 3-5 days** — expect toast.dismiss, prop fixes, TypeScript strictness errors
3. **`work_order_parts` stores denormalized snapshots** — `part_name` is always present, `part_id` is nullable
4. **TypeScript strictness catches missing fields late** — update types before building components

## Historical Context (from `.rpiv/artifacts/`)

- `.rpiv/artifacts/plans/2026-06-03_11-13-57_history-page.md` — in-progress sidebar history page for invoices + work orders (separate feature, does not cover parts-per-vehicle)
- `docs/inventory-improvements.md` — planned improvements list, items #1 and #3 are the subjects of this research

## Developer Context

_No developer corrections during checkpoint._

## Related Research

- `docs/inventory-improvements.md` — full improvement roadmap

## Open Questions

- Should sorting by location be included in the initial implementation or deferred to a follow-up?
- Should the 5th card in the detail header use a responsive grid (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`) or wrap to a second row?
- Should the bay view timeline (`_service-timeline.tsx`) also show parts, or just the vehicle detail sheet?
