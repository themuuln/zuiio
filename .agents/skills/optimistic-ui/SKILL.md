---
name: optimistic-ui
description: Implement optimistic UI updates in React — three paradigms (React Query factory, manual useState, nested-object), reconciliation, toast handling, anti-patterns, and error rollback. Use when adding mutations, fixing UI freeze/stuck on click, or reviewing optimistic update code.
version: "1.0.0"
---

# Optimistic UI

Implement mutations that update the UI instantly before the server responds, then reconcile when the server catches up.

## When to Use

- Adding, updating, or deleting data that should appear immediately
- Multi-select components where per-item REST calls fire on each click
- Any mutation where "loading spinner → eventual update" feels broken
- Fixing UI freeze/stuck on rapid clicks

## Three Paradigms

Choose based on your cache shape and mutation type:

| Paradigm | Cache Shape | Mutation Type | Example |
|----------|-------------|---------------|---------|
| **Factory** | `TData[]` (flat list) | Single bulk `fetch` | `useCreateCustomerNote` |
| **Manual** | Component-local state | Per-item REST (POST/DELETE per item) | `_mechanic-multi-select.tsx` |
| **Nested Object** | Single composite object | Sub-collection mutation | `use-bay-view.ts`, work order detail |

**Default: use the factory.** Manual patterns are justified only when the mutation can't be a single `mutationFn` (per-item fetches) or the cache isn't `TData[]` (nested objects).

---

## Paradigm 1: React Query Factory (`useOrgMutation`)

For flat `TData[]` list caches with a single bulk mutation.

### Pattern

```tsx
const mutation = useOrgMutation<TData, TVariables>({
  endpoint: `/api/organizations/${orgId}/things`,
  method: "POST",
  queryKey: thingKeys.list(orgId),
  optimisticUpdate: (old, vars) => [
    ...old,
    {
      id: `temp-${Date.now()}`,
      ...vars,
      created_at: new Date().toISOString(),
    } as TData,
  ],
  successMessage: "Thing created",
  errorMessage: "Failed to create thing",
});
```

### Lifecycle

1. **onMutate**: `cancelQueries` → `getQueryData<TData[]>` → `optimisticUpdate(previous, variables)` → `setQueryData` — writes temp item
2. **onError**: `setQueryData(queryKey, context.previous)` — restores snapshot
3. **onSettled**: `invalidateQueries({ queryKey })` — triggers refetch, replacing temp IDs with real server data

### Complete Temp Item Contract

Every optimistic item MUST populate ALL fields the list consumer expects. `setQueryData` performs **full replacement**, not merge. Missing fields cause runtime render errors.

```tsx
optimisticUpdate: (old, vars) => [
  ...old,
  {
    id: `temp-${Date.now()}`,     // temp ID — replaced by server on refetch
    organization_id: orgId ?? "",  // known from context
    content: vars.content,         // from user input
    type: vars.type ?? "general", // defaults for optional fields
    created_by: "",                // server-generated — placeholder
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,              // nullable — always null
  } as CustomerNote,
],
```

**Field sources:**
- Known from user input → use directly
- Server-generated (`id`, `created_by`) → placeholder (`""`, `temp-${Date.now()}`)
- Timestamps → `new Date().toISOString()`
- Nullable → `null`

### Offline Support

The factory handles offline automatically via `useOnlineStatus()` + `useMutationQueue()`. When offline, mutations queue to IndexedDB and replay on reconnect. No extra code needed.

---

## Paradigm 2: Manual Optimistic (`useState` + Reconciliation)

For per-item REST calls (POST/DELETE per selected item) where a single `mutationFn` can't express the mutation.

### Pattern

```tsx
function MyMultiSelect({ items, selected, onSelectionChange }) {
  const prevIdsRef = useRef<string[]>([]);
  const fetchCountRef = useRef(0);
  const lastRequestedRef = useRef<string | null>(null);
  const [optimistic, setOptimistic] = useState<T[] | null>(null);

  const serverValue = selected; // from props/server

  // Stable key for reconciliation
  const serverKey = serverValue.map(m => m.id).sort().join(",");
  const lastKey = lastRequestedRef.current;

  useEffect(() => {
    if (!optimistic || !lastKey || fetchCountRef.current > 0) return;
    if (serverKey === lastKey) {
      setOptimistic(null);
      lastRequestedRef.current = null;
    }
  }, [serverKey, lastKey, optimistic]);

  const value = optimistic ?? serverValue;
  prevIdsRef.current = value.map(m => m.id);

  const handleChange = useCallback(async (newValue: T[]) => {
    // 1. Optimistic — fires on EVERY click, never guarded
    setOptimistic(newValue);

    const newIds = newValue.map(m => m.id);
    const oldIds = prevIdsRef.current;
    prevIdsRef.current = newIds;
    lastRequestedRef.current = [...newIds].sort().join(",");

    // 2. Diff what changed
    const added = newValue.filter(m => !new Set(oldIds).has(m.id));
    const removedIds = oldIds.filter(id => !new Set(newIds).has(id));

    // 3. Fetch per item (tracked, not blocking)
    for (const item of added) {
      fetchCountRef.current++;
      try {
        await fetch(`/api/items`, { method: "POST", body: JSON.stringify(item) });
        toast.dismiss();
        toast.success("Added");
        onMutation();
      } catch {
        toast.error("Failed");
      } finally {
        fetchCountRef.current--;
      }
    }

    for (const id of removedIds) {
      fetchCountRef.current++;
      try {
        await fetch(`/api/items/${id}`, { method: "DELETE" });
        toast.dismiss();
        toast.success("Removed");
        onMutation();
      } catch {
        toast.error("Failed");
      } finally {
        fetchCountRef.current--;
      }
    }
  }, [onMutation]);

  return <Combobox value={value} onValueChange={handleChange} />;
}
```

### Refs Explained

| Ref | Purpose | Updated When |
|-----|---------|-------------|
| `prevIdsRef` | Last known ID list for diffing | Every render (line: `prevIdsRef.current = value.map(...)`) + in handler before diff |
| `fetchCountRef` | In-flight fetch counter | `++` before each fetch, `--` in `finally` |
| `lastRequestedRef` | Sorted ID string of last optimistic target | In handler after `setOptimistic` |

### Reconciliation

The `useEffect` reconciles when:
1. `optimistic` is non-null (we have pending state)
2. `lastKey` is non-null (a request was tracked)
3. `fetchCountRef.current === 0` (all fetches completed)
4. `serverKey === lastKey` (server state matches what we requested)

Only then does it clear `setOptimistic(null)`, letting canonical server objects take over.

### Why Not a Boolean `busyRef`?

A boolean blocks the entire handler on the second click:
```tsx
// ❌ BROKEN — second click is silently dropped
if (busyRef.current) return;
busyRef.current = true;
setOptimistic(newValue);  // never reached on second click
```

A counter tracks concurrent fetches without blocking:
```tsx
// ✅ CORRECT — optimistic fires on every click
setOptimistic(newValue);  // always fires
fetchCountRef.current++;   // only gates reconciliation
```

---

## Paradigm 3: Raw `useMutation` for Nested Objects

For caches holding a single composite object (not `TData[]`) with sub-collections to mutate.

### When to Use

- Cache is `BayViewData`, `WorkOrderDetail`, or similar composite object
- Mutation crosses sub-collections (e.g., move from `waitingQueue` to `bays`)
- Factory's `(TData[]) => TData[]` signature can't express the transform

### Pattern

```tsx
function useAssignVehicleToBay(branchId: string) {
  const queryClient = useQueryClient();
  const key = bayViewKeys.data(branchId);

  return useMutation({
    mutationFn: async (vars: { workOrderId: string; bayNumber: number }) => {
      const res = await fetch(`/api/bays/assign`, { /* ... */ });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<BayViewData>(key);

      if (previous) {
        const wo = previous.waitingQueue.find(w => w.id === vars.workOrderId);
        if (wo) {
          queryClient.setQueryData<BayViewData>(key, {
            ...previous,
            waitingQueue: previous.waitingQueue.filter(w => w.id !== vars.workOrderId),
            bays: previous.bays.map(b =>
              b.bayNumber === vars.bayNumber
                ? { ...b, workOrder: { ...wo, bay_number: vars.bayNumber, status: "New" } }
                : b
            ),
          });
        }
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      toast.error("Failed to assign vehicle");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
```

### Shared Rollback Helper

Extract rollback into a shared function when multiple hooks mutate the same cache:

```tsx
function rollbackOnError(
  queryClient: QueryClient,
  key: QueryKey,
  context: { previous: BayViewData | undefined } | undefined,
) {
  if (context?.previous) {
    queryClient.setQueryData(key, context.previous);
  }
}
```

---

## Toast Handling

### Rule: Dismiss-Then-Show

```tsx
// ✅ CORRECT — rapid clicks collapse into one toast
toast.dismiss();
toast.success("Helper added");

// ❌ BROKEN — 5 clicks = 5 stacked toasts
toast.success("Helper added");
```

### Error Toasts

Error toasts rarely stack (server errors are less frequent than successes), but for consistency:

```tsx
toast.dismiss();
toast.error("Failed to add helper");
```

### Factory consumers

If using `useOrgMutation`, the factory handles toasts via `successMessage`/`errorMessage` config. If the factory is missing `toast.dismiss()` (known issue), add it manually in the `onSuccess` callback.

---

## Anti-Patterns

| Anti-Pattern | Why It Breaks | Fix |
|---|---|---|
| `if (busy) return` before `setOptimistic` | Second click silently dropped — UI freezes | Remove guard, use `fetchCountRef` for fetch-only gating |
| `useEffect` depends on object/value refs | Runs every render (new array/object reference), causes flicker | Derive stable `string` key: `ids.sort().join(",")` |
| `setOptimistic(null)` inside render IIFE | State update during render → extra re-renders | Move to `useEffect` |
| Per-fetch toasts without `toast.dismiss()` | Toast spam on rapid clicks | `toast.dismiss()` before each `toast.success()` |
| Boolean `busyRef` blocks handler | Skips optimistic update AND ref diff, losing the click | Use `fetchCountRef` counter, never guard the handler |
| Temp item missing fields | `setQueryData` replaces entire cache — missing fields cause render errors | Populate ALL fields with placeholders |

---

## Error Rollback

### Factory Path

Automatic — `onError` restores `context.previous` snapshot.

### Manual Path

Clear optimistic so server state takes over:

```tsx
} catch {
  setOptimistic(null); // rollback to last known server state
  toast.error("Failed");
}
```

### Nested Object Path

Restore the snapshot captured in `onMutate`:

```tsx
onError: (_err, _vars, context) => {
  if (context?.previous) {
    queryClient.setQueryData(key, context.previous);
  }
};
```

---

## Validation Checklist

Before merging optimistic UI code, verify:

- [ ] `setOptimistic(newValue)` is the **first** operation in the handler (no busy guard before it)
- [ ] `useEffect` dependencies are **primitive strings** (not object/array refs)
- [ ] `setOptimistic(null)` is in `useEffect`, **not** in a render IIFE
- [ ] `toast.dismiss()` before every `toast.success()` in fetch callbacks
- [ ] `fetchCountRef` (counter), not `busyRef` (boolean), gates reconciliation
- [ ] Temp items populate **all fields** the consumer expects
- [ ] `prevIdsRef` is updated **after** the diff (snapshot old → compute diff → overwrite ref)
- [ ] Error path clears optimistic (`setOptimistic(null)` or restores snapshot)

---

## Code References

- `src/lib/queries/mutation-factory.ts` — `useOrgMutation` factory (Paradigm 1)
- `src/components/bay-view-v2/_mechanic-multi-select.tsx` — Manual optimistic (Paradigm 2)
- `src/lib/queries/use-bay-view.ts` — Nested-object optimistic (Paradigm 3)
- `src/app/[locale]/dashboard/work-orders/[id]/page.tsx` — Page-level nested optimistic
- `src/lib/queries/use-customer-notes.ts` — Factory consumer example
- `AGENTS.md:394-483` — Optimistic UI rules and anti-patterns
