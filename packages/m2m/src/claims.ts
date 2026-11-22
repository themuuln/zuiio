/**
 * Claim shapes and runtime guards shared by the signer and the verifier.
 *
 * Zuiio ID mints `client_credentials` access tokens with a fixed claim set:
 * `iss`, `sub` (`client:<client_id>`), `aud`, `scope`, `iat`, `exp`, `jti`.
 * Anything else a token carries is passed through untouched.
 *
 * @module
 */

/** Prefix Zuiio ID puts in front of the client id inside the `sub` claim. */
export const CLIENT_SUBJECT_PREFIX = "client:";

/** Claims carried by a Zuiio ID machine-to-machine access token. */
export interface MachineTokenClaims {
  /** Issuer host that minted the token, e.g. `https://id.zuiio.app`. */
  iss: string;
  /** `client:<client_id>` — see {@link clientIdFromSubject}. */
  sub: string;
  /** Target service the token is scoped to, e.g. `agent-gateway`. */
  aud: string | string[];
  /** Space-delimited scopes granted to the client. */
  scope?: string;
  /** Issued at, seconds since the Unix epoch. */
  iat: number;
  /** Expiry, seconds since the Unix epoch. */
  exp: number;
  /** Unique token id (UUID v4) minted by Zuiio ID. */
  jti?: string;
  [claim: string]: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSecond(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isAudience(value: unknown): value is string | string[] {
  if (isNonEmptyString(value)) return true;
  return (
    Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString)
  );
}

/**
 * Runtime guard for the claims {@link verifyMachineToken} requires before it
 * trusts a payload. Structural only — signature, issuer, audience and time are
 * checked by the verifier itself.
 *
 * Returns `false` for any claim set that could not have been minted by Zuiio
 * ID, including an empty client id in `sub`.
 */
export function isMachineTokenClaims(
  value: unknown,
): value is MachineTokenClaims {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const claims = value as Record<string, unknown>;
  if (!isNonEmptyString(claims.iss)) return false;
  if (!isNonEmptyString(claims.sub)) return false;
  if (!isAudience(claims.aud)) return false;
  if (!isSecond(claims.iat) || !isSecond(claims.exp)) return false;
  if (claims.exp <= claims.iat) return false;
  if (claims.scope !== undefined && typeof claims.scope !== "string")
    return false;
  if (claims.jti !== undefined && typeof claims.jti !== "string") return false;
  return clientIdFromSubject(claims.sub).length > 0;
}

/**
 * Client id carried by a token subject. `client:svc-alpha` and a bare
 * `svc-alpha` both resolve to `svc-alpha`.
 */
export function clientIdFromSubject(subject: string): string {
  return subject.startsWith(CLIENT_SUBJECT_PREFIX)
    ? subject.slice(CLIENT_SUBJECT_PREFIX.length)
    : subject;
}

/** Scopes granted by a claim set, split on whitespace. */
export function tokenScopes(
  claims: Pick<MachineTokenClaims, "scope">,
): string[] {
  return typeof claims.scope === "string"
    ? claims.scope.split(/\s+/).filter(Boolean)
    : [];
}

/** Whether the claim set grants `scope` as one of its space-delimited scopes. */
export function claimsHaveScope(
  claims: Pick<MachineTokenClaims, "scope">,
  scope: string,
): boolean {
  return tokenScopes(claims).includes(scope);
}
