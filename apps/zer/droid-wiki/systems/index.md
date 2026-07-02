# Systems

Active contributors: themuuln

## Purpose

The Systems lens describes cross-cutting infrastructure in Zer — the foundational layers that every feature depends on. These are not business-domain concepts (products, sales, contacts) but rather the architectural backbone: authentication, authorization, multi-branch isolation, and real-time data synchronization.

Understanding these systems is essential for:

- Debugging permission issues or RLS policy violations
- Adding new features that need branch isolation
- Setting up real-time subscriptions for live dashboards
- Tracing how a user's identity propagates through the stack

## Pages

| Page | Description |
|------|-------------|
| [Authentication](./authentication) | Login, registration, password reset, Supabase SSR client setup, proxy middleware for session refresh |
| [Authorization](./authorization) | Permission system via `app_permission` enum, role-based access control, RLS policies with `has_permission()`, `get_current_organization()`, and `user_has_branch_access()` |
| [Multi-Branch](./multi-branch) | Branch isolation model, `withBranchFilter()` helper, `BranchContext` provider in the sidebar, branch-scoped users vs org-wide, 1:1 warehouse linking |
| [Real-Time](./real-time) | Supabase Realtime subscriptions for live data updates, current use in dashboard and shop |

## How to Use

Each system page covers:

1. **Purpose** — Why the system exists and what problem it solves
2. **Key abstractions** — The main types, functions, and database objects involved
3. **How it works** — Walk-through of the architecture and data flow
4. **Key source files** — Links to the relevant code files

## Key Source Files

| File | System |
|------|--------|
| `src/lib/supabase/server.ts` | Authentication |
| `src/lib/supabase/proxy.ts` | Authentication |
| `src/lib/erp.ts` | Authorization |
| `src/lib/permissions.ts` | Authorization |
| `src/lib/action-utils.ts` | Authorization |
| `supabase/migrations/20260616000006_create_roles_and_permissions.sql` | Authorization |
| `src/lib/branches.ts` | Multi-Branch |
| `src/lib/branch-context.tsx` | Multi-Branch |
| `supabase/migrations/20260618133041_add_branches.sql` | Multi-Branch |
| `src/lib/query/realtime-subscriptions.tsx` | Real-Time |
| `src/lib/query/hooks/use-realtime-subscriptions.ts` | Real-Time |
