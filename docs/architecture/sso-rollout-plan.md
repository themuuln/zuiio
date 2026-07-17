# SSO Canary Rollout Plan

## Order

1. **Zer (web)** — most complex app, battle-tested SSO
2. **Tolom (web + mobile)** — already partially configured
3. **Tumurch (Expo)** — first React Native test
4. **Tamga (Flutter)** — first Flutter test
5. **Onoo → Zraf → Zoa → Zatly → Khosuud → Zerbu → Zunch** — in batches of 2-3

## Prerequisites (per product)

- [ ] Env vars configured in `.env.sso.development`:
  - `{PRODUCT}_SUPABASE_URL`
  - `{PRODUCT}_SERVICE_ROLE_KEY`
- [ ] `pnpm sso:doctor --product={id}` passes with no ❌
- [ ] `pnpm sso:plan --product={id}` shows zero changes

## Verification checklist (per product)

### Web flow
- [ ] SSO button redirects to `id.zuiio.com`
- [ ] Consent page renders correctly (app name, logo, scopes)
- [ ] Approve consent → redirects back to product
- [ ] Session created, user appears in user list
- [ ] Existing RLS policies work with new session
- [ ] Page refresh maintains session
- [ ] Logout clears session
- [ ] Re-login shows remembered consent (no repeat prompt)

### Mobile flow
- [ ] Deep link opens app
- [ ] `skipBrowserRedirect` flow returns URL for in-app browser
- [ ] Callback URL format: `zuiio-{product}://auth/callback`
- [ ] Token exchange succeeds
- [ ] Userinfo API returns expected claims

### Edge cases
- [ ] Deny consent → returns to product with error
- [ ] Expired authorization_id → clean error
- [ ] Invalid continuation token → fallback to product login
- [ ] MFA required → MFA challenge before consent
- [ ] Concurrent logins (same user, different devices)

## Rollback procedure

```bash
# 1. Disable the custom:zuiio provider on the product Supabase project
#    (Supabase Dashboard > Auth > Providers > Zuiio → Disable)

# 2. If OAuth client was created, it's safe to leave (no active sessions)
#    OAuth clients alone don't affect existing login flows.

# 3. Restore previous login mechanism
#    - Deploy previous version of the product app
#    - Or re-enable email/password or other providers

# 4. Verify rollback by logging in through the old method
```

## Post-rollout

- [ ] `pnpm sso:doctor --product={id}` returns all ✓
- [ ] `pnpm sso:plan --product={id}` returns zero changes
- [ ] Document any product-specific quirks in `apps/{product}/AGENTS.md`
