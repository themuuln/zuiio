# WO Wizard Decomposition

**Decomposed the 1081-line work order wizard** into a context provider + 6 section components. Page.tsx went from 1081 lines to 70 lines.

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/components/work-orders/wizard/wizard-context.tsx` | 370 | All wizard state + effects + handlers in React Context |
| `src/components/work-orders/wizard/customer-section.tsx` | 132 | Customer search + quick-create + selected card |
| `src/components/work-orders/wizard/vehicle-section.tsx` | 132 | Vehicle search + quick-create + selected card |
| `src/components/work-orders/wizard/services-section.tsx` | 194 | Catalog search + service line items with price/discount editing |
| `src/components/work-orders/wizard/parts-section.tsx` | 85 | Part line item editor |
| `src/components/work-orders/wizard/mechanic-section.tsx` | 32 | Mechanic select + notes (2-col grid) |
| `src/components/work-orders/wizard/summary-section.tsx` | 69 | Totals display + Create button |
| `src/components/work-orders/wizard/index.ts` | 8 | Re-exports |

## File Changed

| File | Before | After |
|------|--------|-------|
| `src/app/[locale]/dashboard/work-orders/new/page.tsx` | 1081 lines (single component, ~40 useState) | 70 lines (orchestrator wrapping WizardProvider + 6 sections) |

## Architecture

```
page.tsx
  └─ WizardProvider (all state + effects + handlers)
       ├─ CustomerSection
       ├─ VehicleSection
       ├─ ServicesSection
       ├─ PartsSection
       ├─ MechanicSection
       └─ SummarySection
```

- All state lives in WizardContext — no prop drilling
- Each section reads/writes from context via `useWizardContext()`
- Search effects, API calls, price calculations preserved identically
- Column names preserved as-is (`base_price`, `discount_amount_mnt`, etc.) — schema migration handles drift separately

## TypeScript: 0 errors
