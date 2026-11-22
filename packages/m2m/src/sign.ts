/**
 * Issuer side of Zuiio ID machine tokens.
 *
 * Mirrors what `zuiio-id` mints today byte for byte: `RS256`, header
 * `{ alg, typ: "JWT", kid }`, claims `{ iss, sub, aud, scope, iat, exp, jti }`,
 * `sub` prefixed with `client:`, default issuer `https://id.zuiio.app`, one hour
 * of validity. The `kid` is derived from the RSA public modulus the same way,
 * so a JWKS published by either side matches.
 *
 * @module
 */

import { SignJWT } from "jose";
import { CLIENT_SUBJECT_PREFIX } from "./claims";

/** Algorithm Zuiio ID signs machine tokens with. */
export const SIGNING_ALGORITHM = "RS256";

/** Issuer Zuiio ID mints under. */
export const DEFAULT_ISSUER = "https://id.zuiio.app";

/** Token lifetime Zuiio ID hands out, in seconds. */
export const DEFAULT_TTL_SECONDS = 3600;

const BASE64URL_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** Claims the caller supplies; the signer fills in `iss`, `sub`, `iat`, `exp`, `jti`. */
export interface MachineTokenRequest {
  /** Registered client id; becomes `sub: "client:<clientId>"`. */
  clientId: string;
  /** Target service the token is issued for. */
  audience: string;
  /** Space-delimited scopes granted to the client. */
  scope?: string;
  /** Issuer host. Defaults to {@link DEFAULT_ISSUER}. */
  issuer?: string;
  /** Lifetime in seconds. Defaults to {@link DEFAULT_TTL_SECONDS}. */
  expiresInSeconds?: number;
}

/** RSA private key used to sign, as a `CryptoKey` or a private JWK. */
export type MachineSigningKey = CryptoKey | JsonWebKey;

/** Options for {@link signMachineToken}. */
export interface SignMachineTokenOptions {
  /** RSA private key. Must be `RS256`-capable. */
  signingKey: MachineSigningKey;
  /**
   * Key id placed in the JWT header. Defaults to the id derived from the key
   * (see {@link deriveMachineKeyId}); keys without an RSA modulus carry no
   * `kid` unless one is given here.
   */
  kid?: string;
  /** Issued-at override, seconds since the epoch. Defaults to now. */
  now?: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] ?? 0;
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += BASE64URL_ALPHABET[b0 >> 2];
    out += BASE64URL_ALPHABET[((b0 & 0x03) << 4) | ((b1 ?? 0) >> 4)];
    if (b1 === undefined) break;
    out += BASE64URL_ALPHABET[((b1 & 0x0f) << 2) | ((b2 ?? 0) >> 6)];
    if (b2 === undefined) break;
    out += BASE64URL_ALPHABET[b2 & 0x3f];
  }
  return out;
}

function rsaPublicPart(
  key: MachineSigningKey,
): { n: string; e: string } | null {
  if (typeof key !== "object" || key === null || !("kty" in key)) return null;
  if (key.kty !== "RSA") return null;
  const { n, e } = key as JsonWebKey;
  if (typeof n !== "string" || typeof e !== "string") return null;
  if (n.length === 0 || e.length === 0) return null;
  return { n, e };
}

/**
 * Stable key id for a signing key, identical to the `kid` Zuiio ID publishes on
 * its JWKS: the first 22 base64url characters of `SHA-256("<n>.<e>")`.
 *
 * Returns `undefined` for keys without an RSA public modulus (`CryptoKey`
 * handles and EC keys), in which case tokens are signed without a `kid` and the
 * verifier falls back to algorithm-based key selection.
 */
export async function deriveMachineKeyId(
  signingKey: MachineSigningKey,
): Promise<string | undefined> {
  const publicPart = rsaPublicPart(signingKey);
  if (!publicPart) return undefined;
  const material = new TextEncoder().encode(`${publicPart.n}.${publicPart.e}`);
  const digest = await crypto.subtle.digest("SHA-256", material);
  return base64UrlEncode(new Uint8Array(digest)).slice(0, 22);
}

function assertNonEmpty(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`signMachineToken: ${field} is required`);
  }
  return value.trim();
}

/**
 * Mints an `RS256` machine token for a registered client.
 *
 * @example
 * ```ts
 * const token = await signMachineToken(
 *   { clientId: "svc-alpha", audience: "agent-gateway", scope: "agent:invoke" },
 *   { signingKey: privateJwk },
 * );
 * ```
 */
export async function signMachineToken(
  claims: MachineTokenRequest,
  options: SignMachineTokenOptions,
): Promise<string> {
  const clientId = assertNonEmpty(claims.clientId, "clientId");
  const audience = assertNonEmpty(claims.audience, "audience");
  const ttlSeconds = claims.expiresInSeconds ?? DEFAULT_TTL_SECONDS;
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
    throw new TypeError(
      "signMachineToken: expiresInSeconds must be a positive number",
    );
  }
  if (!options.signingKey) {
    throw new TypeError("signMachineToken: signingKey is required");
  }

  const issuedAt = Math.floor(options.now ?? Date.now() / 1000);
  const kid = options.kid ?? (await deriveMachineKeyId(options.signingKey));

  const payload: Record<string, unknown> = {
    iss: claims.issuer?.trim() || DEFAULT_ISSUER,
    sub: `${CLIENT_SUBJECT_PREFIX}${clientId}`,
    aud: audience,
    iat: issuedAt,
    exp: issuedAt + Math.floor(ttlSeconds),
    jti: crypto.randomUUID(),
  };
  if (claims.scope !== undefined) {
    payload.scope = claims.scope;
  }

  return new SignJWT(payload)
    .setProtectedHeader({
      alg: SIGNING_ALGORITHM,
      typ: "JWT",
      ...(kid ? { kid } : {}),
    })
    .sign(options.signingKey);
}
