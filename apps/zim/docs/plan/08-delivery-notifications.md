# 8. Delivery & notifications

## QR generation

- Server: `qrcode` → PNG buffer for email CID attachment
- Client: `qrcode.react` → SVG on the delivery page
- QR content = the raw `lpa_string` (`LPA:1$smdp$code`) — what iOS/Android camera installers expect

## Email (`src/lib/email.ts`)

Adapted from `apps/zer/src/lib/email.ts` but simplified — SMTP config from env, not a `smtp_configs` table (single-tenant). Reuse zer's `escapeHtml` approach.

Templates (mn/en by order locale):
1. **Order confirmation** + payment link
2. **eSIM delivery**: QR image (CID inline), LPA string, ICCID, install steps, link to delivery page with access token

## Telegram (`src/lib/telegram.ts`)

Adapted from `apps/zer/src/lib/notification.ts` minus org-config tables — env-driven bot token + admin chat id.

Events:
- `new_sale` — order code, package, retail price, margin
- `provisioning_failed`
- `sync_repricing_needed`

All fire-and-forget with `capture()` on error (`@zuiio/capture`).
