import { describe, expect, it } from "vitest";

describe("handleAbTest", () => {
	it("assigns a variant deterministically and returns its message", async () => {
		const { handleAbTest } = await import("@/flow-executor/nodes/ab-test");

		const result = await handleAbTest(
			{
				run: {
					id: "run-1",
					channelUserId: "user-123",
					assignments: {},
				},
			} as never,
			{
				id: "experiment-1",
				data: {
					variants: [
						{ id: "a", weight: 1, message: "Variant A message" },
						{ id: "b", weight: 1, message: "Variant B message" },
					],
				},
			},
		);

		expect(result.action).toEqual({ type: "next" });
		expect(result.messages).toHaveLength(1);
		expect(["Variant A message", "Variant B message"]).toContain(
			result.messages[0].text,
		);
		expect(result.assignment).toBeDefined();
		expect(result.assignment?.experimentId).toBe("experiment-1");
	});

	it("returns the same variant for the same user (sticky assignment)", async () => {
		const { handleAbTest } = await import("@/flow-executor/nodes/ab-test");

		const ctx = {
			run: {
				id: "run-1",
				channelUserId: "user-456",
				assignments: {},
			},
		};

		const result1 = await handleAbTest(ctx as never, {
			id: "experiment-2",
			data: {
				variants: [
					{ id: "a", weight: 1, message: "Variant A" },
					{ id: "b", weight: 1, message: "Variant B" },
				],
			},
		});

		const variantId = result1.assignment?.variantId;

		// Second call with existing assignment should return same variant
		const ctx2 = {
			run: {
				id: "run-1",
				channelUserId: "user-456",
				assignments: { "experiment-2": variantId },
			},
		};

		const result2 = await handleAbTest(ctx2 as never, {
			id: "experiment-2",
			data: {
				variants: [
					{ id: "a", weight: 1, message: "Variant A" },
					{ id: "b", weight: 1, message: "Variant B" },
				],
			},
		});

		expect(result2.assignment?.variantId).toBe(variantId);
	});

	it("handles single variant", async () => {
		const { handleAbTest } = await import("@/flow-executor/nodes/ab-test");

		const result = await handleAbTest(
			{
				run: {
					id: "run-1",
					channelUserId: "user-1",
					assignments: {},
				},
			} as never,
			{
				id: "experiment-3",
				data: {
					variants: [{ id: "only", weight: 1, message: "Only variant" }],
				},
			},
		);

		expect(result.messages[0].text).toBe("Only variant");
		expect(result.assignment?.variantId).toBe("only");
	});

	it("handles empty variants array", async () => {
		const { handleAbTest } = await import("@/flow-executor/nodes/ab-test");

		const result = await handleAbTest(
			{
				run: {
					id: "run-1",
					channelUserId: "user-1",
					assignments: {},
				},
			} as never,
			{
				id: "experiment-empty",
				data: { variants: [] },
			},
		);

		expect(result.messages[0].text).toBe("");
		expect(result.action).toEqual({ type: "next" });
	});

	it("assigns variants with different weights proportionally", async () => {
		const { handleAbTest } = await import("@/flow-executor/nodes/ab-test");

		// With 10:1 weight, variant A should be assigned ~10x more often
		const results = new Map<string, number>();
		for (let i = 0; i < 100; i++) {
			const result = await handleAbTest(
				{
					run: {
						id: "run-1",
						channelUserId: `user-${i}`,
						assignments: {},
					},
				} as never,
				{
					id: "experiment-weights",
					data: {
						variants: [
							{ id: "a", weight: 10, message: "A" },
							{ id: "b", weight: 1, message: "B" },
						],
					},
				},
			);
			const vid = result.assignment?.variantId;
			results.set(vid, (results.get(vid) ?? 0) + 1);
		}

		// A should be assigned more than B
		expect(results.get("a")!).toBeGreaterThan(results.get("b")!);
	});
});

describe("deterministic assignment", () => {
	it("returns same variant for same user and experiment", async () => {
		const { handleAbTest } = await import("@/flow-executor/nodes/ab-test");

		const result1 = await handleAbTest(
			{
				run: {
					id: "run-1",
					channelUserId: "same-user",
					assignments: {},
				},
			} as never,
			{
				id: "experiment-1",
				data: {
					variants: [{ id: "a", weight: 100, message: "M" }],
				},
			},
		);

		const result2 = await handleAbTest(
			{
				run: {
					id: "run-1",
					channelUserId: "same-user",
					assignments: {},
				},
			} as never,
			{
				id: "experiment-1",
				data: {
					variants: [{ id: "a", weight: 100, message: "M" }],
				},
			},
		);

		// Same user + same experiment = same variant
		expect(result1.assignment?.variantId).toBe(result2.assignment?.variantId);
	});
});
