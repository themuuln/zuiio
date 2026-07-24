# Onoo Remaining Phases — Parallel Implementation

## Migration already applied to local DB (20260722180000_all_remaining_phases)

## Group A: Phase 9 Team Operations (staff, availability, training, dues, opponent)
Files (no overlap with other groups):
- src/app/admin/api/teams/staff/route.ts (new)
- src/app/admin/api/teams/availability/route.ts (new)
- src/app/admin/api/teams/training/route.ts (new)
- src/app/admin/api/teams/transactions/route.ts (new)
- src/app/admin/api/teams/opponent-notes/route.ts (new)
- src/app/admin/teams/ - create staff/, availability/, training/, transactions/, opponent-notes/ each with page.tsx
- src/test/team-ops.integration.test.ts (new - integration tests)
- Create local types file _lib/api-team-ops.ts

Each API route follows the pattern: admin-route.ts withAuth pattern. Each admin page uses: "use client", react-hook-form + zod + TanStack Query + shadcn Table/Dialog/Form. Each uses AdminPageLayout.

Integration tests use: asUser + newPool + pg. Test the tables (team_staff, roster_availability, training_sessions, team_transactions, opponent_notes) with schema checks, CRUD, RLS enforcement.

## Group B: Phase 10b Enrollment + Attendance + Consent
Files (no overlap):
- src/app/admin/api/academy/enrollments/route.ts (new)
- src/app/admin/api/academy/attendance/route.ts (new)
- src/app/admin/api/academy/consent/route.ts (new - for consent templates)
- src/app/admin/academy/enrollments/page.tsx (new)
- src/app/admin/academy/attendance/page.tsx (new)
- src/app/admin/academy/consent/page.tsx (new)
- src/test/enrollment-attendance.integration.test.ts (new)
- Create local types file _lib/api-academy-ext.ts

Tables: academy_enrollments, academy_attendance, academy_consent_templates, academy_consent_records + existing academy_students.

Enrollment uses cmd_create_enrollment / cmd_update_enrollment rpc. Attendance uses cmd_record_attendance rpc. Consent uses direct insert/select (no cmd needed since RLS is wide open for authenticated).

Part of this group: also create admin/academy/students/csv/route.ts for CSV import/export (T-10b.5).

## Group C: Phase 10c+10d+11 Advanced Ops (payments ledger, waitlists, announcements)
Files (no overlap):
- src/app/admin/api/academy/payments/route.ts (new - for payment ledger not QPay)
- src/app/admin/api/academy/waitlists/route.ts (new)
- src/app/admin/api/academy/announcements/route.ts (new)
- src/app/admin/academy/payments-ledger/page.tsx (new)
- src/app/admin/academy/waitlists/page.tsx (new)
- src/app/admin/academy/announcements/page.tsx (new)
- src/test/payments-waitlists.integration.test.ts (new)
- Create local types file _lib/api-advanced.ts

Tables: academy_payment_ledger, academy_waitlists, academy_announcements.
Use cmd_record_payment, cmd_confirm_payment, cmd_join_waitlist, cmd_create_announcement.

## Group D: Phase 3 Stragglers (player comparison, search)
Files (no overlap):
- src/app/players/compare/ (new - player comparison page) - upgrade T-3.6
- src/app/search/ (new - search & browse page) - T-3.8
- These are frontend-only pages that read from existing v_public_* views
- Player comparison: compare two players stat-by-stat using existing data helpers
- Search: search players, teams, games using existing Supabase queries

## For ALL groups - CRITICAL:
1. Create route.ts files using the pattern from existing routes (e.g., academy/locations/route.ts)
2. Create page.tsx files using the pattern from existing admin pages (e.g., academy/locations/page.tsx)
3. Write integration tests using the pattern from academy.integration.test.ts
4. **DO NOT** touch api.ts or admin-sidebar.tsx - those will be merged by the coordinator
5. **DO NOT** run pnpm commands - just write the files
6. Use Mongolian labels for everything (UI text, table headers, form labels)
7. Tables created in the mega migration are already in the DB - reference exact column names
8. Each API route MUST start with withAuth + getUser() check matching existing patterns
9. Each admin page MUST use AdminPageLayout from @/components/admin/page-layout
10. Tests MUST use asUser + newPool from src/test/setup-integration.ts + seed-constants.ts
11. For the seed constants - academy_profiles uses test org (SEED_ORG_ID = b0000000-0000-0000-0000-000000000001)
