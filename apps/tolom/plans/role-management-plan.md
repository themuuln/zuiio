# Organization Role Management

## Context
Tolom has the persistence needed for organization-scoped RBAC—`roles`, `permissions`, `role_permissions`, and `organization_users`—but no role-management workflow. The only roles API is a read-only `GET`, the roles page is a card grid, and the sidebar branches on the seeded role names instead of a member’s assigned permissions. Implement owner-managed custom roles as combinations of an application-owned permission catalog: a user whose role does not include `reports.read` must have no Reports menu entry and receive `403` from the Reports API.

## Approach
### 1. Establish a single, immutable permission model in a new migration
**Dependency:** implement before API, UI, or navigation work. Create the migration with `supabase migration new secure_organization_rbac`; it owns every schema, seed, RLS, trigger, and function change below.

1. Reuse the existing `roles`, `permissions`, `role_permissions`, and `organization_users` tables. Do **not** add a second role table, persist role claims in Supabase `user_metadata`, or create owner-editable permission names. An organization owner creates a custom role by choosing from the fixed catalog; future application features add catalog entries only through migrations.
2. Repair the current role seeding contract, whose latest `seed_org_role_permissions(p_org_id uuid)` definition in `20260705000001_add_refunds_permissions.sql` no longer creates the four seed roles. Add the partial case-insensitive active-name unique index `roles(organization_id, lower(name)) WHERE deleted_at IS NULL`, then make the seed function idempotently create exactly these immutable system roles:
   - `Org Owner` — all active permissions for the organization.
   - `Manager` — the current manager matrix plus all `cash_register.*`, `service_reminders.*`, and `day_close.*` entries listed below.
   - `Mechanic` — `work_orders.read`, `work_orders.update`, `inventory.read`, `customers.read`, `vehicles.read`, `services.read`, `service_reminders.read`, `cash_register.read`, and `day_close.read`.
   - `Guest` — `invoices.read`.
   The function must only insert missing role-permission links; it must not delete custom-role assignments.
3. Fold the existing but currently future-org-missing `cash_register.create|read|update|delete` catalog entries into `seed_org_permissions`. Add these catalog entries and descriptions in the same seed function, then backfill every active organization:
   - `service_reminders.create|read|update|delete|manage`
   - `day_close.read|manage`
   The existing `permission_action` enum already contains `create`, `read`, `update`, `delete`, and `manage`; no enum change is required. Run the seed functions for the migration backfill, then explicitly grant every active permission to each `Org Owner` role so no owner loses access to an older or newly seeded capability.
4. Make all four system roles immutable in the database—not merely hidden in the UI. Add a trigger that rejects any rename, soft delete, `is_system` change, or `role_permissions` replacement for `is_system = true`. The role editor can create, rename, describe, update permissions for, and soft-delete only `is_system = false` roles. This keeps future seed migrations safe and gives owners a stable baseline from which to build custom roles.
5. Create a non-exposed `private` schema and the following `SECURITY DEFINER`, `STABLE`, `SET search_path = ''` lookup functions: `private.is_active_org_member(p_org_id uuid) returns boolean` and `private.is_active_org_owner(p_org_id uuid) returns boolean`. Each function must constrain the queried membership to `(select auth.uid())`, the passed organization, `removed_at IS NULL`, and—in the owner helper—the active system role named `Org Owner`. Revoke default function access from `PUBLIC`, `anon`, and `authenticated`; grant only the privileges needed for policy evaluation. This follows Supabase’s documented private-schema helper pattern and avoids an exposed privileged RPC.
6. Replace `get_user_organization_id()` with an equivalent function that adds `removed_at IS NULL`, so a soft-removed member no longer retains organization-level RLS access. Drop the foundation policies named `Users can view|insert|update|delete roles in their org`, `Users can view|insert|update|delete permissions in their org`, `Users can view|insert|delete role_permissions in their org`, and `Users can view|insert|update|delete org memberships in their org`. Replace them with these explicit rules:
   - Active members may `SELECT` RBAC rows belonging to an organization where `private.is_active_org_member(organization_id)` is true.
   - Only an active owner may `INSERT`, `UPDATE`, or `DELETE` a `roles` row, and every update policy includes the matching owner `WITH CHECK`.
   - The `permissions` catalog is read-only through the Data API; do not create an authenticated mutation policy for it.
   - Only an active owner may insert or delete `role_permissions`; both the role and permission must belong to that same owner’s organization.
   - Only an active owner may insert, update, or delete `organization_users`, except the organization-creation bootstrap insert described next. Every `UPDATE` policy includes the matching owner `WITH CHECK`.
7. Preserve the legitimate bootstrap in `src/lib/services/organization-service.ts#createOrganization` with one narrow `organization_users` INSERT exception: the new row must have `user_id = auth.uid()`, the organization’s `created_by = auth.uid()`, and the seeded `Org Owner` role from that same organization. No ordinary member can use this exception to elevate an existing membership.
8. Add before-write integrity triggers that reject: a `role_permissions` pair whose role and permission are from different organizations; an `organization_users.role_id` from another organization; a system role mutation; an `Org Owner` role assignment, removal, or demotion after bootstrap; and a custom role soft-delete while active `organization_users` rows still reference it. The last condition is returned as the API’s `409 ROLE_IN_USE` rather than leaving a user with a soft-deleted effective role.
9. Update `public.accept_invite(invite_token text, accepting_user_id uuid)` in the same migration because it is a callable `SECURITY DEFINER` function that writes `organization_users`. Require `accepting_user_id = auth.uid()`, resolve the invite’s optional `role_id` only when it is an active non-owner role in the invite organization, otherwise fail with an explicit error; retain the current fallback to that organization’s active `Mechanic` role when no role was invited. Keep its authenticated execution grant because invite redemption is an intentional authenticated operation, but its authorization must be validated inside the function.

### 2. Add owner-only role, catalog, member, and invite APIs
**Dependency:** implement after the migration and generated types. Reuse `createRouteHandler`, `ok`, `created`, `apiError`, `requirePermission`, and the route test style in `src/app/api/organizations/[id]/invites/route.test.ts`; do not introduce server actions or a service-role bypass for owner operations.

1. Extend `src/app/api/organizations/[id]/roles/route.ts` with `minimumRole: "Org Owner"` on `GET` and `POST`; create `src/app/api/organizations/[id]/roles/[roleId]/route.ts` for `PATCH` and `DELETE`, also owner-only. All mutation endpoints accept/return these shapes:

   ```ts
   interface PermissionRecord {
     id: string;
     name: string; // exact catalog literal, e.g. "reports.read"
     resource: string;
     action: PermissionAction;
     description: string | null;
   }

   interface ManagedRole {
     id: string;
     name: string;
     description: string | null;
     isSystem: boolean;
     memberCount: number;
     permissions: PermissionRecord[];
   }

   interface CreateRoleBody {
     name: string;
     description: string | null;
     permissionIds: string[];
   }
   ```

   `GET /roles` remains an array so `src/lib/queries/use-members.ts#useRoles` stays compatible; enrich each role with `isSystem`, `memberCount`, and its permission records. `POST /roles` creates only custom roles. `PATCH /roles/[roleId]` requires the complete replacement `permissionIds` set, verifies every ID is an active catalog row in `orgId`, and updates the name/description/links in one database transaction or RPC. `DELETE` soft-deletes custom roles only. Return `409` for an active-name collision or role-in-use, `403` for any system role mutation, and `404` for a role outside the current organization.
2. Add `src/app/api/organizations/[id]/permissions/route.ts` as owner-only `GET`, returning the active catalog ordered by resource and action. This is read-only; the role editor uses it to render permissions that no current role has.
3. Keep the existing member-assignment endpoint and client hooks instead of adding an overlapping API: add `minimumRole: "Org Owner"` to `src/app/api/organizations/[id]/users/[userId]/route.ts#PATCH`, keep its `{ fullName?, phone?, roleId?, branchId? }` body, and harden `updateMember` in `src/lib/services/user-service.ts` to reject a role outside `orgId`, inactive role, or `Org Owner` assignment. Add the same owner gate to the role-bearing membership routes `src/app/api/organizations/[id]/users/route.ts` (`POST` and `DELETE`), `src/app/api/organizations/[id]/members/route.ts#POST`, and every verb in `src/app/api/organizations/[id]/invites/route.ts`.
4. In `src/lib/services/invite-service.ts#createInvite`, validate an optional `roleId` against the active, non-owner role in `orgId` before persisting it. This closes the cross-organization role-ID path before `accept_invite` performs its database-side validation.
5. Keep ordinary application authorization permission-based. In `src/lib/supabase/role-guard.ts`, remove the name hierarchy from normal permission decisions: `requirePermission` remains the resource/action source of truth; the only remaining `requireRole` use is owner-only administration. Change `src/lib/queries/use-profile.ts` so non-system role names remain `string | null`, not a narrowed four-name union. Preserve `isOrgOwner` and the existing `isMechanic` UI behavior as explicit system-role affordances; replace `team-switcher.tsx`’s `isAdmin || isManager` branch-switch condition with `hasPermission("branches", "read")`.
6. Update `getCurrentUserProfile` in `src/lib/services/user-service.ts` and `GET /api/profile` to include `permissionNames: string[]`, fetched from the active primary membership’s `role_permissions → permissions` rows, and to filter the membership query by `removed_at IS NULL`. Expose `hasPermission(resource, action)` from `useCurrentUserRole()` as a set lookup over `permissionNames`; invalidate/refetch the profile after the current user’s own role changes. Permissions take effect for every server request immediately and for another member’s sidebar when that member reloads/refetches the profile; do not add a second real-time authorization channel.
7. In `src/app/api/organizations/[id]/reports/route.ts`, delete the duplicate `ROLE_HIERARCHY`, `getRoleInOrg`, and `requireRoleInOrg` implementation and remove the outer `requiredPermission: { resource: "reports", action: "read" }` wrapper. Keep the current safe self-service report type list, rename it to `SELF_SERVICE_REPORT_TYPES`, and authorize it with `hasPermission("work_orders", "read", orgId)` while forcing `mechanicId = user.id`. All other report types require `reports.read`. This preserves a technician’s self-scoped operational metrics while making reports navigation and broader analytics unavailable without `reports.read`.
8. Add route-handler permissions to the currently unguarded sidebar data APIs, using `GET → read`, create `POST → create`, update/close/cash-out `POST|PATCH → update`, `DELETE → delete`, and bulk operations → `manage`:
   - `service-reminders/route.ts`, `[reminderId]/route.ts`, `send-pending/route.ts`, `sync-history/route.ts`, and `service-reminder-logs/route.ts` use the new `service_reminders` resource.
   - `cash-register/route.ts`, `[sessionId]/route.ts`, `[sessionId]/cash-out/route.ts`, `[sessionId]/close/route.ts`, and `sessions/route.ts` use `cash_register`.
   - `day-close/route.ts` uses `day_close.read` for `GET` and `day_close.manage` for `POST`.
   Existing estimate endpoints remain mapped to their already-enforced `work_orders` permissions. This feature does not rewrite every business-table RLS policy; existing business-table RLS remains the tenant-isolation layer while `createRouteHandler` is the enforced application capability boundary.

### 3. Build the owner role-management surface from existing drawer conventions
**Dependency:** implement after the APIs. Extend `src/app/[locale]/dashboard/organization/roles/page.tsx`; do not create another settings route.

1. Add `src/lib/queries/use-roles.ts` because no existing hook models role CRUD or the catalog. Use `createOrgQuery` for `GET /roles` and `GET /permissions`, and `useOrgMutation` for create, update, and delete. Define `roleKeys.list(orgId)` as `["organizations", orgId, "roles"]` and `roleKeys.permissions(orgId)` as `["organizations", orgId, "permissions"]`; every role mutation invalidates both keys and `memberKeys.roles(orgId)` from `use-members.ts`.
2. Replace the fixed icon/color card-only behavior with a role list that shows name, description, system/custom status, member count, and assigned-permission count. System roles render as read-only. Add an **Add role** action for custom roles, an **Edit** action for custom roles, and a Delete confirmation only when `memberCount === 0`.
3. Implement the editor with the same `DetailDrawer` compound structure, `react-hook-form`, `zodResolver`, `Field/*`, external footer submit, and pending-state pattern as `src/app/[locale]/dashboard/organization/members/_edit-member-drawer.tsx`. The schema is exactly: trimmed `name` of 1–60 characters, nullable trimmed `description` of at most 240 characters, and `permissionIds: z.array(z.string().uuid())`; an empty permission set is valid for a custom no-access role. Group catalog items by `resource`, expose a group toggle plus individual action checkboxes, and submit the complete selected ID set.
4. Keep the route owner-only through the existing `/dashboard/organization` middleware. In the existing member invite/edit role selects, show active non-owner roles; custom roles appear automatically through the enriched `GET /roles` response. Add matching role-management, permission-group, empty-state, validation, mutation, and confirmation strings to both `src/messages/en.json` and `src/messages/mn.json` under `organization.roles`.

### 4. Make navigation permission-driven while retaining feature gates
**Dependency:** implement after the profile contains `permissionNames`. Extend `NavItem` and `NavSubItem` in `src/hooks/use-navigation.ts` with `requiredPermission?: { resource: string; action: PermissionAction }`, then filter against `hasPermission` before the existing plan-feature filter. The owner-only organization entry remains an `isOrgOwner` gate. Apply this exact mapping to every current sidebar href:

| Sidebar href | Required access |
| --- | --- |
| `/dashboard` | Always visible safe landing page |
| `/dashboard/bay-view`, `/dashboard/work-orders` | `work_orders.read` |
| `/dashboard/services` | `services.read` |
| `/dashboard/appointments` | `appointments.read` |
| `/dashboard/customers` | `customers.read` |
| `/dashboard/customers/new`, `/dashboard/customers/import` | `customers.create` |
| `/dashboard/service-reminders` | `service_reminders.read` |
| `/dashboard/inventory` and all current inventory subitems | `inventory.read` |
| `/dashboard/finance` | `invoices.read` |
| `/dashboard/reports`, `/dashboard/reports/tax` | `reports.read` |
| `/dashboard/expenses` | `expenses.read` |
| `/dashboard/expenses/new` | `expenses.create` |
| `/dashboard/expenses/categories` | `expense_categories.read` |
| `/dashboard/estimates` | `work_orders.read` |
| `/dashboard/estimates/new` | `work_orders.create` |
| `/dashboard/cash-register`, `/dashboard/cash-register/history` | `cash_register.read` |
| `/dashboard/eod-close` | `day_close.read` |
| `/dashboard/payroll` | `payroll.read` |
| `/dashboard/organization` | Active system `Org Owner` only |
| `/dashboard/settings` | `settings.read` |

Remove parent items whose own requirement is missing, remove nested subitems whose requirement is missing, then remove empty groups. Rebuild `filteredSections`, `filteredAllItems`, active-item resolution, and command/search flattening from this already filtered tree so a hidden item cannot remain searchable or highlighted. Apply the existing feature gates **in addition to** permission gates, never instead of them. Keep the technician’s Bay View/dashboard redirect tied only to the immutable `Mechanic` system role; custom roles use the permission-filtered standard navigation.

## Critical files & anchors
- `supabase/migrations/00001_phase0_foundation.sql` — canonical RBAC tables and the permissive policies being replaced.
- `supabase/migrations/20260705000001_add_refunds_permissions.sql` — latest effective seed functions that must be repaired and extended rather than copied from an older migration.
- `src/lib/supabase/role-guard.ts` — current hierarchy defect and reusable `requirePermission`/`hasPermission` guard.
- `src/app/api/organizations/[id]/roles/route.ts` — existing GET-only contract that becomes the owner-only role-management API.
- `src/hooks/use-navigation.ts` — every sidebar/menu, nested child, search, and active-item visibility path.

## Verification
1. **Migration and types:** In `apps/tolom`, start the local stack, run `supabase migration new secure_organization_rbac`, apply the completed migration locally, then run `pnpm update-types`. The generated `src/lib/database.types.ts` must match the final schema; `supabase migration list --local` must show the new migration exactly once.
2. **Database authorization:** Create `supabase/tests/role-management.test.sql` using pgTAP. It must seed two organizations, an owner, a non-owner, a soft-removed member, and an active custom role; execute under the relevant authenticated JWT subjects; and assert all of these outcomes: non-owner writes to `roles`, `role_permissions`, and another member’s `role_id` fail; a role ID from Organization B cannot be assigned in Organization A; a system role cannot be mutated; an assigned custom role cannot be soft-deleted; a removed member cannot select Organization A RBAC rows; owner bootstrap is allowed only for the organization creator; and `accept_invite` rejects an `accepting_user_id` other than `auth.uid()`. Run `supabase test db supabase/tests/role-management.test.sql` with the local stack running; all pgTAP assertions must pass.
3. **API and hooks:** Add colocated Vitest coverage for `roles/route.ts`, `roles/[roleId]/route.ts`, `permissions/route.ts`, `role-guard.ts`, `user-service.ts`, and the reports route. Prove an owner can create a custom role with no `reports.read`; duplicate/cross-org/inactive IDs and system-role mutations return the specified failures; `requirePermission("reports", "read")` rejects that custom role; `SELF_SERVICE_REPORT_TYPES` allow only self-scoped work-order readers; and a custom role name is preserved by `useCurrentUserRole` rather than converted to `null`. Run the focused paths with `pnpm vitest run <exact added paths>`.
4. **UI behavior:** Extend `e2e/organization.spec.ts` using the established `mockSupabaseREST`, `mockProfile`, `mockOrganizationDetail`, and `mockCrudMutations` helpers. Exercise an owner creating a custom role, choosing permissions, editing it, and deleting an unassigned role. In a second mocked profile whose `permissionNames` omit `reports.read`, assert the Reports sidebar item and search entry are absent and that the role name renders as the custom name. Keep route/API authorization assertions in Vitest; do not claim a route mock proves server authorization.
5. **Project checks:** From `apps/tolom`, run `pnpm validate:types`, `pnpm validate:lint`, `pnpm i18n:check`, the focused Vitest command, `supabase test db supabase/tests/role-management.test.sql`, and `pnpm exec playwright test e2e/organization.spec.ts`. All must exit zero. Finally run `supabase db advisors` (or the connected Supabase security advisor when the installed CLI lacks that subcommand) and resolve every new RLS or privileged-function warning before shipping.

## Assumptions & contingencies
- `Autogovner` maps to Tolom’s seeded `Org Owner` role. Ownership transfer is intentionally excluded: only the organization creator receives `Org Owner` at bootstrap, and all later role-assignment paths reject that role. A future transfer feature must be an explicit, separately authorized flow—not a relaxation of member-role updates.
- Custom roles are fully editable combinations of a fixed permission catalog; all system roles are immutable templates. This permits organization-specific roles without allowing an owner to accidentally corrupt the seed contract or future default-role migrations.
- Permission enforcement is introduced at the existing API gateway (`createRouteHandler`) for the role-managed sidebar products. The migration hardens RBAC and membership tables directly; it does not broaden this feature into a rewrite of every business-table RLS policy, whose current responsibility is organization isolation.
- Zer is used only for its grouped permission-editor ergonomics and database-integrity lessons. Its client-only system-role constraints, cross-organization role-ID gaps, invalid `OLD`-referencing RLS policies, and feature-flag-only sidebar filtering are not carried into Tolom.
