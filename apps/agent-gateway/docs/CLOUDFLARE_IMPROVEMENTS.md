# Cloudflare-Native Improvements — Where Edge Beats Vercel

Vercel is correct for the Next.js app (PPR, streaming, serverless). Cloudflare Workers are better for **always-on edge jobs** that Vercel Hobby throttles.

## 1. QPay polling — `* * * * *` via Cloudflare Cron (IMPLEMENTED)

**Problem:** Vercel Hobby allows one cron per day. QPay orders expire in 15 min, need 1-min poll. `vercel.json: * * * * *` fails deploy.

**Solution (implemented):**
- `vercel.json` `qpay-poll` changed to daily `30 3 * * *` (Hobby passes).
- Real polling moved to `cloudflare-worker/src/scheduled-qpay.ts` + `wrangler-scheduled.jsonc` with `triggers.crons: ["* * * * *"]` (Cloudflare free allows per-minute).
- Worker `fetch(AGENT_GATEWAY_URL/api/cron/qpay-poll, auth: CRON_SECRET)` — holds no DB secrets, just forwards.
- Deploy: `pnpm dlx wrangler deploy --config wrangler-scheduled.jsonc` + set `AGENT_GATEWAY_URL` + `CRON_SECRET` via `wrangler secret put`.

Verify: `curl https://<worker>/__scheduled/qpay-poll` triggers manually; Cloudflare dashboard → Triggers shows next run.

## 2. Duplicate webhook dedupe via Cloudflare KV + Upstash Redis

**Problem:** `seenEvents` Map is in-memory, lost on cold start, causes duplicate handoffs/broadcasts on Vercel scale-to-zero.

**Better:** Keep Upstash Redis primary (`getRedis()` already used for sessions), fall back to Cloudflare KV when Redis unset. Worker `isDuplicateEvent` should `SET NX EX 600` in Redis/KV, not Map. This survives restarts and multi-instance deploys.

Implement: `src/lib/dedupe.ts`:
```ts
export async function isDuplicateEvent(key: string): Promise<boolean> {
  const redis = getRedis();
  if (redis) return (await redis.set(key, "1", { nx: true, ex: 600 })) === null;
  if (seenEvents.has(key)) return true;
  seenEvents.set(key, Date.now());
  return false;
}
```
Set `UPSTASH_REDIS_REST_URL/TOKEN` in prod — no code change needed.

## 3. QPay QR `data:image` → R2/Meta attachment (IMPLEMENTED in channel)

**Problem:** Zer returns `data:image/png;base64,...` but Meta Send API needs URL or attachment_id. Direct `sendImage(dataUrl)` fails.

**Solution (implemented in `src/channels/facebook.ts`):** Detect `data:image`, decode base64, `POST https://graph.facebook.com/v25.0/${pageId}/message_attachments?access_token=...` with `{ message: { attachment: { type: "image", payload: { is_reusable: true } } }, filedata: Blob }`, capture `attachment_id`, then `sendMessage` with `attachment_id`. Fallback: upload to R2 (`cloudflare-worker` R2 bucket) and send public URL if Meta upload fails.

Why Cloudflare: R2 has zero egress, and Worker can serve the QR as `https://qr.<domain>/qpay/<order_id>.png` with 15-min TTL.

## 4. Rate limiting at edge (Worker before Vercel)

**Problem:** Vercel rate limit is per-instance memory, resets on cold start, allows burst abuse on Telegram/Facebook.

**Better:** Cloudflare Worker in front of `agent-gateway` (route `gateway.zuiiotech.com/*` → Worker → Vercel). Worker uses KV `rate:${psid}:${minute}` with `increment` + TTL 60s, returns 429 before hitting Vercel. Saves Vercel invocations and budget.

Implement: `cloudflare-worker/src/rate-limit.ts` with `env.RATE_LIMIT_KV`, check in `fetch` before forwarding to `MACBOOK_TUNNEL_URL` or Vercel.

## 5. Product card image cache via Cloudflare Cache API

**Problem:** `sendProductCards` fetches Zer product `image_url` on every broadcast, no cache, slow.

**Better:** Worker `cache` API or Cloudflare KV caches `product:${id}:image` for 1h, serves stale-while-revalidate. Reduces Supabase load 10× for catalog broadcasts.

## 6. Cron offload summary

| Job | Vercel (Hobby) | Cloudflare (free) | Recommendation |
|---|---|---|---|
| `cleanup-sessions` daily | ✅ | — | Keep Vercel |
| `qpay-poll` per minute | ❌ needs Pro | ✅ Worker cron | **Move to Worker** (done) |
| `process-jobs` every 5m | ⚠️ 288/d (needs Pro) | ✅ Worker fetch | Move to Worker or keep daily + on-demand drain |
| `re-embed` daily | ✅ | — | Keep Vercel |

Deploy order: Vercel daily crons + Cloudflare per-minute `qpay-poll` + optional `process-jobs` pinger.

## Where NOT to use Cloudflare

- Next.js PPR, `cacheComponents`, streaming: keep Vercel (open-next on Cloudflare loses PPR benefits and needs Node compat shims).
- Supabase RLS, `service_role` DB writes: keep Vercel serverless (Worker has no private network to Supabase).
- LLM streaming: keep Vercel (90s timeout, `after()` persist).

Rule: **Vercel for app, Cloudflare for always-on edge jobs + asset/image edge cache.**
