---
name: code-standards
description: Tolom code standards — TypeScript strictness, naming conventions, file structure, error handling, data flow patterns, and import rules. Use when writing new files, refactoring, reviewing code, or fixing type errors.
---

# Code Standards

Strict rules for tolom codebase. Enforce on every commit.

---

## TypeScript Rules

### Strict Mode

```json
// tsconfig.json — strict: true
```

**No `any` without justification:**

```tsx
// ✅ CORRECT — typed
interface WorkOrder {
  id: string;
  status: WorkOrderStatus;
  total_amount: number;
}

// ❌ FORBIDDEN — untyped
const order: any = await fetchOrder(id);
const data = response.data as any;
```

**If you must use `any`, add a comment explaining why:**

```tsx
// biome-ignore lint/suspicious/noExplicitAny: third-party library lacks types
const plugin: any = loadPlugin(config);
```

### Import Rules

**Always import types from `@/lib/types`, never from `@/lib/database.types`:**

```tsx
// ✅ CORRECT
import type { WorkOrder, Customer } from "@/lib/types";

// ❌ FORBIDDEN — auto-generated, breaks on regeneration
import type { WorkOrder } from "@/lib/database.types";
```

**Import ordering (Biome enforced):**

1. Node built-ins
2. External packages (`react`, `next`, `@supabase/supabase-js`)
3. Internal aliases (`@/components/...`, `@/lib/...`)
4. Relative imports (`./foo`, `../bar`)

```tsx
// ✅ CORRECT order
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fetchWorkOrders } from "@/lib/services/work-orders";
import { StatusBadge } from "./status-badge";
```

### Type Exports

Export types from the file where they're defined, not re-exported:

```tsx
// ✅ CORRECT — types.tsx
export interface WorkOrderFormData {
  customer_id: string;
  vehicle_id: string;
  complaint: string;
}

// ✅ CORRECT — consuming file
import type { WorkOrderFormData } from "./_types";
```

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files (components) | `kebab-case.tsx` | `work-order-form.tsx` |
| Files (hooks) | `use-` prefix, kebab | `use-customer-data.ts` |
| Files (services) | `kebab-case.ts` | `work-orders.ts` |
| Files (types) | `_types.tsx` or `_types.ts` | `_types.tsx` |
| Files (constants) | `_constants.tsx` | `_constants.tsx` |
| Files (schema) | `_schema.ts` | `_schema.ts` |
| Files (private) | `_`-prefixed | `_bay-action-handlers.ts` |
| Components | `PascalCase` | `WorkOrderForm` |
| Hooks | `use` prefix, camelCase | `useCustomerData` |
| Functions | `camelCase` | `fetchWorkOrders` |
| Interfaces | `PascalCase` | `WorkOrderFormData` |
| Type aliases | `PascalCase` | `WorkOrderStatus` |
| Constants | `UPPER_SNAKE` or `camelCase` | `API_BASE_URL` or `maxRetries` |
| DB tables | `snake_case` | `work_orders` |
| DB columns | `snake_case` | `organization_id` |
| API routes | RESTful | `GET /api/organizations/[id]/work-orders` |

### Private Files

Files prefixed with `_` are private to their directory. They're imported only by sibling files:

```
bay-view-v2/
├── bay-view-v2-client.tsx      # Public — imported by pages
├── _bay-action-handlers.ts     # Private — only imported by bay-view-v2-client
├── _types.tsx                  # Private — only imported by siblings
├── _constants.tsx              # Private — only imported by siblings
└── _schema.ts                  # Private — only imported by siblings
```

---

## File Structure

### Page Components

```tsx
// app/[locale]/dashboard/customers/page.tsx
import { CustomerList } from "./_customer-list";

export default function CustomersPage() {
  return <CustomerList />;
}
```

Pages are thin. All logic lives in components.

### Component Files

```tsx
// components/customers/customer-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { customerSchema, type CustomerFormData } from "./_schema";

interface CustomerFormProps {
  initialData?: CustomerFormData;
  onSubmit: (data: CustomerFormData) => Promise<void>;
}

export function CustomerForm({ initialData, onSubmit }: CustomerFormProps) {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData ?? {
      name: "",
      email: "",
      phone: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Customer name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Save
        </Button>
      </form>
    </Form>
  );
}
```

### Component Size Limits

| Size | Action |
|------|--------|
| < 200 lines | Fine as-is |
| 200-400 lines | Consider extracting sub-components |
| 400-500 lines | Extract sub-components into `_`-prefixed files |
| 500+ lines | **Must split** — this is a signal, not a suggestion |

---

## Data Flow

```
Pages → React Query hooks → API routes → Services → Supabase
```

**Never skip a layer.**

### Layer Responsibilities

| Layer | Location | Responsibility |
|-------|----------|---------------|
| Pages | `src/app/` | Layout, routing, thin wrapper |
| Hooks | `src/lib/queries/` | React Query, cache management |
| API Routes | `src/app/api/` | Request validation, response formatting |
| Services | `src/lib/services/` | Business logic, DB queries |
| Supabase | — | Data storage, RLS |

### Rules

```tsx
// ✅ CORRECT — page uses hook
export default function CustomersPage() {
  const { data: customers, isLoading } = useCustomers();
  return <CustomerList customers={customers} isLoading={isLoading} />;
}

// ❌ FORBIDDEN — fetch in page
export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  useEffect(() => {
    fetch("/api/customers").then(r => r.json()).then(setCustomers);
  }, []);
  return <CustomerList customers={customers} />;
}
```

```tsx
// ✅ CORRECT — API route uses service
export async function GET(request: NextRequest) {
  const customers = await CustomerService.list(organizationId);
  return NextResponse.json(customers);
}

// ❌ FORBIDDEN — raw Supabase in route
export async function GET(request: NextRequest) {
  const { data } = await supabase.from("customers").select("*");
  return NextResponse.json(data);
}
```

---

## Error Handling

### API Routes

Always use `api-handler.ts` wrapper:

```tsx
// ✅ CORRECT
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (request, { orgId }) => {
  const customers = await CustomerService.list(orgId);
  return { data: customers };
});

// ❌ FORBIDDEN — raw NextResponse
export async function GET(request: NextRequest) {
  const { data, error } = await supabase.from("customers").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

### Service Functions

```tsx
// ✅ CORRECT — typed errors
export class CustomerError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "DUPLICATE" | "RLS_VIOLATION",
  ) {
    super(message);
    this.name = "CustomerError";
  }
}

export async function getCustomer(orgId: string, customerId: string) {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("organization_id", orgId)
    .eq("id", customerId)
    .single();

  if (error?.code === "PGRST116") {
    throw new CustomerError("Customer not found", "NOT_FOUND");
  }

  if (error) {
    throw new CustomerError(`Failed to fetch customer: ${error.message}`, "RLS_VIOLATION");
  }

  return data;
}
```

### Client-Side

```tsx
// ✅ CORRECT — React Query handles errors
const { data, error, isLoading } = useQuery({
  queryKey: customerKeys.detail(orgId, customerId),
  queryFn: () => fetchCustomer(orgId, customerId),
});

if (error) {
  return <ErrorState error={error} onRetry={() => refetch()} />;
}

// ❌ FORBIDDEN — manual error state
const [error, setError] = useState<string | null>(null);
useEffect(() => {
  fetchCustomer(id)
    .then(setData)
    .catch((e) => setError(e.message));
}, [id]);
```

---

## State Management

| State Type | Tool | Location |
|-----------|------|----------|
| Server data | React Query | `src/lib/queries/` |
| URL state (pagination, search) | nuqs | In components |
| Form values | react-hook-form | In components |
| Transient UI state | Zustand | `src/lib/stores/` |

### Zustand Store Pattern

```tsx
// ✅ CORRECT — with required middleware
import { create } from "zustand";
import { devtools, persist, immer } from "zustand/middleware";

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set) => ({
        sidebarOpen: true,
        toggleSidebar: () => set((state) => { state.sidebarOpen = !state.sidebarOpen; }),
      })),
      { name: "app-store" }
    )
  )
);

// ✅ CORRECT — export selector hook
export const useSidebarOpen = () => useAppStore((s) => s.sidebarOpen);

// ❌ FORBIDDEN — destructuring full store
const { sidebarOpen, toggleSidebar } = useAppStore();
```

---

## Formatting

Enforced by Biome:

- 2-space indent
- Single quotes
- Trailing semicolons
- No unused imports
- Consistent import ordering

```bash
# Check formatting
npm run validate:lint

# Auto-fix
npx biome check --write src/
```

---

## Anti-Patterns

| Anti-Pattern | Why It's Wrong | Fix |
|---|---|---|
| `fetch()` + `useState` + `useEffect` in pages | Skips React Query cache, no deduplication, no retry | Use React Query hooks |
| Raw `NextResponse.json()` in API routes | No error handling, no auth, no org scoping | Use `api-handler.ts` |
| `import from @/lib/database.types` | Breaks on type regeneration | Import from `@/lib/types` |
| Destructuring full Zustand store | Re-renders on any store change | Export selector hooks |
| `any` type without comment | Defeats TypeScript | Add comment or use proper type |
| Files > 500 lines | Hard to navigate, test, review | Extract sub-components |
| `_`-prefixed file imported outside directory | Breaks encapsulation | Move to shared location |
| `space-y-*` with flex | Inconsistent with wrapping | Use `gap-*` |
| Hardcoded colors | Breaks dark mode, theme changes | Use semantic tokens |

---

## Validation Checklist

Before merging any code change:

- [ ] TypeScript strict — no `any` without comment
- [ ] Types imported from `@/lib/types`
- [ ] Files named with kebab-case
- [ ] Private files prefixed with `_`
- [ ] Components under 400 lines (must split at 500+)
- [ ] API routes use `api-handler.ts`
- [ ] Services handle errors with typed error classes
- [ ] No raw `fetch()` + `useState` in pages
- [ ] Zustand stores use `devtools + persist + immer`
- [ ] Zustand stores export selector hooks
- [ ] Biome passes: `npm run validate:lint`
