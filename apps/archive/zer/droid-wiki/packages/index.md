# Packages

Active contributors: themuuln

## Purpose

The Packages lens catalogs the reusable library code in Zer — the shared components, query hooks, server action utilities, and export tools that feature pages depend on. These are organized into self-contained modules under `src/lib/` and `src/components/`.

## Pages

| Page | Description |
|------|-------------|
| [UI Components](./ui-components) | 70+ shared components built on shadcn/ui, Base UI, and Radix: SlideInDrawer, Combobox, DataTable, DatePicker, CurrencyInput, ErrorBanner, Field components, DrawerFooter, plus ERP-specific components: PageShell, KpiGrid, StatCard, ErpEmptyState, ExportButton |
| [Data Fetching](./data-fetching) | React Query setup: `createSimpleQuery()` factory hook, query key factory (`keys.ts`), optimistic mutation hooks (`useOptimisticCreate/Update/Delete`), and domain-specific hooks for products, sales, contacts, expenses, brands, inventory, and variants |
| [Server Actions](./server-actions) | Guard utilities (`requireActionContext`, `requireWriteAction`, `requireBranchScope`), centralized revalidation (`revalidateEntity`, `revalidateEntities`), form data parsing (`getString`, `normalizePhone`, `escapeHtml`) |
| [Export](./export) | CSV, XLSX, DOCX, PDF export via API routes with `serveEntityExport()` |

## Key Source Files

| File | Package |
|------|---------|
| `src/components/ui/` | UI Components |
| `src/components/erp/` | UI Components |
| `src/lib/query/` | Data Fetching |
| `src/lib/action-utils.ts` | Server Actions |
| `src/lib/revalidate.ts` | Server Actions |
| `src/lib/validation.ts` | Server Actions |
| `src/lib/export/` | Export |
| `src/lib/csv.ts` | Export |
