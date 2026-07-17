# @zuiio/oidc

OIDC client library for integrating non-Supabase applications with Zuiio ID.

## When to use this

Use this package when your application **does not** use Supabase Auth and you
want to authenticate users through Zuiio ID (the Zuiio ecosystem's central
identity provider).

If your app **does** use Supabase Auth, use `@zuiio/auth` instead — it
integrates via the `custom:zuiio` OIDC provider with a simpler API.

## Quickstart

```bash
pnpm add @zuiio/oidc openid-client
```

### 1. Register your application

Contact the Zuiio team to register an OAuth client for your application.
You'll receive a `client_id` and `client_secret`.

### 2. Create the client

```ts
import { createZuiioOidcClient } from "@zuiio/oidc";

const zuiioId = await createZuiioOidcClient({
  issuer: "https://id.zuiiotech.com",
  clientId: process.env.ZUIIO_OIDC_CLIENT_ID!,
  clientSecret: process.env.ZUIIO_OIDC_CLIENT_SECRET!,
  redirectUri: "https://yourapp.com/auth/callback",
});
```

### 3. Start login (server-side route)

```ts
const auth = await zuiioId.beginAuthorization();
// Store auth.state, auth.nonce, auth.codeVerifier in an encrypted session
// (never in localStorage or URL params)
session.set("oidc_transaction", auth);
redirect(auth.url);
```

### 4. Handle callback

```ts
const transaction = session.get("oidc_transaction");
const tokens = await zuiioId.handleCallback(request.url, transaction);
session.destroy("oidc_transaction");
session.set("tokens", tokens);
```

### 5. Fetch user info

```ts
const user = await zuiioId.userinfo(tokens.accessToken);
// user.sub, user.email, user.name, user.username, ...
```

### 6. Refresh tokens

```ts
const newTokens = await zuiioId.refresh(tokens.refreshToken);
```

### 7. Logout

```ts
const logoutUrl = zuiioId.endSessionUrl(tokens.idToken, "https://yourapp.com");
// Redirect the user to this URL
redirect(logoutUrl);
```

## API

### `createZuiioOidcClient(config)`

Creates an OIDC client by discovering the issuer's OpenID Provider metadata.

**Config:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `issuer` | `string` | Yes | Issuer URL (e.g. `https://id.zuiiotech.com`) |
| `clientId` | `string` | Yes | OAuth client ID |
| `clientSecret` | `string` | No | Client secret (omit for public clients) |
| `redirectUri` | `string` | Yes | Registered redirect URI |
| `scopes` | `string[]` | No | Default: `["openid", "profile", "email", "offline_access"]` |

### Client methods

| Method | Returns | Description |
|--------|---------|-------------|
| `beginAuthorization()` | `AuthorizationTransaction` | Generate PKCE + state + nonce, return authorize URL |
| `handleCallback(url, tx)` | `ZuiioTokenSet` | Exchange code for tokens |
| `refresh(refreshToken)` | `ZuiioTokenSet` | Refresh an expired access token |
| `userinfo(accessToken)` | `ZuiioUserinfo` | Fetch userinfo from the userinfo endpoint |
| `endSessionUrl(idTokenHint, postLogoutRedirectUri)` | `string \| undefined` | Build RP-initiated logout URL |

## Security

- **Server-side only.** Never expose `client_secret`, `codeVerifier`, or tokens
  to the browser.
- Store `AuthorizationTransaction` in encrypted server sessions (not `localStorage`).
- The `openid-client` library validates ID token signatures, issuer, audience,
  and nonce automatically.
