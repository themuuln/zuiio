import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { generateGoogleNonce } from "./google-nonce";

describe("generateGoogleNonce", () => {
  it("returns a fresh raw nonce and its SHA-256 hex digest", async () => {
    const first = await generateGoogleNonce();
    const second = await generateGoogleNonce();

    expect(first.rawNonce).not.toBe(second.rawNonce);
    expect(first.hashedNonce).toMatch(/^[0-9a-f]{64}$/);
    expect(createHash("sha256").update(first.rawNonce).digest("hex")).toBe(
      first.hashedNonce,
    );
  });
});
