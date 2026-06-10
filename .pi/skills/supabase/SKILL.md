---
name: supabase-patterns
description: Tolom Supabase patterns — service functions, RLS policies, type generation, client setup, queries, mutations, caching, and audit logging. Use when writing services, creating migrations, adding RLS policies, querying Supabase, or fixing database-related issues.
---

# Supabase Patterns

Database layer conventions. Every query is org-scoped, every table has RLS.

---

## Client Setup

### Server Client

```tsx
// src/lib/supabase/server.ts
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            cookieStore.set(name, value)
          );
        },
      },
    },
  );
}
```

### Browser Client

```tsx
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

### Rules

- **Never create clients inline** — always use the factory functions
- **Server routes** use `createClient()` from `@/lib/supabase/server`
- **Components** use `createClient()` from `@/lib/supabase/client`
- **Never use service role key** in client-side code

---

## Type Generation

### Generated Types

```bash
supabase gen types typescript --linked > src/lib/database.types.ts
```

### Custom Types

```tsx
// src/lib/types.ts — YOUR types, not the generated ones
import type { Database } from "@/lib/database.types";

// Map DB types to app types
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type WorkOrder = Database["public"]["Tables"]["work_orders"]["Row"];

// Params for mutations
export type CreateCustomerParams = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  companyName?: string;
  // ...
};

export type UpdateCustomerParams = Partial<CreateCustomerParams>;

// Paginated response
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
```

### Import Rules

```tsx
// ✅ CORRECT — import from @/lib/types
import type { Customer, CreateCustomerParams } from "@/lib/types";

// ❌ FORBIDDEN — import from generated file
import type { Customer } from "@/lib/database.types";
// database.types.ts changes on every regeneration — breaks your code
```

---

## Service Function Pattern

Every service follows this structure:

```tsx
// src/lib/services/customer-service.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError, ConflictError } from "@/lib/errors";
import type { Customer, CreateCustomerParams, PaginatedResponse } from "@/lib/types";

/**
 * Get a single customer by ID.
 */
export async function getCustomer(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<Customer> {
  const { data, error } = await db
    .from("customers")
    .select("id, organization_id, first_name, last_name, phone, email, ...")
    .eq("id", id)
    .eq("organization_id", orgId)     // ← ORG SCOPING
    .is("deleted_at", null)           // ← SOFT DELETE
    .single();

  if (error || !data) {
    throw new NotFoundError("Customer not found");
  }

  return data as Customer;
}
```

### Service Rules

| Rule | Why |
|------|-----|
| `db: SupabaseClient` as first param | Enables testing with mock client |
| `orgId` on every query | Multi-tenancy — never cross-org |
| `.is("deleted_at", null)` | Soft delete pattern |
| Throw typed errors | `NotFoundError`, `ConflictError`, etc. |
| `revalidateTag()` after mutations | Cache invalidation |
| `createAuditLog()` after mutations | Audit trail |

---

## Query Patterns

### List with Pagination

```tsx
export async function getCustomers(
  db: SupabaseClient,
  orgId: string,
  options?: { search?: string; page?: number; pageSize?: number },
): Promise<PaginatedResponse<Customer>> {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options?.pageSize ?? 50));
  const offset = (page - 1) * pageSize;

  let query = db
    .from("customers")
    .select("id, first_name, last_name, phone, ...", { count: "exact" })
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Search across multiple fields
  if (options?.search?.trim()) {
    const term = `%${options.search.trim()}%`;
    query = query.or(
      `first_name.ilike.${term},last_name.ilike.${term},phone.ilike.${term}`,
    );
  }

  const { data, count, error } = await query.range(offset, offset + pageSize - 1);

  if (error) throw new Error(error.message);

  return {
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}
```

### Single Record

```tsx
const { data, error } = await db
  .from("customers")
  .select("id, first_name, phone, ...")
  .eq("id", id)
  .eq("organization_id", orgId)
  .is("deleted_at", null)
  .single();

if (error || !data) throw new NotFoundError("Customer not found");
```

### Insert

```tsx
const { data, error } = await db
  .from("customers")
  .insert({
    organization_id: orgId,
    first_name: params.firstName?.trim() || null,
    phone: params.phone?.trim() || null,
    created_by: userId,
    updated_by: userId,
  })
  .select("id, first_name, phone, ...")
  .single();

if (error || !data) throw new Error(error?.message ?? "Failed to create");
```

### Update

```tsx
const { data, error } = await db
  .from("customers")
  .update({
    first_name: params.firstName?.trim() || null,
    updated_by: userId,
  })
  .eq("id", id)
  .eq("organization_id", orgId)
  .is("deleted_at", null)
  .select("id, first_name, ...")
  .single();

if (error || !data) throw new Error(error?.message ?? "Failed to update");
```

### Soft Delete

```tsx
const { error } = await db
  .from("customers")
  .update({
    deleted_at: new Date().toISOString(),
    updated_by: userId,
  })
  .eq("id", id)
  .eq("organization_id", orgId);

if (error) throw new Error(error.message);
```

---

## Audit Logging

After every mutation:

```tsx
await createAuditLog({
  supabase: db,
  action: "create" | "update" | "soft_delete",
  table_name: "customers",
  record_id: data.id,
  user_id: userId,
  organization_id: orgId,
  old_data: existing,   // for updates
  new_data: data,       // for creates/updates
});
```

---

## Cache Invalidation

```tsx
import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";

// After any mutation
revalidateTag(cacheTags.customers(orgId), "max");
```

### Cache Tag Convention

```tsx
// src/lib/cache/keys.ts
export const cacheTags = {
  customers: (orgId: string) => `org-${orgId}-customers`,
  workOrders: (orgId: string) => `org-${orgId}-work-orders`,
  // ...
};
```

---

## RLS Policies

### Standard Pattern (org isolation)

```sql
-- Every table gets 4 policies
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "my_table_select"
  ON my_table FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "my_table_insert"
  ON my_table FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "my_table_update"
  ON my_table FOR UPDATE
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "my_table_delete"
  ON my_table FOR DELETE
  USING (organization_id = get_user_organization_id());
```

### Naming Convention

```
{table}_{operation}
```

Examples: `customers_select`, `customers_insert`, `work_orders_update`, `followups_org_select`

### Helper Function

```sql
-- Returns the user's current organization_id
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid AS $$
  SELECT organization_id FROM organization_users
  WHERE user_id = auth.uid()
  AND removed_at IS NULL
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Shared Data (Cross-Org)

For read-only cross-org data (e.g., shared customers):

```sql
CREATE POLICY "customers_select_shared"
  ON customers FOR SELECT
  USING (
    organization_id != get_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM organizations
      WHERE id = customers.organization_id
      AND sharing_enabled = true
    )
  );
```

---

## Migration Checklist

```bash
# 1. Create migration
supabase migration new add_customer_followups

# 2. Write SQL (idempotent)
# 3. Add RLS policies (EVERY table)
# 4. Add indexes for query patterns
# 5. Add trigger for updated_at
# 6. Regenerate types
supabase gen types typescript --linked > src/lib/database.types.ts
# 7. Run tests
npm run validate && npm run test
```

### Migration Template

```sql
-- ── Table Name ──────────────────────────────────────────────
-- Description of what this table stores
-- ────────────────────────────────────────────────────────────

CREATE TABLE my_table (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- columns...
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamp with time zone NOT NULL DEFAULT now(),
  updated_at      timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at      timestamp with time zone
);

-- ── RLS ────────────────────────────────────────────────────
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
-- 4 policies...

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX idx_my_table_org ON my_table (organization_id)
  WHERE deleted_at IS NULL;

-- ── Auto-update trigger ────────────────────────────────────
CREATE TRIGGER set_my_table_updated_at
  BEFORE UPDATE ON my_table
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## Testing with Mock Client

```tsx
import { createMockSupabaseClient } from "@/test/mocks/supabase";

const mockClient = createMockSupabaseClient();

// Override terminal methods
mockClient.from("customers").single.mockResolvedValue({
  data: { id: "c1", first_name: "Bat" },
  error: null,
});

// Chain queries
mockClient
  .from("customers")
  .maybeSingle.mockResolvedValueOnce({ data: null, error: null }); // first call
mockClient
  .from("customers")
  .single.mockResolvedValueOnce({ data: { id: "c1" }, error: null }); // second call
```

---

## Anti-Patterns

| Anti-Pattern | Why It's Wrong | Fix |
|---|---|---|
| No `orgId` on queries | Cross-org data leak | Always `.eq("organization_id", orgId)` |
| No `.is("deleted_at", null)` | Shows soft-deleted records | Add to every select |
| Raw `Error` instead of `AppError` | No HTTP status mapping | Use `NotFoundError`, etc. |
| No audit log on mutations | No trail for debugging | `createAuditLog()` after every write |
| No `revalidateTag` after mutation | Stale cache served | Invalidate relevant tags |
| Importing from `database.types` | Breaks on type regen | Import from `@/lib/types` |
| RLS policies missing | Data accessible without org scope | Every table gets 4 policies |
| Migration without indexes | Slow queries | Add indexes for query patterns |
| Service functions without `db` param | Can't test with mock | Always accept `SupabaseClient` |

---

## Validation Checklist

Before merging Supabase-related code:

- [ ] Every query has `.eq("organization_id", orgId)`
- [ ] Every select has `.is("deleted_at", null)`
- [ ] Services throw typed errors (`NotFoundError`, `ConflictError`, etc.)
- [ ] Mutations call `createAuditLog()` after write
- [ ] Mutations call `revalidateTag()` after write
- [ ] Types imported from `@/lib/types` (not `database.types`)
- [ ] Service functions accept `db: SupabaseClient` as first param
- [ ] New tables have RLS policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] New tables have indexes for query patterns
- [ ] New tables have `set_updated_at` trigger
- [ ] Migration is idempotent
- [ ] Types regenerated after migration
