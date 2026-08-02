import { describe, expect, it, vi } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/crypto";

vi.mock("server-only", () => ({}));

const KEY = "test-encryption-key-12345";

describe("encryptSecret / decryptSecret", () => {
	it("round-trips a secret", () => {
		process.env.META_TOKEN_ENCRYPTION_KEY = KEY;
		const encrypted = encryptSecret("page-token-abc");
		expect(encrypted).not.toContain("page-token-abc");
		expect(decryptSecret(encrypted)).toBe("page-token-abc");
	});

	it("produces unique ciphertext per call (random IV)", () => {
		process.env.META_TOKEN_ENCRYPTION_KEY = KEY;
		const a = encryptSecret("same");
		const b = encryptSecret("same");
		expect(a).not.toBe(b);
		expect(decryptSecret(a)).toBe("same");
		expect(decryptSecret(b)).toBe("same");
	});

	it("uses different keys → different ciphertext", () => {
		process.env.META_TOKEN_ENCRYPTION_KEY = "key-one";
		const a = encryptSecret("data");
		process.env.META_TOKEN_ENCRYPTION_KEY = "key-two";
		const b = encryptSecret("data");
		expect(a).not.toBe(b);
	});

	it("fails closed with plain: prefix when no key configured", () => {
		delete process.env.META_TOKEN_ENCRYPTION_KEY;
		const value = encryptSecret("plain-secret");
		expect(value.startsWith("plain:")).toBe(true);
		expect(decryptSecret(value)).toBe("plain-secret");
	});

	it("passes through legacy plaintext when decrypting non-encrypted values", () => {
		process.env.META_TOKEN_ENCRYPTION_KEY = KEY;
		expect(decryptSecret("legacy-token")).toBe("legacy-token");
	});

	it("returns raw value on tampered ciphertext (never throws)", () => {
		process.env.META_TOKEN_ENCRYPTION_KEY = KEY;
		const encrypted = encryptSecret("token");
		const tampered = `${encrypted.slice(0, -4)}AAAA`;
		const result = decryptSecret(tampered);
		expect(typeof result).toBe("string");
		// Must not return the original plaintext
		expect(result).not.toBe("token");
	});
});
