# Zer ERP

Active contributors: themuuln

## Purpose

Zer is a Mongolia-first mini ERP for small businesses. It handles sales (including a POS Shop module), expenses, purchases, returns, invoices, quotations, discounts, inventory management with multi-warehouse and multi-branch support, product variants, commissions, double-entry accounting, audit logging, Telegram notifications, branded theming, and automated email reporting. The entire UI is in Mongolian.

## Tech Stack

| Layer         | Technology                                           |
| ------------- | ---------------------------------------------------- |
| Framework     | Next.js 16.2.6 (App Router, Turbopack)               |
| Database      | Supabase (PostgreSQL 14.5)                           |
| Auth          | Supabase SSR (`@supabase/ssr`)                       |
| UI            | Tailwind CSS v4, shadcn/ui, Base UI (drawers)        |
| State         | TanStack React Query v5, React 19 Server Components  |
| Icons         | Phosphor Icons                                       |
| Tables        | TanStack React Table v8                              |
| Forms         | react-hook-form + zod                                |
| Charts        | Recharts                                             |
| Linting       | Biome 2.2                                            |
| Testing       | Vitest (unit), Playwright (E2E), CodeceptJS (AI E2E) |
| Theme         | next-themes (dark mode)                              |
| Notifications | Sonner (toast), Telegram bot                         |

## Key Features

- **Multi-Branch Support** — Physical location management with isolated transactions, per-branch trial balance, and consolidated accounting
- **Product Variants** — Multi-group variant system supporting arbitrary combinations (Size × Color, Material × Size × Finish)
- **Product Bundles** — Create kits from multiple products for simplified checkout
- **Shop POS** — Mobile-first point-of-sale with product catalog, cart, numeric keypad, customer picker, and receipt printing
- **Double-Entry Accounting** — Full chart of accounts, journal entries, trial balance with auto-posting from sales, expenses, and purchases
- **Public Routes** — Shareable report links and invoice payment pages without authentication
- **Brand Theming** — Per-organization CSS variable overrides with 7 pre-built themes
- **Onboarding Wizard** — Guided setup with brand presets and feature selection
- **Feature Gating** — 10+ boolean org settings that control sidebar visibility and feature availability

## Quick Links

- [Architecture](architecture.md)
- [Getting Started](getting-started.md)
- [Glossary](glossary.md)
