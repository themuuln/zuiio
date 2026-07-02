---
name: accounting
version: 1.0.0
description: >
  Double-entry accounting subsystem for this ERP: chart of accounts, journal
  entries with debit/credit line items, trial balance, and auto-posting from
  sales/expenses/purchases. Use when implementing or modifying accounting
  features, fixing RLS issues, adding journal entry flows, or debugging
  auto-posting. Not relevant for non-accounting features (products, contacts,
  inventory, etc.).
---

# Accounting — Implementation Guide

## Architecture Overview

```
DB: chart_of_accounts → journal_entries → journal_entry_lines
UI: /accounting (3 tabs: trial-balance, journal-entries, chart-of-accounts)
Auto-posting: sales/new/actions.ts → postSaleToJournal
              expenses/new/actions.ts → postExpenseToJournal
              purchases/actions.ts → postPurchaseToJournal
```

The accounting module is at `/accounting` with three tabs:

1. **Trial Balance** (`get_trial_balance` RPC) — default tab
2. **Journal Entries** — list with detail/edit/delete drawers
3. **Chart of Accounts** — list with create drawer, inline toggle active

---

## DB Schema

All tables live in `public` schema with RLS enforced.

### chart_of_accounts

| Column          | Type    | Notes                                 |
| --------------- | ------- | ------------------------------------- |
| id              | UUID    | PK, gen_random_uuid()                 |
| organization_id | UUID    | FK → organizations                    |
| code            | TEXT    | Unique per org, e.g. "1100"           |
| name            | TEXT    | Mongolian account name                |
| type            | TEXT    | asset/liability/equity/income/expense |
| parent_id       | UUID    | FK → self (parent account)            |
| is_active       | BOOLEAN | Default true                          |

### journal_entries

| Column          | Type | Notes                                          |
| --------------- | ---- | ---------------------------------------------- |
| id              | UUID | PK                                             |
| organization_id | UUID | FK → organizations                             |
| entry_date      | DATE |                                                |
| entry_number    | TEXT | Auto-generated: `JE-YYYYMMDD-NNNN`             |
| reference_type  | TEXT | nullable — "sale", "expense", "purchase_order" |
| reference_id    | UUID | nullable — FK to the source document           |
| description     | TEXT |                                                |
| created_by      | UUID | FK → profiles                                  |

### journal_entry_lines

| Column                      | Type          | Notes                                    |
| --------------------------- | ------------- | ---------------------------------------- |
| id                          | UUID          | PK                                       |
| journal_entry_id            | UUID          | FK → journal_entries (CASCADE delete)    |
| account_id                  | UUID          | FK → chart_of_accounts (RESTRICT delete) |
| debit_amount                | NUMERIC(12,2) | >= 0                                     |
| credit_amount               | NUMERIC(12,2) | >= 0                                     |
| CONSTRAINT chk_at_least_one |               | debit > 0 OR credit > 0                  |

### Sequences

- `journal_entry_number_seq` — for JE number generation
- RPC: `generate_journal_entry_number()` returns `JE-YYYYMMDD-NNNN`

---

## RLS Policies

All 3 accounting tables MUST have full CRUD policies:

| Table               | SELECT | INSERT | UPDATE | DELETE |
| ------------------- | ------ | ------ | ------ | ------ |
| chart_of_accounts   | ✅     | ✅     | ✅     | ✅     |
| journal_entries     | ✅     | ✅     | ✅     | ✅     |
| journal_entry_lines | ✅     | ✅     | ✅     | ✅     |

All policies check:

- `organization_id = get_current_organization()`
- `has_permission('accounting.manage'::app_permission)`

For journal_entry_lines, the org check is via subquery on the parent journal_entry.

## Migration RLS gotcha

When adding new policies in a migration, DO NOT use `IF NOT EXISTS` on CREATE POLICY — it's not supported in PostgreSQL. Instead, the migration can safely re-run using `DROP POLICY IF EXISTS` first if idempotency is needed.

---

## File Structure

```
src/app/(dashboard)/accounting/
├── page.tsx                    ← Server component (fetches data)
├── accounting-content.tsx      ← Client component (tabs, drawers)
├── actions.ts                  ← Server actions (CRUD)
├── loading.tsx
├── new/page.tsx                ← Redirect to /accounting?create=true

src/components/accounting/
├── account-create-drawer.tsx
├── journal-entry-create-drawer.tsx
├── journal-entry-detail-drawer.tsx
├── journal-entry-edit-drawer.tsx

src/lib/accounting.ts           ← Auto-posting helpers
```

---

## UI Patterns

### Drawers (NOT full pages)

All create/edit/detail views use `SlideInDrawer` from `@/components/ui/slide-in-drawer`.

```tsx
<SlideInDrawer
  open={open}
  onOpenChange={setOpen}
  title="Шинэ журналын бичилт"
  description="..."
  panelWidth="36rem"   // default is 28rem, use 36rem for journal entries
  trigger={<button ...>Шинэ бичилт</button>}
>
  {/* form content */}
</SlideInDrawer>
```

### Form pattern

Use react-hook-form + zod (see AGENTS.md for the full pattern).

For journal entries specifically, use `useFieldArray` for dynamic line items:

```tsx
const { fields, append, remove } = useFieldArray({
  control,
  name: "lines",
});

// Each line: account_id (Select), debit_amount (Input number), credit_amount (Input number)
// Show running totals: totalDebits, totalCredits, isBalanced flag
```

### Detail drawer → Edit drawer flow

The detail drawer has a "Засах" button that opens the edit drawer. The edit drawer is a sibling component, NOT nested inside the detail drawer:

```tsx
// In detail drawer component:
<>
  <SlideInDrawer ...> // detail view
    <button onClick={() => setEditOpen(true)}>Засах</button>
  </SlideInDrawer>
  <JournalEntryEditDrawer ... /> // edit drawer — separate, not nested
</>
```

### Toggle active inline

The chart of accounts table uses the Badge as a toggle button:

```tsx
<button onClick={async () => {
  await toggleAccountActive(account.id, !account.is_active);
}}>
  <Badge ...>{account.is_active ? "Идэвхтэй" : "Идэвхгүй"}</Badge>
</button>
```

---

## Auto-Posting Patterns

Each auto-posting function in `src/lib/accounting.ts`:

1. Looks up chart of accounts by hardcoded codes (e.g., "1200" for bank)
2. Generates a journal entry number
3. Builds debit/credit line items
4. Inserts journal_entry + lines
5. Logs audit event

If required accounts are missing, it returns `{ success: false, error: "..." }` silently — the sale/expense/purchase still succeeds.

### Wired calls (all fire-and-forget, after main transaction succeeds):

| Action file               | Function called         | When                                   |
| ------------------------- | ----------------------- | -------------------------------------- |
| `sales/new/actions.ts`    | `postSaleToJournal`     | After successful sale + stock movement |
| `expenses/new/actions.ts` | `postExpenseToJournal`  | After successful expense insert        |
| `purchases/actions.ts`    | `postPurchaseToJournal` | After successful purchase order insert |

### Adding a new auto-posting source:

1. Add the import: `import { postXxxToJournal } from "@/lib/accounting"`
2. Call it after the main insert succeeds (but before revalidation)
3. Make it fire-and-forget — don't block the user on GL errors

---

## E2E Tests

Tests live in `e2e/accounting.spec.ts` with naming convention `ACC-NNN`.

Test groups:

- Page Structure (ACC-001–002)
- Chart of Accounts (ACC-010–015)
- Journal Entries (ACC-020–027)
- Trial Balance (ACC-030)
- Navigation & URL-driven (ACC-040–041)

Run: `npm run test:e2e`

The tests skip gracefully if there's no data, so they work on both empty and populated databases.

---

## Common Gotchas

1. **Missing RLS policies** — journal_entries and journal_entry_lines need separate UPDATE/DELETE policies (not just INSERT/SELECT). Check `pg_policies` if you get 401 on edits.

2. **Auto-posting is fire-and-forget** — errors are logged but not shown to the user. The sale still goes through even if posting to GL fails. This is intentional but means GL errors need monitoring.

3. **Account codes are hardcoded** — `postSaleToJournal` looks up "1200", "1300", "4100", "5100" by code. If these accounts don't exist for an org, auto-posting silently fails.

4. **No generated TS types** for journal_entries/chart_of_accounts yet — code uses `as any` casts on the Supabase client. When types are generated, remove these casts.

5. **CASCADE vs RESTRICT** — journal_entry_lines has ON DELETE RESTRICT on account_id (can't delete an account with lines) but CASCADE on journal_entry_id (deleting an entry deletes its lines).

6. **Entry number uniqueness** — uses a sequence, so entries from different days can share the same number suffix. The full format `JE-YYYYMMDD-NNNN` makes them unique in practice.

7. **Detail drawer replaces inline expand** — the old inline expand/collapse for journal entry lines has been replaced with a proper detail drawer. Don't add inline expansion back.
