---
date: 2026-06-06T00:49:14+0800
author: Temuulen Undrakhbayar
commit: fbfc2c10
branch: main
repository: tolom
topic: "optimistic ui coding skill"
tags: [research, codebase, mutation-factory, optimistic-ui, bay-view, combobox, toast]
status: complete
last_updated: 2026-06-06T00:49:14+0800
last_updated_by: Temuulen Undrakhbayar
---

# Research: Optimistic UI Coding Skill

## Research Question
Find or create a reusable skill/procedure for optimistic UI coding patterns — covering React Query factory path, manual useState path, nested-object path, toast handling, and anti-patterns.

## Summary
The codebase has **three coexisting optimistic UI paradigms**: (1) React Query `useOrgMutation` factory for flat `TData[]` lists, (2) manual `useState` + `fetchCountRef` + `useEffect` reconciliation for multi-select/per-item REST calls, (3) raw `useMutation` with manual `setQueryData` for nested composite objects (`BayViewData`, `WorkOrderDetail`). No existing skill covers optimistic UI. The `mutation-factory.ts` is missing `toast.dismiss()` at line 209, causing toast spam across all factory consumers. A new skill should document all three paradigms, their when-to-use boundaries, and the anti-patterns table from AGENTS.md.

## Detailed Findings

### Paradigm 1: React Query Factory (`useOrgMutation`)

The `useOrgMutation` factory at `src/lib/queries/mutation-factory.ts:88` orchestrates the full optimistic lifecycle:

- **onMutate** (line 186): `cancelQueries` → `getQueryData<TData[]>` → `optimisticUpdate(previous, variables)` → `setQueryData<TData[]>` — writes temp item into cache
- **onError** (line 200): `setQueryData(queryKey, context.previous)` — restores snapshot
- **onSettled** (line 215): `invalidateQueries({ queryKey })` — triggers refetch, replacing temp IDs with real server data
- **Offline** (line 93-131): `useOnlineStatus()` + `useMutationQueue()` split the `mutationFn` into online `fetch` path vs. offline `queue.enqueue` path returning synthetic `{ queued: true }`

The factory's `optimisticUpdate` signature is `(cached: TData[], variables: TVariables) => TData[]` — strictly for flat array caches. Cannot express nested-object mutations.

**Consumers:** `use-customer-notes.ts:31`, `use-expenses.ts`, `use-inventory.ts`, `use-commission-rules.ts` — all use the factory for list CRUD.

**Complete temp item contract:** Every optimistic item must populate ALL fields the list consumer expects, because `setQueryData` performs full replacement. Missing fields cause runtime render errors. Example at `use-customer-notes.ts:41-49` — all 9 `CustomerNote` fields populated with `temp-${Date.now()}` for `id`, empty strings for server-generated fields, `new Date().toISOString()` for timestamps, `null` for nullable fields.

### Paradigm 2: Manual Optimistic (`useState` + Reconciliation)

Used in `_mechanic-multi-select.tsx` when the mutation is **per-item REST calls** (POST/DELETE per helper) rather than a single bulk mutation:

- **State:** `useState<MechanicOption[] | null>(null)` — null = server state, non-null = optimistic override (line 76)
- **Refs:** `prevIdsRef` (diff), `fetchCountRef` (in-flight counter), `lastRequestedRef` (reconciliation anchor) (lines 73-75)
- **Value:** `optimistic ?? serverValue` — single render-time decision point (line 94)
- **Reconciliation:** `useEffect` compares `serverKey === lastKey` and `fetchCountRef.current === 0` before clearing optimistic (lines 86-91)
- **Handler:** `setOptimistic(newValue)` fires synchronously on EVERY click — never guarded by busy check (line 104)
- **Diff:** `prevIdsRef` snapshot → Set-based diff → per-item POST/DELETE (lines 106-116)
- **Toast:** `toast.dismiss()` before `toast.success()` to prevent spam (lines 128-129, 155-156)

**Why manual:** Per-item fetches can't be expressed as a single `mutationFn`. The handler needs to loop over added/removed items and fire individual requests, each tracked independently by `fetchCountRef`.

### Paradigm 3: Raw `useMutation` for Nested Objects

Used in `use-bay-view.ts` (4 hooks) and `work-orders/[id]/page.tsx` when the cache holds a **composite object** (not `TData[]`):

- **`use-bay-view.ts:5-8` NOTE:** "useOrgMutation factory is designed for list mutations (TData[]). Bay view data is a single BayViewData object."
- **Pattern:** `cancelQueries` → `getQueryData<BayViewData>` → `setQueryData<BayViewData>(key, { ...previous, bays: [...], waitingQueue: [...] })` — reconstructs parent with modified sub-collections
- **Shared `rollbackOnError` helper** (line 16-23): used by all 4 hooks, restores entire `BayViewData` atomically
- **Cross-collection mutations:** `useAssignVehicleToBay` (line 112) removes from `waitingQueue` AND inserts into `bays` — impossible with factory's `(TData[]) => TData[]` signature

**`work-orders/[id]/page.tsx`:** Page-level optimistic writes via `queryClient.setQueryData<WorkOrderDetail>(detailKey, (prev) => ({ ...prev, services: [...prev.services, tempItem] }))`. Same pattern for add/remove service, add/remove part. Rollback via captured `prev` snapshot.

### Toast Handling Patterns

| Pattern | Location | Prevents Spam? |
|---|---|---|
| `toast.dismiss()` + `toast.success()` | `_mechanic-multi-select.tsx:128-129` | ✅ Yes |
| `toast.success(msg)` no dismiss | `mutation-factory.ts:209` | ❌ No — **all factory consumers stack** |
| `toastRetry(msg, retryFn)` | `use-diagnosis-labels.ts:78` | N/A (error recovery) |

The `mutation-factory.ts:209` missing dismiss is the **highest-severity toast violation** because it's shared infrastructure. Every `useOrgMutation` consumer inherits stacked toasts on rapid interactions.

### Anti-Patterns Validation

| Anti-Pattern | `_mechanic-multi-select.tsx` | Factory consumers |
|---|---|---|
| `if (busy) return` before optimistic | ✅ Avoided (line 104 fires first) | ✅ React Query handles dedup |
| `useEffect` on object refs | ✅ Uses stable string keys (line 92) | N/A (no useEffect) |
| `setOptimistic(null)` in render | ✅ Moved to useEffect (line 90) | N/A |
| Per-fetch toasts without dismiss | ⚠️ Error paths lack dismiss | ❌ `mutation-factory.ts:209` |
| Boolean busyRef blocks handler | ✅ Uses `fetchCountRef` counter | N/A |

## Code References

- `src/lib/queries/mutation-factory.ts:88` — `useOrgMutation` factory definition
- `src/lib/queries/mutation-factory.ts:186-198` — onMutate lifecycle (cancel → snapshot → patch)
- `src/lib/queries/mutation-factory.ts:200-204` — onError rollback
- `src/lib/queries/mutation-factory.ts:209` — Missing `toast.dismiss()` before success toast
- `src/lib/queries/mutation-factory.ts:215-219` — onSettled invalidation
- `src/lib/queries/mutation-factory.ts:93-131` — Offline queue integration
- `src/lib/queries/use-customer-notes.ts:31-53` — Factory consumer with complete temp item
- `src/lib/queries/use-diagnosis-labels.ts:23-78` — Manual pattern (duplicates factory)
- `src/components/bay-view-v2/_mechanic-multi-select.tsx:73-97` — Manual optimistic refs + reconciliation
- `src/components/bay-view-v2/_mechanic-multi-select.tsx:99-165` — handleChange with optimistic-first + diff
- `src/lib/queries/use-bay-view.ts:5-8` — NOTE: factory doesn't work for nested objects
- `src/lib/queries/use-bay-view.ts:16-23` — Shared `rollbackOnError` helper
- `src/lib/queries/use-bay-view.ts:112-137` — Cross-collection optimistic (waitingQueue → bays)
- `src/app/[locale]/dashboard/work-orders/[id]/page.tsx:371-397` — Page-level optimistic add service
- `AGENTS.md:394-483` — Optimistic UI rules, patterns, anti-patterns

## Integration Points

### Inbound References
- `src/components/bay-view-v2/_drawer-header.tsx:151` — Renders `MechanicMultiSelect`
- `src/lib/queries/use-customer-notes.ts:31` — Uses `useOrgMutation` factory
- `src/lib/queries/use-expenses.ts` — Uses `useOrgMutation` factory
- `src/lib/queries/use-inventory.ts` — Uses `useOrgMutation` factory
- `src/lib/queries/use-diagnosis-labels.ts:23` — Manual `useMutation` (duplicates factory)

### Outbound Dependencies
- `src/lib/queries/mutation-factory.ts:93` — Depends on `useOnlineStatus()` hook
- `src/lib/queries/mutation-factory.ts:94` — Depends on `useMutationQueue()` hook
- `src/lib/offline/mutation-queue-provider.tsx:36` — MutationQueueContext
- `src/lib/toast-utils.ts:7` — `toastRetry` function
- `sonner` — Toast library (`toast.dismiss`, `toast.success`, `toast.error`)

### Infrastructure Wiring
- `src/lib/queries/keys.ts` — Query key factories for all entities
- `src/lib/hooks/use-online-status.ts:12` — Online status detection
- `src/lib/offline/mutation-queue-provider.tsx:83` — Offline replay on reconnect

## Architecture Insights

**Three-paradigm architecture:** The codebase has evolved three distinct optimistic patterns based on cache shape:
1. **`TData[]` lists** → `useOrgMutation` factory (preferred, ~15 consumers)
2. **Per-item REST** → Manual `useState` + `fetchCountRef` (1 consumer: mechanic multi-select)
3. **Nested composite objects** → Raw `useMutation` + manual `setQueryData` (6 hooks: bay-view + work-order detail)

**Factory is the default.** Manual patterns are justified only when the mutation can't be expressed as a single `mutationFn` (per-item fetches) or the cache shape doesn't match `TData[]` (nested objects).

**Offline-first built into factory.** The factory automatically routes through IndexedDB queue when offline. Manual patterns must duplicate this integration (`use-diagnosis-labels.ts` does, `_mechanic-multi-select.tsx` does not).

**Toast dismiss is a codebase-wide gap.** The factory at line 209 lacks `toast.dismiss()`, affecting all consumers. This should be fixed as a one-line change in `mutation-factory.ts`.

## Precedents & Lessons

### Precedent: `mutation-factory.ts` creation and evolution (3 iterations)
**Commit(s):** `34e54f50` (2026-06-04), `5e14243e` (2026-06-05), `3a9740a3` (2026-06-05)
**Blast radius:** 1 file per commit (factory definition), but imported across entire mutation layer

v1 was simple optimistic wrapper with `toastRetry`. v2 became full offline-first factory with `useOnlineStatus`, `useMutationQueue`, synthetic `{ queued: true }` response. v3 was formatting fix.

**Takeaway:** Factory went through 3 iterations in 2 days. The `toastRetry` → `toast.error` downgrade and offline queue integration were the major changes.

### Precedent: Mechanic multi-select — 3 follow-up commits in 2 hours
**Commit(s):** `5e14243e` → `3a9740a3` → `fbfc2c10` (2026-06-05)
**Blast radius:** 1 file (`_mechanic-multi-select.tsx`), 439 lines changed

Initial UI rewrite → lead selection filter bug → helper ID mismatch (`h.id` vs `h.mechanic_id`).

**Takeaway:** Helper API returns `mechanic_id` not `id`. Always verify API response shapes. New UI components typically need 2-3 follow-up fixes.

### Precedent: Infinite re-render loops from unstable callbacks
**Commit(s):** `dfb429fd`, `579b4a85` (2026-06-01)
**Blast radius:** 3 files, 83 lines changed

Polling callback recreated every render → `clearInterval`/`setInterval` on every render → infinite API loop. Toast dismiss handler also reset timer every render.

**Takeaway:** Every callback to `usePolling`/`useEffect` deps/`setInterval` MUST be wrapped in `useCallback`. This is the #1 recurring failure pattern.

### Precedent: Combobox portal escaping parent dialog
**Commit(s):** `f38e32bc`, `2e69248c` (2026-06-02)

Base UI Portal places combobox popup outside dialog DOM → outside-click fires → dialog closes. Fix: `onPointerDown` + `stopPropagation` on popup.

**Takeaway:** Portal-inside-portal requires `stopPropagation` on the inner popup to prevent parent dismiss.

### Composite Lessons
- Factory is the standard — use it for new mutations unless cache is nested object or mutation is per-item REST
- `toast.dismiss()` before `toast.success()` is mandatory — factory at line 209 violates this
- Every callback to effects/polling must use `useCallback` — caused infinite loops in bay-view
- New UI components need 2-3 follow-up fixes — plan for iteration
- Verify API response field names against types — `mechanic_id` vs `id` mismatch caused silent bugs

## Historical Context (from `.rpiv/artifacts/`)
- `AGENTS.md:394-483` — Optimistic UI section with rules, patterns, anti-patterns table, error rollback

## Open Questions
- Should `mutation-factory.ts:209` be fixed to add `toast.dismiss()` before `toast.success()`? (Impact: all `useOrgMutation` consumers)
- Should the skill be project-scoped (`.agents/skills/optimistic-ui/SKILL.md`) or global (`~/.pi/runtimes/nextjs/skills/`)? The pattern is specific to this codebase's `useOrgMutation` factory but the anti-patterns are universal.
- Should the manual paradigm (Paradigm 2) be refactored to use a factory-like wrapper, or is the current `_mechanic-multi-select.tsx` pattern acceptable as-is?
