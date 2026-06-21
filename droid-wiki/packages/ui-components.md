# UI Components

Active contributors: themuuln

## Purpose

Zer has ~70+ shared UI components in `src/components/ui/` and ~10 domain-specific components in `src/components/erp/`. They are built on three underlying libraries:

- **shadcn/ui** — Base set of accessible, unstyled components (Button, Input, Dialog, Table, Select, DropdownMenu, etc.)
- **Base UI** (`@base-ui/react`) — Used for the slide-in drawer component (`SlideInDrawer`)
- **Radix** (`radix-ui`) — Used sparingly (Slot, some primitive patterns)

All components are styled with Tailwind CSS v4 using CSS variables defined in the design system (see `DESIGN.md`).

## Key UI Components

### SlideInDrawer

File: `src/components/ui/slide-in-drawer.tsx`

The standard drawer for create/edit/detail views. Built on `@base-ui/react/drawer`.

Props:
- `open` / `onOpenChange` — Controlled state
- `title` / `description` — Header
- `panelWidth` — Defaults to `28rem`
- `trigger` — Optional trigger element
- `footer` — Fixed footer slot
- `handle` — Detached trigger support via `Drawer.createHandle()`
- `modal` — Modal behavior (default `true`)
- `disablePointerDismissal` — Prevent outside click close

```tsx
<SlideInDrawer open={open} onOpenChange={setOpen} title="Шинэ нэхэмжлэл">
  {/* drawer content */}
</SlideInDrawer>
```

### Combobox

File: `src/components/ui/combobox.tsx`

Custom combobox/autocomplete built from scratch (no Downshift or Base UI). Uses React context for compound component pattern.

Sub-components: `Combobox`, `ComboboxInput`, `ComboboxContent`, `ComboboxList`, `ComboboxEmpty`, `ComboboxItem`, `ComboboxCreate`, `ComboboxSeparator`, `ComboboxGroupLabel`.

Supports:
- Keyboard navigation (arrows, enter, escape)
- Filtering by input value
- Groups with separators
- Inline creation via `ComboboxCreate`
- Hidden input for form integration

### DataTable

File: `src/components/ui/data-table.tsx`

Built on `@tanstack/react-table`. Full-featured table with:
- Sorting (clickable column headers)
- Search filtering by column
- Column visibility toggle
- Row selection with checkboxes
- Pagination with page size selector
- Custom toolbar slot
- Row click callback

### DatePicker

File: `src/components/ui/date-picker.tsx`

Built on shadcn/ui Calendar + Popover. Uses `date-fns` for formatting.

### CurrencyInput

File: `src/components/ui/currency-input.tsx`

Custom input that formats numbers with thousand separators and parses clean numeric values.

### ErrorBanner

File: `src/components/ui/error-banner.tsx`

Dismissible error banner that accepts `string`, `Error`, or `null`. Optional auto-hide timer. Used in forms to display server action errors.

### Field Components

Files: `src/components/ui/field.tsx`, `src/components/ui/input.tsx`, `src/components/ui/label.tsx`

Form field primitives: `Field`, `FieldGroup`, `FieldLabel`, `FieldDescription`, `FieldMessage`. Usually paired with `Input`.

### Drawer Footer Components

File: `src/components/ui/drawer-footer.tsx`

- `DrawerFooter` — Sticky bottom bar with border-top
- `DrawerCancel` — Cancel button that calls `onClick`
- `DrawerSubmit` — Submit button linked to a form via `form` attribute, with loading state

## ERP Components

### PageShell

File: `src/components/erp/page-shell.tsx`

Standard page layout wrapper for all dashboard pages. Provides a consistent header with title, description, and actions slot.

```tsx
<PageShell title="Борлуулалт" description="..." actions={<Button>Шинэ борлуулалт</Button>}>
  {/* page content */}
</PageShell>
```

### KpiGrid

File: `src/components/erp/kpi-grid.tsx`

Responsive grid layout for KPI/metric cards: 1 column on mobile → 2 on sm → 3 on lg → 4 on xl.

### StatCard

File: `src/components/erp/stat-card.tsx`

Individual metric card with icon, label, value, and optional trend indicator (up/down arrow).

### ErpEmptyState

File: `src/components/erp/empty-state.tsx`

Empty state placeholder with icon, title, description, and optional action button. Uses dashed border and centered layout.

### ExportButton

File: `src/components/erp/export-button.tsx`

Dropdown button that triggers CSV/XLSX/DOCX/PDF export via API endpoint. Shows loading state during export. Downloads the file client-side.

## Key Source Files

| File | Components |
|------|------------|
| `src/components/ui/slide-in-drawer.tsx` | SlideInDrawer |
| `src/components/ui/combobox.tsx` | Combobox, ComboboxInput, ComboboxList, ComboboxCreate, etc. |
| `src/components/ui/data-table.tsx` | DataTable |
| `src/components/ui/date-picker.tsx` | DatePicker |
| `src/components/ui/currency-input.tsx` | CurrencyInput |
| `src/components/ui/error-banner.tsx` | ErrorBanner |
| `src/components/ui/field.tsx` | Field, FieldGroup, FieldLabel, FieldDescription, FieldMessage |
| `src/components/ui/drawer-footer.tsx` | DrawerFooter, DrawerCancel, DrawerSubmit |
| `src/components/ui/input.tsx` | Input |
| `src/components/ui/button.tsx` | Button, buttonVariants |
| `src/components/ui/label.tsx` | Label |
| `src/components/erp/page-shell.tsx` | PageShell |
| `src/components/erp/kpi-grid.tsx` | KpiGrid |
| `src/components/erp/stat-card.tsx` | StatCard |
| `src/components/erp/empty-state.tsx` | ErpEmptyState |
| `src/components/erp/export-button.tsx` | ExportButton |
