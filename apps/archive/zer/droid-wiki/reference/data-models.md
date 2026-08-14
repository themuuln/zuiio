# Data models

Active contributors: themuuln

This page documents the key database tables organized by domain. All tables are in the `public` schema and use UUID primary keys generated via `gen_random_uuid()`.

## Organization domain

### `organizations`
The top-level tenant table. Every row in the app belongs to an organization.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Default `gen_random_uuid()` |
| `name` | TEXT | Organization display name |
| `slug` | TEXT | URL-friendly identifier |
| `currency` | TEXT | Default currency code |
| `company_type` | TEXT | Company type classification |
| `brand_config` | JSONB | Branding config (theme, fonts, colors, radius, logo) |
| `has_email_reports` | BOOLEAN | Feature gate for email reports |
| `has_brands` | BOOLEAN | Feature gate for brand presets |
| `has_suppliers` | BOOLEAN | Feature gate for suppliers |
| `has_inventory` | BOOLEAN | Feature gate for inventory |
| `has_variants` | BOOLEAN | Feature gate for product variants |
| `enabled_features` | TEXT[] | Array of enabled feature flags |
| `created_at` | TIMESTAMPTZ | Default `now()` |

### `profiles`
User profiles linked to auth.users.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | References `auth.users.id` |
| `organization_id` | UUID FK | References `organizations(id)` |
| `role_id` | UUID FK | References `roles(id)` |
| `branch_id` | UUID FK | References `branches(id)` |
| `full_name` | TEXT | Display name |
| `is_owner` | BOOLEAN | Whether user is org owner |

### `roles`
Organization roles for RBAC.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID FK | References `organizations(id)` |
| `name` | TEXT | Role name |
| `description` | TEXT | Optional description |
| `hierarchy_level` | INTEGER | For role ordering |
| `is_system_role` | BOOLEAN | System roles cannot be deleted |

### `role_permissions`
Maps permissions to roles.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `role_id` | UUID FK | References `roles(id)` |
| `permission` | TEXT | Permission key (e.g., `sales.create`, `roles.manage`) |

Permissions are defined as an `app_permission` enum type.

### `branches`
Multi-branch support for organizations.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID FK | References `organizations(id)` |
| `name` | TEXT | Branch name |
| `address` | TEXT | Optional address |
| `is_active` | BOOLEAN | Whether branch is active |

## Product domain

### `products`
The core product table. Supports soft-delete and optional variant relationships.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID FK | References `organizations(id)` |
| `name` | TEXT | Product name |
| `sku` | TEXT | Stock keeping unit |
| `barcode` | TEXT | Barcode (for scanner) |
| `description` | TEXT | Optional description |
| `category_id` | UUID FK | References `categories(id)` |
| `unit` | TEXT | Unit of measure |
| `unit_cost` | NUMERIC(12,2) | Cost price |
| `unit_price` | NUMERIC(12,2) | Selling price |
| `image_url` | TEXT | Product image |
| `has_variants` | BOOLEAN | Whether this product uses variants |
| `is_deleted` | BOOLEAN | Soft-delete flag |
| `created_at` | TIMESTAMPTZ | |

### `product_variants`
Individual variants of a parent product (size, color, etc.).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `product_id` | UUID FK | References `products(id)` |
| `sku` | TEXT | Variant-specific SKU |
| `barcode` | TEXT | Variant-specific barcode |
| `unit_price` | NUMERIC(12,2) | Override parent price |
| `image_url` | TEXT | Variant-specific image |

### `product_variant_groups`
Groupings for variant options (e.g., "Color", "Size").

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `product_id` | UUID FK | References `products(id)` |
| `name` | TEXT | Group name (e.g., "Color") |

### `product_variant_options`
Specific values within a variant group (e.g., "Red", "Large").

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `group_id` | UUID FK | References `product_variant_groups(id)` |
| `value` | TEXT | Option value |

### `product_variant_assignments`
Links variants to their option values.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `variant_id` | UUID FK | References `product_variants(id)` |
| `option_id` | UUID FK | References `product_variant_options(id)` |

### `product_bundles`
Kit/product bundle definitions.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `name` | TEXT | Bundle name |
| `description` | TEXT | Optional description |
| `unit_price` | NUMERIC(12,2) | Bundle price |
| `is_active` | BOOLEAN | |

### `product_bundle_items`
Individual products within a bundle.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `bundle_id` | UUID FK | References `product_bundles(id)` |
| `product_id` | UUID FK | References `products(id)` |
| `quantity` | NUMERIC(12,2) | Quantity in bundle |

### `categories`
Product categories.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `name` | TEXT | Category name |
| `parent_id` | UUID FK | Self-referencing for subcategories |

### `brands`
Brand definitions (used in brand presets).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `name` | TEXT | Brand name |

## Transaction domain

Many transaction types follow the same header + line items pattern:

### `sales` / `sale_items`
Sales transactions.

`sales` columns: `id`, `organization_id`, `contact_id`, `sale_number`, `sale_date`, `status` (draft, active, cancelled), `total_amount`, `paid_amount`, `payment_method`, `payment_status`, `salesperson_id`, `branch_id`, `notes`, `created_by`.

`sale_items` columns: `id`, `sale_id`, `product_id`, `variant_id`, `quantity`, `unit_price`, `total_price` (generated: `quantity * unit_price`).

### `purchase_orders` / `purchase_order_items`
Purchase/procurement orders.

`purchase_orders` columns: `id`, `organization_id`, `supplier_id`, `order_number`, `order_date`, `expected_date`, `status` (draft, sent, partially_received, received, cancelled), `total_amount`, `notes`, `created_by`.

`purchase_order_items` columns: `id`, `purchase_order_id`, `product_id`, `description`, `quantity`, `unit_cost`, `total_cost` (generated), `received_quantity`.

### `returns` / `return_items`
Sales returns/refunds.

`returns` columns: `id`, `organization_id`, `sale_id`, `contact_id`, `return_number`, `return_date`, `status`, `total_amount`, `reason`, `created_by`.

`return_items` columns: `id`, `return_id`, `product_id`, `variant_id`, `quantity`, `unit_price`, `total_price` (generated).

### `invoices` / `invoice_items`
Invoicing with public share links.

`invoices` columns: `id`, `organization_id`, `contact_id`, `invoice_number`, `issue_date`, `due_date`, `status` (draft, sent, paid, overdue, cancelled), `total_amount`, `paid_amount`, `notes`, `public_share_token`, `created_by`.

`invoice_items` columns: `id`, `invoice_id`, `product_id`, `description`, `quantity`, `unit_price`, `total_price` (generated).

### `quotations` / `quotation_items`
Estimates/quotations.

`quotations` columns: `id`, `organization_id`, `contact_id`, `quote_number`, `issue_date`, `expiry_date`, `status`, `total_amount`, `notes`, `created_by`.

`quotation_items` columns: `id`, `quotation_id`, `product_id`, `description`, `quantity`, `unit_price`, `total_price` (generated).

### `expenses`
Expense tracking.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `category_id` | UUID FK | |
| `amount` | NUMERIC(12,2) | |
| `description` | TEXT | |
| `expense_date` | DATE | |
| `created_by` | UUID FK | |

### `contacts`
Unified contact table used for customers, suppliers, and general contacts.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `name` | TEXT | Contact name |
| `phone` | TEXT | |
| `email` | TEXT | |
| `type` | TEXT | Contact type (customer, supplier, both) |
| `company` | TEXT | Company name |
| `tax_id` | TEXT | Tax ID / VAT number |
| `address` | TEXT | |
| `is_active` | BOOLEAN | |

## Inventory domain

### `warehouses`
Multi-warehouse support.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `branch_id` | UUID FK | Optional branch association |
| `name` | TEXT | Warehouse name |
| `is_active` | BOOLEAN | |

### `warehouse_products`
Stock levels per product per warehouse.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `warehouse_id` | UUID FK | |
| `product_id` | UUID FK | |
| `quantity` | NUMERIC(12,2) | Current stock |
| `min_stock` | NUMERIC(12,2) | Minimum stock level |

### `stock_movements`
Audit trail for all stock changes.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `product_id` | UUID FK | |
| `warehouse_id` | UUID FK | |
| `variant_id` | UUID FK | Optional variant reference |
| `quantity_change` | NUMERIC(12,2) | Positive for in, negative for out |
| `reason` | TEXT | Reason code |
| `reference_type` | TEXT | Source document type (sale, purchase, etc.) |
| `reference_id` | UUID | Source document ID |
| `batch_id` | UUID | For grouping bulk adjustments |
| `created_by` | UUID FK | |

## Accounting domain

### `chart_of_accounts`
COA with organization isolation.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `account_number` | TEXT | Account code |
| `name` | TEXT | Account name |
| `type` | TEXT | Account type (asset, liability, equity, revenue, expense) |
| `is_active` | BOOLEAN | |

### `journal_entries`
General journal entries for double-entry accounting.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `branch_id` | UUID FK | Optional branch filter |
| `entry_number` | TEXT | Auto-generated entry number |
| `entry_date` | DATE | |
| `description` | TEXT | |
| `reference_type` | TEXT | Source document type |
| `reference_id` | UUID | Source document ID |
| `created_by` | UUID FK | |

### `journal_entry_lines`
Individual debit/credit lines within a journal entry.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `journal_entry_id` | UUID FK | |
| `account_id` | UUID FK | References `chart_of_accounts(id)` |
| `debit` | NUMERIC(12,2) | |
| `credit` | NUMERIC(12,2) | |
| `description` | TEXT | |

### Stored procedures
- `get_trial_balance` — Returns trial balance with branch filtering support.
- `set_role_permissions` — Atomically replaces all permissions for a role.

## Commission domain

### `commission_payouts`
Commission payout records.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `salesperson_id` | UUID FK | |
| `period_start` | DATE | |
| `period_end` | DATE | |
| `total_commission` | NUMERIC(12,2) | |
| `status` | TEXT | |

### `commission_payout_items`
Individual commission line items.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `payout_id` | UUID FK | |
| `sale_id` | UUID FK | |
| `commission_amount` | NUMERIC(12,2) | |
| `sale_amount` | NUMERIC(12,2) | |

## Other tables

### `audit_log`
Tracks all data changes across the system.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `table_name` | TEXT | |
| `record_id` | UUID | |
| `action` | TEXT | INSERT, UPDATE, DELETE |
| `old_data` | JSONB | |
| `new_data` | JSONB | |
| `changed_by` | UUID FK | |
| `created_at` | TIMESTAMPTZ | |

### `notifications` / `notification_configs`
Notification system (Telegram-based).

`notification_configs`: `id`, `organization_id`, `channel` (telegram), `config` (JSONB), `is_active`.
`notifications`: `id`, `organization_id`, `type`, `title`, `message`, `is_read`, `created_at`.

### `smtp_configs`
SMTP server configuration for email sending.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `host` | TEXT | |
| `port` | INTEGER | |
| `username` | TEXT | |
| `is_configured` | BOOLEAN | |

### `shared_reports`
Public report sharing links.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `token` | TEXT | Unique share token |
| `report_type` | TEXT | |
| `config` | JSONB | Report configuration |

### `discount_conditions`
Discount and promotion rules.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `name` | TEXT | |
| `type` | TEXT | Discount type |
| `value` | NUMERIC(12,2) | |
| `conditions` | JSONB | Condition rules |

### `uom_conversions`
Units of measurement conversion factors.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `from_uom` | TEXT | |
| `to_uom` | TEXT | |
| `conversion_factor` | NUMERIC(12,6) | |

### `product_presets`
Seed data for brand/product import presets.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `brand_id` | UUID FK | |
| `name` | TEXT | |
| `data` | JSONB | Product preset data |

## Entity relationships

```
organizations
├── profiles (users belong to orgs via organization_id)
│   ├── roles (via role_id)
│   └── branches (via branch_id)
├── branches
├── roles → role_permissions
├── products → categories
│   ├── product_variants → product_variant_assignments → product_variant_options → product_variant_groups
│   └── warehouse_products (stock per warehouse)
├── product_bundles → product_bundle_items → products
├── warehouses (per org, optionally per branch)
├── sales → sale_items → products/variants
├── purchase_orders → purchase_order_items → products
├── returns → return_items → products
├── invoices → invoice_items → products
├── quotations → quotation_items → products
├── expenses
├── contacts (customers, suppliers)
├── chart_of_accounts
│   └── journal_entries → journal_entry_lines → chart_of_accounts
├── commission_payouts → commission_payout_items → sales
├── stock_movements (links to products, warehouses)
├── audit_log (links to any table)
└── notification_configs → notifications
```
