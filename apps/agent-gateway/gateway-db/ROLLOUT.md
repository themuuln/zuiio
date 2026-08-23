# Meta control plane — gated production rollout

Every step below requires explicit user approval before execution (plan §7).
Nothing in this file has been run against production.

## Required secrets (never printed; set via approved credential tooling)

Gateway (Vercel, agent.zuiiotech.com):
- `ZER_GATEWAY_CONTROL_SECRET`
- `GATEWAY_ZER_DATA_SECRET` (must differ from the Zer→Gateway secret)
- `GATEWAY_WORKER_SHARED_SECRET`
- `GATEWAY_SUPABASE_URL`, `GATEWAY_SUPABASE_SECRET_KEY` (new Gateway project)
- `META_TOKEN_ENCRYPTION_ACTIVE_VERSION=1`, `META_TOKEN_ENCRYPTION_KEY_V1`
- `FB_APP_ID`, `FB_APP_SECRET`, `FB_OAUTH_REDIRECT_URI`, `FB_GRAPH_API_VERSION`
- `ZER_META_SELECTOR_URL=https://zer.zuiiotech.com/settings/meta/select`
- `META_WORKER_INTERNAL_URL`, `DASHBOARD_API_KEY`, `CRON_SECRET`

Worker (`wrangler secret put`, worker `agent-gateway-meta-events`):
- `FB_APP_SECRET`, `FB_VERIFY_TOKEN`, `GATEWAY_SUPABASE_URL`,
  `GATEWAY_SUPABASE_SECRET_KEY`, `GATEWAY_INTERNAL_URL`,
  `GATEWAY_WORKER_SHARED_SECRET`

Zer:
- `GATEWAY_ZER_DATA_SECRET` (server-side only)

## Sequence

1. Provision/link the new Gateway Supabase project; note its ref.
2. Apply schema: `supa run <profile> --workdir apps/agent-gateway/gateway-db db push`
   then run Supabase advisors and fix findings.
3. Migrate data: with source env set,
   `pnpm --filter agent-gateway exec tsx scripts/migrate-meta-control-plane.ts --dry-run`
   → resolve reported conflicts → rerun without `--dry-run`.
4. Deploy Gateway Next app (OAuth routes + processor) with secrets.
5. Deploy Worker: create queues `agent-gateway-meta-events` +
   `-dlq`, `wrangler deploy -c apps/agent-gateway/workers/meta-events/wrangler.jsonc`,
   set worker secrets. Route stays INACTIVE until step 8
   (remove the `routes` block for first deploy or use a throwaway pattern).
6. Deploy Zer branch `feat/agent-gateway-meta-tools`; apply migration
   `20260823144641_agent_gateway_request_nonces.sql`; set `GATEWAY_ZER_DATA_SECRET`.
7. OAuth canary: connect a test Page from Zer settings → selector →
   installation becomes `active` via queue provisioning.
8. Activate Cloudflare route `agent.zuiiotech.com/api/facebook/webhook*`;
   update the Meta app webhook subscription to this URL once.
9. Signed webhook canary: invalid-signature probe → 401; verification
   challenge → 200; real test-customer DM → one Mongolian reply; queue backlog 0;
   `gateway.inbound_events/agent_runs/outbound_messages` show one completed chain.
10. Cutover cleanup (separate approval): delete `api/facebook/connect|start|select`,
    `link/select` page, legacy Vercel webhook path, Zer
    `src/app/api/messenger/webhook`. Keep `api/facebook/callback`.
11. Later destructive step (own approval): encrypted backup + count check,
    then purge migrated Meta rows from the source project.

## Rollback

Route deactivation returns ingress to Vercel legacy webhook (still deployed
until step 10). Gateway OAuth routes are additive; Zer settings fall back to
the previous card state if the new actions error.
