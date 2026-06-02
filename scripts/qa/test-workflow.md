# TOLOM QA Testing Workflow

> **Last updated**: 2026-06-02
> **Based on**: Production QA session covering Dashboard, Reports, EOD, and all report API endpoints.

---

## Quick Reference

```bash
# Fast pre-commit validation (type check + lint + API smoke test)
bash scripts/qa/api-smoke-test.sh

# Fast validation without building (reuse running server)
bash scripts/qa/api-smoke-test.sh --skip-build

# Run with an existing session cookie (skip auth)
COOKIE="sb-xxx=yyy" bash scripts/qa/api-smoke-test.sh --api-only

# Standard pre-commit checks
npm run validate && npm run test
```

---

## Critical Learnings from QA Session

### 1. 🔴 The Branch Filter Bug (Silent Data Killer)

**Symptom**: Dashboard, Reports pages all show zero data (`₮0`, "No activity this period") even though API returns data with `branch=all`.

**Root cause**: When an org has exactly 1 branch, the component auto-selects it:
```tsx
// src/app/[locale]/dashboard/page.tsx (FIXED)
if (branches.length === 1) {
  setSelectedBranchId(branches[0].id); // ← This kills all data
}
```
All work orders have `branch_id: null`, so filtering by `branch_id=eq.{UUID}` matches nothing.

**Fixed**: Removed the auto-select. Branch stays at `"all"` (null filter) by default.

**How to detect**: Run the smoke test — it cross-checks `branch=all` vs `branch={UUID}`:
```bash
bash scripts/qa/api-smoke-test.sh --skip-build
```

### 2. 🟡 Fuse.js v7 API Deprecation

The `tokenize` option was removed in Fuse.js v7. Use `useTokenSearch` instead:

```tsx
// ❌ OLD (build error)
...(prefix ? { tokenize: true, matchAllTokens: true } : {})

// ✅ NEW (Fuse.js v7+)
...(prefix ? { useTokenSearch: true } : {})
```

**Detected by**: `npx validate:types` / `tsc --noEmit` fails.

### 3. 🟡 Translation Key Double-Namespacing

The Reports page EOD view had `t("reports.totalRevenueLabel")` but `t` is already scoped to the `reports` namespace via `useTranslations("reports")`. The correct key is `t("totalRevenueLabel")`.

**Affected component**: `EodView` in `src/app/[locale]/dashboard/reports/page.tsx`

**How to detect**: Switch to the EOD Summary tab and check for raw keys like `reports.reports.totalRevenueLabel` in the UI.

### 4. 🟡 Missing Translation Keys

The `serviceMix` key existed in `mn.json` but not `en.json`, causing `dashboard.serviceMix` to appear as raw text in English mode.

**How to detect**: Run the app in English locale and scan for raw key names in the UI.

---

## Testing Architecture

```
┌──────────────────────┐
│    Pre-commit        │  npm run validate (types + lint)
│    (~30s)            │  npm run test (unit tests)
├──────────────────────┤
│    API Smoke Test    │  bash scripts/qa/api-smoke-test.sh
│    (~3 min)          │  - Builds production app
│                      │  - Starts server
│                      │  - Tests all report endpoints
│                      │  - Cross-checks branch filter
├──────────────────────┤
│    E2E Tests         │  npm run test:e2e
│    (~5 min)          │  - Playwright browser tests
│                      │  - Auth flow, CRUD, navigation
├──────────────────────┤
│    UAT Suite         │  python scripts/uat-e2e-tests.py
│    (~10 min)         │  - Full Playwright UAT
│                      │  - Screenshots all pages
│                      │  - Verifies CRUD operations
└──────────────────────┘
```

---

## What Can Be Optimized

### Build & Serve Cycle

| Bottleneck | Current | Optimized |
|-----------|---------|-----------|
| Full build | ~3 min | `npm run validate` (~30s) for type checking |
| Server start | ~4s after build | Reuse server with `--skip-build` |
| Cold start (dev) | 8-9s per first request | Use production build (`npm run build && npm start`) |

**Optimization**: The API smoke test auto-builds once, then runs all tests. For rapid iteration:

```bash
# Start a persistent server once
npm run build && PORT=3001 npm run start

# Then re-run smoke tests quickly
COOKIE="sb-xxx=yyy" bash scripts/qa/api-smoke-test.sh --api-only
```

### Pre-existing Unit Test Failures

4 test files consistently fail (unrelated to app code — environment setup issues):

| File | Tests failing | Root cause |
|------|--------------|------------|
| `src/components/search-input.test.tsx` | 15/15 | Missing `next-intl` provider in test render |
| `src/lib/services/work-order-service.test.ts` | 1 | Mock setup |
| `src/lib/services/customer-service.test.ts` | 1 | Mock setup |
| `src/lib/hooks/use-clock-in-out.test.ts` | 2 | Mock setup |

**Fix**: Add `next-intl` test utilities and fix mock setup in test files.

### Seed Data Quality

All work orders have `branch_id: null` — the auto-assign logic during WO creation doesn't set the org's main branch. Fix in the work order service:

```ts
// src/lib/services/work-order-service.ts — when creating a WO
if (!branch_id) {
  // Auto-assign the org's main branch
  const { data: mainBranch } = await supabase
    .from("branches")
    .select("id")
    .eq("organization_id", organization_id)
    .eq("is_main", true)
    .single();
  if (mainBranch) branch_id = mainBranch.id;
}
```

---

## Improvement Roadmap

### Short-term (this sprint)

1. **Fix pre-existing test mocks** — SearchInput, work-order, customer tests
2. **Add branch auto-assign** — Work order creation should set `branch_id` to org's main branch
3. **Expand smoke test** — Cover edge cases (empty org, no mechanics, custom date ranges)

### Medium-term (next sprint)

4. **E2E for Reports** — Playwright tests that verify:
   - All report tabs render with data
   - Branch filter changes update KPIs
   - EOD Summary shows correct mechanic breakdown
   - P&L matches dashboard totals
5. **Visual regression tests** — Screenshot comparison for charts and KPI layouts
6. **Performance budget** — Dashboard API response < 500ms, full page render < 2s

### Long-term

7. **CI pipeline integration** — Add API smoke test to GitHub Actions (needs Supabase connection)
8. **Data quality monitors** — Periodic checks for data consistency (revenue totals match across reports)
9. **Test data factory** — Scriptable seed data generator for reproducible QA scenarios

---

## Common Issues & Quick Fixes

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Dashboard shows all zeros | Branch filter bug | Rebuild with the fix (`npm run build`) |
| Raw translation keys in UI | Missing key in `en.json` or `mn.json` | Add the key to both files |
| `serviceMix` shows as key | Missing `en.json` entry | Added in this session |
| EOD shows `reports.reports.*` | Double-namespaced translation key in `EodView` | Remove the `reports.` prefix |
| Build fails on `tokenize` | Fuse.js v7 deprecated API | Replace with `useTokenSearch` |
| Slow first request (dev mode) | Turbopack lazy compilation | Use `npm run build && npm start` instead |
