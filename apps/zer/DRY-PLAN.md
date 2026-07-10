# DRY & Cleanup Plan — Zer ERP

> Comprehensive analysis of codebase duplication, dead code, and abstraction opportunities.
> Based on thorough examination of `src/app/`, `src/components/`, `src/lib/`, and `tests/`.

---

## 1. Architecture & Patterns

### What's Working Well

- **Clean module separation**: Business logic is organized by domain (sales/, expenses/, products/, etc.)
- **Consistent drawer pattern**: `SlideInDrawer` / `DrawerLayout` provides a shared wrapper for all slide-in panels
- **Shared optimistic hooks**: `useOptimisticCreate`/`useOptimisticDelete`/`useOptimisticUpdate` in `src/lib/query/use-optimistic.ts` provide a consistent pattern
- **Query key factory**: Consistent query key generation via `src/lib/query/keys.ts`
- **Validation utility**: `src/lib/validation.ts` centralizes form data parsing (`getString`, `normalizePhone`)
- **Domain rules**: `src/lib/domain-rules.ts` centralizes basic input validators
- **Server action guard**: `requireAppContext()` provides a consistent auth/permission/branch check start
- **Permission check utility**: `checkPermission()` is used consistently across all actions
- **Server-only audit logging**: `src/lib/audit.ts` with `logAuditEvent`/`logAuditEventWithClient`
- **Export module**: `src/lib/export/` has a clean structure for multiple export formats
- **Branch context/helpers**: `src/lib/branch-context.tsx` + `src/lib/branches.ts` provide a consistent branch system

### What Needs Improvement

1. **Server action boilerplate**: Every action file starts with the same 6-line destructuring from `requireAppContext()`, the same `checkPermission` guard, and the same `if (isBranchScoped && !branchId)` check — this is repeated 20+ times
2. **Drawer form duplication**: Create-drawer components for purchases, invoices, quotations, returns, and accounting all have nearly identical "line item" tables (useFieldArray, VariantPicker, total calculation, add/remove buttons) — copy-pasted with minor field differences
3. **Query hook duplication**: 7 query hooks (products, sales, expenses, contacts, brands, inventory) have identical structure — only the query key, table name, and select differ
4. **Branch access functions**: `getUserBranches` and `getAccessibleBranches` in `branches.ts` are nearly identical
5. **Revalidate path duplication**: Each action file hardcodes its own list of `revalidatePath()` calls — many repeat the same paths
6. **Accounting journal posting**: `postSaleToJournal`, `postExpenseToJournal`, `postPurchaseToJournal` in `accounting.ts` share 70%+ identical boilerplate (fetch accounts, generate entry number, create JE, insert lines, audit log)
7. **Customer/Contact creation-on-the-fly**: Same "find or create contact" pattern duplicated in sales actions, invoice actions, and shop actions
8. **Stock movement/reversal logic**: Same stock decrement/increment logic appears in sales, returns, purchases, and stock movements actions
9. **Inline Monglish HTML**: `email.ts` contains 200+ lines of inline-Styled HTML string templates — unmaintainable
10. **ProductOption/SupplierOption type duplication**: Each drawer file defines its own `ProductOption` type instead of sharing a common type

---

## 2. DRY Opportunities — Organized by Priority

### 🔴 HIGH Priority (Significant duplication, high impact)

| #   | Issue                                       | Files Affected                                                                                                                                                                                                                                                                     | Lines              | Description                                                                                                                                                                                                                                                                                                              |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| H1  | **Server action scaffold pattern**          | ~20 action files                                                                                                                                                                                                                                                                   | ~80 total          | Every action: `const { supabase, organizationId, userId, branchId, isBranchScoped, permissions } = await requireAppContext();` + `const permError = checkPermission(permissions, "...");` + `if (isBranchScoped && !branchId) return { error: "..." }` — create a `requireScopedContext` helper or higher-order function |
| H2  | **Branch scoping guard**                    | 10 action files: `quotations/actions.ts:26`, `returns/actions.ts:23`, `expenses/new/actions.ts:26`, `discounts/actions.ts:37`, `purchases/actions.ts:25`, `sales/new/actions.ts:39`, `invoices/actions.ts:32`, `inventory/movements/actions.ts:25`, `accounting/actions.ts:19,153` | ~10 lines each     | Same `if (isBranchScoped && !branchId) return { error: "Салбар тодорхойгүй байна." }` in every create/update action. Extract to `requireBranchScope(branchId, isBranchScoped)`                                                                                                                                           |
| H3  | **Line-item form pattern**                  | `purchase-create-drawer.tsx`, `invoice-create-drawer.tsx`, `return-create-drawer.tsx`, `quotation-create-drawer.tsx`, `sale-form.tsx`, `journal-entry-create-drawer.tsx`, `journal-entry-edit-drawer.tsx`                                                                          | ~80-150 lines each | Nearly identical useFieldArray pattern: add/remove buttons, Combobox for product, quantity input, CurrencyInput for unit price, VariantPicker integration, total-line calculation, Trash button. Extract to a `<LineItemTable>` component                                                                                |
| H4  | **VariantPicker integration**               | `sale-form.tsx:692,812`, `purchase-create-drawer.tsx:404`, `invoice-create-drawer.tsx:403`, `return-create-drawer.tsx:374`, `quotation-create-drawer.tsx:379`, `product-card.tsx:139`                                                                                              | ~10-15 lines each  | Same `VariantPicker` wrapper with productId lookup, onSelect setting variant_id, auto-filling price. Extract to a shared hook `useVariantPicker(index, productId)`                                                                                                                                                       |
| H5  | **Query hook boilerplate**                  | `use-products.ts`, `use-sales.ts`, `use-contacts.ts`, `use-expenses.ts`, `use-brands.ts`, `use-inventory.ts`                                                                                                                                                                       | ~12 lines each     | Same structure: `createClient()` + `useQuery({ queryKey, queryFn, enabled })`. Create a `useSimpleQuery(entityKeys, tableName)` factory function                                                                                                                                                                         |
| H6  | **getUserBranches / getAccessibleBranches** | `src/lib/branches.ts`                                                                                                                                                                                                                                                              | ~40 lines each     | Two functions that both query the profile then branches. Combine into one with an optional `organizationId` parameter                                                                                                                                                                                                    |
| H7  | **Accounting journal posting**              | `src/lib/accounting.ts` (`postSaleToJournal`, `postExpenseToJournal`, `postPurchaseToJournal`)                                                                                                                                                                                     | ~100 lines each    | 3 functions sharing 70% identical tea-making (fetch accounts, RPC for entry number, create JE, insert lines, audit log). Extract common `createJournalEntry` helper                                                                                                                                                      |
| H8  | **Contact creation-on-the-fly**             | `sales/new/actions.ts:180-216`, `invoices/actions.ts:37-75`, `shop/actions.ts:139-173`                                                                                                                                                                                             | ~35 lines each     | Same "find-or-create contact" pattern with duplicate name check, phone normalization, error handling. Extract to `findOrCreateContact(supabase, organizationId, name, phone)`                                                                                                                                            |
| H9  | **Stock decrement logic**                   | `sales/new/actions.ts:260-355`, `shop/actions.ts:260-355`, `returns/actions.ts:180-260`, `purchases/actions.ts:250-330`                                                                                                                                                            | ~80 lines each     | Repeated stock update + gte check + rollback pattern. Extract to `decrementStock` / `incrementStock` helpers                                                                                                                                                                                                             |

### 🟡 MEDIUM Priority (Moderate duplication)

| #   | Issue                                         | Files Affected                                                                                                                                                                                                      | Lines           | Description                                                                                                                                                    |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| M1  | **Revalidate path patterns**                  | ~25 action files                                                                                                                                                                                                    | ~2-5 each       | Each action hardcodes `revalidatePath("/path1")`, `revalidatePath("/path2")`. Create a `ENTITY_REVALIDATE_PATHS` map so revalidation is centralized            |
| M2  | **logAuditEventWithClient calls**             | `quotations/actions.ts`, `discounts/actions.ts`, `sales/new/actions.ts`, `invoices/actions.ts`, `accounting/actions.ts`, `accounting.ts`                                                                            | ~5 lines each   | Same audit logging pattern after every mutation. Could wrap in an audit decorator or helper                                                                    |
| M3  | **ProductOption / CustomerOption types**      | `sales-create-drawer.tsx`, `purchase-create-drawer.tsx`, `invoice-create-drawer.tsx`, `return-create-drawer.tsx`, `quotation-create-drawer.tsx`                                                                     | ~5-8 lines each | Each drawer defines its own `ProductOption`, `CustomerOption`, etc. Types should live in a shared `src/lib/types.ts`                                           |
| M4  | **useFieldArray remove + variant cleanup**    | `purchase-create-drawer.tsx`, `invoice-create-drawer.tsx`, `return-create-drawer.tsx`, `quotation-create-drawer.tsx`, `sale-form.tsx`                                                                               | ~5 lines each   | Already has `useVariantLineItemRemove` but still used individually. Also the reset-on-close pattern with `setVariantSelections({})`, `reset()` etc is repeated |
| M5  | **SlideInDrawer vs DrawerLayout**             | `expenses-create-drawer.tsx`, `sales-create-drawer.tsx`, `return-create-drawer.tsx` use `SlideInDrawer`; `product-create-drawer.tsx`, `invoice-create-drawer.tsx`, `quotation-create-drawer.tsx` use `DrawerLayout` | N/A             | Two different drawer wrappers with very similar API. Consider consolidating or documenting when to use which                                                   |
| M6  | **formatRouteDate vs inline date formatting** | `sales/new/actions.ts`, `expenses/new/actions.ts`, `purchases/actions.ts`, `returns/actions.ts`, `invoices/actions.ts`, `inventory/movements/actions.ts`                                                            | ~15 total       | Some use `formatRouteDate()`, others use `new Date().toISOString().slice(0, 10)`. Standardize on `formatRouteDate`                                             |
| M7  | **Error banner / error handling pattern**     | All drawer components                                                                                                                                                                                               | ~3 lines each   | Same pattern: `const [serverError, setServerError] = useState<string                                                                                           | null>(null)`+`<ErrorBanner error={serverError} />`. Could create a `useFormError` hook |
| M8  | **Sales actions vs Shop actions**             | `sales/new/actions.ts` and `shop/actions.ts`                                                                                                                                                                        | ~400 lines each | Both create sales but have nearly identical logic. Shop has extra point-of-sale features. Could extract shared base                                            |

### 🟢 LOW Priority (Minor duplication / nice-to-haves)

| #   | Issue                                      | Files Affected                      | Lines      | Description                                                                                                                  |
| --- | ------------------------------------------ | ----------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| L1  | **PERMISSION_LABELS boilerplate**          | `src/lib/permissions.ts`            | ~70 lines  | All labels follow pattern `"products.create": "Бүтээгдэхүүн үүсгэх"` — could be generated from permission key + a suffix map |
| L2  | **PERMISSION_GROUPS filters**              | `src/lib/permissions.ts`            | ~50 lines  | Each group does `APP_PERMISSIONS.filter(p => p.startsWith("products."))` — could be generated from a list of prefixes        |
| L3  | **Inline CSS in email.ts**                 | `src/lib/email.ts`                  | ~200 lines | Entire HTML email template with inline styles. Should use a proper template or at least extract CSS                          |
| L4  | **Brand/Logo URL in combobox**             | `product-create-drawer.tsx`         | ~20 lines  | Brand combobox with Image logo rendering could be a reusable `<BrandCombobox>` component                                     |
| L5  | **useEffect for variant initialization**   | `product-create-drawer.tsx:107-124` | ~18 lines  | Variant data initialization on groups change uses `useEffect` — could be derived via `useMemo`                               |
| L6  | **QueryClient defaultOptions duplication** | `src/lib/query/provider.tsx`        | ~6 lines   | Only one provider, but if multiple QueryProviders are ever needed, the config should be shared                               |

---

## 3. Cleanup Items

### Dead Code / Unused Exports

| #   | Item                                                            | File                        | Details                                                                                             |
| --- | --------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------- |
| D1  | `matchesSelectedProducts`                                       | `src/lib/discount-utils.ts` | Internal helper, never exported, but also may be unused (only `calculateDiscount` is called)        |
| D2  | `matchesSelectedCategories`                                     | `src/lib/discount-utils.ts` | Same as D1                                                                                          |
| D3  | `sanitizeRedirectPath`                                          | `src/lib/validation.ts`     | Check if this is used anywhere — might be dead                                                      |
| D4  | `validateLoginInput`, `validatePasswordResetRequestInput`, etc. | `src/lib/domain-rules.ts`   | Some of these validators may not be in use (domain-rules has many export functions, check callers)  |
| D5  | `AppContext` type export                                        | `src/lib/erp.ts`            | Exported but consumed only via `requireAppContext()` return type — may be dead as a standalone type |
| D6  | `EventType`, `SendResult` re-exports                            | `src/lib/notification.ts`   | Exported as `export type` but check if consumed externally                                          |

### Naming Inconsistencies

| #   | Issue                                                                           | Location                    | Suggested Fix                                                                                                                  |
| --- | ------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| N1  | `sales-create-drawer` vs `product-create-drawer`                                | Filenames                   | All should be `{entity}-create-drawer.tsx` — sales already has `sales-create-drawer.tsx` ✓ but others are inconsistent         |
| N2  | `expenses-create-drawer.tsx` vs `ExpensesCreateDrawer`                          | Component name              | Should be `expense-create-drawer.tsx` and `ExpenseCreateDrawer` (no trailing 's')                                              |
| N3  | `purchase-create-drawer` uses `PurchaseCreateDrawer` but folder is `purchases/` | `src/components/purchases/` | Minor: component name vs folder name mismatch                                                                                  |
| N4  | `formatRouteDate` name                                                          | `src/lib/format.ts`         | This just formats a date or returns today — naming implies it's for routes specifically, but it's used for any date formatting |
| N5  | `getString` in validation.ts                                                    | `src/lib/validation.ts`     | Name is generic but it's a formData handler. Could be renamed `getFormString` for clarity                                      |
| N6  | `createContact` in customers/actions.ts vs suppliers/actions.ts                 | Both action files           | Both create contacts with different validation/type handling — but could share the same action                                 |

### File Organization Issues

| #   | Issue                                                 | Details                                                                                                         |
| --- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| O1  | `sale-form.tsx` in `app/(dashboard)/sales/new/`       | This is a component file living inside the app router directory. Should be in `src/components/sales/`           |
| O2  | `expense-form.tsx` in `app/(dashboard)/expenses/new/` | Same as O1 — form component in app directory                                                                    |
| O3  | `sale-form.tsx` is very long                          | This file is likely 800+ lines. Should be split into smaller components                                         |
| O4  | `settings/actions.ts` is a monolith                   | Single action file in settings handles organization, notifications, presets, contact info, etc. Should be split |
| O5  | `permissions.ts` is a monolith                        | Mixes permission constants, groups, labels all in one file. Could split into `permissions/` directory           |
| O6  | Test files lack co-location                           | Tests are in `tests/` directory rather than co-located with source files. Only 1 test file found in `src/`      |

---

## 4. Recommended Abstraction Plan

### Phase 1: Shared Server-Action Utilities (HIGH impact)

**New files to create**:

1. `src/lib/action-utils.ts` — Higher-order utilities for action boilerplate:

   ```ts
   // Wraps requireAppContext + checkPermission + branch scope check
   async function requireActionContext(permission: AppPermission);
   // Returns { supabase, organizationId, userId, branchId, isBranchScoped, permissions }
   // or throws { error } if unauthorized
   ```

2. `src/lib/stock-utils.ts` — Stock management helpers:

   ```ts
   decrementProductStock(supabase, productId, orgId, quantity) → rollback-safe
   incrementProductStock(supabase, productId, orgId, quantity)
   decrementVariantStock(supabase, variantId, quantity)
   createStockMovement(supabase, { productId, type, quantity, reference, ... })
   ```

3. `src/lib/contact-utils.ts` — Contact find-or-create:
   ```ts
   findOrCreateContact(supabase, orgId, name, phone, type) → { id }
   ```

**Refactoring targets**:

- All ~20 server action files will use `requireActionContext` instead of manual destructuring + permission + branch checks
- `sales/new/actions.ts` and `shop/actions.ts` will use `stock-utils.ts` for stock operations
- `sales/new/actions.ts`, `invoices/actions.ts`, `shop/actions.ts` will use `contact-utils.ts`

### Phase 2: Shared Drawer Components (HIGH impact)

**New files to create**:

1. `src/components/erp/line-item-table.tsx` — Reusable line-item form table:
   - Generic `LineItemTable<T>` component with add/remove rows, product combobox, quantity/price inputs, total calc
   - Props: `fields`, `append`, `remove`, `products`, `itemRenderer`, `totalAmount`
   - Handles `VariantPicker` integration internally
   - Handles row remove with variant cleanup

2. `src/components/erp/drawer-create-footer.tsx` — Shared create-drawer footer:
   - Wraps `DrawerCancel` + `DrawerSubmit` with consistent `reset()`, `setServerError(null)`, etc.
   - Props: `form`, `onCancel`, `isPending`, `label`, etc.

**Refactoring targets**:

- All 5+ create-drawer components with line items will use `LineItemTable`
- `sale-form.tsx` will benefit significantly (~200 lines reduction)

### Phase 3: Shared Query Hook Factory (MEDIUM impact)

**New files to create**:

1. `src/lib/query/factory.ts` — Factory for query hooks:
   ```ts
   function createQueryHook(entityName, keyFactory, tableSelect, options?);
   ```
   Generates `useProducts`, `useContacts`, etc. with consistent patterns.

**Refactoring targets**:

- All 7 query hooks in `src/lib/query/hooks/` will use the factory
- Reduces each hook file from ~12 lines to ~3 lines

### Phase 4: Accounting Consolidation (MEDIUM impact)

**New files to create**:

1. `src/lib/accounting-utils.ts` — Shared journal entry creation:
   ```ts
   createJournalEntry(supabase, {
     orgId,
     branchId,
     date,
     refType,
     refId,
     description,
     userId,
     lines,
   });
   ```

**Refactoring targets**:

- `postSaleToJournal`, `postExpenseToJournal`, `postPurchaseToJournal` will all use `createJournalEntry`
- Each function reduces from ~100 to ~30 lines

### Phase 5: Revalidate Path Consolidation (LOW impact)

**New files to create**:

1. `src/lib/revalidate.ts` — Revalidation paths map:
   ```ts
   const ENTITY_PATHS = {
     sales: ["/", "/sales", "/inventory", "/products"],
     expenses: ["/", "/expenses"],
     // ...
   } as const;
   function revalidateEntity(entity: keyof typeof ENTITY_PATHS): void;
   ```

**Refactoring targets**:

- All action files will use `revalidateEntity("sales")` instead of 4 separate `revalidatePath()` calls

### Phase 6: Type Consolidation (LOW impact)

**New files to create**:

1. `src/lib/types.ts` — Shared business types:
   ```ts
   ProductOption, CustomerOption, SupplierOption, LineItem, etc.
   ```

**Refactoring targets**:

- All drawer components that define their own `ProductOption` type will import from `src/lib/types.ts`

---

## 5. File-by-File Specific Issues (25+ entries)

### Server Actions

1. **`src/app/(dashboard)/sales/new/actions.ts`** (~500 lines)
   - Extracted H2: Branch scope guard at line 39
   - Extracted H8: Contact creation at lines 180-216
   - Extracted H9: Stock decrement at lines 260-355 (two nearly identical blocks for products and variants)
   - Fire-and-forget notification + low-stock check at lines 460-485 could be a shared helper
   - `logAuditEventWithClient` call at line 444 follows same pattern as other actions

2. **`src/app/(dashboard)/purchases/actions.ts`** (~350 lines)
   - Line 21: Branch scope guard
   - Lines 200-340: `receivePurchaseOrderItems` has stock movement logic duplicated from elsewhere
   - Line 29-33: Manual getString calls for order fields

3. **`src/app/(dashboard)/returns/actions.ts`** (~340 lines)
   - Line 23: Branch scope guard
   - Lines 180-260: Stock reversal logic in `completeReturn` duplicates the pattern from sales

4. **`src/app/(dashboard)/invoices/actions.ts`** (~270 lines)
   - Lines 37-75: Contact find-or-create duplication (H8)
   - Line 32: Branch scope guard
   - Lines 147, 200, 254: Three `logAuditEventWithClient` calls

5. **`src/app/(dashboard)/expenses/new/actions.ts`** (~75 lines)
   - Line 26: Branch scope guard
   - Line 22: Permission check
   - Relatively clean but still has boilerplate

6. **`src/app/(dashboard)/products/actions.ts`** (~260 lines)
   - Lines 13, 240: Permission checks
   - Variant management code (lines 75-220) is complex and isolated to this file — could be extracted to `variant-utils.ts`

7. **`src/app/(dashboard)/shop/actions.ts`** (~400 lines)
   - Nearly identical to `sales/new/actions.ts` (same sale creation logic with minor POS-specific additions)
   - H8 Contact creation duplication
   - H9 Stock decrement duplication
   - Account for the fact that 60%+ of this file duplicates sales actions

8. **`src/app/(dashboard)/settings/actions.ts`** (~590 lines)
   - Monolithic file handling org settings, contact info, notification presets, report email config, etc.
   - Should be split into `settings/organization/`, `settings/notifications/`, `settings/contact/`, etc.

9. **`src/app/(dashboard)/customers/actions.ts`** (~135 lines)
   - `createContact` and `updateContact` could share about 50% of their logic
   - Lines 57-59: Three revalidatePath calls

10. **`src/app/(dashboard)/discounts/actions.ts`** (~370 lines)
    - `createDiscount` and `updateDiscount` share ~70% of their form-data parsing logic

### Components

11. **`src/components/invoices/invoice-create-drawer.tsx`** (~500 lines)
    - Uses `DrawerLayout` but most other drawers use `SlideInDrawer` (inconsistency M5)
    - Has `useFieldArray` line-item table (H3) with 100+ lines of identical pattern
    - Defines its own `ProductOption` type inline

12. **`src/components/purchases/purchase-create-drawer.tsx`** (~450 lines)
    - Same line-item table pattern (H3)
    - Same `ProductOption` type duplication
    - Reset on close pattern duplicates invoice/returns drawers

13. **`src/components/returns/return-create-drawer.tsx`** (~400 lines)
    - Same line-item table (H3)
    - Defines its own `ProductOption` type
    - Uses `NativeSelect` for product selection (different from Combobox used elsewhere)

14. **`src/components/expenses/expenses-create-drawer.tsx`** (~50 lines)
    - Clean and lean — uses `SlideInDrawer` wrapper, minimal code
    - But named `expenses` (plural) while most others use singular

15. **`src/components/products/product-create-drawer.tsx`** (~300 lines)
    - Uses `DrawerLayout` (inconsistency with expense drawer)
    - Has variant management logic tightly coupled
    - Brand combobox with Image logo could be reusable component (L4)

16. **`src/components/products/variant-picker.tsx`**
    - Used in 6 different drawer components
    - The pattern of wrapping it inside each line item is duplicated

### Library Files

17. **`src/lib/branches.ts`** (~120 lines)
    - `getUserBranches` and `getAccessibleBranches` are ~90% identical (H6)
    - `BranchRow` and `BranchInfo` are the same shape — could consolidate

18. **`src/lib/accounting.ts`** (~225 lines)
    - Three journal posting functions sharing ~70% boilerplate (H7)
    - Each does: fetch accounts by code → call RPC → create JE → insert lines → audit log

19. **`src/lib/reports.ts`** (~250 lines)
    - Cleanly organized with typed return values
    - Some queries (like `getCommissionSummaryReport`) are complex with manual joins
    - `getFullReport` calls all 6 sub-functions — good use of `Promise.all`

20. **`src/lib/email.ts`** (~300 lines)
    - `generateDailyReportHtml` contains 200+ lines of inline-HTML string with CSS
    - Error handling in `sendDailyReportEmail` is duplicated — try/catch + logging happens in both `sendEmail` and `sendDailyReportEmail`
    - All HTML should be extracted to a separate template module

21. **`src/lib/format.ts`** (~30 lines)
    - `formatRouteDate` and `formatDate` are nearly identical (one returns "-" for null, other defaults to today)
    - Check if `slugify` is used anywhere

22. **`src/lib/permissions.ts`** (~150 lines)
    - `PERMISSION_GROUPS` and `PERMISSION_LABELS` are big static objects
    - The filter-by-prefix in groups could be done programmatically from a list of prefixes

### Query Hooks

23. **`src/lib/query/hooks/use-products.ts`** (~15 lines)
    - Identical structure to `use-sales.ts`, `use-expenses.ts`, `use-contacts.ts`, `use-brands.ts`, `use-inventory.ts`
    - 6 files, ~100 total lines, all following the exact same pattern

24. **`src/lib/query/hooks/use-product-variants.ts`** (~130 lines)
    - More complex than others with nested queries for groups/variants/assignments
    - The `fetchVariantGroups` and `fetchVariants` functions make sequential N+1 queries to Supabase

25. **`src/lib/query/hooks/use-realtime-subscriptions.ts`** (~80 lines)
    - Clean pattern but hardcodes entity list with separate `RealtimeChannelGroup` configs
    - Could auto-discover from the entity list mapped in `src/lib/query/keys.ts`

### Tests

26. **`tests/discount-utils.test.ts`** (~170 lines) — Clean, good coverage of `calculateDiscount`
27. **`tests/products.test.ts`** (~260 lines) — Tests `validateProductInput` extensively
28. **`tests/branch-helpers.test.ts`** (~60 lines) — Tests `canAccessBranch` and `enforceBranchAccess`
29. **`tests/accounting-isolation.test.ts`** — Needs review for completeness
30. **`tests/` directory** — No test for drawer components, action files, or query hooks — all testing is at the utility level

---

## 6. Estimated Effort

| Phase   | Area                     | Files Changed               | Files Created         | Risk Level | Estimated Effort |
| ------- | ------------------------ | --------------------------- | --------------------- | ---------- | ---------------- |
| Phase 1 | Action utilities         | ~20 action files            | 3 new lib files       | HIGH       | 2-3 days         |
| Phase 2 | Shared drawer components | ~8 drawer files + sale-form | 2 new component files | MEDIUM     | 2-3 days         |
| Phase 3 | Query hook factory       | 7 hook files                | 1 new lib file        | LOW        | 0.5 day          |
| Phase 4 | Accounting consolidation | 1 lib file                  | 1 new lib file        | MEDIUM     | 0.5 day          |
| Phase 5 | Revalidate paths         | ~25 action files            | 1 new lib file        | LOW        | 0.5 day          |
| Phase 6 | Type consolidation       | ~8 component + action files | 1 new lib file        | LOW        | 0.25 day         |
| Cleanup | Dead code removal        | 3-5 lib files               | 0                     | LOW        | 0.25 day         |
| Cleanup | File organization        | 4-6 files moved             | 0                     | LOW        | 0.5 day          |

**Total estimates**:

- **Files that would change**: ~45-55 unique files
- **New files created**: ~9 files
- **Risk profile**: Phases 1-2 are HIGH risk (touches every server action and complex UI components), Phases 3-6 are LOW-MEDIUM
- **Cumulative effort**: ~5-8 days for full implementation with thorough testing

### Mitigation Strategy for High-Risk Changes

1. **Phase 1 (Action utils)** should be done incrementally:
   - Start with `requireActionContext` — a thin wrapper around `requireAppContext` + `checkPermission`
   - Migrate one action file at a time, running tests after each
   - Then add `stock-utils.ts` and migrate sales/shop/purchases/returns together

2. **Phase 2 (LineItemTable)** should be built alongside an existing drawer:
   - Extract the pattern from `purchase-create-drawer.tsx` (representative example)
   - Add TypeScript generics for type-safe line items
   - Migrate other drawers one at a time

3. **All phases**: Write utility tests first before refactoring, to ensure behavior is preserved

---

## Summary

The most impactful changes are:

1. **Action boilerplate reduction** (Phase 1) — removes ~200 lines of duplicated guards across 20 files
2. **Line-item table component** (Phase 2) — removes ~600 lines of duplicated form table code across 8 drawer components
3. **Journal posting consolidation** (Phase 4) — removes ~200 lines of boilerplate from accounting.ts
4. **Contact find-or-create** (Phase 1) — removes ~100 lines from 3 action files

The least impactful (but still worth doing) are:

- Dead code removal
- Naming consistency fixes
- Type consolidation
- Revalidate path centralization

**Recommended order**: Phase 1 → Phase 4 → Phase 2 → Phase 3 → Phase 5 → Phase 6 → Cleanup
