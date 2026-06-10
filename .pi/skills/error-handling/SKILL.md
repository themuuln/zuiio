---
name: error-handling
description: Tolom error handling patterns — AppError classes, API error responses, toast notifications with sonner, error boundaries, mutation error handling, and retry patterns. Use when adding error handling, fixing uncaught errors, improving user-facing error messages, or writing mutation callbacks.
---

# Error Handling

Consistent error handling across API, services, and UI. Every error is typed, every user sees a toast.

---

## Error Class Hierarchy

All errors extend `AppError` from `src/lib/errors.ts`:

```
AppError (base)
├── NotFoundError      (404)
├── UnauthorizedError  (401)
├── ForbiddenError     (403)
├── ValidationError    (400)
└── ConflictError      (409)
```

### Usage in Services

```tsx
import { NotFoundError, ValidationError, ConflictError } from "@/lib/errors";

// ✅ CORRECT — throw typed errors
export async function getCustomer(db: SupabaseClient, id: string, orgId: string) {
  const { data, error } = await db
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw new NotFoundError("Customer not found");
  }

  return data;
}

// ✅ CORRECT — validation error with details
if (!params.phone?.trim() && !params.email?.trim()) {
  throw new ValidationError("At least one identifying field is required");
}

// ✅ CORRECT — conflict with context
throw new ConflictError("A customer with this phone already exists", {
  existingCustomerId: existing.id,
});

// ❌ FORBIDDEN — generic Error
throw new Error("Customer not found");
throw new Error("Something went wrong");
```

### When to Use Each

| Error | When | HTTP Status |
|-------|------|-------------|
| `NotFoundError` | Resource doesn't exist or RLS blocks access | 404 |
| `UnauthorizedError` | No authenticated user | 401 |
| `ForbiddenError` | User lacks org membership or role | 403 |
| `ValidationError` | Invalid input, missing required fields | 400 |
| `ConflictError` | Duplicate unique field (phone, email) | 409 |
| `AppError` | Custom server errors | 500 |

---

## API Error Responses

### `toApiErrorResponse()`

Converts any error to a serializable response. Used by `api-handler.ts`:

```tsx
import { toApiErrorResponse } from "@/lib/errors";

// Returns: { status, body: { error: { code, message, details? } }, headers? }
const { status, body, headers } = toApiErrorResponse(error);
return NextResponse.json(body, { status, headers });
```

### Response Shape

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Customer not found",
    "details": { "customerId": "abc-123" }
  }
}
```

### `api-handler.ts` Wrapper

All API routes use `createRouteHandler`. It handles:
- Auth (Supabase session)
- Org membership verification
- Role/permission checks
- Rate limiting
- Error catching → `toApiErrorResponse()`

```tsx
import { createRouteHandler } from "@/lib/api-handler";
import { NotFoundError } from "@/lib/errors";

// ✅ CORRECT — handler throws, wrapper catches
export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
  const customer = await getCustomer(supabase, params.id, orgId);
  return NextResponse.json({ data: customer });
});

// ❌ FORBIDDEN — manual error handling
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase.from("customers").select("*");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

---

## Toast Notifications (Sonner)

### Success Toasts

```tsx
import { toast } from "sonner";

// ✅ CORRECT — dismiss first, then show (prevents stacking on rapid clicks)
toast.dismiss();
toast.success("Customer created");

// ❌ FORBIDDEN — no dismiss (5 clicks = 5 stacked toasts)
toast.success("Customer created");
```

### Error Toasts

```tsx
// ✅ CORRECT — with error extraction
} catch (err) {
  toast.error(err instanceof Error ? err.message : t("failedToUpdate"));
}

// ✅ CORRECT — validation errors show specific message
toast.error("Please enter a part name");

// ❌ FORBIDDEN — generic message loses context
toast.error("Something went wrong");
```

### Retry Toasts

Use `toastRetry` from `src/lib/toast-utils.ts`:

```tsx
import { toastRetry } from "@/lib/toast-utils";

// ✅ CORRECT — retry button on error
try {
  await saveData(data);
  toast.dismiss();
  toast.success("Saved");
} catch (err) {
  toastRetry(
    err instanceof Error ? err.message : "Failed to save",
    () => saveData(data),  // retry function
  );
}
```

### Toast Rules

| Rule | Why |
|------|-----|
| `toast.dismiss()` before `toast.success()` | Prevents stacking on rapid clicks |
| `toast.dismiss()` before `toast.error()` | Same — collapse errors |
| Extract `err.message` for user display | `instanceof Error` check is required |
| Use `t("key")` for i18n | All user-facing messages must be translatable |
| `toastRetry` for recoverable errors | User can retry without page refresh |

---

## Error Boundaries

### Component-Level

```tsx
import { ErrorBoundary } from "@/components/error-boundary";

// ✅ CORRECT — wrap risky sections
<ErrorBoundary>
  <RevenueChart data={data} />
</ErrorBoundary>

// ✅ CORRECT — custom fallback
<ErrorBoundary fallback={<ChartError />}>
  <ComplexVisualization />
</ErrorBoundary>
```

### When to Use

| Situation | Use ErrorBoundary? |
|-----------|-------------------|
| Third-party chart library | ✅ Yes — crashes shouldn't kill the page |
| Complex form with many fields | ✅ Yes — isolate failures |
| Simple text display | ❌ No — overkill |
| Entire page layout | ❌ No — use `error.tsx` instead |

### Page-Level (`error.tsx`)

Next.js App Router handles this automatically:

```tsx
// app/[locale]/dashboard/customers/error.tsx
"use client";

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <AlertTriangle className="size-6 text-destructive" />
      <p className="text-muted-foreground">{error.message}</p>
      <Button variant="outline" onClick={reset}>Try again</Button>
    </div>
  );
}
```

---

## Mutation Error Handling

### React Query Pattern

```tsx
const mutation = useMutation({
  mutationFn: updateCustomer,
  onSuccess: () => {
    toast.dismiss();
    toast.success("Customer updated");
    queryClient.invalidateQueries({ queryKey: customerKeys.list(orgId) });
  },
  onError: (err) => {
    toast.error(err instanceof Error ? err.message : "Failed to update");
  },
});
```

### Optimistic Rollback on Error

```tsx
const mutation = useMutation({
  mutationFn: updateCustomer,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey });
    const previous = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, newData);
    return { previous };
  },
  onError: (_err, _vars, context) => {
    // Rollback to snapshot
    queryClient.setQueryData(queryKey, context?.previous);
    toast.error("Update failed — reverted");
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey });
  },
});
```

### Manual Catch in Components

```tsx
// ✅ CORRECT — handle each mutation separately
const handleDelete = async (id: string) => {
  try {
    await deleteCustomer(id, orgId);
    toast.dismiss();
    toast.success("Deleted");
    setOpen(false);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Failed to delete");
  }
};

// ❌ FORBIDDEN — swallowing errors silently
const handleDelete = async (id: string) => {
  await deleteCustomer(id, orgId);
  setOpen(false);
  // user has no idea if it worked
};
```

---

## Offline Error Handling

```tsx
import { toastRetry } from "@/lib/toast-utils";

// In mutation queue provider — when offline
if (!navigator.onLine) {
  toastRetry(
    "You're offline — changes will sync when reconnected",
    () => retrySync(),
    10000,  // longer duration for offline
  );
}
```

---

## Anti-Patterns

| Anti-Pattern | Why It's Wrong | Fix |
|---|---|---|
| `throw new Error("Not found")` | Generic error, no HTTP status mapping | Use `NotFoundError` |
| `toast.success()` without `toast.dismiss()` | Stacks on rapid clicks | Always dismiss first |
| `catch (e) { console.log(e) }` | Silent failure, user sees nothing | Show toast + re-throw if needed |
| `catch (e) { }` | Swallows errors completely | Never empty catch |
| Generic `"Something went wrong"` toast | User can't debug | Extract `err.message` |
| Manual `try/catch` in API routes | Duplicates `api-handler` logic | Use `createRouteHandler` |
| `@ts-ignore` on error types | Hides type issues | Use proper error classes |

---

## Validation Checklist

Before merging error handling code:

- [ ] Services throw typed `AppError` subclasses (not generic `Error`)
- [ ] API routes use `createRouteHandler` (not raw `NextResponse`)
- [ ] Toasts call `toast.dismiss()` before `toast.success()` / `toast.error()`
- [ ] Error messages use `err instanceof Error ? err.message : t("key")`
- [ ] All user-facing strings use `t("key")` for i18n
- [ ] Mutations have `onError` with toast feedback
- [ ] Optimistic mutations have rollback in `onError`
- [ ] Error boundaries wrap third-party / complex components
- [ ] No empty `catch` blocks
- [ ] `toastRetry` used for recoverable errors
