import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  return process.env.ORDER_ACCESS_SECRET || "zim-dev-order-secret";
}

/** HMAC access token gating the delivery page for guests. */
export function orderAccessToken(orderCode: string): string {
  return createHmac("sha256", secret())
    .update(orderCode)
    .digest("hex")
    .slice(0, 32);
}

export function verifyOrderAccessToken(
  orderCode: string,
  token: string | null | undefined,
): boolean {
  if (!token) return false;
  const expected = orderAccessToken(orderCode);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
