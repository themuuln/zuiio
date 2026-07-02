# Features

Active contributors: themuuln

## Purpose

Zer ERP is organized into feature lenses, each corresponding to a major business domain. Every lens provides list views, create/edit drawers, detail drawers, and server-side data fetching with branch-scoped queries. The following pages document each feature's purpose, directory layout, key abstractions, and data flow.

## Feature Pages

- [Dashboard](dashboard.md) — KPI grid, stat cards, monthly sales chart, recent sales table, low stock alerts.
- [Sales](sales.md) — Sale registration, line items, payment quick actions, stock validation, sale list with filter chips, sale detail drawer.
- [Invoices](invoices.md) — Invoice creation from sales, manual invoice creation, public sharing via token, payment recording.
- [Quotations](quotations.md) — Quote creation with line items, status management, conversion to sale with auto-invoice.
- [Discounts](discounts.md) — Discount creation with conditions (all/selected products/categories), validity dates, usage limits.
- [Products](products.md) — Product CRUD with create/edit/detail drawers, fields, bulk barcode import, barcode scanner.
- [Product Variants](product-variants.md) — Variant groups, options, SKU-level variants with own price/stock, variant picker, N+1 query pattern.
- [Shop POS](shop.md) — Mobile-first point-of-sale: product catalog, cart with numeric keypad, customer picker, receipt printing, sales history.
- [Expenses](expenses.md) — Expense creation with category/amount/date/payment method, list with search, CSV export.
- [Purchases](purchases.md) — Purchase order creation with line items, PO status management (draft→ordered→received), receiving items with stock updates, posting to general ledger.
- [Returns](returns.md) — Return creation with line items, stock reversal on complete, returns list.
