# 7. Admin dashboard (`src/app/[locale]/admin/`)

`layout.tsx` checks Supabase session + `admin_users` membership (redirect to `/admin/login`; email+password or magic link). All admin mutations are server actions using the service-role client after re-checking admin.

UI: shadcn/ui components; tables = shadcn table + TanStack Table (pattern: `apps/tolom/src/components/data-table-dashboard.tsx`).

| Route | Content |
|---|---|
| `admin` | Dashboard: today/7d/30d revenue (₮), cost, margin (from order_items snapshots), orders by status, failed-provisioning count |
| `admin/catalog` | Packages table, enable/disable toggles, `needs_repricing` badges, **Sync** button → server action: `provider.listCatalog()` → upsert by `(provider, provider_package_id)`; missing → `is_archived=true, is_enabled=false`; `cost_usd` changed → update + `needs_repricing=true` + Telegram alert (min-margin floor protects meanwhile) |
| `admin/pricing` | Rules CRUD (global %, per-region, per-package) + **live preview**: pick any package → cost USD → cost ₮ → markup → floor → rounded retail, computed with the same `engine.ts` |
| `admin/fx` | Current USD→MNT rate, history table, set-new-rate form (inserts `fx_rates` row) with price-impact preview on top packages |
| `admin/orders` + `admin/orders/[id]` | Filterable list; detail: payment info, pricing snapshot, esims, provisioning job log; actions: **Retry provisioning** (re-queue), **Mark refunded** (order+esim `refunded`; optional `provider.cancel`; QPay refund manual in merchant portal for v1, recorded as `payments.status='refunded'`) |
| `admin/esims/[id]` | Low-level view: ICCID, LPA, QR, raw provider status, refresh-status button (`getEsimStatus`), usage if available |
