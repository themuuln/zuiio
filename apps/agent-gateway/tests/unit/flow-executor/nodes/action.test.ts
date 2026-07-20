import { describe, expect, it } from "vitest";

describe("handleAction", () => {
	it("returns side effect with type 'tag' for tag action", async () => {
		const { handleAction } = await import("@/flow-executor/nodes/action");

		const result = await handleAction(
			{ run: { id: "run-1", orgId: "org-1", fields: {} } } as never,
			{
				data: { actionType: "tag", value: "vip-customer" },
			},
		);

		expect(result.action).toEqual({ type: "next" });
		expect(result.messages).toHaveLength(0);
		expect(result.sideEffects).toHaveLength(1);
		expect(result.sideEffects?.[0]).toEqual({
			type: "tag",
			tag: "vip-customer",
		});
	});

	it("returns side effect with type 'notify' for notify action", async () => {
		const { handleAction } = await import("@/flow-executor/nodes/action");

		const result = await handleAction(
			{ run: { id: "run-1", orgId: "org-1", fields: {} } } as never,
			{
				data: { actionType: "notify", value: "New order received" },
			},
		);

		expect(result.sideEffects).toHaveLength(1);
		expect(result.sideEffects?.[0]).toEqual({
			type: "notify",
			message: "New order received",
		});
	});

	it("returns side effect with webhook type including run context", async () => {
		const { handleAction } = await import("@/flow-executor/nodes/action");

		const result = await handleAction(
			{
				run: {
					id: "run-1",
					orgId: "org-123",
					fields: { name: "Test", email: "test@example.com" },
				},
			} as never,
			{
				data: { actionType: "webhook", value: "https://example.com/hook" },
			},
		);

		expect(result.sideEffects).toHaveLength(1);
		const effect = result.sideEffects?.[0];
		expect(effect).toMatchObject({
			type: "webhook",
			url: "https://example.com/hook",
		});
		if (effect.type === "webhook") {
			expect(effect.payload.runId).toBe("run-1");
			expect(effect.payload.orgId).toBe("org-123");
			expect(effect.payload.fields).toEqual({
				name: "Test",
				email: "test@example.com",
			});
		}
	});

	it("returns setField side effect for subscribe action", async () => {
		const { handleAction } = await import("@/flow-executor/nodes/action");

		const result = await handleAction(
			{ run: { id: "run-1", orgId: "org-1", fields: {} } } as never,
			{
				data: { actionType: "subscribe", value: "newsletter" },
			},
		);

		expect(result.sideEffects).toHaveLength(1);
		expect(result.sideEffects?.[0]).toEqual({
			type: "setField",
			field: "_action_subscribe",
			value: "newsletter",
		});
	});

	it("returns setField side effect for unsubscribe action", async () => {
		const { handleAction } = await import("@/flow-executor/nodes/action");

		const result = await handleAction(
			{ run: { id: "run-1", orgId: "org-1", fields: {} } } as never,
			{
				data: { actionType: "unsubscribe", value: "promotions" },
			},
		);

		expect(result.sideEffects).toHaveLength(1);
		expect(result.sideEffects?.[0]).toEqual({
			type: "setField",
			field: "_action_unsubscribe",
			value: "promotions",
		});
	});

	it("always returns action type 'next' regardless of action type", async () => {
		const { handleAction } = await import("@/flow-executor/nodes/action");

		const result = await handleAction(
			{ run: { id: "run-1", orgId: "org-1", fields: {} } } as never,
			{
				data: { actionType: "tag", value: "test" },
			},
		);

		expect(result.action).toEqual({ type: "next" });
	});
});
