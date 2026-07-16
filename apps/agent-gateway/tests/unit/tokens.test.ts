import { describe, expect, it } from "vitest";
import { createCompactToken, verifyCompactToken } from "@/lib/tokens";

describe("createCompactToken / verifyCompactToken", () => {
	const orgId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
	const userId = "11111111-2222-3333-4444-555555555555";

	it("creates a token that is ≤ 64 characters (Telegram limit)", () => {
		const token = createCompactToken(orgId, userId, "zer");
		expect(token.length).toBeLessThanOrEqual(64);
	});

	it("verifies a token it created (zer)", () => {
		const token = createCompactToken(orgId, userId, "zer");
		const payload = verifyCompactToken(token);
		expect(payload).not.toBeNull();
		expect(payload!.orgId).toBe(orgId);
		expect(payload!.userId).toBe(userId);
		expect(payload!.productType).toBe("zer");
	});

	it("verifies a token it created (tolom)", () => {
		const token = createCompactToken(orgId, userId, "tolom");
		const payload = verifyCompactToken(token);
		expect(payload).not.toBeNull();
		expect(payload!.orgId).toBe(orgId);
		expect(payload!.userId).toBe(userId);
		expect(payload!.productType).toBe("tolom");
	});

	it("returns null for tampered token (bad signature)", () => {
		const token = createCompactToken(orgId, userId, "zer");
		const tampered = token.slice(0, -1) + "X";
		const payload = verifyCompactToken(tampered);
		expect(payload).toBeNull();
	});

	it("returns null for garbage input", () => {
		expect(verifyCompactToken("not-a-token")).toBeNull();
		expect(verifyCompactToken("")).toBeNull();
		expect(verifyCompactToken("a.b.c")).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(verifyCompactToken("")).toBeNull();
	});

	it("produces deterministic-length tokens regardless of input", () => {
		const t1 = createCompactToken(orgId, userId, "zer");
		const t2 = createCompactToken(orgId, userId, "tolom");
		expect(t1.length).toBe(t2.length);
	});

	it("produces unique tokens each time (different expiry)", async () => {
		const t1 = createCompactToken(orgId, userId, "zer");
		// Wait >1s so the 4-byte expiry seconds field changes
		await new Promise((r) => setTimeout(r, 1100));
		const t2 = createCompactToken(orgId, userId, "zer");
		expect(t1).not.toBe(t2);
	});
});
