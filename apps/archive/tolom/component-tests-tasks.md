# Component Test Tasks

Write Vitest (jsdom) component tests for business-logic components in apps/tolom.
CWD is apps/tolom/. Each file goes in `src/components/<category>/__tests__/<name>.test.tsx`.
Create `__tests__/` dirs as needed.

## Test patterns to follow:
- Import `render` from `@/test/test-utils` (wraps QueryClientProvider + NextIntlClientProvider + ThemeProvider)
- Provide messages to render: `render(<Component />, { messages: { ... } })`
- Import `screen`, `fireEvent`, `waitFor` from `@testing-library/react`
- Use `describe`/`it`/`expect` from `vitest`
- Mock external hooks at module level with `vi.mock`
- For react-query hooks: mock the hook return value (data, isLoading, error)
- For next-intl: mock `useTranslations` or provide messages via test-utils
- Test: renders with data, empty/null state, loading state (where applicable)
- For drawers/dialogs: test open/close behavior
- Test error states where component has error handling

## Task Groups (no shared files between groups)

### Group 1: Reports + Charts (8 files)
Test files:
- src/components/reports/__tests__/kpi-card.test.tsx
- src/components/reports/__tests__/pnl-card.test.tsx
- src/components/reports/__tests__/target-card.test.tsx
- src/components/reports/__tests__/forecast-card.test.tsx
- src/components/reports/__tests__/retention-card.test.tsx
- src/components/charts/__tests__/area-chart.test.tsx
- src/components/charts/__tests__/bar-chart.test.tsx
- src/components/charts/__tests__/pie-chart.test.tsx

### Group 2: Misc (5 files)
Test files:
- src/components/__tests__/section-cards.test.tsx
- src/components/__tests__/search-form.test.tsx
- src/components/__tests__/export-button.test.tsx
- src/components/__tests__/data-table-dashboard.test.tsx
- src/components/__tests__/dispatch-calendar.test.tsx

### Group 3: Work Orders Wizard + Drawer (5 files)
Test files:
- src/components/work-orders/wizard/__tests__/complaint-section.test.tsx
- src/components/work-orders/wizard/__tests__/customer-section.test.tsx
- src/components/work-orders/wizard/__tests__/mechanic-section.test.tsx
- src/components/work-orders/wizard/__tests__/vehicle-section.test.tsx
- src/components/work-orders/__tests__/new-work-order-drawer.test.tsx

### Group 4: Work Orders Core (6 files)
Test files:
- src/components/work-orders/__tests__/change-status-drawer.test.tsx
- src/components/work-orders/__tests__/customer-select.test.tsx
- src/components/work-orders/__tests__/vehicle-select.test.tsx
- src/components/work-orders/__tests__/service-lines.test.tsx
- src/components/work-orders/__tests__/part-lines.test.tsx
- src/components/work-orders/__tests__/totals-summary.test.tsx
- src/components/work-orders/__tests__/line-item-row.test.tsx

### Group 5: Inventory (6 files)
Test files:
- src/components/inventory/__tests__/new-supplier-drawer.test.tsx
- src/components/inventory/__tests__/supplier-form.test.tsx
- src/components/inventory/__tests__/new-purchase-order-drawer.test.tsx
- src/components/inventory/__tests__/purchase-order-form.test.tsx
- src/components/inventory/__tests__/part-form.test.tsx
- src/components/inventory/__tests__/quick-stock-in-dialog.test.tsx

### Group 6: Services (4 files)
Test files:
- src/components/services/__tests__/service-form.test.tsx
- src/components/services/__tests__/variant-picker.test.tsx
- src/components/services/__tests__/variant-editor-drawer.test.tsx
- src/components/services/__tests__/variant-selection-dialog.test.tsx
