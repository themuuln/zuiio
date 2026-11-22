/**
 * `@zuiio/m2m` — one machine-to-machine JWT implementation for the Zuiio
 * ecosystem: {@link signMachineToken} on the issuer side and
 * {@link verifyMachineToken} on every consuming service.
 *
 * @module
 */

export {
  CLIENT_SUBJECT_PREFIX,
  claimsHaveScope,
  clientIdFromSubject,
  isMachineTokenClaims,
  type MachineTokenClaims,
  tokenScopes,
} from "./claims";
export {
  DEFAULT_ISSUER,
  DEFAULT_TTL_SECONDS,
  deriveMachineKeyId,
  type MachineSigningKey,
  type MachineTokenRequest,
  SIGNING_ALGORITHM,
  type SignMachineTokenOptions,
  signMachineToken,
} from "./sign";
export {
  clearJwksCache,
  DEFAULT_ALGORITHMS,
  DEFAULT_ALLOWED_ISSUERS,
  DEFAULT_CLOCK_TOLERANCE_SECONDS,
  DEFAULT_JWKS_CACHE_TTL_MS,
  DEFAULT_JWKS_URL,
  type MachineTokenFailure,
  type MachineTokenResult,
  type VerifyMachineTokenOptions,
  verifyMachineToken,
} from "./verify";
