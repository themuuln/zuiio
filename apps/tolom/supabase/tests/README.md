# RLS Policy Tests (pgTAP)

These SQL tests verify Row-Level Security policies using pgTAP, a
Postgres unit testing framework integrated with Supabase.

## Prerequisites

1. **Local Supabase running:**
   ```bash
   colima start --cpu 4 --memory 8
   supabase start --exclude studio,imgproxy,inbucket,vector,logflare,edge-runtime,meta
   ```

2. **Install pgTAP extension** (one-time, local dev only):
   ```bash
   supabase db execute --parent 'create extension if not exists pgtap with schema extensions;'
   ```

## Running Tests

```bash
cd apps/tolom
supabase test db
```

This runs all `.sql` files in `supabase/tests/` against your local
Supabase Postgres.

## Test Files

| File | What it covers |
|---|---|
| `000_helper.sql` | Reusable test helpers (set_auth, clear_auth, assert helpers) |
| `001_org_isolation.sql` | Tenant isolation: org A cannot access org B's data |
| `002_role_based_access.sql` | RBAC: admin vs mechanic vs guest vs anonymous |

## Adding Tests

Create a new file `supabase/tests/003_your_test.sql`:

```sql
begin;
select plan(N);

-- your test logic

select * from finish();
rollback;
```

## How RLS Tests Work

Each test file runs inside a transaction (`begin`/`rollback`) so no
data is persisted. Tests use:

- `set_config('role', ...)` to switch auth context
- `set_config('request.jwt.claim.sub', ...)` to set the user
- `set_config('request.jwt.claim.organization_id', ...)` to set org
- `throws_ok(...)` with SQLSTATE 42501 for permission denials

## Important: These tests assume seed data exists

Some tests reference organizations, roles, and permissions that are
created by migrations (`00001_*`, `00002_*`, etc.). Ensure all
migrations have been applied:

```bash
supabase db push
```
