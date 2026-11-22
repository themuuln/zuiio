# @zuiio/m2m

Machine-to-machine JWT for the Zuiio ecosystem: Zuiio ID (issuer) mints tokens
with `signMachineToken`, every consumer (zer-green, agent gateway, any Worker or
Node service) verifies them with `verifyMachineToken`. Replaces the drifted
copies in `zer-green/src/server/m2m-jwt.ts` and the agent gateway's
`worker/src/core/m2m-jwt.ts`.

## Install

```bash
pnpm add @zuiio/m2m
```

Published privately to npmjs from this repo by the `publish-packages` workflow;
consumers need an npm token with read access to the `@zuiio` scope.

## Verify

```ts
import { verifyMachineToken } from "@zuiio/m2m";
const result = await verifyMachineToken(bearer, {
  expectedAudience: "agent-gateway",
  requiredScope: "agent:invoke",
});
if (!result.ok) return new Response(result.reason, { status: 401 });
const { clientId, claims } = result;
```

Failures are values, never exceptions: `expired`, `bad_signature`,
`wrong_issuer`, `wrong_audience`, `missing_scope`, `malformed`,
`jwks_unavailable`. The verifier never logs or echoes the token. Accepted
algorithms are `RS256` and `ES256`; clock tolerance is 30s.

## Sign (issuer only)

```ts
import { signMachineToken } from "@zuiio/m2m";
const token = await signMachineToken(
  { clientId: "svc-alpha", audience: "agent-gateway", scope: "agent:invoke" },
  { signingKey: privateJwk },
);
```

`RS256`, claims `iss`/`sub` (`client:<id>`)/`aud`/`scope`/`iat`/`exp`/`jti`,
default issuer `https://id.zuiio.app`, one hour — identical to what Zuiio ID
mints today, derived `kid` included.

## JWKS host rule

`jwksUrl` must point at the **same single issuer host** you accept.
`https://id.zuiio.app` is the only default; there is no `id.zuiiotech.com`
fallback. Accepting the legacy `https://id.zuiiotech.com` issuer means passing
that host's JWKS explicitly — mixing one host's issuer with another's keys
fails closed.

## Migration

Delete the local `verifyM2MToken` and its JWKS cache; call `verifyMachineToken`
and switch on `result.ok`. Keep bearer/service-binding/auth layering in the service.
