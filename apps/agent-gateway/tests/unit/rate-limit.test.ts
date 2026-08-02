import { describe, expect, it } from "vitest";
import { checkRateLimitSync, RATE_LIMITS } from "@/state/rate-limit";

describe("checkRateLimitSync", () => {
	it("allows first request", () => {
		const result = checkRateLimitSync(`org-first-${Date.now()}`, 20);
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(19);
	});

	it("allows requests up to the limit", () => {
		const orgId = `org-lim-${Date.now()}`;
		for (let i = 0; i < 20; i++) {
			const result = checkRateLimitSync(orgId, 20);
			expect(result.allowed).toBe(true);
		}
	});

	it("blocks requests over the limit", () => {
		const orgId = `org-block-${Date.now()}`;
		// Exhaust the limit
		for (let i = 0; i < 20; i++) {
			checkRateLimitSync(orgId, 20);
		}
		// Next should be blocked
		const result = checkRateLimitSync(orgId, 20);
		expect(result.allowed).toBe(false);
		expect(result.remaining).toBe(0);
		expect(result.resetInMs).toBeGreaterThan(0);
	});

	it("uses separate windows for different keys", () => {
		const org1 = `org-sep-1-${Date.now()}`;
		const org2 = `org-sep-2-${Date.now()}`;

		// Exhaust org1
		for (let i = 0; i < 20; i++) {
			checkRateLimitSync(org1, 20);
		}
		expect(checkRateLimitSync(org1, 20).allowed).toBe(false);

		// org2 should still be allowed
		expect(checkRateLimitSync(org2, 20).allowed).toBe(true);
	});

	it("returns correct remaining count", () => {
		const orgId = `org-rem-${Date.now()}`;
		const r1 = checkRateLimitSync(orgId, 10);
		expect(r1.remaining).toBe(9);

		checkRateLimitSync(orgId, 10);
		const r2 = checkRateLimitSync(orgId, 10);
		expect(r2.remaining).toBe(7); // we sent 3 now
	});

	it("uses default messagesPerMinute from RATE_LIMITS", () => {
		const orgId = `org-default-${Date.now()}`;
		const result = checkRateLimitSync(orgId, RATE_LIMITS.messagesPerMinute);
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(RATE_LIMITS.messagesPerMinute - 1);
	});
});
