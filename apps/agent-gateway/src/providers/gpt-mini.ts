
import type { AiProvider, GatewayTool, ToolContext } from "./types";

/**
 * OpenAI-compatible provider (GPT-4o-mini fallback).
 * Implements the same multi-turn tool-calling loop as OpenCodeGoProvider,
 * but uses OpenAI's native API format.
 */
export class GptMiniProvider implements AiProvider {
	constructor(
		private options: {
			apiKey: string;
			baseUrl?: string;
			model?: string;
		},
	) {}

	async runWithTools(params: {
		system: string;
		userMessage: string;
		tools: GatewayTool[];
		context: ToolContext;
		maxRounds?: number;
		onToken?: (token: string) => void;
		conversationHistory?: Array<{
			role: string;
			content: string | null;
			tool_calls?: Array<{
				id: string;
				type: "function";
				function: { name: string; arguments: string };
			}>;
			tool_call_id?: string;
		}>;
	}): Promise<string> {
		const {
			system,
			userMessage,
			tools,
			context,
			maxRounds = 5,
			conversationHistory,
		} = params;
		const baseUrl = this.options.baseUrl ?? "https://api.openai.com/v1";

		// Convert tools to OpenAI function-calling format
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

		// Prepend conversation history
		if (conversationHistory && conversationHistory.length > 0) {
			messages.push(...conversationHistory);
		}

		messages.push({ role: "user", content: userMessage });

		let lastContent: string | null = null;

		for (let round = 0; round < maxRounds; round++) {
			const isStreaming = !!params.onToken;
			const body: Record<string, unknown> = {
				model: this.options.model ?? "gpt-4o-mini",
				messages,
				temperature: 0.3,
				max_tokens: 1024,
				stream: isStreaming,
			};

			if (openAiTools.length > 0) {
				body.tools = openAiTools;
			}

			const response = await fetch(`${baseUrl}/chat/completions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.options.apiKey}`,
				},
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				const errBody = await response.text().catch(() => "unknown error");
				throw new Error(`OpenAI API error: ${response.status} — ${errBody}`);
			}

			// Parse response — streaming or non-streaming
			let message: { content: string | null; tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }> } | null = null;

			if (isStreaming && response.body) {
				// Parse SSE stream
				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";
				const toolCallsById = new Map<string, { id: string; name: string; arguments: string }>();

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

						const parsed = JSON.parse(data) as Record<string, unknown>;
						const choices = parsed.choices as Array<Record<string, unknown>> | undefined;
						const delta = choices?.[0]?.delta as Record<string, unknown> | undefined;
						if (!delta) continue;

						// Content token
						if (typeof delta.content === "string" && delta.content) {
							lastContent = (lastContent ?? "") + delta.content;
							params.onToken?.(delta.content);
						}

						// Tool call delta
						const tcDelta = delta.tool_calls as Array<Record<string, unknown>> | undefined;
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

				const toolCalls = toolCallsById.size > 0
					? [...toolCallsById.values()].map((tc) => ({
						id: tc.id,
						type: "function" as const,
						function: { name: tc.name, arguments: tc.arguments },
					}))
					: undefined;

				message = { content: lastContent, tool_calls: toolCalls };
			} else {
				// Non-streaming: parse full JSON response
				const json = await response.json() as Record<string, unknown>;
				const choices = json.choices as Array<Record<string, unknown>> | undefined;
				const msg = choices?.[0]?.message as Record<string, unknown> | undefined;
				if (!msg) {
					throw new Error("OpenAI API returned empty response");
				}
				message = {
					content: (msg.content as string) ?? null,
					tool_calls: msg.tool_calls as Array<{ id: string; type: string; function: { name: string; arguments: string } }> | undefined,
				};
			}

			if (!message) {
				throw new Error("OpenAI API returned empty response");
			}

			if (message.content) {
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
}
