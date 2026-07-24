# 6. Payment flow (QPay)

Adapt `apps/zerbu/src/lib/payment-service.ts` into `src/lib/qpay.ts`.

- `createInvoice(order)`: `senderInvoiceNo = order_code`, `amount = total_mnt`, `callbackUrl = ${QPAY_CALLBACK_URL}?code=${order_code}`. **Never pass trusted data in the callback URL beyond the code** (zerbu trusts `plan` from query params — do not copy that).
- `checkPayment(invoiceId)` as in zerbu.
- `QPAY_MOCK=true`: in-memory fake client returning a stub QR + dev-only `POST /api/payments/mock-pay` (guarded `NODE_ENV !== "production"`) that marks the fake invoice paid — enables full local/E2E flow.

## Single settlement function

`settleOrderPayment(orderCode)` in `src/lib/orders.ts` — called by BOTH the callback route and the polling route (kills the callback-vs-polling race):

1. Load order + payment (service role)
2. If order not `pending_payment` → return current state (idempotent no-op; handles duplicate callbacks)
3. If past `expires_at` and unpaid → mark expired, return
4. Verify with QPay `checkPayment(invoice_id)` — never trust callback body/query
5. Atomic transition: `update orders set status='paid' where id=$1 and status='pending_payment' returning id` — zero rows = another request won; return
6. Update payment row (`paid`, `qpay_payment_id`, `paid_at`, raw)
7. Insert `provisioning_jobs` row, then attempt provisioning inline
8. Telegram "new sale" alert (fire-and-forget)

## Routes

- `GET /api/payments/callback` → `settleOrderPayment(code)` → 200 (QPay just needs a 200)
- `GET /api/payments/status?code=` → if `pending_payment`, call `settleOrderPayment` (covers missed callbacks); respond `{status}` for the polling UI

## Provisioning (`src/lib/provisioning.ts`)

`runProvisioning(orderId)` — set order `provisioning`, call `provider.provision({orderRef: order_code, …})`:

- `delivered` → update esims rows (iccid/lpa/qr, `delivered`), order `delivered`, job `succeeded`, send delivery email
- `pending` → store `providerOrderId` on esim, leave order `provisioning`; webhook completes it
- `failed` retryable → job stays `queued`, `attempts+1`, `next_retry_at = now() + 2^attempts minutes`, Telegram failure alert. After `max_attempts` → `failed_permanent`, order `failed`, admin alert (money held → manual refund)

## Crons (guard with `CRON_SECRET`)

- `GET /api/cron/expire-orders` (every 10 min): expire `pending_payment` orders past `expires_at`
- `GET /api/cron/retry-provisioning` (every 5 min): pick `queued` jobs with `next_retry_at <= now()`; claim via `update … set status='running' where status='queued'` to avoid double-execution
