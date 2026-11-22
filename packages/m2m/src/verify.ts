/**
 * Verification of Zuiio ID machine-to-machine tokens.
 *
 * Every failure is reported as a value, never as an exception: callers switch
 * on {@link MachineTokenResult.ok}. The token itself is never logged and never
 * echoed back in a failure reason.
 *
 * @module
 */

import {
  createRemoteJWKSet,
  customFetch,
  errors,
  type FetchImplementation,
  type JWTVerifyGetKey,
  jwtVerify,
} from "jose";
import {
  claimsHaveScope,
  clientIdFromSubject,
  isMachineTokenClaims,
  type MachineTokenClaims,
} from "./claims";

/** Issuer hosts Zuiio ID has published tokens under. */
export const DEFAULT_ALLOWED_ISSUERS: readonly string[] = [
  "https://id.zuiio.app",
  "https://id.zuiiotech.com",
];

/** JWKS endpoint of the default issuer. */
export const DEFAULT_JWKS_URL = "https://id.zuiio.app/api/oauth/jwks";

/** Asymmetric algorithms Zuiio ID issues. Symmetric and `none` are never allowed. */
export const DEFAULT_ALGORITHMS: readonly string[] = ["RS256", "ES256"];

/** Clock skew tolerated on `exp`, `iat` and `nbf`, in seconds. */
export const DEFAULT_CLOCK_TOLERANCE_SECONDS = 30;

/** How long a downloaded JWKS is reused before it is fetched again, in milliseconds. */
export const DEFAULT_JWKS_CACHE_TTL_MS = 3_600_000;

const JWKS_COOLDOWN_MS = 30_000;
const JWKS_TIMEOUT_MS = 5_000;

/** Why a token was rejected. */
export type MachineTokenFailure =
  | "expired"
  | "bad_signature"
  | "wrong_issuer"
  | "wrong_audience"
  | "missing_scope"
  | "malformed"
  | "jwks_unavailable";

/** Discriminated result of {@link verifyMachineToken}. */
export type MachineTokenResult =
  | { ok: true; claims: MachineTokenClaims; clientId: string }
  | { ok: false; reason: MachineTokenFailure };

/** Options for {@link verifyMachineToken}. */
export interface VerifyMachineTokenOptions {
  /** Audience this service accepts tokens for. Required. */
  expectedAudience: string;
  /** Issuer hosts to accept. Defaults to {@link DEFAULT_ALLOWED_ISSUERS}. */
  allowedIssuers?: readonly string[];
  /** Scope the caller must hold, e.g. `agent:invoke`. */
  requiredScope?: string;
  /** Accepted signing algorithms. Defaults to {@link DEFAULT_ALGORITHMS}. */
  algorithms?: readonly string[];
  /** JWKS endpoint. Defaults to {@link DEFAULT_JWKS_URL}. */
  jwksUrl?: string;
  /** Clock skew allowance in seconds. Defaults to {@link DEFAULT_CLOCK_TOLERANCE_SECONDS}. */
  clockToleranceSeconds?: number;
  /** JWKS reuse window in milliseconds. Defaults to {@link DEFAULT_JWKS_CACHE_TTL_MS}. */
  jwksCacheTtlMs?: number;
  /** JWKS request timeout in milliseconds. */
  jwksTimeoutMs?: number;
  /** Pre-built key resolver, bypassing the remote JWKS cache. */
  jwks?: JWTVerifyGetKey;
  /** `fetch` used to download the JWKS — bindings and tests. */
  fetchImpl?: FetchImplementation;
}

interface CachedJwks {
  getKey: JWTVerifyGetKey;
  createdAt: number;
  ttlMs: number;
  fetchImpl: FetchImplementation | undefined;
}

const remoteJwksCache = new Map<string, CachedJwks>();

/**
 * Drops every cached remote JWKS. Only needed by tests and key-rotation
 * tooling; production code relies on the TTL.
 */
export function clearJwksCache(): void {
  remoteJwksCache.clear();
}

function remoteJwks(
  jwksUrl: string,
  ttlMs: number,
  timeoutMs: number,
  fetchImpl: FetchImplementation | undefined,
): JWTVerifyGetKey {
  const now = Date.now();
  const cached = remoteJwksCache.get(jwksUrl);
  if (
    cached &&
    cached.ttlMs === ttlMs &&
    cached.fetchImpl === fetchImpl &&
    now - cached.createdAt < ttlMs
  ) {
    return cached.getKey;
  }

  const getKey = createRemoteJWKSet(new URL(jwksUrl), {
    cacheMaxAge: ttlMs,
    cooldownDuration: JWKS_COOLDOWN_MS,
    timeoutDuration: timeoutMs,
    ...(fetchImpl ? { [customFetch]: fetchImpl } : {}),
  });
  remoteJwksCache.set(jwksUrl, { getKey, createdAt: now, ttlMs, fetchImpl });
  return getKey;
}

interface TrackedJwks {
  getKey: JWTVerifyGetKey;
  /** True once the resolver failed for a reason other than "no matching key". */
  unavailable: () => boolean;
}

/**
 * Wraps a resolver so a JWKS that cannot be downloaded or parsed is reported as
 * `jwks_unavailable` instead of a signature failure. "No matching key" stays a
 * signature failure — the key set was available, the token just does not
 * belong to it.
 */
function trackJwks(getKey: JWTVerifyGetKey): TrackedJwks {
  let failed = false;
  const tracked: JWTVerifyGetKey = async (protectedHeader, token) => {
    try {
      return await getKey(protectedHeader, token);
    } catch (error) {
      if (
        !(error instanceof errors.JWKSNoMatchingKey) &&
        !(error instanceof errors.JWKSMultipleMatchingKeys)
      ) {
        failed = true;
      }
      throw error;
    }
  };
  return { getKey: tracked, unavailable: () => failed };
}

function classify(
  error: unknown,
  jwksUnavailable: boolean,
): MachineTokenFailure {
  if (jwksUnavailable) return "jwks_unavailable";
  if (error instanceof errors.JWTExpired) return "expired";
  if (error instanceof errors.JWTClaimValidationFailed) {
    if (error.claim === "aud") return "wrong_audience";
    if (error.claim === "iss") return "wrong_issuer";
    if (error.claim === "exp") return "expired";
    return "malformed";
  }
  if (error instanceof errors.JOSEError) {
    switch (error.code) {
      case "ERR_JWKS_NO_MATCHING_KEY":
      case "ERR_JOSE_ALG_NOT_ALLOWED":
      case "ERR_JWS_SIGNATURE_VERIFICATION_FAILED":
        return "bad_signature";
      case "ERR_JWKS_TIMEOUT":
      case "ERR_JWKS_INVALID":
        return "jwks_unavailable";
      default:
        return "malformed";
    }
  }
  return "malformed";
}

/**
 * Verifies a Zuiio ID machine token against the issuer's JWKS.
 *
 * Checks signature, `iss`, `aud`, `exp`/`iat` (with clock tolerance), the
 * algorithm allowlist, the required claim shape, then the optional scope.
 * Never throws for a bad token — see {@link MachineTokenFailure}.
 *
 * @example
 * ```ts
 * const result = await verifyMachineToken(bearer, {
 *   expectedAudience: "agent-gateway",
 *   requiredScope: "agent:invoke",
 * });
 * if (!result.ok) return new Response(result.reason, { status: 401 });
 * const { clientId, claims } = result;
 * ```
 */
export async function verifyMachineToken(
  token: string,
  options: VerifyMachineTokenOptions,
): Promise<MachineTokenResult> {
  if (typeof token !== "string" || token.length === 0) {
    return { ok: false, reason: "malformed" };
  }
  const expectedAudience = options.expectedAudience?.trim();
  if (!expectedAudience) {
    throw new TypeError(
      "verifyMachineToken: options.expectedAudience is required",
    );
  }

  const allowedIssuers =
    options.allowedIssuers && options.allowedIssuers.length > 0
      ? [...options.allowedIssuers]
      : [...DEFAULT_ALLOWED_ISSUERS];

  let resolver: JWTVerifyGetKey;
  try {
    resolver =
      options.jwks ??
      remoteJwks(
        options.jwksUrl ?? DEFAULT_JWKS_URL,
        options.jwksCacheTtlMs ?? DEFAULT_JWKS_CACHE_TTL_MS,
        options.jwksTimeoutMs ?? JWKS_TIMEOUT_MS,
        options.fetchImpl,
      );
  } catch {
    return { ok: false, reason: "jwks_unavailable" };
  }
  const jwks = trackJwks(resolver);

  let payload: unknown;
  try {
    const verified = await jwtVerify(token, jwks.getKey, {
      issuer: allowedIssuers,
      audience: expectedAudience,
      algorithms: [...(options.algorithms ?? DEFAULT_ALGORITHMS)],
      clockTolerance:
        options.clockToleranceSeconds ?? DEFAULT_CLOCK_TOLERANCE_SECONDS,
    });
    payload = verified.payload;
  } catch (error) {
    return { ok: false, reason: classify(error, jwks.unavailable()) };
  }

  if (!isMachineTokenClaims(payload)) {
    return { ok: false, reason: "malformed" };
  }
  if (
    options.requiredScope &&
    !claimsHaveScope(payload, options.requiredScope)
  ) {
    return { ok: false, reason: "missing_scope" };
  }

  return {
    ok: true,
    claims: payload,
    clientId: clientIdFromSubject(payload.sub),
  };
}
