# Mutation Patterns in zer Project

## Server Actions Found (10 files)

### Auth Actions
| File | Action | Tables Written |
|------|--------|---------------|
| `src/app/(auth)/login/actions.ts` | login | auth.users (via supabase.auth) |
| `src/app/(auth)/register/actions.ts` | register | auth.users, profiles |
| `src/app/(auth)/forgot-password/actions.ts` | forgotPassword | auth.users |
| `src/app/(auth)/reset-password/actions.ts` | resetPassword | auth.users |

### Dashboard Actions
| File | Action | Tables Written | Revalidates |
|------|--------|---------------|-------------|
| `src/app/(dashboard)/actions.ts` | logout | — (sign out) | — |
| `src/app/(dashboard)/organization/new/actions.ts` | createOrganization | organizations, profiles (via RPC) | layout |

### Data Mutations (Primary Targets for Optimistic UI)
| File | Action | Tables Written | Revalidates |
|------|--------|---------------|-------------|
| `src/app/(dashboard)/products/new/actions.ts` | createProduct | products, categories, stock_movements | /products, /inventory, / |
| `src/app/(dashboard)/sales/new/actions.ts` | createSale | sales, sale_items, stock_movements, contacts, products(current_stock) | /, /sales, /inventory, /products |
| `src/app/(dashboard)/shop/actions.ts` | createShopSale | sales, sale_items, stock_movements, contacts, products(current_stock) | /shop, /shop/history |
| `src/app/(dashboard)/expenses/new/actions.ts` | createExpense | expenses | /, /expenses |

## Client-Side Fetching (useEffect)

| File | What | Issue |
|------|------|-------|
| `src/app/(dashboard)/shop/checkout/page.tsx` | Fetches contacts list on mount via createClient() | No caching, no refetch, stale after new customer created |

## All Server Component Data Fetches

| Page | Tables Queried | Organization-Scoped? |
|------|---------------|---------------------|
| `shop/page.tsx` | products, categories | Yes |
| `shop/history/page.tsx` | sales, contacts, sale_items | Yes |
| `shop/receipt/[id]/page.tsx` | sales, sale_items, products | Yes |
| `products/page.tsx` | products, categories | Yes |
| `inventory/page.tsx` | products | Yes |
| `inventory/movements/page.tsx` | stock_movements, products | Yes |
| `sales/page.tsx` | sales, contacts | Yes |
| `sales/new/page.tsx` | products, contacts (server) | Yes |
| `expenses/page.tsx` | expenses | Yes |
| `dashboard/page.tsx` | sales, expenses, products (metrics) | Yes |
| `suppliers/page.tsx` | contacts | Yes |
| `customers/page.tsx` | contacts | Yes |
| `settings/users/page.tsx` | profiles | Yes |

## Rollback Patterns

- **createProduct**: Multi-step rollback (reverse order): stock_movements → products → categories
- **createSale (ERP)**: Multi-step rollback: stock_movements → sale_items → sales → contacts
- **createShopSale**: Multi-step rollback with atomic `.gte()` guarding on stock decrement

## Revalidation Gaps

- Shop sales (`createShopSale`) do NOT revalidate `/inventory` or `/products` (only /shop, /shop/history)
- ERP sales (`createSale`) do NOT revalidate `/shop` or `/shop/history`
- No `revalidateTag` used anywhere — all `revalidatePath`
- Client-side cache (React Query) not invalidated — no React Query
