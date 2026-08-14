# Coupon System — Phase 1 Implementation Plan

## Context
Zer has `discounts` (admin-applied percentage/fixed_amount discounts) but no **coupon code system**. Customers cannot enter codes at checkout. This is a critical gap vs shop.mn, where coupon codes are a standard feature. Coupons drive customer acquisition and checkout conversion.

## Scope
Phase 1 covers: coupon code creation/management UI + customer coupon entry at checkout + coupon validation.

Gift cards, promotions engine, analytics, SEO → deferred to later phases.

## Files to Change

### Database
| File | Action | What changes |
|------|--------|--------------|
| `supabase/migrations/20260730000001_create_coupons.sql` | **Create** | Coupons table, app_permission enum values, RLS, grants |

### Server Actions
| File | Action | What changes |
|------|--------|--------------|
| `src/app/(dashboard)/coupons/actions.ts` | **Create** | CRUD server actions + `validateCoupon` action |
| `src/app/(dashboard)/shop/actions.ts` | **Modify** | Add coupon_code + discount_amount params to `createShopSale`; validate + apply coupon |

### Page & UI
| File | Action | What changes |
|------|--------|--------------|
| `src/app/(dashboard)/coupons/page.tsx` | **Create** | Coupons list page with DataTable |
| `src/app/(dashboard)/coupons/coupons-content.tsx` | **Create** | Client component with table + drawer wiring |
| `src/components/coupons/coupon-create-drawer.tsx` | **Create** | Create drawer with react-hook-form + zod |
| `src/components/coupons/coupon-edit-drawer.tsx` | **Create** | Edit drawer |
| `src/components/coupons/coupon-detail-drawer.tsx` | **Create** | Detail drawer |
| `src/app/(dashboard)/coupons/layout.tsx` | **Create** | Optional layout if needed |

### Checkout Integration
| File | Action | What changes |
|------|--------|--------------|
| `src/components/shop/checkout-form.tsx` | **Modify** | Add coupon code input field + apply button + discount display |
| `src/components/shop/checkout-coupon.tsx` | **Create** | Coupon input component (code field, validate button, applied state, remove) |

### Sidebar Navigation
| File | Action | What changes |
|------|--------|--------------|
| `src/app/(dashboard)/coupons/` → sidebar config | **Modify** | Add "Купон" nav item (sidebar config likely in gen-sidebar.sh or a sidebar config) |

### Tests
| File | Action | What changes |
|------|--------|--------------|
| `tests/actions-coupons.test.ts` | **Create** | CRUD + validation tests |
| Modify existing checkout test | **Modify** | Add coupon flow to e2e if exists |

## Database Schema

```sql
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC(12, 2) NOT NULL,
  min_purchase_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  max_discount_amount NUMERIC(12, 2),         -- cap for percentage coupons
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  usage_limit INTEGER,                         -- total uses across all customers
  used_count INTEGER NOT NULL DEFAULT 0,
  per_customer_limit INTEGER DEFAULT 1,        -- how many times one customer can use
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'selected_products', 'selected_categories')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, code)
);

-- Coupon usage tracking (for per-customer limits)
CREATE TABLE public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT now()
);

-- App permission enum values
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'coupons.create';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'coupons.read';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'coupons.update';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'coupons.delete';
```

## Server Actions

### `src/app/(dashboard)/coupons/actions.ts`

| Function | Method | Description |
|----------|--------|-------------|
| `createCoupon(prev, formData)` | Server Action | Creates coupon. Perm: `coupons.create` |
| `updateCoupon(prev, formData)` | Server Action | Updates coupon. Perm: `coupons.update` |
| `toggleCouponActive(id, isActive)` | Server Action | Toggle. Perm: `coupons.update` |
| `deleteCoupon(id)` | Server Action | Delete. Perm: `coupons.delete` |
| `validateCouponCode(code, customerContactId?)` | Server Action | Validates coupon + returns discount amount. Public (sale.create) |

### `validateCouponCode` logic:
1. Find coupon by code + organization_id + is_active
2. Check valid_from ≤ now ≤ valid_until
3. Check usage_limit > used_count (if usage_limit set)
4. Check per_customer_limit (if contact_id provided, count from coupon_usage)
5. Calculate discount based on cart total
6. For percentage: min(cart_total * percentage/100, max_discount_amount)
7. For fixed_amount: min(discount_value, cart_total)
8. Return: { valid: boolean, discount_amount: number, coupon_id: string, error?: string }

### `createShopSale` changes (in shop/actions.ts):
- Accept new FormData fields: `coupon_code`, `coupon_id`, `discount_amount`
- Validate coupon before processing sale
- Pass `p_discount_amount` to `process_shop_sale` RPC
- Insert `coupon_usage` record after successful sale
- Update `coupons.used_count++`

### `process_shop_sale` RPC changes:
- Add `p_discount_amount NUMERIC DEFAULT 0` parameter
- Apply discount to sale total

## Implementation Order
1. Migration (coupons table, app_permission enum, RLS, grants)
2. Server actions (CRUD + validateCouponCode)
3. Coupon create/edit/detail drawer components
4. Coupons list page + content
5. Checkout integration (coupon input in checkout-form.tsx)
6. Sidebar nav item
7. Tests

## Edge Cases
- **Expired coupon** → return error "Хугацаа дууссан"
- **Usage limit reached** → return error "Ашиглалтын хязгаарт хүрсэн"
- **Per-customer limit reached** → return error "Та энэ купоныг аль хэдийн ашигласан"
- **Min purchase not met** → return error "Хамгийн бага дүн: X₮"
- **Inactive coupon** → return error "Купон идэвхгүй байна"
- **Non-existent code** → return error "Купон олдсонгүй"
- **Concurrent usage** → use atomic UPDATE ... SET used_count = used_count + 1 WHERE used_count < usage_limit
- **Percentage cap** → percentage coupons have max_discount_amount ceiling
- **No customer selected** → still allow coupon, but skip per_customer_limit check
- **Coupon applies to selected products only** → verify cart contains qualifying products

## Verification
1. `pnpm --filter=zer typecheck` — zero new errors
2. `pnpm --filter=zer test -- tests/actions-coupons.test.ts` — all pass
3. Manual: create coupon → enter code in checkout → see discount applied → complete sale → verify usage_count incremented
4. Manual: enter expired coupon → see error toast
5. Manual: enter invalid code → see error toast
