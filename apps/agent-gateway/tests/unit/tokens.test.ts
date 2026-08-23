import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createCompactToken, verifyCompactToken } from "@/lib/tokens";

describe("createCompactToken / verifyCompactToken", () => {
	const orgId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
	const userId = "11111111-2222-3333-4444-555555555555";

	it("stays within the Telegram 64-character limit", () => {
		expect(createCompactToken(orgId, userId, "zer").length).toBeLessThanOrEqual(
			64,
		);
	});

	it.each(["zer", "tolom", "zatly"] as const)(
		"round-trips the %s product flag",
		(productType) => {
			const payload = verifyCompactToken(
				createCompactToken(orgId, userId, productType),
			);
			expect(payload).toEqual({ orgId, userId, productType });
		},
	);

	it("rejects the reserved 11 product flag", () => {
		const token = createCompactToken(orgId, userId, "zer");
		const payload = Buffer.from(token.split(".")[0], "base64url");
		payload[32] = (payload[32] ?? 0) | 0b11;
		const payloadBase64 = payload.toString("base64url");
		const signature = createHmac(
			"sha256",
			"dev-secret-change-in-production",
		)
			.update(payloadBase64)
			.digest("base64url")
			.slice(0, 12);
		expect(verifyCompactToken(`${payloadBase64}.${signature}`)).toBeNull();
	});

	it("rejects a bad signature", () => {
		const token = createCompactToken(orgId, userId, "zer");
		expect(verifyCompactToken(`${token.slice(0, -1)}X`)).toBeNull();
	});

	it.each(["not-a-token", "", "a.b.c"])("rejects malformed token %j", (token) => {
		expect(verifyCompactToken(token)).toBeNull();
	});

	it("uses a fixed wire length for every product", () => {
		const lengths = ["zer", "tolom", "zatly"].map((productType) =>
			createCompactToken(orgId, userId, productType).length,
		);
		expect(new Set(lengths).size).toBe(1);
	});
});
