import "server-only";
import { createHmac } from "node:crypto";
import { env } from "./env";

const TOKEN_SECRET = env("TOKEN_SIGNING_SECRET") ?? "dev-secret-change-in-production";
const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

interface TokenPayload {
  orgId: string;
  userId: string;
  productType: string;
  exp: number;
}

/**
 * Create a signed one-time link token.
 * Stateless: the token contains (orgId, userId, productType, exp) signed with HMAC.
 * No database lookup needed at verification time.
 */
export function createLinkToken(
  orgId: string,
  userId: string,
  productType: string,
): string {
  const payload: TokenPayload = {
    orgId,
    userId,
    productType,
    exp: Date.now() + TOKEN_EXPIRY_MS,
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", TOKEN_SECRET).update(payloadStr).digest("base64url");

  return `${payloadStr}.${sig}`;
}

/**
 * Verify and decode a link token.
 * Returns the payload if valid, null if expired or tampered.
 */
export function verifyLinkToken(
  token: string,
): { orgId: string; userId: string; productType: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadStr, sig] = parts as [string, string];

  // Verify HMAC
  const expectedSig = createHmac("sha256", TOKEN_SECRET).update(payloadStr).digest("base64url");
  if (sig !== expectedSig) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(payloadStr, "base64url").toString("utf-8"),
    ) as TokenPayload;

    if (payload.exp < Date.now()) return null;

    return {
      orgId: payload.orgId,
      userId: payload.userId,
      productType: payload.productType,
    };
  } catch {
    return null;
  }
}
