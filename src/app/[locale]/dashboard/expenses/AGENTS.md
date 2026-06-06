# Expenses Module

**Purpose:** Expense tracking with list view, create form, and category management for auto service shops.

## File Structure

```
expenses/
├── page.tsx              # Main expense list page (468 lines)
├── _columns.tsx          # DataTable column definitions (189 lines)
├── loading.tsx           # Spinner loader
├── error.tsx             # Error boundary with Sentry
├── new/
│   ├── page.tsx          # Create expense form (465 lines)
│   ├── loading.tsx       # Spinner loader
│   └── error.tsx         # Error boundary
└── categories/
    ├── page.tsx          # CRUD category manager (390 lines)
    ├── loading.tsx       # Spinner loader
    └── error.tsx         # Error boundary
```

## Key Components

| Component | Role |
|-----------|------|
| `ExpensesPage` | Main list view — KPI cards, filter bar, `DataTable` with `onRowClick` opening detail sheet |
| `columns` (exported) | 8 columns: date, description (truncated), category badge, vendor, due date (with overdue indicator), amount, status (paid/unpaid/overdue), chevron |
| `CategoryBadge` | Inline pill with color dot — used for category rendering in table |
| `NewExpensePage` | Full-page form with validation — description, amount, dates, category, vendor, tax, payment method, reference, notes, paid checkbox |
| `CategoriesPage` | Card grid of categories with add/edit dialog (color picker) and delete confirmation |

## Data Flow

| Source | Hook/Endpoint | Used By |
|--------|---------------|---------|
| Expense list | `useExpenses(orgId, { q, categoryId, paid, overdue, startDate, endDate, branchId })` | page.tsx |
| Expense stats | `useExpenseStats(orgId)` | page.tsx (5 KPI cards) |
| Create expense | `useCreateExpense(orgId)` | new/page.tsx |
| Categories list | `useExpenseCategories(orgId)` | page.tsx, new/page.tsx, categories/page.tsx |
| Create category | `useCreateExpenseCategory(orgId)` | categories/page.tsx |
| Update category | `useUpdateExpenseCategory(orgId)` | categories/page.tsx |
| Delete category | `useDeleteExpenseCategory(orgId)` | categories/page.tsx |

## State Management

- **URL state**: `useTableFilters("expenses")` — search, category, paid status, dateFrom, dateTo, activeCount, resetAll
- **Local state (new page)**: `ExpenseFormState` — 11 fields managed with `useState`, field-level validation on submit
- **Local state (categories)**: Dialog open/close, form fields (name, description, color), editing mode flag
- **Global state**: `useSelectedBranchId` for branch filtering; `usePageHeader()` for expense sheet/detail panel

## Conventions

- Currency formatted with `formatMNT()` (not `formatCurrency`)
- Category colors are 9 predefined hex values (`CATEGORY_COLORS` array) rendered as circular swatches
- Overdue detection: `isOverdue()` checks unpaid + past due_date
- Payment methods: `cash`, `card`, `bank_transfer`, `manual`
- Page uses `ListPageShell` for consistent layout with header action (Add Expense button)
- Mobile card layout via `renderMobileCard` on `DataTable`
- Export columns defined as `ExportColumn<ExpenseWithCategory>[]`
- KPI cards are defined inline (not shared with finance module)

## Dependencies

- `@/components/list-page-shell` — page layout wrapper with title, desc, loading, error states
- `@/components/list-toolbar` — search + filter bar with category select, date range, paid status toggle
- `@/components/ui/data-table` — TanStack Table wrapper with sort headers
- `@/components/ui/date-range-picker` — date range filter
- `@/components/export-button` — Excel export
- `@/lib/queries/use-expenses` — all expense CRUD + category hooks
- `@/lib/queries/use-organization` — org ID
- `@/lib/stores` — `useSelectedBranchId`
- `@/hooks/use-page-header` — opens new expense sheet / detail panel
