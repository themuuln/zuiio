import "server-only";

import type { GatewayTool, ToolContext } from "@zuiio/gateway-core";

/** History message shape accepted by the providers. */
export interface LoopHistoryMessage {
	role: string;
	content: string | null;
	tool_calls?: Array<{
		id: string;
		type: "function";
		function: { name: string; arguments: string };
	}>;
	tool_call_id?: string;
}

export interface OpenAiCompatibleLoopOptions {
	apiKey: string;
	baseUrl: string;
	model: string;
	system: string;
	userMessage: string;
	images?: string[];
	tools: GatewayTool[];
	context: ToolContext;
	maxRounds?: number;
	onToken?: (token: string) => void;
	conversationHistory?: LoopHistoryMessage[];
	temperature?: number;
	maxTokens?: number;
	/** Provider label for error messages (e.g. "OpenCodeGo", "OpenAI"). */
	label?: string;
	/** Per-request timeout in ms. */
	timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 90_000;
const MAX_RETRIES = 2;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * OpenAI-compatible multi-turn tool-calling loop with SSE streaming.
 *
 * Shared by the OpenCodeGo (primary) and GPT-mini (fallback) providers so the
 * streaming UX gets tokens on the PRIMARY path too — previously only the
 * fallback streamed, starving Telegram drafts of live tokens.
 */
export async function runOpenAiCompatibleLoop(
	options: OpenAiCompatibleLoopOptions,
): Promise<string> {
	const {
		apiKey,
		baseUrl,
		model,
		system,
		userMessage,
		images,
		tools,
		context,
		maxRounds = 5,
		conversationHistory,
		temperature = 0.3,
		maxTokens = 1024,
		label = "LLM",
		timeoutMs = DEFAULT_TIMEOUT_MS,
	} = options;

	const openAiTools = tools.map((t) => ({
		type: "function" as const,
		function: {
			name: t.name,
			description: t.description,
			parameters: {
				type: "object" as const,
				properties: Object.fromEntries(
					t.parameters.map((p) => [
						p.name,
						{
							type: p.type,
							description: p.description,
							...(p.enum ? { enum: p.enum } : {}),
						},
					]),
				),
				required: t.parameters.filter((p) => p.required).map((p) => p.name),
			},
		},
	}));

	const toolByName = new Map(tools.map((t) => [t.name, t]));

	const messages: Array<Record<string, unknown>> = [
		{ role: "system", content: system },
	];

	if (conversationHistory && conversationHistory.length > 0) {
		messages.push(
			...(conversationHistory as unknown as Array<Record<string, unknown>>),
		);
	}

	if (images && images.length > 0) {
		messages.push({
			role: "user",
			content: [
				{ type: "text", text: userMessage },
				...images.map((url) => ({
					type: "image_url" as const,
					image_url: { url, detail: "auto" as const },
				})),
			],
		});
	} else {
		messages.push({ role: "user", content: userMessage });
	}

	let lastContent: string | null = null;

	for (let round = 0; round < maxRounds; round++) {
		const isStreaming = !!options.onToken;
		const body: Record<string, unknown> = {
			model,
			messages,
			temperature,
			max_tokens: maxTokens,
			stream: isStreaming,
		};

		if (openAiTools.length > 0) {
			body.tools = openAiTools;
		}

		// One fetch attempt with timeout; retry transient failures with backoff.
		let response: Response | null = null;
		for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), timeoutMs);
			try {
				const res = await fetch(`${baseUrl}/chat/completions`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${apiKey}`,
					},
					body: JSON.stringify(body),
					signal: controller.signal,
				});

				if (
					res.status === 429 ||
					res.status === 500 ||
					res.status === 502 ||
					res.status === 503
				) {
					// Retryable — drain body and retry.
					await res.text().catch(() => "");
					if (attempt < MAX_RETRIES) {
						await sleep(500 * 2 ** attempt);
						continue;
					}
				}

				response = res;
				break;
			} catch (err) {
				if (controller.signal.aborted) {
					throw new Error(`${label} API timed out after ${timeoutMs}ms`);
				}
				if (attempt < MAX_RETRIES) {
					await sleep(500 * 2 ** attempt);
					continue;
				}
				throw err;
			} finally {
				clearTimeout(timer);
			}
		}

		if (!response) {
			throw new Error(`${label} API request failed after retries`);
		}

		if (!response.ok) {
			const errBody = await response.text().catch(() => "unknown error");
			throw new Error(`${label} API error: ${response.status} — ${errBody}`);
		}

		// Parse response — streaming or non-streaming
		let message: {
			content: string | null;
			tool_calls?: Array<{
				id: string;
				type: string;
				function: { name: string; arguments: string };
			}>;
		} | null = null;

		if (isStreaming && response.body) {
			// Parse SSE stream
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";
			const toolCallsById = new Map<
				string,
				{ id: string; name: string; arguments: string }
			>();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });

				const lines = buffer.split("\n");
				buffer = lines.pop() ?? "";

				for (const line of lines) {
					if (!line.startsWith("data: ")) continue;
					const data = line.slice(6).trim();
					if (data === "[DONE]") break;

					let parsed: Record<string, unknown>;
					try {
						parsed = JSON.parse(data) as Record<string, unknown>;
					} catch {
						continue; // ignore malformed keep-alive lines
					}
					const choices = parsed.choices as
						| Array<Record<string, unknown>>
						| undefined;
					const delta = choices?.[0]?.delta as
						| Record<string, unknown>
						| undefined;
					if (!delta) continue;

					// Content token
					if (typeof delta.content === "string" && delta.content) {
						lastContent = (lastContent ?? "") + delta.content;
						options.onToken?.(delta.content);
					}

					// Tool call delta
					const tcDelta = delta.tool_calls as
						| Array<Record<string, unknown>>
						| undefined;
					if (tcDelta) {
						for (const tc of tcDelta) {
							const idx = tc.index as number;
							const existing = toolCallsById.get(String(idx));
							const fn = tc.function as Record<string, unknown> | undefined;
							if (existing) {
								existing.arguments += (fn?.arguments as string) ?? "";
							} else if (fn) {
								toolCallsById.set(String(idx), {
									id: (tc.id as string) ?? `call_${idx}`,
									name: (fn.name as string) ?? "",
									arguments: (fn.arguments as string) ?? "",
								});
							}
						}
					}
				}
			}

			const toolCalls =
				toolCallsById.size > 0
					? [...toolCallsById.values()].map((tc) => ({
							id: tc.id,
							type: "function" as const,
							function: { name: tc.name, arguments: tc.arguments },
						}))
					: undefined;

			message = { content: lastContent, tool_calls: toolCalls };
		} else {
			// Non-streaming: parse full JSON response
			const json = (await response.json()) as Record<string, unknown>;
			const choices = json.choices as
				| Array<Record<string, unknown>>
				| undefined;
			const msg = choices?.[0]?.message as Record<string, unknown> | undefined;
			if (!msg) {
				throw new Error(`${label} API returned empty response`);
			}
			message = {
				content: (msg.content as string) ?? null,
				tool_calls: msg.tool_calls as
					| Array<{
							id: string;
							type: string;
							function: { name: string; arguments: string };
					  }>
					| undefined,
			};
		}

		if (!message) {
			throw new Error(`${label} API returned empty response`);
		}

		if (message.content && typeof message.content === "string") {
			lastContent = message.content;
		}

		// No tool calls → done
		if (!message.tool_calls || message.tool_calls.length === 0) {
			return (
				lastContent ??
				"Уучлаарай, хариулт үүсгэхэд алдаа гарлаа. Дахин оролдоно уу."
			);
		}

		// Push assistant message with tool_calls
		messages.push(message);

		// Execute each tool call
		for (const tc of message.tool_calls) {
			const tool = toolByName.get(tc.function.name);
			let resultContent: string;

			if (!tool) {
				resultContent = JSON.stringify({
					error: `Багаж олдсонгүй: ${tc.function.name}`,
				});
			} else {
				try {
					const args = JSON.parse(tc.function.arguments) as Record<
						string,
						unknown
					>;
					const raw = await tool.execute(args, context);
					resultContent = typeof raw === "string" ? raw : JSON.stringify(raw);
				} catch (err) {
					resultContent = JSON.stringify({
						error:
							err instanceof Error
								? err.message
								: "Багаж ажиллуулахад алдаа гарлаа",
					});
				}
			}

			messages.push({
				role: "tool",
				tool_call_id: tc.id,
				content: resultContent,
			});
		}
	}

	return (
		lastContent ??
		"Уучлаарай, хүсэлтийг боловсруулж дуусгах боломжгүй байна. Дахин оролдоно уу."
	);
}
