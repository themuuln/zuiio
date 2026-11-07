# Zuiio SSO — Integration Guide

## Overview

Zuiio ID (`id.zuiiotech.com`) is the central identity provider for the Zuiio ecosystem. There are **two integration paths** depending on your stack:

| Path | Best for | Package |
|------|----------|---------|
| **Supabase Federation** | Internal Zuiio products using Supabase Auth | `@zuiio/auth` |
| **Direct OIDC** | External apps, non-Supabase stacks, any language | `@zuiio/oidc` or raw OIDC |

Both paths use Authorization Code flow with PKCE (S256).

---

## Path A: Supabase Federation (internal products)

For apps inside the Zuiio monorepo that already use Supabase Auth.

### What happens

```
Product App → Product's Supabase (custom:zuiio provider) → Zuiio ID (identity server)
                                                                     ↓
Product App ← Product's Supabase (PKCE code exchange) ← Consent/Login
```

### Setup

**1. Provision the product** (one-time, from monorepo root):

```bash
# Health check first
pnpm sso:doctor --product=<id>

# Dry-run to see what will change
pnpm sso:plan --product=<id>

# Apply — creates OAuth client on identity server + configures custom:zuiio provider
pnpm sso:apply --product=<id>
```

**2. Add `@zuiio/auth` dependency:**

```json
"dependencies": {
  "@zuiio/auth": "workspace:*"
}
```

**3. Create `/auth/sso` route** — initiates SSO login:

```ts
// app/(auth)/sso/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next")?.startsWith("/") ? searchParams.get("next") : "/";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "custom:zuiio",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/login?error=auth_start_failed", origin));
  }
  return NextResponse.redirect(data.url);
}
```

**4. Create `/auth/callback` route** — handles the PKCE code exchange:

```ts
// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeZuiioSsoCode } from "@zuiio/auth";

export async function GET(request: Request) {
  const supabase = await createClient();
  const error = await exchangeZuiioSsoCode(supabase, request.url);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=" + encodeURIComponent(error)));
  }
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
```

**5. Protect pages with `useRequireAuth`:**

```tsx
"use client";
import { useRequireAuth } from "@zuiio/auth";

export default function DashboardPage() {
  const { status, session } = useRequireAuth({ redirectTo: "/login" });
  if (status !== "authenticated") return <Loading />;
  return <div>Welcome, {session.user.email}</div>;
}
```

### Mobile (React Native)

Use `skipBrowserRedirect: true` to get the URL for an in-app browser:

```ts
import { startZuiioSso } from "@zuiio/auth";

const { url, error } = await startZuiioSso(supabase, {
  redirectTo: "zuiio-{product}://auth/callback",
  skipBrowserRedirect: true,
});
// Open url in expo-web-browser or similar
```

---

## Path B: Direct OIDC (external apps)

For non-Supabase applications — Django, Go, PHP, plain JavaScript, Flutter, etc.

Zuiio ID is a standards-compliant OIDC Provider. You can use any OIDC library or raw HTTP.

The production identity host is `https://id.zuiio.app`. `https://id.zuiiotech.com` is a hostname-level test alias on the same Worker, not an isolated environment; use `.app` for production clients.

### Discovery

All metadata is available at:

```
https://id.zuiio.app/.well-known/openid-configuration
```

This returns the authorization endpoint, token endpoint, JWKS URI, supported scopes, response types, and more.

### Supported features

- Authorization Code flow with PKCE (S256)
- Token refresh
- Userinfo endpoint
- JWKS (RS256 + HS256)
- RP-initiated logout
- Scope: `openid`, `profile`, `email`, `offline_access`
- Claims: `sub`, `email`, `email_verified`, `name`, `full_name`, `username`, `picture`, `updated_at`

### Node.js / Next.js (using `@zuiio/oidc`)

```bash
npm install @zuiio/oidc openid-client
```

```ts
import { createZuiioOidcClient } from "@zuiio/oidc";

// 1. Create client (auto-discovers OIDC metadata)
const client = await createZuiioOidcClient({
  issuer: "https://id.zuiiotech.com",
  clientId: process.env.ZUIIO_OIDC_CLIENT_ID!,
  clientSecret: process.env.ZUIIO_OIDC_CLIENT_SECRET!,
  redirectUri: "https://yourapp.com/auth/callback",
});

// 2. Start login
const auth = await client.beginAuthorization();
// Store auth.state, auth.nonce, auth.codeVerifier in encrypted server session
session.set("oidc_tx", auth);
redirect(auth.url);

// 3. Handle callback
const tx = session.get("oidc_tx");
const tokens = await client.handleCallback(request.url, tx);
session.delete("oidc_tx");
session.set("tokens", tokens);

// 4. Fetch user info
const user = await client.userinfo(tokens.accessToken);
// { sub, email, name, full_name, username, ... }

// 5. Refresh when expired
const refreshed = await client.refresh(tokens.refreshToken);

// 6. Logout
const logoutUrl = client.endSessionUrl(tokens.idToken, "https://yourapp.com");
redirect(logoutUrl);
```

### Python (using `requests` + `authlib`)

```python
from authlib.integrations.requests_client import OAuth2Session
import secrets, hashlib, base64

# PKCE code verifier + challenge
code_verifier = secrets.token_urlsafe(64)
code_challenge = base64.urlsafe_b64encode(
    hashlib.sha256(code_verifier.encode()).digest()
).rstrip(b"=").decode()

# Discovery
import requests
discovery = requests.get("https://id.zuiiotech.com/.well-known/openid-configuration").json()

# Authorization URL
params = {
    "response_type": "code",
    "client_id": "your-client-id",
    "redirect_uri": "https://yourapp.com/auth/callback",
    "scope": "openid profile email",
    "code_challenge": code_challenge,
    "code_challenge_method": "S256",
    "state": secrets.token_urlsafe(32),
}
auth_url = f"{discovery['authorization_endpoint']}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
# Redirect user to auth_url

# Token exchange (on callback)
token_response = requests.post(discovery["token_endpoint"], data={
    "grant_type": "authorization_code",
    "code": received_code,
    "redirect_uri": "https://yourapp.com/auth/callback",
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "code_verifier": code_verifier,
}).json()

# Userinfo
userinfo = requests.get(discovery["userinfo_endpoint"],
    headers={"Authorization": f"Bearer {token_response['access_token']}"}
).json()
```

### Go (using `coreos/go-oidc`)

```go
import "github.com/coreos/go-oidc/v3/oidc"

provider, err := oidc.NewProvider(ctx, "https://id.zuiio.app")
// Use provider.Endpoint() for AuthURL, TokenURL
// Generate PKCE with crypto/rand, use oauth2 package for token exchange
```

### PHP (using `league/oauth2-client`)

```php
$provider = new \League\OAuth2\Client\Provider\GenericProvider([
    'clientId' => 'your-client-id',
    'clientSecret' => 'your-client-secret',
    'redirectUri' => 'https://yourapp.com/auth/callback',
    'urlAuthorize' => 'https://id.zuiio.app/api/auth/oauth2/authorize',
    'urlAccessToken' => 'https://id.zuiio.app/api/auth/oauth2/token',
    'urlResourceOwnerDetails' => 'https://id.zuiio.app/api/auth/oauth2/userinfo',
]);

// Generate PKCE
$codeVerifier = bin2hex(random_bytes(32));
$codeChallenge = rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');

// Authorization URL
$authUrl = $provider->getAuthorizationUrl([
    'code_challenge' => $codeChallenge,
    'code_challenge_method' => 'S256',
]);
// Store $provider->getState() in session, redirect to $authUrl
```

---

## Getting a client_id

### Internal (monorepo) products

Run `pnpm sso:plan --product=<id>` then `pnpm sso:apply --product=<id>`. The provisioning script creates the OAuth client on the identity server and configures the `custom:zuiio` provider on the product's Supabase project.

### External apps

Contact the Zuiio team to register your application. You'll receive:
- `client_id`
- `client_secret` (for confidential clients)
- A redirect URI to register

You can also register a public client (no secret) for mobile apps or SPAs, but PKCE is required.

---

## Token verification

Use the OIDC discovery document:

```
GET https://id.zuiio.app/.well-known/openid-configuration
```

Read `jwks_uri` from that metadata (`https://id.zuiio.app/api/auth/jwks`) to verify OIDC ID tokens. The legacy M2M `/api/oauth/jwks` endpoint serves client-credentials keys, not OIDC ID-token keys.

For Supabase Federation products, token verification happens automatically through Supabase Auth.

---

## MFA

Zuiio ID supports multi-factor authentication via:
- **TOTP** — authenticator app (Google Authenticator, etc.)
- **Passkeys** — WebAuthn platform authenticators

When a user has MFA enabled, they will be prompted during SSO login before the consent screen.

---

## Architecture

```
┌─────────────────────┐         ┌──────────────────────────┐
│   Your App          │         │   Zuiio ID               │
│                     │         │   (id.zuiiotech.com)     │
│  /auth/sso ─────────┼────────→│  OIDC endpoints           │
│                     │         │  Login / Signup           │
│  /auth/callback ←───┼─────────│  Consent / MFA           │
│                     │         │  SAML federation          │
│  Local session      │         │  SCIM provisioning        │
│  RLS policies       │         │                          │
└─────────────────────┘         └──────────────────────────┘
         │                                │
         │         ┌──────────────────────┘
         │         │
         ▼         ▼
  ┌──────────────────────────┐
  │  Product's Supabase       │
  │  (for Supabase Federation)│
  │                           │
  │  custom:zuiio provider    │
  │  → delegates to Zuiio ID  │
  └──────────────────────────┘
```

For **Direct OIDC** consumers, the Product Supabase layer is absent — your app talks directly to Zuiio ID.

---

## Comparison

| Feature | Supabase Federation | Direct OIDC |
|---------|-------------------|-------------|
| Setup complexity | ~30 lines of boilerplate | ~100 lines (or `@zuiio/oidc`) |
| Token handling | Automatic via Supabase SDK | Manual (store/refresh) |
| RLS integration | Built-in (auth.uid()) | Manual (pass user context) |
| Session management | Supabase SSR cookies | Your own session store |
| Mobile support | `skipBrowserRedirect` | PKCE + custom scheme |
| MFA | Through Zuiio ID | Through Zuiio ID |
| Offline access | Automatic | Request `offline_access` scope |
| Userinfo | Supabase `auth.getUser()` | `GET /userinfo` endpoint |
| Logout | Supabase `auth.signOut()` | RP-initiated logout URL |
