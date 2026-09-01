import { describe, expect, it } from "vitest";

import { FacebookChannel } from "@/channels/facebook";
import { TelegramChannel } from "@/channels/telegram";
import { runOpenAiCompatibleLoop } from "@/providers/openai-compatible-loop";
import {
	externalApiServer,
	HttpResponse,
	http,
	useExternalApiServer,
} from "../fixtures/external-api-msw";

useExternalApiServer();

describe("external API adapters with MSW", () => {
	it("sends a Facebook message through the Meta Graph API", async () => {
		let requestBody: {
			recipient?: { id?: string };
			message?: { text?: string };
		};
		let accessToken: string | null = null;
		externalApiServer.use(
			http.post(
				"https://graph.facebook.com/v25.0/:pageId/messages",
				async ({ request }) => {
					requestBody = (await request.json()) as typeof requestBody;
					accessToken = new URL(request.url).searchParams.get("access_token");
					return HttpResponse.json({
						recipient_id: "psid-1",
						message_id: "m-1",
					});
				},
			),
		);

		const channel = new FacebookChannel({
			pageId: "page-1",
			pageAccessToken: "page-token",
		});
		const sent = await channel.sendMessage("psid-1", "Сайн байна уу");

		expect(sent).toBe(true);
		expect(accessToken).toBe("page-token");
		expect(requestBody).toEqual({
			recipient: { id: "psid-1" },
			messaging_type: "RESPONSE",
			message: { text: "Сайн байна уу" },
		});
	});

	it("sends a Telegram message through the Bot API", async () => {
		let requestBody: { chat_id?: number | string; text?: string };
		externalApiServer.use(
			http.post(
				"https://api.telegram.org/bottest-token/sendMessage",
				async ({ request }) => {
					requestBody = (await request.json()) as typeof requestBody;
					return HttpResponse.json({
						ok: true,
						result: { message_id: 42 },
					});
				},
			),
		);

		const channel = new TelegramChannel("test-token");
		const sent = await channel.sendMessage("chat-1", "hello");

		expect(sent).toBe(true);
		expect(requestBody).toMatchObject({ chat_id: "chat-1", text: "hello" });
	});

	it("retries a transient LLM response and returns the final answer", async () => {
		let requests = 0;
		externalApiServer.use(
			http.post("https://llm.test/chat/completions", () => {
				requests++;
				if (requests === 1) {
					return HttpResponse.json(
						{ error: { message: "temporary upstream failure" } },
						{ status: 503 },
					);
				}
				return HttpResponse.json({
					choices: [{ message: { content: "Хариу бэлэн боллоо." } }],
				});
			}),
		);

		const answer = await runOpenAiCompatibleLoop({
			apiKey: "test-key",
			baseUrl: "https://llm.test",
			model: "test-model",
			system: "system",
			userMessage: "hello",
			tools: [],
			context: {
				orgId: "org-1",
				userId: "user-1",
				supabase: {} as never,
			},
			maxRounds: 1,
		});

		expect(answer).toBe("Хариу бэлэн боллоо.");
		expect(requests).toBe(2);
	});

	it("does not retry an LLM quota response", async () => {
		let requests = 0;
		externalApiServer.use(
			http.post("https://llm-quota.test/chat/completions", () => {
				requests++;
				return HttpResponse.json(
					{ error: { message: "insufficient_quota" } },
					{ status: 429 },
				);
			}),
		);

		await expect(
			runOpenAiCompatibleLoop({
				apiKey: "test-key",
				baseUrl: "https://llm-quota.test",
				model: "test-model",
				system: "system",
				userMessage: "hello",
				tools: [],
				context: {
					orgId: "org-1",
					userId: "user-1",
					supabase: {} as never,
				},
				maxRounds: 1,
			}),
		).rejects.toThrow(/insufficient_quota/);
		expect(requests).toBe(1);
	});
});
