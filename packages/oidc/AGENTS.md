# @zuiio/oidc — OIDC client for Zuiio ID

Server-only OIDC client library for integrating non-Supabase applications
with Zuiio ID. Uses `openid-client` for spec-compliant OIDC discovery,
PKCE authorization, token exchange, and refresh.

## When to trigger this skill

- Integrating a non-Supabase app or website with Zuiio ID SSO
- Building OIDC authorization flow (PKCE, code exchange, refresh)
- Questions about `createZuiioOidcClient`, `beginAuthorization`, `handleCallback`

## Key APIs

| Export | Type | Description |
|--------|------|-------------|
| `createZuiioOidcClient(config)` | Factory | Discover issuer metadata, create client |
| `ZuiioOidcClient.beginAuthorization()` | Method | Generate PKCE, return authorize URL |
| `ZuiioOidcClient.handleCallback(url, tx)` | Method | Exchange code for tokens |
| `ZuiioOidcClient.refresh(refreshToken)` | Method | Refresh access token |
| `ZuiioOidcClient.userinfo(accessToken)` | Method | Fetch userinfo |
| `ZuiioOidcClient.endSessionUrl(...)` | Method | Build RP-initiated logout URL |

## Integration pattern

This is the standard OIDC Authorization Code flow with PKCE:

1. Redirect user to `beginAuthorization().url`
2. Store `{ state, nonce, codeVerifier }` server-side
3. On callback, call `handleCallback(request.url, stored)`
4. Use tokens for authenticated requests
5. Refresh with `refresh(tokenSet.refreshToken)` when expired

## Important

- Server-side only. Never expose secrets or tokens to the browser.
- Store authorization transactions in encrypted server sessions only.
