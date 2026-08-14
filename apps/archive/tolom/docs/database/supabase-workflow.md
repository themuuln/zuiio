# Tolom Supabase Workflow

## Type Generation (NEVER manually patch)

After every migration, run `pnpm update-types`. **NEVER manually edit `database.types.ts`**.

If auth fails, stop and ask user to run `supabase login`.

## Tenant Isolation

Every table has `organization_id`. Every query is RLS-scoped. Never bypass.

## Error Capture

Every Supabase query must capture errors:

```ts
const { data, error } = await supabase.from('products').select('*');
if (error) { reportServerError('query', error); return apiError('QUERY_ERROR', error.message, 500); }
```

## Query Checklist

- [ ] Query scoped by `organization_id`
- [ ] Error captured (not silently swallowed)
- [ ] Types regenerated after schema changes
- [ ] No `as unknown as Record<string, unknown>` on insert/update
