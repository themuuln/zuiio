import { describe, expect, it, vi } from "vitest";

describe("handleAiReply", () => {
	it("returns fallback message when no AI provider is available", async () => {
		const { handleAiReply } = await import("@/flow-executor/nodes/ai-reply");

		const result = await handleAiReply(
			{
				run: { id: "run-1", fields: {} },
				userMessage: "Hello",
				aiProvider: null,
			} as never,
			{
				data: {
					systemPrompt: "You are a helpful assistant",
					model: "default",
					contextSize: 4096,
					temperature: 0.7,
				},
			},
		);

		expect(result.action).toEqual({ type: "next" });
		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].text).toContain("AI үйлчилгээ");
	});

	it("calls provider with system prompt and user message", async () => {
		const { handleAiReply } = await import("@/flow-executor/nodes/ai-reply");

		const mockProvider = {
			runWithTools: vi.fn().mockResolvedValue("AI response text"),
		};

		const result = await handleAiReply(
			{
				run: { id: "run-1", fields: { name: "Test" } },
				userMessage: "What is my name?",
				aiProvider: mockProvider,
			} as never,
			{
				data: {
					systemPrompt: "Custom system prompt",
					model: "gpt-4",
					contextSize: 8192,
					temperature: 0.5,
				},
			},
		);

		expect(result.messages[0].text).toBe("AI response text");
		expect(mockProvider.runWithTools).toHaveBeenCalledWith({
			system: "Custom system prompt",
			userMessage: "User info:\nname: Test\n\nUser message: What is my name?",
			maxRounds: 1,
		});
	});

	it("sends plain user message when no fields exist", async () => {
		const { handleAiReply } = await import("@/flow-executor/nodes/ai-reply");

		const mockProvider = {
			runWithTools: vi.fn().mockResolvedValue("Response"),
		};

		await handleAiReply(
			{
				run: { id: "run-1", fields: {} },
				userMessage: "Just a question",
				aiProvider: mockProvider,
			} as never,
			{
				data: {
					systemPrompt: "System",
					model: "default",
					contextSize: 4096,
					temperature: 0.7,
				},
			},
		);

		expect(mockProvider.runWithTools).toHaveBeenCalledWith(
			expect.objectContaining({
				userMessage: "Just a question",
			}),
		);
	});

	it("excludes internal fields (prefixed with _) from context", async () => {
		const { handleAiReply } = await import("@/flow-executor/nodes/ai-reply");

		const mockProvider = {
			runWithTools: vi.fn().mockResolvedValue("OK"),
		};

		await handleAiReply(
			{
				run: {
					id: "run-1",
					fields: {
						name: "Visible",
						_awaitingField: "hidden",
						_internalToken: "should-not-appear",
					},
				},
				userMessage: "Hi",
				aiProvider: mockProvider,
			} as never,
			{
				data: {
					systemPrompt: "System",
					model: "default",
					contextSize: 4096,
					temperature: 0.7,
				},
			},
		);

		const userMsg = mockProvider.runWithTools.mock.calls[0][0].userMessage;
		expect(userMsg).toContain("name: Visible");
		expect(userMsg).not.toContain("_awaitingField");
		expect(userMsg).not.toContain("_internalToken");
	});

	it("returns error message when provider throws", async () => {
		const { handleAiReply } = await import("@/flow-executor/nodes/ai-reply");

		const mockProvider = {
			runWithTools: vi.fn().mockRejectedValue(new Error("API error")),
		};

		const result = await handleAiReply(
			{
				run: { id: "run-1", fields: {} },
				userMessage: "Hi",
				aiProvider: mockProvider,
			} as never,
			{
				data: {
					systemPrompt: "System",
					model: "default",
					contextSize: 4096,
					temperature: 0.7,
				},
			},
		);

		expect(result.messages[0].text).toContain("AI алдаа");
	});
});
