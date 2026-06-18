---
title: Routes
desc: Application routing structure
---

# Routes

## Public Routes

| Route                   | Description                               |
| ----------------------- | ----------------------------------------- |
| `/`                     | Landing / marketing page                  |
| `/login`                | Sign in                                   |
| `/register`             | Create account                            |
| `/forgot-password`      | Password reset request                    |
| `/reset-password`       | Set new password                          |
| `/update-password`      | Update password (authenticated)           |
| `/r/[token]`            | Receipt share link                        |
| `/r/invoice/[token]`    | Invoice share link                        |
| `/[slug]/products`      | Public product catalog (per-organization) |
| `/[slug]/products/[id]` | Public product detail                     |

## Dashboard Routes (authenticated)

### Үндсэн (Main)

| Route | Description                                  |
| ----- | -------------------------------------------- |
| `/`   | Dashboard — KPI cards, quick actions, charts |

### Үйл ажиллагаа (Operations)

| Route            | Description                         |
| ---------------- | ----------------------------------- |
| `/sales`         | Sales list (DataTable with filters) |
| `/sales/new`     | Create sale (redirects to drawer)   |
| `/sales/[id]`    | Sale detail page                    |
| `/expenses`      | Expenses list                       |
| `/expenses/new`  | Create expense                      |
| `/purchases`     | Purchases list                      |
| `/purchases/new` | Create purchase                     |
| `/returns`       | Returns list                        |
| `/returns/new`   | Create return                       |

### Бүртгэл (Registry)

| Route                      | Description                         |
| -------------------------- | ----------------------------------- |
| `/products`                | Products list                       |
| `/products/bulk`           | Bulk product import                 |
| `/inventory`               | Inventory overview + warehouse list |
| `/inventory/categories`    | Category management                 |
| `/inventory/movements`     | Stock movements                     |
| `/inventory/movements/new` | Create movement                     |
| `/inventory/warehouses`    | Warehouse management                |
| `/customers`               | Customer list                       |
| `/suppliers`               | Supplier list                       |

### Баримт бичиг (Documents)

| Route             | Description                          |
| ----------------- | ------------------------------------ |
| `/invoices`       | Invoice list                         |
| `/invoices/new`   | Create invoice (redirects to drawer) |
| `/invoices/[id]`  | Invoice detail                       |
| `/quotations`     | Quotation list                       |
| `/quotations/new` | Create quotation                     |
| `/discounts`      | Discount management                  |

### Шинжилгээ (Analytics)

| Route             | Description                                                  |
| ----------------- | ------------------------------------------------------------ |
| `/reports`        | Reports dashboard (charts, KPIs)                             |
| `/commissions`    | Commission tracking                                          |
| `/accounting`     | Double-entry accounting (chart of accounts, journal entries) |
| `/accounting/new` | Create account (redirects to drawer)                         |
| `/audit`          | Activity history log                                         |

### Систем (System)

| Route                     | Description                             |
| ------------------------- | --------------------------------------- |
| `/settings`               | Organization settings                   |
| `/settings/organization`  | Org profile                             |
| `/settings/users`         | User management                         |
| `/settings/roles`         | Roles & permissions                     |
| `/settings/branding`      | Branding/themes configuration           |
| `/settings/notifications` | Notification config (Telegram, email)   |
| `/settings/smtp`          | SMTP technical config (superadmin only) |

### Shop (Point of Sale)

| Route                | Description                     |
| -------------------- | ------------------------------- |
| `/shop`              | POS catalog with barcode search |
| `/shop/cart`         | Shopping cart                   |
| `/shop/checkout`     | Checkout flow                   |
| `/shop/history`      | Sales history (shop)            |
| `/shop/history/[id]` | Sale detail                     |
| `/shop/receipt/[id]` | Receipt view (printable)        |

## Organization Setup

| Route               | Description                             |
| ------------------- | --------------------------------------- |
| `/organization/new` | Create organization (post-registration) |

## API Routes

| Route                    | Description                     |
| ------------------------ | ------------------------------- |
| `/api/cron/daily-report` | Daily email report cron trigger |
| `/api/cron/setup`        | Cron job setup endpoint         |
| `/api/email/test`        | Email configuration test        |
| `/api/export/customers`  | CSV export — customers          |
| `/api/export/expenses`   | CSV export — expenses           |
| `/api/export/inventory`  | CSV export — inventory          |
| `/api/export/products`   | CSV export — products           |
| `/api/export/reports`    | CSV export — reports            |
| `/api/export/sales`      | CSV export — sales              |
| `/api/export/suppliers`  | CSV export — suppliers          |

## Auth

| Route            | Description                    |
| ---------------- | ------------------------------ |
| `/auth/callback` | Supabase Auth redirect handler |
