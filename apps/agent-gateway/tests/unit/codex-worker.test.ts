import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type CodexEnv,
	handleCodexRequest,
	type KvNamespace,
	toCodexResponsesBody,
} from "../../cloudflare-worker/src/codex";

class MemoryKv implements KvNamespace {
	private readonly values = new Map<string, string>();

	async get(key: string): Promise<string | null> {
		return this.values.get(key) ?? null;
	}

	async put(
		key: string,
		value: string,
		_options?: { expirationTtl?: number },
	): Promise<void> {
		this.values.set(key, value);
	}
}

function makeEnv(): CodexEnv {
	return {
		CODEX_KV: new MemoryKv(),
		CODEX_REFRESH_TOKEN: "refresh-token",
		CODEX_ACCOUNT_ID: "account-id",
		CODEX_CLIENT_ID: "client-id",
		CODEX_BASE_URL: "https://chatgpt.com/backend-api/codex",
		CODEX_PROXY_API_KEY: "proxy-key",
	};
}

beforeEach(() => {
	vi.restoreAllMocks();
});

describe("toCodexResponsesBody", () => {
	it("converts chat messages to Codex input and forces streaming", () => {
		const body = JSON.parse(
			toCodexResponsesBody({
				model: "gpt-5.6-luna",
				messages: [{ role: "user", content: "Сайн байна уу" }],
				tools: [{ type: "function", function: { name: "lookup" } }],
			}),
		);

		expect(body).toMatchObject({
			model: "gpt-5.6-luna",
			store: false,
			stream: true,
			input: [
				{
					role: "user",
					content: [{ type: "input_text", text: "Сайн байна уу" }],
				},
			],
			tools: [{ type: "function", name: "lookup" }],
		});
	});
	it("preserves function calls and outputs for tool-loop turns", () => {
		const body = JSON.parse(
			toCodexResponsesBody({
				model: "gpt-5.6-luna",
				messages: [
					{ role: "system", content: "Use tools" },
					{
						role: "assistant",
						content: null,
						tool_calls: [
							{
								id: "call-1",
								function: { name: "lookup", arguments: '{"id":1}' },
							},
						],
					},
					{
						role: "tool",
						tool_call_id: "call-1",
						content: '{"name":"Test"}',
					},
				],
			}),
		);

		expect(body.input).toEqual([
			{
				role: "developer",
				content: [{ type: "input_text", text: "Use tools" }],
			},
			{
				type: "function_call",
				call_id: "call-1",
				name: "lookup",
				arguments: '{"id":1}',
			},
			{
				type: "function_call_output",
				call_id: "call-1",
				output: '{"name":"Test"}',
			},
		]);
	});

	it("rejects malformed chat requests", () => {
		expect(() => toCodexResponsesBody({ model: "gpt-5.6-luna" })).toThrow(
			"messages must be a list",
		);
	});
	it("rejects models other than Luna", () => {
		expect(() =>
			toCodexResponsesBody({
				model: "gpt-5.6-sol",
				messages: [],
			}),
		).toThrow("only gpt-5.6-luna is supported");
	});
});

describe("handleCodexRequest", () => {
	it("requires the proxy API key", async () => {
		const response = await handleCodexRequest(
			new Request("https://worker.test/codex/v1/responses", { method: "POST" }),
			makeEnv(),
		);

		expect(response.status).toBe(401);
	});

	it("refreshes OAuth and converts Codex SSE to chat-completion SSE", async () => {
		const codexEvents = [
			{
				type: "response.output_text.delta",
				delta: "Сайн байна",
			},
			{ type: "response.completed" },
		]
			.map((event) => `data: ${JSON.stringify(event)}\n\n`)
			.join("");
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({ access_token: "access-token", expires_in: 3600 }),
					{ headers: { "Content-Type": "application/json" } },
				),
			)
			.mockResolvedValueOnce(
				new Response(codexEvents, {
					headers: { "Content-Type": "text/event-stream" },
				}),
			);
		vi.stubGlobal("fetch", fetchMock);

		const response = await handleCodexRequest(
			new Request("https://worker.test/codex/v1/chat/completions", {
				method: "POST",
				headers: { Authorization: "Bearer proxy-key" },
				body: JSON.stringify({
					model: "gpt-5.6-luna",
					messages: [{ role: "user", content: "hello" }],
				}),
			}),
			makeEnv(),
		);
		const text = await response.text();

		expect(response.status).toBe(200);
		expect(text).toContain('"content":"Сайн байна"');
		expect(text).toContain('"object":"chat.completion.chunk"');
		expect(text).toContain("data: [DONE]");
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock.mock.calls[1]?.[0]).toBe(
			"https://chatgpt.com/backend-api/codex/responses",
		);
		const requestInit = fetchMock.mock.calls[1]?.[1] as RequestInit | undefined;
		expect(requestInit?.headers).toMatchObject({
			originator: "codex_cli_rs",
			"Accept-Language": "en-US,en;q=0.9",
			Origin: "https://chatgpt.com",
			Referer: "https://chatgpt.com/codex",
		});
	});
});
