# Tolom i18n Improvement Plan

**Created:** 2026-07-11
**Status:** Awaiting prioritization

---

## Current State

| Metric | Value |
|--------|-------|
| Library | next-intl@4.13.1 (latest stable) |
| Locales | `mn` (default), `en` |
| Namespaces | 49 |
| Leaf keys | 3,964 |
| `useTranslations()` without namespace | 666 calls / 255 files |
| `useTranslations()` with namespace | 331 calls / 200 files |
| ICU plural usage | 5 keys |
| Keys needing ICU plural conversion | 52 keys |
| Message file size | ~4,143 lines per locale |

---

## Completed

- [x] Enable type-safe messages (`createMessagesDeclaration` + `AppConfig` augmentation)
- [x] Remove type-cast hacks (`as (key: string) => string`) — 10 occurrences
- [x] Add `common.statusLabels` for work order statuses (MN + EN)
- [x] Rewrite `StatusBadge` to use `useTranslations()` instead of hardcoded English
- [x] Update StatusBadge tests to use `renderWithProviders` + i18n wrapper

---

## Phase 1: Namespace All `useTranslations()` Calls

**Effort:** Medium (~255 files)
**Impact:** High — makes translation scoping clear

Every `useTranslations()` call without a namespace searches the entire 3,964-key dictionary. Adding namespaces makes it clear which keys belong to which feature.

### What to do
- Find every `useTranslations()` call without a namespace argument
- Determine which namespace the keys belong to (grep for the key in `en.json`)
- Add the namespace: `useTranslations()` → `useTranslations("bayView")`

### Example
```tsx
// Before: unclear where keys come from
const t = useTranslations();
t("statusNew");

// After: scoped to namespace
const t = useTranslations("bayView");
t("statusNew");
```

### Tracking
- [ ] Run `grep -rn "useTranslations()" src --include='*.tsx' --include='*.ts'` to get the full list
- [ ] Process file by file, adding appropriate namespace
- [ ] Verify with `pnpm run validate` (lint + type-check)
- [ ] Run `npx vitest run` to catch regressions

---

## Phase 2: Split Monolithic Message Files into Per-Namespace Files

**Effort:** High (all message files + i18n/request.ts + all imports)
**Impact:** High — cleaner diffs, per-feature editing, lazy loading potential

### Target structure
```
src/messages/
├── en/
│   ├── _index.ts          # re-exports all namespaces
│   ├── app.json
│   ├── auth.json
│   ├── bayView.json       # largest: ~720 keys
│   ├── common.json        # ~250 keys
│   ├── customers.json
│   ├── dashboard.json
│   ├── finance.json
│   ├── home.json
│   ├── inventory.json     # ~500 keys
│   ├── mechanic.json
│   ├── mechanicPerformance.json
│   ├── nav.json
│   ├── organization.json
│   ├── pricing.json
│   ├── reports.json
│   ├── services.json      # ~298 keys
│   ├── settings.json      # ~564 keys
│   ├── vehicles.json
│   ├── workOrderDetail.json
│   ├── workOrders.json
│   ├── workOrderWizard.json
│   └── ... (49 files total)
├── mn/
│   ├── _index.ts
│   ├── app.json
│   ├── auth.json
│   └── ... (mirrors en/)
```

### What to do
1. For each namespace in `en.json`, extract to `en/{namespace}.json`
2. Do the same for `mn.json`
3. Create `en/_index.ts` that imports and merges all namespaces
4. Update `src/lib/i18n/request.ts` to load from `_index.ts`
5. Verify all `useTranslations("namespace")` calls still resolve
6. Run full test suite

### `_index.ts` pattern
```ts
import app from "./app.json";
import auth from "./auth.json";
import bayView from "./bayView.json";
import common from "./common.json";
// ... all namespaces

const messages = { app, auth, bayView, common, ... };
export default messages;
```

---

## Phase 3: Convert `{count}` Interpolation to ICU Plural Forms

**Effort:** Small (~52 keys, ~1 hour)
**Impact:** Medium — correct Mongolian grammar

52 keys use simple `{count} pending` instead of proper ICU plural syntax. Mongolian has a 2-form plural system (`one` + `other`), same as English.

### Keys to convert (sample)
```json
// Before (wrong grammar for plural counts):
"pendingCount": "{count} хүлээгдэж байна"

// After (proper ICU plural):
"pendingCount": "{count, plural, one {# хүлээгдэж байна} other {# хүлээгдэж байна}}"
```

### Key list
- `common.pendingCount`
- `mechanic.jobCount`
- `bayView.moreInQueue`
- `bayView.batchComplete`
- `bayView.batchCompleteConfirmDesc`
- `bayView.batchCompleteSuccess`
- `bayView.activeJobsCount`
- `inventory.variantCount`
- `inventory.thresholdSet`
- `inventory.partsNoThreshold`
- `services.serviceCount`
- ... and 41 more (run `grep -n '{count}' src/messages/en.json` for full list)

---

## Phase 4: Translation Completeness Script

**Effort:** Small (~30 minutes)
**Impact:** High — visibility into what's done and what's missing

Create `scripts/i18n/completeness.mjs` that reports:
- Keys in `en.json` but missing in `mn.json`
- Keys in `mn.json` but missing in `en.json`
- Keys where both locales have identical values (likely untranslated)
- Completion percentage per namespace
- Overall completion percentage

### Usage
```bash
pnpm i18n:completeness
```

### Output (example)
```
Translation Completeness Report
================================

Overall: 98.2% (3,892 / 3,964 keys translated)

By Namespace:
  bayView          99.4% (716/720)
  common           97.2% (243/250)
  inventory        100.0% (500/500)
  settings         98.6% (556/564)
  ...

Missing translations (mn.json):
  bayView.queueEmpty (line 45)
  bayView.noBays (line 89)
  ...

Identical values (possibly untranslated):
  common.error: "Error" / "Error" (line 147)
  home.heroSubtitle: "..." / "..." (line 234)
  ...
```

---

## Phase 5: Key Ordering Alignment

**Effort:** Small (automated)
**Impact:** Low — cleaner diffs

Both `en.json` and `mn.json` have the same keys but in different order. Sorting both identically makes manual edits and git diffs much cleaner.

### What to do
- [ ] Create a script that sorts both JSON files by key (canonical order)
- [ ] Run once and commit
- [ ] Add to CI: fail if keys are out of order

---

## Dependencies Between Phases

```
Phase 1 (namespace calls)
  ↓
Phase 2 (split files) — requires Phase 1 to be complete
  ↓
Phase 4 (completeness script) — easier after split
Phase 3 (ICU plurals) — independent, can do anytime
Phase 5 (key ordering) — independent, can do anytime
```

---

## Quick Wins (can do right now)

| Task | Time | Impact |
|------|------|--------|
| ICU plurals for 52 keys | ~1 hour | Correct grammar |
| Translation completeness script | ~30 min | Visibility |
| Key ordering alignment | ~5 min (automated) | Cleaner diffs |

## Big Wins (need planning)

| Task | Time | Impact |
|------|------|--------|
| Namespace all 666 calls | ~half day | Clear scoping |
| Split 49 namespaces into files | ~half day | Better workflow |
