Write Vitest component tests for Misc business components.

CWD: apps/tolom

Create these 5 test files:

### 1. src/components/__tests__/section-cards.test.tsx
Component: SectionCards from "@/components/section-cards"
No props - static component with 4 stat cards.
- Test all 4 cards render (Total Revenue, New Customers, Active Accounts, Sales)
- Test trend indicators (TrendingUp, TrendingDown)

### 2. src/components/__tests__/search-form.test.tsx
Component: SearchForm from "@/components/search-form"
Props: extends React.ComponentProps<"form">
Uses useTranslations("common") for "search" and "typeToSearch" keys.
- Test renders search input with placeholder
- Test renders search icon
- Test renders label (sr-only)
- Test className passthrough
- Test renders children

### 3. src/components/__tests__/export-button.test.tsx
Component: ExportButton from "@/components/export-button"
Props: { data: T[]; columns: ExportColumn<T>[]; filename?: string; sheetName?: string; title?: string; label?: string; disabled?: boolean; buttonSize?: ComponentProps<typeof Button>["size"]; className?: string }
Uses useExcelExport from @/hooks/use-excel-export, toast from sonner, useTranslations("common")
Mock useExcelExport with vi.mock("@/hooks/use-excel-export")
- Test renders button with label
- Test disabled when data is empty
- Test disabled prop works
- Test click calls exportToExcel
- Test exporting state shows spinner (isExporting=true)
- Mock toast.success for export success

### 4. src/components/__tests__/data-table-dashboard.test.tsx
Component: DataTable from "@/components/data-table-dashboard"
Props: { data: z.infer<typeof schema>[] } where schema is from @/components/_data-table-columns
This is a complex table with DnD, sorting, filtering, pagination.
- Mock @dnd-kit/core and @dnd-kit/sortable
- Mock @tanstack/react-table
- Mock the columns import from ./_data-table-columns
- Test renders with data
- Test renders empty state
- Test renders pagination controls

### 5. src/components/__tests__/dispatch-calendar.test.tsx
Component: DispatchCalendar from "@/components/dispatch-calendar"
Props: { appointments: AppointmentDetail[]; onAppointmentClick?: (apt: AppointmentDetail) => void; isLoading?: boolean; className?: string }
AppointmentDetail type has: { id, start_time, end_time, vehicle?: { plate_number }, mechanic?: { full_name }, customer?: { ... }, services: Array<{ name }>, status, total_cost, ... }
- Test loading state shows CalendarSkeleton
- Test renders appointment blocks
- Test renders time column (7am-6pm)
- Test appointment click calls onAppointmentClick
- Test empty appointments renders empty grid
- Test className passthrough

Import render from @/test/test-utils. Provide common messages: { common: { search: "Search", typeToSearch: "Type to search...", exportSuccess: "Exported", exportFailed: "Export failed" } }
