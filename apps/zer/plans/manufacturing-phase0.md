# Manufacturing Module - Phase 0: Feature Gating & Permissions

## Context
Add manufacturing feature gating (BOM, production orders, job costing, quality control, material tracking) to the Zer ERP app. This includes DB enum values, permission backfill for existing roles, feature key constants, and permission UI entries. Navigation and onboarding wiring will be handled by another worker.

## Files to Change
| File | Action | What changes |
|------|--------|--------------|
| `supabase/migrations/20260717100000_manufacturing_features_permissions.sql` | Create | Add 11 new `app_permission` enum values + backfill owner/admin roles |
| `src/lib/constants.ts` | Modify | Add 5 manufacturing features to `FEATURES`, new keys in `FEATURE_KEYS`, 3 routes to `NAV_FEATURE_MAP` |
| `src/lib/permissions.ts` | Modify | Add manufacturing `PERMISSION_GROUPS` entry + 11 `PERMISSION_LABELS` entries |

## Implementation Order
1. **Migration** — no dependencies, self-contained
2. **constants.ts** — define feature constants
3. **permissions.ts** — define permission groups + labels

## Migration Design
- Follow EXACT existing pattern from `20260617000001_create_purchases_quotations...`: individual `DO $$ BEGIN ALTER TYPE ... ADD VALUE IF NOT EXISTS '...'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;` blocks per permission
- Backfill: `DO $$` block iterating owner/admin roles, uses `ON CONFLICT DO NOTHING` for idempotency
- Admin gets all new permissions (no exclusions since none are sensitive like `roles.manage`)

## New Enum Values (11 total)
- `boms.create`, `boms.read`, `boms.update`, `boms.delete`
- `production_orders.create`, `production_orders.read`, `production_orders.update`, `production_orders.delete`
- `production_costs.read`
- `quality_checks.create`, `quality_checks.read`

## Constants Design
- `FEATURE_KEYS` as tuple: `manufacturing: ['boms', 'production_orders', 'job_costing', 'quality_control', 'material_tracking'] as const`
- `FEATURES` array: 5 new entries following existing `{ key, label, description }` pattern
- `NAV_FEATURE_MAP`: 3 route entries — `/bom`, `/production`, `/job-costing`

## Permissions Design
- New `PERMISSION_GROUPS` entry: key=`manufacturing`, label=`Үйлдвэрлэл`
- 11 `PERMISSION_LABELS` entries with Mongolian translations

## Edge Cases
- **Duplicate enum values**: `ADD VALUE IF NOT EXISTS` handles idempotency
- **Duplicate role_permissions**: `ON CONFLICT (role_id, permission) DO NOTHING`
- **No roles exist for some orgs**: Backfill loops only process existing roles
- **`is_system_role = true` filter**: Only seed default roles, not custom roles
- **TypeScript enum sync**: TS types need regeneration after migration (separate step)

## Verification
1. `supabase migration up` — applies without errors
2. `bun run typecheck` — zero new errors in constants.ts/permissions.ts
3. Check that `Constants.public.Enums.app_permission` includes new values in generated types
