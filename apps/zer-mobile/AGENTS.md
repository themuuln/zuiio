# Zer Mobile

React Native (Expo) consumer storefront app for Zer ERP storefronts. Reads the
same public Supabase RPCs as the web storefront (apps/zer) and shares its
Supabase project.

## Stack

- **Framework**: Expo SDK 57 + Expo Router (file-based routing), Expo Go compatible
- **UI**: NativeWind (Tailwind CSS for React Native), brand tokens in `global.css`
- **State**: TanStack Query v5 (server state) + zustand (cart, persisted via AsyncStorage)
- **Auth**: `@zuiio/auth` + expo-secure-store (session persisted in SecureStore)
- **Backend**: Supabase — same project as `apps/zer` (URL + publishable key in env)

## Environment

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Copy values from `apps/zer/.env.local` (the Zer web app uses the same project).

## Commands

```bash
pnpm dev        # start Expo
pnpm typecheck  # tsc --noEmit
pnpm test       # jest (unit tests in src/lib/__tests__)
```

## Project Structure

```
src/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Providers (React Query + SupabaseAuthProvider)
│   ├── index.tsx           # Store list (slug input + recent stores)
│   └── store/[slug]/       # Catalog, product, cart, checkout, success,
│                           # account (login/signup), orders
├── components/             # RN components (ui/ mirrors tolom-mobile)
├── lib/                    # Pure, unit-tested data layer
│   ├── catalog.ts          # get_public_products / get_public_product / get_public_categories
│   ├── checkout.ts         # process_shop_sale payload + submitShopOrder
│   ├── store-account.ts    # store_accounts upsert helpers (mirror web use-store-session)
│   ├── orders.ts           # get_my_orders() wrapper
│   ├── queue.ts            # local pending-order queue (offline fallback)
│   └── storage.ts          # KV abstraction over AsyncStorage
└── store/                  # zustand stores (cart, recent stores)
```

## Data / Backend Boundaries

- Public catalog RPCs (`get_public_products`, `get_public_product`,
  `get_public_categories`) are granted to `anon` — buyers never need auth to browse.
- Buyer auth: `supabase.auth.signUp` with metadata `{ store_account: true, ... }`,
  then `store_accounts` own-row upsert (RLS: `auth.uid() = id`).
- Order history: `get_my_orders()` (SECURITY DEFINER, returns caller's own orders).
- **Checkout limitation (known)**: the web submits orders through the staff-only
  server action `createShopSale` → `process_shop_sale` RPC (guarded by
  `has_permission('sales.create')`, requires org/branch/salesperson ids). No
  public buyer checkout RPC/route exists in the backend. The app builds the
  exact `process_shop_sale` payload (`src/lib/checkout.ts`) and submits it when
  org/branch ids are supplied; otherwise checkout offers to queue the order
  locally (status "pending_sync", shown in order history). Wiring a real buyer
  channel requires a backend RPC (e.g. a buyer-scoped sale function granted to
  `authenticated`) — outside this app's boundary.
- Coupon/gift-card validation is NOT public (server-action only); codes are
  passed through in the payload for server-side validation.
- The public catalog RPCs deliberately do not expose stock counts
  (`current_stock` is not returned), so stock badges render only when the
  backend starts returning them.

## Rules

- TypeScript strict; named exports; `interface` over `type`.
- TanStack Query v5 — use `isPending`, object syntax.
- NativeWind for styling; Mongolian strings inline (no i18n framework).
- Tests: real unit tests for pure libs in `src/lib/__tests__` (jest + babel-preset-expo).
  Run specific files with `pnpm test -- <path>`.
- Never commit secrets; `.env*.local` is gitignored.
- Do NOT edit `apps/zer/**` (web) or `packages/**` from this app.
