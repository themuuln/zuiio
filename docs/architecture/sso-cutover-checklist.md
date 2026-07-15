# SSO Product Cutover Checklist

## Environment Variables Required Per Product

Each product needs these env vars in `.env.local`:

```bash
# Identity app origin
NEXT_PUBLIC_IDENTITY_URL=http://localhost:3000

# Identity Supabase (for custom:zuiio provider verification)
NEXT_PUBLIC_IDENTITY_SUPABASE_URL=http://127.0.0.1:54321
```

## Provisioning Steps (per environment)

1. Create `.env.sso.development` with all product Supabase URLs and service keys
2. Run `pnpm sso:apply --environment development`
3. Verify: `pnpm sso:plan --environment development` shows no changes

## Per-Product Auth Routes

### Web (Next.js) — Standard Pattern

| Route | Behavior |
|-------|----------|
| `/auth/sso` | Starts `custom:zuiio` OAuth, redirects to identity |
| `/auth/callback` | Exchanges PKCE code, runs product bootstrap |
| `/login` | Redirects to `/auth/sso` |
| `/register` | Redirects to identity `/signup?product=<id>&return_to=/auth/sso` |
| `/forgot-password` | Redirects to identity `/forgot-password` |
| `/reset-password` | Redirects to identity `/reset-password` |

### Mobile (Expo) — Standard Pattern

1. Replace email/password screens with "Continue with Zuiio" button
2. Call `startZuiioSso(supabase, { redirectTo, skipBrowserRedirect: true })`
3. Open returned URL with `expo-web-browser.openAuthSessionAsync()`
4. Route `zuiio-<product>://auth/callback` to `exchangeZuiioSsoCode()`
5. Declare deep link in `app.json`: `zuiio-<product>://auth/callback`

### Flutter — Standard Pattern

1. Add `packages/zuiio_auth_flutter` path dependency
2. Configure `zuiio-<product>://auth/callback` in Android/iOS
3. Replace `signInWithPassword`/`signInWithOAuth(Google)` with `ZuiioAuth.signInWithZuiio()`

## Verification Per Product

- [ ] Login redirects to identity
- [ ] Callback exchanges code and creates local session
- [ ] User data accessible after login
- [ ] Logout clears local session
- [ ] No credential forms render in product UI

## Products to Migrate

| Product | Web | Expo | Flutter | Status |
|---------|-----|------|---------|--------|
| Zer | ✅ Done | Pending | — | Reference impl |
| Tolom | Pending | Pending | — | |
| Tamga | Pending | Pending | Pending | |
| Onöö | Pending | Pending | — | |
| Tumurch | — | Pending | Pending | |
| Zraf | Pending | — | Pending | |
| Zoa | Pending | Pending | — | |
| Zatly | Pending | — | — | |
| Khosuud | — | Pending | — | |
| Zerbu | Pending | — | — | |
| Zunch | — | — | Pending | |
| Card | N/A (authMode: none) | — | — | |
| Zill | N/A (authMode: none) | — | — | |
