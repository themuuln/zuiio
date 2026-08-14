import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_EXPIRY,
  defaultExpiryDate,
  expiryFromDays,
  generateToken,
  hashToken,
  isValidTokenFormat,
  TOKEN_LENGTH,
} from "../src/lib/public-share-token";

describe("public-share-token", () => {
  describe("generateToken", () => {
    it("returns a 64-character hex string", () => {
      const token = generateToken();
      assert.equal(token.length, TOKEN_LENGTH);
      assert.match(token, /^[0-9a-f]{64}$/);
    });

    it("generates unique tokens", () => {
      const t1 = generateToken();
      const t2 = generateToken();
      assert.notEqual(t1, t2);
    });
  });

  describe("hashToken", () => {
    it("returns a 64-character hex SHA-256 hash", () => {
      const token = generateToken();
      const hash = hashToken(token);
      assert.equal(hash.length, 64);
      assert.match(hash, /^[0-9a-f]{64}$/);
    });

    it("is deterministic", () => {
      const token = generateToken();
      assert.equal(hashToken(token), hashToken(token));
    });

    it("produces different hashes for different tokens", () => {
      const h1 = hashToken(generateToken());
      const h2 = hashToken(generateToken());
      assert.notEqual(h1, h2);
    });
  });

  describe("isValidTokenFormat", () => {
    it("accepts valid 64-char hex tokens", () => {
      assert.ok(isValidTokenFormat(generateToken()));
    });

    it("rejects too short tokens", () => {
      assert.ok(!isValidTokenFormat("abc123"));
    });

    it("rejects tokens with uppercase", () => {
      assert.ok(!isValidTokenFormat("A".repeat(64)));
    });

    it("rejects tokens with non-hex chars", () => {
      assert.ok(!isValidTokenFormat(`g${"0".repeat(63)}`));
    });

    it("rejects empty string", () => {
      assert.ok(!isValidTokenFormat(""));
    });
  });

  describe("defaultExpiryDate", () => {
    it("returns a date in the future for invoice", () => {
      const expiry = defaultExpiryDate("invoice");
      const expected = new Date();
      expected.setDate(expected.getDate() + DEFAULT_EXPIRY.invoice);
      assert.equal(expiry.toDateString(), expected.toDateString());
    });

    it("returns a date in the future for report", () => {
      const expiry = defaultExpiryDate("report");
      const expected = new Date();
      expected.setDate(expected.getDate() + DEFAULT_EXPIRY.report);
      assert.equal(expiry.toDateString(), expected.toDateString());
    });

    it("returns a date in the future for receipt", () => {
      const expiry = defaultExpiryDate("receipt");
      const expected = new Date();
      expected.setDate(expected.getDate() + DEFAULT_EXPIRY.receipt);
      assert.equal(expiry.toDateString(), expected.toDateString());
    });
  });

  describe("expiryFromDays", () => {
    it("returns correct expiry from days", () => {
      const expiry = expiryFromDays(30);
      const expected = new Date();
      expected.setDate(expected.getDate() + 30);
      assert.equal(expiry.toDateString(), expected.toDateString());
    });
  });
});
