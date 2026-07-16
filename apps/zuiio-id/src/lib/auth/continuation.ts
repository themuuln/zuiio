import { createHmac, randomUUID } from "node:crypto";
import { getSsoProduct, type ProductId } from "@config/sso-products";

const HMAC_ALGORITHM = "sha256";
const CONTINUATION_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * A continuation token that ties a signup/recovery flow back to
 * the originating product. Stored in `auth_continuations` and
 * signed as an HMAC for tamper detection.
 */
export interface ContinuationPayload {
  jti: string;
  productId: ProductId;
  returnTo: string;
  expiresAt: number;
}

export interface SignedContinuation {
  payload: ContinuationPayload;
  token: string;
}

function getSigningSecret(): string {
  const secret = process.env.ZUIIO_CONTINUATION_SECRET;
  if (!secret) {
    throw new Error("Missing ZUIIO_CONTINUATION_SECRET");
  }
  return secret;
}

export function signContinuation(
  productId: ProductId,
  returnTo: string,
): SignedContinuation {
  const jti = randomUUID();
  const expiresAt = Date.now() + CONTINUATION_TTL_MS;
  const payload: ContinuationPayload = { jti, productId, returnTo, expiresAt };

  const data = JSON.stringify(payload);
  const token = createHmac(HMAC_ALGORITHM, getSigningSecret())
    .update(data)
    .digest("hex");

  return { payload, token: `${btoa(data)}.${token}` };
}

export function verifyContinuation(token: string): ContinuationPayload | null {
  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex === -1) return null;

  const encoded = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  let data: string;
  try {
    data = atob(encoded);
  } catch {
    return null;
  }

  const expectedSignature = createHmac(HMAC_ALGORITHM, getSigningSecret())
    .update(data)
    .digest("hex");

  if (signature !== expectedSignature) return null;

  let payload: ContinuationPayload;
  try {
    payload = JSON.parse(data) as ContinuationPayload;
  } catch {
    return null;
  }

  if (payload.expiresAt < Date.now()) return null;

  // Validate returnTo is a relative path
  if (!payload.returnTo.startsWith("/") || payload.returnTo.includes("://")) {
    return null;
  }

  // Validate the product exists and the returnTo is in its allowlist
  const product = getSsoProduct(payload.productId);
  if (!product) return null;

  return payload;
}

/**
 * Validates a redirect target against the product's allowlisted continue URLs.
 * Only relative paths are accepted unless the URL matches a product_catalog.continue_urls entry.
 */
export function validateIdentityRedirect(
  redirectTo: string,
  allowedOrigins: readonly string[],
): string | null {
  // Relative paths are always safe
  if (redirectTo.startsWith("/") && !redirectTo.includes("://")) {
    return redirectTo;
  }

  // Absolute URLs must exactly match an allowed origin
  try {
    const url = new URL(redirectTo);
    const origin = url.origin;

    if (allowedOrigins.includes(origin)) {
      return redirectTo;
    }
  } catch {
    // Not a valid URL
  }

  return null;
}
