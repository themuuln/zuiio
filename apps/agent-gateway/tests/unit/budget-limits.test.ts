import { describe, expect, it } from "vitest";
import { DAILY_LIMITS, REQUEST_LIMITS } from "@/state/budget";

describe("REQUEST_LIMITS", () => {
	it("has maxToolRounds set to 5 (tuned for speed — 10 was tail latency)", () => {
		expect(REQUEST_LIMITS.maxToolRounds).toBe(5);
	});

	it("has maxTotalTokens set to 100_000", () => {
		expect(REQUEST_LIMITS.maxTotalTokens).toBe(100_000);
	});

	it("has maxResultTokens set to 16_384", () => {
		expect(REQUEST_LIMITS.maxResultTokens).toBe(16_384);
	});
});

describe("DAILY_LIMITS", () => {
	it("has softCapTokens set to 5_000_000", () => {
		expect(DAILY_LIMITS.softCapTokens).toBe(5_000_000);
	});

	it("has hardCapTokens set to 10_000_000", () => {
		expect(DAILY_LIMITS.hardCapTokens).toBe(10_000_000);
	});
});
