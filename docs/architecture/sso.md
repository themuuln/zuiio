# Zuiio SSO Architecture

## Overview

One hosted identity experience at `id.zuiio.com` for every Zuiio product. Users authenticate centrally; products keep local sessions, RLS, organizations, and authorization.

## Environments

Each environment is fully isolated:

```
zuiio-identity-{development|staging|production}
├── zuiio-zer-{environment}
├── zuiio-tolom-{environment}
├── zuiio-tamga-{environment}
├── zuiio-onoo-{environment}
├── zuiio-tumurch-{environment}
├── zuiio-zraf-{environment}
├── zuiio-zoa-{environment}
├── zuiio-zatly-{environment}
├── zuiio-khosuud-{environment}
├── zuiio-zerbu-{environment}
└── zuiio-zunch-{environment}
```

## Provisioning

```bash
# Dry run — see what would be created
pnpm sso:plan --environment development

# Apply — create OAuth clients, providers, catalog rows
pnpm sso:apply --environment development

# Rotate a specific product's credentials
pnpm sso:apply --environment development --rotate zer
```

Environment variables needed (in `.env.sso.<environment>`):
- `IDENTITY_SUPABASE_URL` — identity project URL
- `IDENTITY_SERVICE_ROLE_KEY` — identity project service role key
- `<PRODUCT>_SUPABASE_URL` — per product project URL
- `<PRODUCT>_SERVICE_ROLE_KEY` — per product project service role key

## Auth Flow

1. User opens product app → redirected to `/auth/sso` → starts `custom:zuiio` OAuth
2. Identity project receives `/oauth/authorize?authorization_id=...`
3. If unauthenticated → central login/signup at `id.zuiio.com`
4. If authenticated → auto-approves first-party client, redirects back
5. Product receives PKCE code → exchanges for local session
6. Product-local `auth.uid()` is created/linked, existing RLS continues

## Rollout Order

1. Development identity project
2. Development Zer (web) — representative web product
3. Development Tolom Mobile — representative mobile product
4. All remaining development products
5. Staging provider verification (Google, Apple, SMTP)
6. Production identity project
7. Production products one family at a time

At each gate: verify callback, local session, entitlement/onboarding, logout.

## Rollback

Per-product rollback is configuration-only:
1. Disable `custom:zuiio` provider on the product project
2. Re-enable the previous auth method
3. Restore the previous deployment

## Logout Behavior

- Product logout: local session cleared + central identity logout redirect
- NOT global: other products' sessions remain until their own logout/expiry
- This is by design — Supabase OAuth federation does not provide back-channel single logout

## Account Recovery

- Forgot password → redirect to `id.zuiio.com/forgot-password`
- Reset password → redirect to `id.zuiio.com/reset-password`
- No product handles password recovery directly

## Adding a New Product

1. Add to `config/sso-products.ts` with `authMode: "sso"`
2. Run `pnpm sso:apply --environment development`
3. Add `.env.sso.development` entries for the new product
4. Configure the product's `/auth/sso` and `/auth/callback` routes
5. Add `@zuiio/auth: "workspace:*"` dependency
6. Use `startZuiioSso()` / `exchangeZuiioSsoCode()` in your auth flow
7. Verify end-to-end: login → callback → session → logout
