# Lore

Active contributors: themuuln

The history of the Zer codebase, as reconstructed from commit messages and migration files.

**Note**: This is a very young codebase — less than two weeks old at the time of writing (first commit on 2026-05-22).

## Era 1: Initial scaffolding (Mid Jun 2026)

_Note: The earliest commits date to 2026-05-22, but the intensive development period began in mid-June._

The repository was initialized with the foundation of a Mongolia-first mini ERP. The initial scaffolding set up:

- Next.js 16 App Router project structure
- Supabase integration with anonymous and service-role clients
- Authentication system (login, register, password reset)
- Organization creation and onboarding flow
- Basic layout with sidebar navigation

The first migrations created the core schema: organizations table, profiles linked to auth.users, and the foundational data model for products and categories.

**Key commits**: Project initialization, Supabase client setup, auth flow, org creation.

## Era 2: Backend infrastructure (Mid Jun 2026)

With the scaffolding in place, the backend infrastructure was built out:

- Row Level Security (RLS) policies for data isolation
- Role-based access control system with custom permissions (`app_permission` enum)
- Multi-branch support added via the `branches` table
- Service client for privileged operations
- Audit logging for tracking all data changes
- Notification system with Telegram integration
- UOM (unit of measure) conversions

The roles and permissions system became the backbone of authorization, with system-defined roles and hierarchy levels. The audit_log table provided full traceability for regulatory compliance.

**Key migrations**: `add_get_current_organization_function.sql`, `create_roles_and_permissions.sql`, `gym_role_presets.sql`, `create_audit_log.sql`, `create_notifications.sql`, `create_uom_conversions.sql`, `add_branches.sql`.

## Era 3: Core features (Mid Jun 2026)

The main ERP features were built in rapid succession:

- **Sales** module with line items, payment tracking, status management, and barcode scanner support
- **Products** module with CRUD, categorization, soft-delete, and product browser
- **Expenses** module for expense tracking by category
- **Customers and suppliers** (unified contacts table) with CRUD drawers
- **Inventory** with warehouse management, stock movements, and stock adjustments
- **Invoices** with public share links and PDF generation
- **Quotations/estimates** with expiry tracking
- **Returns** for handling sales returns and refunds
- **Purchase orders** with receiving workflow
- **Discounts and promotions** with condition rules
- **Reports** dashboard with sales summaries, charts, and data export (PDF, Excel, DOCX)
- **Onboarding** flow for new organizations

All modules followed the same pattern: server component list page → client component with drawer state → slide-in drawers for create/edit/detail.

**Key migrations**: `create_purchases_quotations_returns_accounting_discounts.sql`, `create_invoices.sql`, `create_warehouses.sql`.

## Era 4: Multi-branch and accounting (Mid Jun 2026)

A major milestone was the addition of double-entry accounting and multi-branch support:

- **Chart of accounts** with unique constraint fixes and branch isolation
- **Journal entries** with debit/credit line items
- **Trial balance** stored procedure with branch filtering
- **Commission payouts** with salesperson tracking
- Multi-branch filtering across all data
- Accounting isolation per organization

This era involved complex SQL migrations with RLS policies, stored procedures, and data integrity constraints. The `chart_of_accounts` unique constraint had to be fixed and cleaned up with dedicated migrations.

**Key migrations**: `add_branches.sql`, `fix_coa_unique_constraint.sql`, `cleanup_duplicate_coa_constraint.sql`, `update_trial_balance_branch_filter.sql`, `add_commission_support.sql`, `enable_rls_commission_tables.sql`.

## Era 5: Polish and onboarding (Late Jun 2026)

The final era focused on refinements, feature gating, and new capabilities:

- **Product variants** system: variant groups, options, assignments, and barcode/SKU per variant
- **Product bundles/kits**: group products for sale as a single item
- **Feature gating**: `has_variants`, `has_inventory`, `has_suppliers`, `has_brands` columns on organizations
- **Brand presets**: import pre-built brand and product templates from a library
- **Restock flows**: multi-warehouse restocking with batch adjustments
- **Branding system**: 7 themes, 10 fonts, custom colors, organization-level CSS variables
- **Storage bucket**: `brand_assets` for logos and brand assets
- **Leave organization** self-service
- **Product soft-delete**
- **SMTP configuration** for email sending
- **Shared reports** with public tokens
- **Accessibility tests** added to E2E suite
- **E2E test expansion**: feature gating tests, restock deep flows, CRUD tests for all entities

This era also saw extensive E2E test writing with 18 spec files covering all modules, cross-area flows, and edge cases.

**Key migrations**: `create_product_variants.sql`, `create_product_bundles.sql`, `seed_product_presets.sql`, `add_brand_config.sql`, `create_brand_assets_bucket.sql`, `add_onboarding_columns.sql`, `add_org_settings.sql`, product soft-delete.

## Timeline summary

| Date | Event |
|------|-------|
| 2026-05-22 | First commit — project initialization |
| Mid Jun 2026 | Backend infrastructure (auth, RLS, roles, multi-branch) |
| Mid Jun 2026 | Core features (sales, products, expenses, inventory) |
| Mid Jun 2026 | Accounting system (chart of accounts, journal entries) |
| Late Jun 2026 | Variants, bundles, branding, feature gating, E2E tests |
| 2026-06-21 | Current state — ~145 commits, full-featured mini ERP |

## Productivity note

The entire codebase was built in less than two weeks by a single developer (Temuulen Undrakhbayar). With 145 commits and ~67,000 lines of TypeScript/TSX, this represents an intense, focused development effort covering all major ERP domains: sales, purchasing, inventory, accounting, invoicing, commissions, reporting, and more.
