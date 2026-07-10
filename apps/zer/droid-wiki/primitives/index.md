# Core Concepts

Active contributors: themuuln

## Purpose

The Primitives lens describes the fundamental domain objects in Zer — the core data models that everything else is built on. These are the conceptual building blocks of the ERP: organizations, products, contacts, and transactions.

## Pages

| Page | Description |
|------|-------------|
| [Organization](./organization) | Tenant model, company_types, onboarding columns, enabled_features, has_* booleans, brand_config, CSS theming via branding.ts |
| [Product](./product) | Products table fields, variant system (groups/options/assignments), bundle system, categories, brands |
| [Contact](./contact) | Contacts table (customers + suppliers), type discrimination (type column), balance tracking |
| [Transaction](./transaction) | Shared line-item pattern across sales/purchases/returns/invoices/quotations, useFieldArray pattern, consistent total calculation |

## Key Source Files

| File | Primitive |
|------|-----------|
| `src/lib/supabase/types.ts` (organizations) | Organization |
| `src/lib/branding.ts` | Organization |
| `src/lib/supabase/types.ts` (products) | Product |
| `supabase/migrations/20260618000002_create_product_variants.sql` | Product |
| `supabase/migrations/20260621000002_create_product_bundles.sql` | Product |
| `src/lib/supabase/types.ts` (contacts) | Contact |
| `src/lib/supabase/types.ts` (sales, purchases, invoices, quotations, returns) | Transaction |
