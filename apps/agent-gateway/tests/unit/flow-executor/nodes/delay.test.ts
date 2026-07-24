import { describe, expect, it } from "vitest";

describe("handleDelay", () => {
	it("creates a 5-second delay wait state", async () => {
		const { handleDelay } = await import("@/flow-executor/nodes/delay");

		const result = await handleDelay({} as never, {
			data: { duration: 5, unit: "seconds" },
		});

		expect(result.action.type).toBe("wait");
		if (result.action.type === "wait") {
			expect(result.action.waitType).toBe("delay");
			expect(result.action.scheduledAt).toBeDefined();
			const scheduled = new Date(result.action.scheduledAt!).getTime();
			const now = Date.now();
			expect(scheduled - now).toBeGreaterThanOrEqual(4500);
			expect(scheduled - now).toBeLessThanOrEqual(6000);
		}
		expect(result.messages).toHaveLength(0);
	});

	it("creates a 30-minute delay wait state", async () => {
		const { handleDelay } = await import("@/flow-executor/nodes/delay");

		const result = await handleDelay({} as never, {
			data: { duration: 30, unit: "minutes" },
		});

		expect(result.action.type).toBe("wait");
		if (result.action.type === "wait") {
			const scheduled = new Date(result.action.scheduledAt!).getTime();
			const now = Date.now();
			expect(scheduled - now).toBeGreaterThanOrEqual(1_795_000);
			expect(scheduled - now).toBeLessThanOrEqual(1_810_000);
		}
	});

	it("creates a 1-hour delay wait state", async () => {
		const { handleDelay } = await import("@/flow-executor/nodes/delay");

		const result = await handleDelay({} as never, {
			data: { duration: 1, unit: "hours" },
		});

		expect(result.action.type).toBe("wait");
		if (result.action.type === "wait") {
			const scheduled = new Date(result.action.scheduledAt!).getTime();
			const now = Date.now();
			expect(scheduled - now).toBeGreaterThanOrEqual(3_595_000);
			expect(scheduled - now).toBeLessThanOrEqual(3_610_000);
		}
	});
});

describe("calculateDelayMs", () => {
	it("returns 5000 for 5 seconds", async () => {
		const { calculateDelayMs } = await import("@/flow-executor/nodes/delay");

		expect(calculateDelayMs(5, "seconds")).toBe(5000);
	});

	it("returns 300000 for 5 minutes", async () => {
		const { calculateDelayMs } = await import("@/flow-executor/nodes/delay");

		expect(calculateDelayMs(5, "minutes")).toBe(300000);
	});

	it("returns 3600000 for 1 hour", async () => {
		const { calculateDelayMs } = await import("@/flow-executor/nodes/delay");

		expect(calculateDelayMs(1, "hours")).toBe(3_600_000);
	});

	it("returns 0 for 0 seconds", async () => {
		const { calculateDelayMs } = await import("@/flow-executor/nodes/delay");

		expect(calculateDelayMs(0, "seconds")).toBe(0);
	});
});
