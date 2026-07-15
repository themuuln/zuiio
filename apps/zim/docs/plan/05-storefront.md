# 5. Customer storefront

Mobile-first, `mn` default locale + `en`, next-intl with `[locale]` segment (routing setup copied from `apps/zatly/src/i18n/*`). Use `formatCurrency` from `@zuiio/core` for ₮ display. UI composed from shadcn/ui components.

## Routes (`src/app/[locale]/`)

| Route | Purpose |
|---|---|
| `/` | Landing: hero, popular destinations grid (China first), how-it-works, trust strip |
| `/destinations` | All destinations + client-side search (data passed from RSC) |
| `/destinations/[slug]` | Package list for region; client filters: data size, validity, price sort |
| `/packages/[id]` | Detail: coverage list, price, device-compatibility note, buy CTA |
| `/checkout` | Guest form (phone + email; zod + react-hook-form); server action creates order → redirect to pay |
| `/pay/[orderCode]` | QPay QR + bank-app deep link + 3s status polling of `/api/payments/status`; on paid → redirect |
| `/orders/[orderCode]` | Delivery page: eSIM QR (qrcode.react, payload = raw LPA string), copy-LPA button, ICCID, iOS/Android install accordions, provisioning/failed states. Gated by HMAC token (`?t=`) issued at checkout + in email |
| `/lookup` | Order lookup: order_code + phone → server action verifies → redirect with fresh token |
| `/my/orders` | Authed users (optional magic link): orders where customer linked to `auth.uid()` |

## Checkout server action

`src/app/[locale]/checkout/actions.ts` (pattern: `apps/zer/src/app/(dashboard)/shop/actions.ts`):

1. Validate (zod)
2. Upsert customer
3. Quote via pricing wrapper (`quote.ts`)
4. Insert order (code `ZIM-` + 6 chars, unambiguous alphabet) + order_item snapshot + esim row (`pending`)
5. Create QPay invoice, insert payment row
6. Redirect to `/pay/[orderCode]`

## Scope note

V1 is **single-package buy-now** (quantity 1); no cart. `order_items` is already array-shaped, so a multi-item cart (reuse the reducer pattern from `apps/zer/src/lib/shop-cart.ts`) is a clean v2.
