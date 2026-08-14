# Zer Supabase Workflow

## Type Generation (NEVER manually patch)

After every database migration, types MUST be regenerated:

```bash
# Option 1: Supabase CLI (preferred)
cd apps/zer && supabase gen types typescript --project-id <ref> --schema public > src/lib/database.types.ts
cp src/lib/database.types.ts src/lib/supabase/types.ts

# Option 2: Supabase MCP (if CLI auth is broken)
# Use mcp__supabase_zer_generate_typescript_types, then save to both files
```

**Two type files exist** — both must be updated:
- `src/lib/database.types.ts` — canonical Supabase-generated types
- `src/lib/supabase/types.ts` — copy used by `createClient()`

After generating, run `biome check --write` to fix formatting.

If auth fails, **stop and ask user to run `supabase login`**. Do NOT manually patch types.

## Tenant Isolation

Every table has `organization_id`. Every query is RLS-scoped. Never bypass.

```ts
// ✅ Correct — RLS handles scoping
const { data } = await supabase.from('products').select('*');

// ❌ Never — bypasses RLS
const { data } = await supabase.from('products').select('*').eq('org_id', hardcodedId);
```

## Error Capture

Every Supabase query must use `withDbCapture()`:

```ts
const { data, error } = await withDbCapture("getProducts",
  supabase.from("products").select("*").eq("organization_id", orgId)
);
```
