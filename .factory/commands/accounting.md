---
description: Double-entry accounting: chart of accounts, journal entries, trial balance, auto-posting
argument-hint: what to do (e.g. "add P&L report", "fix journal entry RLS", "wire auto-posting for returns")
---

# Accounting — Нягтлан бодох бүртгэл

The accounting module is at `/accounting` with 3 tabs: Trial Balance, Journal Entries, Chart of Accounts.

## Key conventions

- All forms use `react-hook-form` + `zod` validation
- All create/edit/detail views use `SlideInDrawer` from `@/components/ui/slide-in-drawer`
- Error messages are in Mongolian
- Form pattern: `useForm({ resolver: zodResolver(schema) })` + `handleSubmit(onSubmit)` — never `action={...}`

## File structure

```
src/app/(dashboard)/accounting/
├── page.tsx              ← Server component (fetches data)
├── accounting-content.tsx ← Client (tabs + drawers)
├── actions.ts            ← Server actions (CRUD + toggleAccountActive)
├── new/page.tsx          ← redirect(/accounting?create=true)

src/components/accounting/
├── account-create-drawer.tsx
├── journal-entry-create-drawer.tsx
├── journal-entry-detail-drawer.tsx    ← detail + edit/delete buttons
├── journal-entry-edit-drawer.tsx

src/lib/accounting.ts     ← Auto-posting helpers
```

## DB schema

- `chart_of_accounts`: id, organization_id, code (unique per org), name, type (asset/liability/equity/income/expense), parent_id, is_active
- `journal_entries`: id, organization_id, entry_date, entry_number (JE-YYYYMMDD-NNNN), reference_type, reference_id, description, created_by
- `journal_entry_lines`: id, journal_entry_id (CASCADE), account_id (RESTRICT), debit_amount, credit_amount (chk: at least one > 0)
- RPCs: `generate_journal_entry_number()`, `get_trial_balance(p_organization_id)`, `seed_default_chart_of_accounts(p_organization_id)`

## RLS policies

All accounting tables need full CRUD (SELECT/INSERT/UPDATE/DELETE) policies checking:
- `organization_id = get_current_organization()`
- `has_permission('accounting.manage'::app_permission)`

For `journal_entry_lines`, org check is via subquery on parent `journal_entries`.

## Auto-posting (wired calls — fire-and-forget after main transaction)

| Source | Function | File |
|--------|----------|------|
| Sale | `postSaleToJournal` | `sales/new/actions.ts` |
| Expense | `postExpenseToJournal` | `expenses/new/actions.ts` |
| Purchase order | `postPurchaseToJournal` | `purchases/actions.ts` |

Each function looks up accounts by hardcoded codes (1200, 1300, 4100, 5100, etc.). If accounts are missing, auto-posting silently fails with `{ success: false }`.

## What's implemented

- Chart of accounts: create, list, inline toggle active
- Journal entries: create (with line items), detail drawer, edit (with line items), delete
- Trial balance: read-only table
- URL-driven drawer: `/accounting?create=true`

## What's NOT implemented (if asked)

- P&L / Balance Sheet reports (only trial balance exists)
- Account edit drawer (only toggle active + create)
- Auto-posting error surfacing (fire-and-forget, errors log silently)

## Gotchas

1. Missing RLS policies — if you get 401 on journal entry edits, check `pg_policies` for UPDATE/DELETE policies
2. Account codes are hardcoded in `src/lib/accounting.ts` — if org doesn't have them, auto-posting silently fails
3. `journal_entry_lines` has ON DELETE RESTRICT on account_id, CASCADE on journal_entry_id
4. No generated TS types yet — code uses `as any` casts
5. All accounting E2E tests in `e2e/accounting.spec.ts` (ACC-NNN format, run with `npm run test:e2e`)
