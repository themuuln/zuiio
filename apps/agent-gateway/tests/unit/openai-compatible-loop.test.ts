import { beforeEach, describe, expect, it, vi } from "vitest";
import { runOpenAiCompatibleLoop } from "@/providers/openai-compatible-loop";
import type { GatewayTool, ToolContext } from "@/providers/types";

vi.mock("server-only", () => ({}));

const CONTEXT: ToolContext = {
	orgId: "org-1",
	userId: "u-1",
	supabase: {} as never,
};

function sseChunk(data: unknown): string {
	return `data: ${JSON.stringify(data)}\n\n`;
}

function makeFetchMock(
	responses: Array<{ status?: number; body?: string; error?: Error }>,
) {
	const fetchMock = vi.fn();
	for (const r of responses) {
		if (r.error) {
			fetchMock.mockRejectedValueOnce(r.error);
		} else {
			fetchMock.mockResolvedValueOnce(
				new Response(r.body, { status: r.status ?? 200 }),
			);
		}
	}
	return fetchMock;
}

beforeEach(() => {
	vi.restoreAllMocks();
});

describe("runOpenAiCompatibleLoop — streaming", () => {
	it("delivers content tokens via onToken and returns the full text", async () => {
		const stream =
			sseChunk({ choices: [{ delta: { content: "Сайн" } }] }) +
			sseChunk({ choices: [{ delta: { content: " байна" } }] }) +
			"data: [DONE]\n\n";
		globalThis.fetch = makeFetchMock([{ body: stream }]);

		const tokens: string[] = [];
		const result = await runOpenAiCompatibleLoop({
			apiKey: "k",
			baseUrl: "https://api.test/v1",
			model: "m",
			system: "sys",
			userMessage: "hi",
			tools: [],
			context: CONTEXT,
			onToken: (t) => tokens.push(t),
		});

		expect(tokens).toEqual(["Сайн", " байна"]);
		expect(result).toBe("Сайн байна");
	});

	it("executes tool calls and loops until a final answer (non-streaming)", async () => {
		const tool: GatewayTool = {
			name: "readData",
			description: "read",
			parameters: [],
			execute: vi.fn(async () => ({ rows: [{ id: 1 }] })),
		};

		const toolCallResponse = JSON.stringify({
			choices: [
				{
					message: {
						content: null,
						tool_calls: [
							{
								id: "call_1",
								type: "function",
								function: { name: "readData", arguments: "{}" },
							},
						],
					},
				},
			],
		});
		const finalResponse = JSON.stringify({
			choices: [{ message: { content: "Дууслаа" } }],
		});

		globalThis.fetch = makeFetchMock([
			{ body: toolCallResponse },
			{ body: finalResponse },
		]);

		const result = await runOpenAiCompatibleLoop({
			apiKey: "k",
			baseUrl: "https://api.test/v1",
			model: "m",
			system: "sys",
			userMessage: "hi",
			tools: [tool],
			context: CONTEXT,
			maxRounds: 3,
		});

		expect(tool.execute).toHaveBeenCalledOnce();
		expect(result).toBe("Дууслаа");
		// Second request includes the tool result
		const secondBody = JSON.parse(
			(globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[1]![1]!
				.body as string,
		);
		const toolMsg = secondBody.messages.find(
			(m: { role: string }) => m.role === "tool",
		);
		expect(toolMsg).toBeDefined();
		expect(JSON.parse(toolMsg.content)).toEqual({ rows: [{ id: 1 }] });
	});
});

describe("runOpenAiCompatibleLoop — resilience", () => {
	it("retries on 429 then succeeds", async () => {
		globalThis.fetch = makeFetchMock([
			{ status: 429, body: "rate limited" },
			{ body: JSON.stringify({ choices: [{ message: { content: "ok" } }] }) },
		]);

		const result = await runOpenAiCompatibleLoop({
			apiKey: "k",
			baseUrl: "https://api.test/v1",
			model: "m",
			system: "sys",
			userMessage: "hi",
			tools: [],
			context: CONTEXT,
		});

		expect(result).toBe("ok");
		expect(globalThis.fetch).toHaveBeenCalledTimes(2);
	});

	it("throws a timeout error when the request hangs", async () => {
		globalThis.fetch = vi.fn(
			() =>
				new Promise((_resolve, reject) => {
					setTimeout(() => reject(new Error("aborted")), 50);
				}),
		);

		await expect(
			runOpenAiCompatibleLoop({
				apiKey: "k",
				baseUrl: "https://api.test/v1",
				model: "m",
				system: "sys",
				userMessage: "hi",
				tools: [],
				context: CONTEXT,
				timeoutMs: 10,
			}),
		).rejects.toThrow();
	});

	it("survives malformed SSE lines (keep-alives) while streaming", async () => {
		const stream =
			": keep-alive\n\n" +
			"data: {broken json}\n\n" +
			sseChunk({ choices: [{ delta: { content: "hi" } }] }) +
			"data: [DONE]\n\n";
		globalThis.fetch = makeFetchMock([{ body: stream }]);

		const result = await runOpenAiCompatibleLoop({
			apiKey: "k",
			baseUrl: "https://api.test/v1",
			model: "m",
			system: "sys",
			userMessage: "hi",
			tools: [],
			context: CONTEXT,
			onToken: () => {},
		});

		expect(result).toBe("hi");
	});

	it("returns Mongolian fallback when the model returns nothing", async () => {
		globalThis.fetch = makeFetchMock([
			{ body: JSON.stringify({ choices: [{ message: { content: "" } }] }) },
		]);

		const result = await runOpenAiCompatibleLoop({
			apiKey: "k",
			baseUrl: "https://api.test/v1",
			model: "m",
			system: "sys",
			userMessage: "hi",
			tools: [],
			context: CONTEXT,
		});

		expect(result).toContain("Уучлаарай");
	});
});
