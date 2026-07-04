# Facebook Messenger Webhook (Supabase Edge Function)

This function replaces the public webhook endpoint from Next.js with a Supabase-hosted endpoint.

## Deploy

```bash
supabase functions deploy facebook-webhook --no-verify-jwt
```

## Required secrets

```bash
supabase secrets set FB_VERIFY_TOKEN="my_super_secret_verify_token"
supabase secrets set FB_PAGE_ACCESS_TOKEN="EAAX..."
supabase secrets set FB_APP_SECRET="..."
# optional
supabase secrets set FB_GRAPH_API_VERSION="v25.0"
supabase secrets set FB_FALLBACK_MESSAGE="Thanks for your message. A team member will reply soon."
```

## Use Your Flow Builder Logic

This function can run a published flow from your builder export.

1. Export flow JSON from your app sidebar (the `flow.json` file).
2. Set it as an Edge Function secret:

```bash
supabase secrets set FB_BOT_FLOW_JSON="$(cat flow.json)"
```

Supported runtime behavior:

- `start` -> follows connected edges
- `sendMessage` -> sends `data.message`
- `askQuestion` -> sends `data.question`
- `condition` -> branches by `yes`/`no` handle using incoming message text
- `setField` -> stores static field values during run
- `cardCarousel` -> sends first card title/subtitle as text

When no flow exists or no branch matches, `FB_FALLBACK_MESSAGE` is sent.

## Facebook Dashboard

1. Set Callback URL to:
   `https://<PROJECT_REF>.supabase.co/functions/v1/facebook-webhook`
2. Set Verify Token to exactly `FB_VERIFY_TOKEN`
3. Subscribe to `messages` and `messaging_postbacks` fields for the page

## Notes

- `FB_APP_SECRET` enables signature validation via `x-hub-signature-256`.
- If `FB_APP_SECRET` is omitted, requests are accepted without signature validation.
- Replies are sent via Graph API using `FB_PAGE_ACCESS_TOKEN`.
