# Zer ERP

A Mongolia-first mini ERP for small businesses. Built with **Next.js 16.2.6** (App Router), **Supabase** (PostgreSQL + Auth), **Tailwind CSS v4**, **shadcn/ui**, and **TanStack React Query v5**.

The entire UI is in Mongolian (Монгол хэл).

## Features

- **Multi-Branch Support** — Physical location management (e.g., gym branches). Each branch has isolated transactions (sales, expenses, purchases, returns, invoices, quotations, discounts, stock movements, commissions), its own chart of accounts with per-branch trial balance, and a consolidated accounting view that merges all branches. Users can be org-wide (access all branches) or branch-scoped. Creating a branch auto-creates a linked warehouse (1:1) and seeds a default chart of accounts. Master data (products, customers, suppliers, categories, brands) is shared across all branches.
- **Authentication** — Login, register, password reset via Supabase SSR with organization-scoped access. First-time users are prompted to create their organization.
- **Dashboard** — KPI overview with total products, customers, suppliers, today's sales and expenses, low stock alerts, pending sales, recent sales, and a monthly sales chart.
- **Products & Variants** — Full CRUD with create/edit/detail drawers, category management page with product counts. **Product Variants** — Multi-group variant system supporting arbitrary combinations (e.g., Size × Color, Material × Size × Finish). Each variant has its own SKU, barcode, cost/sale price, and stock. Variants are configured via a dedicated slide-in drawer with preset group suggestions, matrix-style bulk editing for prices/stock/SKU, and auto-fill from product defaults.
- **Inventory** — Stock level overview with KPIs and stock value, movement history (in/out/adjustment), new stock movement form with atomic stock updates.
- **Sales** — Register view with 7 quick filter chips (Өнөөдөр, 7 хоног, Үлдэгдэлтэй, Бүрэн төлөгдсөн, Цуцлагдсан, Бэлэн, Карт), Үлдэгдэл (balance) column, and inline Төлбөрийн төлөв payment-state badges (Төлөгдсөн/Хэсэгчлэн/Төлөөгүй); multi-line sale entry with add/remove line items, per-row product combobox, quantity, unit price, subtotal, and grand total; customer selection via searchable CustomerPicker supporting inline creation, walk-in mode, and auto-fill; payment quick actions (Бүгд/0/50% buttons) with manual edit detection; inline stock validation that warns and disables save on oversell; post-save workflow with Дэлгэрэнгүй/Дахин бүртгэх toast actions and a keep-open toggle for rapid entry; row click opens a slide-in sale detail drawer with full sale info and line items; plus mobile-first **Shop POS** module (product catalog, cart, checkout with numeric keypad + customer picker, receipt printing, sales history).
- **Customers & Suppliers** — Full CRUD with create/edit/detail drawers, search, balance tracking, phone/email/address management.
- **Expenses** — Expense creation with category/amount/date/payment method, list with search and CSV export.
- **Reports** — 5-section report page (financial summary, product sales, expense breakdown, stock movements, pending sales) with date range filtering, CSV export, and public share links (no login required).
- **Settings** — Organization info editing, profile form, dark mode toggle, user management page with name/email/role display.
- **CSV Export** — All list pages and reports support CSV export via secure API routes.

## Tech Stack

| Layer         | Technology                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Framework     | Next.js 16.2.6 (App Router)                                                                          |
| Database      | Supabase (PostgreSQL)                                                                                |
| Auth          | Supabase SSR (`@supabase/ssr` + `@supabase/supabase-js`)                                             |
| UI            | Tailwind CSS v4, shadcn/ui, Base UI (drawers), Radix UI                                              |
| State         | TanStack React Query v5 with devtools, React 19 Server Components                                    |
| Icons         | Phosphor Icons                                                                                       |
| Tables        | TanStack React Table v8                                                                              |
| Forms         | react-hook-form + zod (`@hookform/resolvers`)                                                        |
| Charts        | Recharts                                                                                             |
| Linting       | Biome 2.2 (with Next.js + React domain rules)                                                        |
| Testing       | Node.js built-in test runner (`node:test` + `node:assert/strict`), tsx runner, Playwright 1.61 (E2E) |
| Theme         | next-themes (dark mode)                                                                              |
| Notifications | Sonner (toast)                                                                                       |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm

### Setup

```bash
git clone <repo>
cd zer
pnpm install
```

Create `.env.local` with Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Development

```bash
pnpm dev -- -p 3101
```

Open [http://localhost:3101](http://localhost:3101).

## Available Scripts

| Script               | Description                                     |
| -------------------- | ----------------------------------------------- |
| `pnpm dev`           | Start development server (use `-p 3101`)        |
| `pnpm build`         | Production build                                |
| `pnpm start`         | Start production server                         |
| `pnpm test`          | Run test suite (331 tests across 13 test files) |
| `pnpm run typecheck` | TypeScript type checking (`tsc --noEmit`)       |
| `pnpm run lint`      | Biome lint check                                |
| `pnpm run format`    | Biome auto-format                               |
| `pnpm run test:e2e`  | Playwright E2E tests                            |

## Testing

Tests use Node.js built-in `node:test` + `node:assert/strict` with the `tsx` runner:

```bash
pnpm test                          # Run all tests
pnpm exec tsx --test tests/*.test.ts  # Run specific test file
```

**10 test files, 229 tests** covering: auth validation, product CRUD validation, inventory calculations, expense grouping, report aggregation, cart reducer logic, and utility formatting.

## Deployment

Vercel-ready. Set these environment variables in production:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
CRON_SECRET                    # optional, for daily report cron
```

## License

Built for Mongolian small businesses. 🇲🇳
