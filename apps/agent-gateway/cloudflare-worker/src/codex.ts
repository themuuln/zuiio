const CODEX_MODEL = "gpt-5.6-luna";

export interface KvNamespace {
	get(key: string): Promise<string | null>;
	put(
		key: string,
		value: string,
		options?: { expirationTtl?: number },
	): Promise<void>;
}

export interface CodexEnv {
	CODEX_KV: KvNamespace;
	CODEX_REFRESH_TOKEN: string;
	CODEX_ACCOUNT_ID: string;
	CODEX_CLIENT_ID: string;
	CODEX_BASE_URL?: string;
	CODEX_PROXY_API_KEY?: string;
}

interface TokenResponse {
	access_token: string;
	expires_in: number;
	refresh_token?: string;
}

interface ChatToolCall {
	id: string;
	function: { name: string; arguments: string };
}

interface ChatMessage {
	role: string;
	content: unknown;
	tool_call_id?: string;
	tool_calls?: ChatToolCall[];
}

interface ChatRequest {
	model: string;
	messages: ChatMessage[];
	tools?: unknown;
}

interface ResponsesTool {
	type: "function";
	name: string;
	description?: string;
	parameters?: unknown;
	strict?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isTokenResponse(value: unknown): value is TokenResponse {
	return (
		isRecord(value) &&
		typeof value.access_token === "string" &&
		typeof value.expires_in === "number"
	);
}

function parseChatToolCalls(value: unknown): ChatToolCall[] | undefined {
	if (!Array.isArray(value)) return undefined;
	return value.map((call) => {
		if (
			!isRecord(call) ||
			typeof call.id !== "string" ||
			!isRecord(call.function)
		) {
			throw new Error("invalid assistant tool call");
		}
		if (
			typeof call.function.name !== "string" ||
			typeof call.function.arguments !== "string"
		) {
			throw new Error("invalid assistant tool function");
		}
		return {
			id: call.id,
			function: {
				name: call.function.name,
				arguments: call.function.arguments,
			},
		};
	});
}

function toResponsesTools(value: unknown): ResponsesTool[] | undefined {
	if (!Array.isArray(value)) return undefined;
	return value.map((tool) => {
		if (
			!isRecord(tool) ||
			tool.type !== "function" ||
			!isRecord(tool.function)
		) {
			throw new Error("invalid function tool");
		}
		if (typeof tool.function.name !== "string") {
			throw new Error("function tool name is required");
		}
		return {
			type: "function",
			name: tool.function.name,
			...(typeof tool.function.description === "string"
				? { description: tool.function.description }
				: {}),
			...(typeof tool.function.parameters !== "undefined"
				? { parameters: tool.function.parameters }
				: {}),
			...(typeof tool.function.strict === "boolean"
				? { strict: tool.function.strict }
				: {}),
		};
	});
}

function parseChatRequest(value: unknown): ChatRequest {
	if (!isRecord(value) || value.model !== CODEX_MODEL) {
		throw new Error(`only ${CODEX_MODEL} is supported`);
	}
	if (!Array.isArray(value.messages)) {
		throw new Error("messages must be a list");
	}
	const messages = value.messages.map((message) => {
		if (
			!isRecord(message) ||
			typeof message.role !== "string" ||
			!("content" in message)
		) {
			throw new Error("each message needs role and content");
		}
		return {
			role: message.role,
			content: message.content,
			...(typeof message.tool_call_id === "string"
				? { tool_call_id: message.tool_call_id }
				: {}),
			...(message.tool_calls
				? { tool_calls: parseChatToolCalls(message.tool_calls) }
				: {}),
		};
	});
	return {
		model: value.model,
		messages,
		...(value.tools ? { tools: value.tools } : {}),
	};
}

function contentToText(content: unknown): string {
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return String(content ?? "");
	return content
		.filter(isRecord)
		.map((part) => {
			if (typeof part.text === "string") return part.text;
			if (typeof part.content === "string") return part.content;
			return "";
		})
		.join("\n");
}

function toResponsesInput(
	messages: ChatMessage[],
): Array<Record<string, unknown>> {
	const input: Array<Record<string, unknown>> = [];
	for (const message of messages) {
		if (message.role === "tool") {
			if (!message.tool_call_id) throw new Error("tool_call_id is required");
			input.push({
				type: "function_call_output",
				call_id: message.tool_call_id,
				output: contentToText(message.content),
			});
			continue;
		}
		if (message.role === "assistant" && message.tool_calls) {
			for (const call of message.tool_calls) {
				input.push({
					type: "function_call",
					call_id: call.id,
					name: call.function.name,
					arguments: call.function.arguments,
				});
			}
			continue;
		}
		input.push({
			role: message.role === "system" ? "developer" : message.role,
			content: [{ type: "input_text", text: contentToText(message.content) }],
		});
	}
	return input;
}

export function toCodexResponsesBody(value: unknown): string {
	const chat = parseChatRequest(value);
	const tools = toResponsesTools(chat.tools);
	return JSON.stringify({
		model: chat.model,
		input: toResponsesInput(chat.messages),
		store: false,
		stream: true,
		...(tools ? { tools } : {}),
	});
}
function normalizeCodexResponsesBody(value: unknown): string {
	if (!isRecord(value) || value.model !== CODEX_MODEL) {
		throw new Error(`only ${CODEX_MODEL} is supported`);
	}
	return JSON.stringify({ ...value, store: false, stream: true });
}

async function getAccessToken(env: CodexEnv): Promise<string> {
	const cached = await env.CODEX_KV.get("access_token");
	const expiresAt = Number((await env.CODEX_KV.get("expires_at")) ?? 0);
	if (cached && Date.now() < expiresAt - 60_000) return cached;

	const refreshToken =
		(await env.CODEX_KV.get("refresh_token")) ?? env.CODEX_REFRESH_TOKEN;
	const response = await fetch("https://auth.openai.com/oauth/token", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			grant_type: "refresh_token",
			refresh_token: refreshToken,
			client_id: env.CODEX_CLIENT_ID,
		}),
	});
	if (!response.ok) {
		throw new Error(`OAuth refresh failed with status ${response.status}`);
	}
	const payload: unknown = await response.json();
	if (!isTokenResponse(payload))
		throw new Error("OAuth refresh returned invalid data");

	await env.CODEX_KV.put("access_token", payload.access_token, {
		expirationTtl: Math.max(60, payload.expires_in - 60),
	});
	await env.CODEX_KV.put(
		"expires_at",
		String(Date.now() + payload.expires_in * 1000),
	);
	if (payload.refresh_token) {
		await env.CODEX_KV.put("refresh_token", payload.refresh_token);
	}
	return payload.access_token;
}

function sseChunk(
	delta: Record<string, unknown>,
	finishReason: string | null = null,
): string {
	return `data: ${JSON.stringify({
		id: "codex-proxy",
		object: "chat.completion.chunk",
		choices: [{ index: 0, delta, finish_reason: finishReason }],
	})}\n\n`;
}

function transformCodexStream(
	body: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
	const decoder = new TextDecoder();
	const encoder = new TextEncoder();
	const reader = body.getReader();
	const toolCalls = new Map<string, number>();
	let nextToolIndex = 0;
	let buffer = "";

	return new ReadableStream<Uint8Array>({
		async pull(controller) {
			const { done, value } = await reader.read();
			if (done) {
				controller.enqueue(encoder.encode("data: [DONE]\n\n"));
				controller.close();
				return;
			}
			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() ?? "";

			for (const line of lines) {
				if (!line.startsWith("data: ")) continue;
				const data = line.slice(6).trim();
				if (!data || data === "[DONE]") continue;
				let event: unknown;
				try {
					event = JSON.parse(data) as unknown;
				} catch {
					continue;
				}
				if (!isRecord(event) || typeof event.type !== "string") continue;

				if (event.type === "response.output_text.delta") {
					if (typeof event.delta === "string") {
						controller.enqueue(
							encoder.encode(sseChunk({ content: event.delta })),
						);
					}
					continue;
				}

				if (
					event.type === "response.output_item.added" &&
					isRecord(event.item)
				) {
					const item = event.item;
					if (item.type !== "function_call") continue;
					const callId = String(
						item.call_id ?? item.id ?? `call_${nextToolIndex}`,
					);
					const index = nextToolIndex++;
					if (typeof item.id === "string") toolCalls.set(item.id, index);
					toolCalls.set(callId, index);
					controller.enqueue(
						encoder.encode(
							sseChunk({
								tool_calls: [
									{
										index,
										id: callId,
										type: "function",
										function: {
											name: String(item.name ?? ""),
											arguments: "",
										},
									},
								],
							}),
						),
					);
					continue;
				}

				if (event.type === "response.function_call_arguments.delta") {
					const callId = String(event.item_id ?? event.call_id ?? "");
					const index = toolCalls.get(callId);
					if (index === undefined || typeof event.delta !== "string") continue;
					controller.enqueue(
						encoder.encode(
							sseChunk({
								tool_calls: [{ index, function: { arguments: event.delta } }],
							}),
						),
					);
				}

				if (event.type === "response.completed") {
					controller.enqueue(
						encoder.encode(
							sseChunk({}, toolCalls.size > 0 ? "tool_calls" : "stop"),
						),
					);
				}
			}
		},
		cancel() {
			void reader.cancel();
		},
	});
}

export async function handleCodexRequest(
	request: Request,
	env: CodexEnv,
): Promise<Response> {
	const url = new URL(request.url);
	if (url.pathname === "/codex/health") return new Response("ok");
	if (url.pathname === "/codex/v1/models") {
		return Response.json({
			object: "list",
			data: [{ id: "gpt-5.6-luna", object: "model" }],
		});
	}
	if (request.method !== "POST")
		return new Response("Method not allowed", { status: 405 });

	const isChat = url.pathname === "/codex/v1/chat/completions";
	const isResponses = url.pathname === "/codex/v1/responses";
	if (!isChat && !isResponses)
		return new Response("Not found", { status: 404 });
	if (!env.CODEX_PROXY_API_KEY) {
		return new Response("Codex proxy is not configured", { status: 503 });
	}
	if (
		request.headers.get("authorization") !== `Bearer ${env.CODEX_PROXY_API_KEY}`
	) {
		return new Response("unauthorized", { status: 401 });
	}

	const rawBody = await request.text();
	let body: string;
	try {
		const parsed: unknown = JSON.parse(rawBody) as unknown;
		body = isChat
			? toCodexResponsesBody(parsed)
			: normalizeCodexResponsesBody(parsed);
	} catch (error: unknown) {
		return new Response(
			error instanceof Error ? error.message : "invalid JSON",
			{ status: 400 },
		);
	}

	let token: string;
	try {
		token = await getAccessToken(env);
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "token refresh failed";
		return new Response(message, { status: 502 });
	}

	const upstream = await fetch(
		`${env.CODEX_BASE_URL ?? "https://chatgpt.com/backend-api/codex"}/responses`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
				"ChatGPT-Account-Id": env.CODEX_ACCOUNT_ID,
				"OpenAI-Beta": "responses=v1",
				originator: "codex_cli_rs",
				Accept: "text/event-stream",
				"Accept-Language": "en-US,en;q=0.9",
				"User-Agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
				Origin: "https://chatgpt.com",
				Referer: "https://chatgpt.com/codex",
			},
			body,
		},
	);

	if (!isChat || !upstream.ok || !upstream.body) {
		return new Response(upstream.body, {
			status: upstream.status,
			headers: {
				"Content-Type":
					upstream.headers.get("Content-Type") ?? "application/json",
			},
		});
	}
	return new Response(transformCodexStream(upstream.body), {
		status: upstream.status,
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
}
