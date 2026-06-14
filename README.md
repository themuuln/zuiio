# Zer ERP

Mongolia-first mini ERP for small businesses — inventory, sales, expenses, customers, suppliers, and a mobile-first Shop POS module.

Built with a Mongolian-language UI. Works on desktop and mobile.

## Tech Stack

- **Framework:** Next.js 16 (App Router, RSC, Server Actions)
- **UI:** React 19, Tailwind CSS v4, shadcn/ui, vaul, Phosphor Icons
- **Backend:** Supabase (PostgreSQL + Auth), Supabase SSR
- **Client State:** @tanstack/react-query v5, Supabase Realtime
- **Language:** TypeScript, Biome for linting/formatting

## Getting Started

### Requirements

- Node.js 18+
- A Supabase project (free tier works)

### Environment Setup

Create `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # required for public share pages
```

### Install & Run

```bash
npm install
PORT=3003 npm run dev
```

The app will be available at [http://localhost:3003](http://localhost:3003).

## Shop POS Module

The `/shop` route provides a mobile-first point-of-sale interface for front-desk staff:

- **Product Catalog** — browse/search products by name/SKU, filter by category, out-of-stock indicators
- **Cart** — add/remove items, adjust quantities, persistent via sessionStorage, item count badge on bottom bar
- **Checkout** — customer search/create, payment method selection (cash/card/bank/invoice), POS-style numeric keypad, automatic change calculation
- **Receipt** — itemized sale summary with "New Sale" to start fresh
- **Sales History** — recent sales list with detail view

The sidebar auto-collapses to icon-only mode on shop routes, maximizing space for the POS interface.

## Reports

The `/reports` route provides a comprehensive end-of-day financial and operational report for any date range:

- **Financial Summary** — total sales, total paid, total expenses, net cash flow, gross profit
- **Per-Product Sales** — breakdown by product with quantity sold, revenue, cost, profit, and margin
- **Expense Breakdown** — expenses grouped by category with totals and transaction counts
- **Stock Movements** — summary of in/out/adjustment movements in the period
- **Pending Sales** — outstanding sales with contact info and amounts

### Public Share Links

Any report can be shared via a public link (no login required):

1. Open `/reports` and select your date range
2. Click **Хуваалцах** (Share) in the action bar
3. Click **Холбоос үүсгэх** (Generate Link) to create a unique, secure token
4. Copy the generated URL and share it with anyone
5. Recipients open the link to see the same report without logging in

Share uses a SECURITY DEFINER Postgres function for secure, controlled data access.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (use `PORT=3003`) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | Biome lint check |
| `npm run test` | Run tests (node:test) |

## Architecture

- **Route groups:** `(auth)` for login/register, `(dashboard)` for authenticated pages, `/r` for public share pages (no auth)
- **Shop POS:** `/shop` route group with mobile-first layout (bottom tab bar, collapsed sidebar)
- **Data:** Supabase PostgreSQL with RLS — tables for organizations, profiles, products, categories, contacts, sales, sale_items, stock_movements, expenses, shared_reports
- **React Query + Optimistic UI:** Client-side caching with stale-while-revalidate. All mutations (shop checkout, product/sale/expense creation) use optimistic updates with automatic rollback on error and error toasts via sonner. Dual invalidation: server `revalidatePath` + client `invalidateQueries`.
- **Supabase Realtime:** Live cache invalidation via `useRealtimeSubscriptions` hook — 4 organization-scoped channels (products, sales, contacts, expenses). Sales changes also invalidate inventory cache. Channels cleand up on unmount, no leaks.
- **Query Infrastructure:** `lib/query/` — `QueryProvider` wrapper, entity key factories (`keys.ts`), per-entity hooks (`useProducts`, `useSales`, `useExpenses`, `useContacts`, `useInventory`), and the subscriptions hook.
- **Reports:** `lib/reports.ts` query library with parallel fetching + shared React components in `components/reports/`
- **Server Actions:** All mutations go through server actions with atomic rollback and stock validation
