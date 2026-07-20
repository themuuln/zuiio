import { describe, expect, it, vi } from "vitest";

vi.mock("@/flow-executor/nodes/send-message", () => ({
	handleSendMessage: vi.fn().mockResolvedValue({
		action: { type: "next" },
		messages: [{ text: "sent via mock" }],
	}),
}));

vi.mock("@/flow-executor/nodes/ask-question", () => ({
	handleAskQuestion: vi.fn().mockResolvedValue({
		action: { type: "wait", waitType: "question_response" },
		messages: [{ text: "question?" }],
	}),
}));

vi.mock("@/flow-executor/nodes/condition", () => ({
	handleCondition: vi.fn().mockResolvedValue({
		action: { type: "branch", edgeLabel: "true" },
		messages: [],
	}),
}));

vi.mock("@/flow-executor/nodes/set-field", () => ({
	handleSetField: vi.fn().mockResolvedValue({
		action: { type: "next" },
		messages: [],
		fieldUpdates: { test: "value" },
	}),
}));

vi.mock("@/flow-executor/nodes/delay", () => ({
	handleDelay: vi.fn().mockResolvedValue({
		action: { type: "wait", waitType: "delay" },
		messages: [],
	}),
}));

vi.mock("@/flow-executor/nodes/action", () => ({
	handleAction: vi.fn().mockResolvedValue({
		action: { type: "next" },
		messages: [],
		sideEffects: [{ type: "tag", tag: "vip" }],
	}),
}));

vi.mock("@/flow-executor/nodes/card-carousel", () => ({
	handleCardCarousel: vi.fn().mockResolvedValue({
		action: { type: "next" },
		messages: [{ text: "Card 1" }],
	}),
}));

vi.mock("@/flow-executor/nodes/ai-reply", () => ({
	handleAiReply: vi.fn().mockResolvedValue({
		action: { type: "next" },
		messages: [{ text: "AI reply" }],
	}),
}));

vi.mock("@/flow-executor/nodes/ab-test", () => ({
	handleAbTest: vi.fn().mockResolvedValue({
		action: { type: "next" },
		messages: [{ text: "Variant" }],
		assignment: { experimentId: "exp-1", variantId: "a" },
	}),
}));

describe("executeNode", () => {
	it("dispatches sendMessage nodes", async () => {
		const { executeNode } = await import("@/flow-executor/nodes");

		const result = await executeNode({} as never, {
			id: "n1",
			type: "sendMessage",
			data: { message: "Hello" },
		});

		expect(result.messages[0].text).toBe("sent via mock");
	});

	it("dispatches askQuestion nodes", async () => {
		const { executeNode } = await import("@/flow-executor/nodes");

		const result = await executeNode({} as never, {
			id: "n2",
			type: "askQuestion",
			data: { question: "What?", saveToField: "answer" },
		});

		expect(result.action.type).toBe("wait");
	});

	it("dispatches condition nodes", async () => {
		const { executeNode } = await import("@/flow-executor/nodes");

		const result = await executeNode({} as never, {
			id: "n3",
			type: "condition",
			data: { field: "status", operator: "equals", value: "active" },
		});

		expect(result.action.type).toBe("branch");
	});

	it("dispatches setField nodes", async () => {
		const { executeNode } = await import("@/flow-executor/nodes");

		const result = await executeNode({} as never, {
			id: "n4",
			type: "setField",
			data: { field: "name", value: "Test" },
		});

		expect(result.fieldUpdates).toEqual({ test: "value" });
	});

	it("dispatches delay nodes", async () => {
		const { executeNode } = await import("@/flow-executor/nodes");

		const result = await executeNode({} as never, {
			id: "n5",
			type: "delay",
			data: { duration: 5, unit: "seconds" },
		});

		expect(result.action.type).toBe("wait");
	});

	it("dispatches action nodes", async () => {
		const { executeNode } = await import("@/flow-executor/nodes");

		const result = await executeNode({} as never, {
			id: "n6",
			type: "action",
			data: { actionType: "tag", value: "test" },
		});

		expect(result.sideEffects).toBeDefined();
	});

	it("dispatches cardCarousel nodes", async () => {
		const { executeNode } = await import("@/flow-executor/nodes");

		const result = await executeNode({} as never, {
			id: "n7",
			type: "cardCarousel",
			data: { cards: [] },
		});

		expect(result.messages[0].text).toBe("Card 1");
	});

	it("dispatches aiReply nodes", async () => {
		const { executeNode } = await import("@/flow-executor/nodes");

		const result = await executeNode({} as never, {
			id: "n8",
			type: "aiReply",
			data: {
				systemPrompt: "System",
				model: "default",
				contextSize: 4096,
				temperature: 0.7,
			},
		});

		expect(result.messages[0].text).toBe("AI reply");
	});

	it("dispatches abTest nodes", async () => {
		const { executeNode } = await import("@/flow-executor/nodes");

		const result = await executeNode({} as never, {
			id: "n9",
			type: "abTest",
			data: { variants: [] },
		});

		expect(result.messages[0].text).toBe("Variant");
		expect(result.assignment).toBeDefined();
	});

	it("returns default result for unknown node types", async () => {
		const { executeNode } = await import("@/flow-executor/nodes");

		const result = await executeNode({} as never, {
			id: "n10",
			type: "unknown",
			data: {},
		});

		expect(result.action).toEqual({ type: "next" });
		expect(result.messages).toHaveLength(0);
	});
});
