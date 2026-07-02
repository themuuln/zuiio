# Permissions Suite — Process Overview

## Goal
Build a comprehensive permissions, RBAC, and feature management system for TOLOM — from DB fixes through API, UI, and RLS.

## Phases (9 total)

| # | Phase | What it delivers |
|---|-------|-----------------|
| 0 | Fix permission_action enum + backfill | Add `write`/`invite` to enum, backfill all existing orgs with latest permission sets |
| 1 | PLAN_FEATURES mapping | `src/lib/plan-features.ts` — defines which features each plan tier unlocks |
| 2 | Feature flags API + sidebar gating | API endpoints for `feature_flags`, `useAvailableFeatures()` hook, sidebar filters by plan+flags+role |
| 3 | Role/Permission CRUD APIs | POST/PATCH/DELETE roles, GET/PUT role-permissions, GET all permissions |
| 4 | Permission matrix UI | Visual grid (resource×action) with toggles, create/edit/delete roles |
| 5 | RLS policy fixes | Minimum-role gates on `roles`, `permissions`, `role_permissions`, `organization_settings`, `feature_flags` |
| 6 | Permission gating on API routes | Add `requiredPermission`/`minimumRole` to all currently unguarded API routes |
| 7 | Feature toggle UI for org owners | Settings section with switches per feature, locked features show upgrade link |
| 8 | Quality gate | build + lint + test — green across the board |

## Process flow

```
Phase 0 (DB fix) → Phase 1 (plan map) → Phase 2 (flags + sidebar)
  → Phase 3 (CRUD APIs) → Phase 4 (matrix UI) → Phase 5 (RLS)
  → Phase 6 (API gating) → Phase 7 (toggle UI) → Phase 8 (verify)
```

Each phase includes: implementation → build verification → type regeneration.
