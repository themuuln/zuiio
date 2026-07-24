/**
 * E2E tests for the Telegram webhook route (POST /api/telegram/webhook).
 *
 * Tests the full request flow: auth check, command routing, message handling,
 * callback queries, and error handling — with mocked fetch/Supabase/LLM.
 *
 * Strategy: mock `fetch` globally (Telegram API calls), mock Supabase through
 * module mock, and mock LLM providers. The route imports its real code and
 * we stub its I/O boundaries.
 */
import { describe, expect, it, vi } from "vitest";

// ─── Module Mocks ──────────────────────────────────────────────────────────────
// These must use vi.mock (hoisted) before imports

vi.mock("@/lib/supabase", () => ({
	createServiceClient: vi.fn().mockReturnValue({
		from: vi.fn().mockReturnThis(),
		select: vi.fn().mockReturnThis(),
		insert: vi.fn().mockReturnThis(),
		update: vi.fn().mockReturnThis(),
		upsert: vi.fn().mockReturnThis(),
		delete: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		in: vi.fn().mockReturnThis(),
		order: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		is: vi.fn().mockReturnThis(),
		not: vi.fn().mockReturnThis(),
		or: vi.fn().mockReturnThis(),
		gte: vi.fn().mockReturnThis(),
		lte: vi.fn().mockReturnThis(),
		single: vi.fn().mockResolvedValue({
			data: {
				id: "link-1",
				organization_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
				user_id: "user-123",
				telegram_chat_id: 12345,
				telegram_user_id: 67890,
				is_active: true,
				notification_preferences: { productType: "zer" },
				created_at: "2026-01-01T00:00:00Z",
				updated_at: "2026-01-01T00:00:00Z",
			},
			error: null,
		}),
		maybeSingle: vi.fn().mockResolvedValue({
			data: {
				id: "link-1",
				organization_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
				user_id: "user-123",
				telegram_chat_id: 12345,
				telegram_user_id: 67890,
				is_active: true,
			},
			error: null,
		}),
		rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
		then: undefined,
	}),
	getSupabaseForProduct: vi.fn().mockReturnValue({
		from: vi.fn().mockReturnThis(),
		select: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		single: vi.fn().mockResolvedValue({ data: null, error: null }),
		then: undefined,
	}),
}));

vi.mock("@/state/budget", () => ({
	checkDailyBudget: vi
		.fn()
		.mockResolvedValue({ allowed: true, tokensUsedToday: 100 }),
	recordUsageAtomic: vi.fn().mockResolvedValue(undefined),
	REQUEST_LIMITS: {
		maxToolRounds: 5,
		maxTotalTokens: 16384,
		maxResultTokens: 2048,
	},
	DAILY_LIMITS: { softCapTokens: 500000, hardCapTokens: 1000000 },
}));

vi.mock("@/state/rate-limit", () => ({
	checkRateLimit: vi
		.fn()
		.mockReturnValue({ allowed: true, remaining: 19, resetInMs: 60000 }),
	RATE_LIMITS: { messagesPerMinute: 20, linksPerMinute: 10 },
}));

vi.mock("@/state/session", () => ({
	loadSession: vi.fn().mockResolvedValue({ messages: [], tokenCount: 0 }),
	saveSession: vi.fn().mockResolvedValue(undefined),
	MAX_SESSION_MESSAGES: 50,
}));

vi.mock("@/state/audit", () => ({
	withAudit: vi.fn().mockImplementation((tool) => ({
		...tool,
		execute: vi
			.fn()
			.mockImplementation((args, context) => tool.execute(args, context)),
	})),
}));

vi.mock("@/stt/groq", () => ({
	transcribeVoice: vi.fn().mockResolvedValue("transcribed text"),
}));

vi.mock("@/bot-ux", () => ({
	onUserLinked: vi.fn().mockResolvedValue(undefined),
	onWelcome: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/link-code", () => ({
	redeemLinkCode: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/tokens", () => ({
	verifyCompactToken: vi.fn().mockImplementation((token: string) => {
		if (token === "valid-token" || token === "start valid-token") {
			return {
				orgId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
				userId: "user-123",
				productType: "zer" as const,
			};
		}
		return null;
	}),
}));

vi.mock("next/server", () => ({
	NextResponse: {
		json: (data: unknown, init?: ResponseInit) =>
			new Response(JSON.stringify(data), init),
	},
	after: (fn: () => void | Promise<void>) => {
		fn();
	},
}));

const mockFetch = vi.hoisted(() =>
	vi.fn().mockResolvedValue(new Response("{}")),
);

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/telegram/webhook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("fetch", mockFetch);
	});

	it("rejects unauthorized requests (missing secret token)", async () => {
		const { POST } = await import("@/app/api/telegram/webhook/route");

		const response = await POST(
			new Request("http://localhost/api/telegram/webhook", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ update_id: 1 }),
			}),
		);

		expect(response.status).toBe(401);
	});

	it("handles /help command", async () => {
		const { POST } = await import("@/app/api/telegram/webhook/route");

		const response = await POST(
			new Request("http://localhost/api/telegram/webhook", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-telegram-bot-api-secret-token": "test-webhook-secret-2026",
				},
				body: JSON.stringify({
					update_id: 1,
					message: {
						message_id: 100,
						chat: { id: 12345, type: "private" },
						from: { id: 67890, first_name: "Test" },
						text: "/help",
					},
				}),
			}),
		);

		expect(response.status).toBe(200);
		// The Telegram API was called (via fetch mock) with sendMessage
		expect(mockFetch).toHaveBeenCalled();
		// The fetch URL should contain "sendMessage" for /help responses
		const callUrl = mockFetch.mock.calls[0]?.[0] ?? "";
		expect(callUrl).toContain("sendMessage");
	});

	it("handles /start command without token", async () => {
		const { POST } = await import("@/app/api/telegram/webhook/route");

		await POST(
			new Request("http://localhost/api/telegram/webhook", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-telegram-bot-api-secret-token": "test-webhook-secret-2026",
				},
				body: JSON.stringify({
					update_id: 2,
					message: {
						message_id: 101,
						chat: { id: 12345, type: "private" },
						from: { id: 67890, first_name: "Test" },
						text: "/start",
					},
				}),
			}),
		);

		expect(mockFetch).toHaveBeenCalled();
		const callUrl = mockFetch.mock.calls[0]?.[0] ?? "";
		expect(callUrl).toContain("sendMessage");
	});

	it("handles /start command with valid compact token", async () => {
		const { POST } = await import("@/app/api/telegram/webhook/route");

		await POST(
			new Request("http://localhost/api/telegram/webhook", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-telegram-bot-api-secret-token": "test-webhook-secret-2026",
				},
				body: JSON.stringify({
					update_id: 3,
					message: {
						message_id: 102,
						chat: { id: 12345, type: "private" },
						from: { id: 67890, first_name: "Test" },
						text: "/start valid-token",
					},
				}),
			}),
		);

		expect(mockFetch).toHaveBeenCalled();
	});

	it("handles /start with invalid compact token", async () => {
		const { POST } = await import("@/app/api/telegram/webhook/route");

		await POST(
			new Request("http://localhost/api/telegram/webhook", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-telegram-bot-api-secret-token": "test-webhook-secret-2026",
				},
				body: JSON.stringify({
					update_id: 4,
					message: {
						message_id: 103,
						chat: { id: 12345, type: "private" },
						from: { id: 67890, first_name: "Test" },
						text: "/start bad-token",
					},
				}),
			}),
		);

		expect(mockFetch).toHaveBeenCalled();
	});

	it("handles /switch command", async () => {
		const { POST } = await import("@/app/api/telegram/webhook/route");

		const response = await POST(
			new Request("http://localhost/api/telegram/webhook", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-telegram-bot-api-secret-token": "test-webhook-secret-2026",
				},
				body: JSON.stringify({
					update_id: 5,
					message: {
						message_id: 104,
						chat: { id: 12345, type: "private" },
						from: { id: 67890, first_name: "Test" },
						text: "/switch",
					},
				}),
			}),
		);

		expect(response.status).toBe(200);
	});

	it("handles /link command", async () => {
		const { POST } = await import("@/app/api/telegram/webhook/route");

		await POST(
			new Request("http://localhost/api/telegram/webhook", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-telegram-bot-api-secret-token": "test-webhook-secret-2026",
				},
				body: JSON.stringify({
					update_id: 6,
					message: {
						message_id: 105,
						chat: { id: 12345, type: "private" },
						from: { id: 67890, first_name: "Test" },
						text: "/link",
					},
				}),
			}),
		);

		expect(mockFetch).toHaveBeenCalled();
	});

	it("handles callback_query (switch org)", async () => {
		const { POST } = await import("@/app/api/telegram/webhook/route");

		const response = await POST(
			new Request("http://localhost/api/telegram/webhook", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-telegram-bot-api-secret-token": "test-webhook-secret-2026",
				},
				body: JSON.stringify({
					update_id: 7,
					callback_query: {
						id: "cb-1",
						from: { id: 67890 },
						message: {
							message_id: 200,
							chat: { id: 12345 },
						},
						data: "switch:a1b2c3d4-e5f6-7890-abcd-ef1234567890",
					},
				}),
			}),
		);

		expect(response.status).toBe(200);
	});

	it("handles regular text message (user query)", async () => {
		const { POST } = await import("@/app/api/telegram/webhook/route");

		const response = await POST(
			new Request("http://localhost/api/telegram/webhook", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-telegram-bot-api-secret-token": "test-webhook-secret-2026",
				},
				body: JSON.stringify({
					update_id: 8,
					message: {
						message_id: 107,
						chat: { id: 12345, type: "private" },
						from: { id: 67890, first_name: "Test" },
						text: "Өнөөдрийн борлуулалт хэд вэ?",
					},
				}),
			}),
		);

		expect(response.status).toBe(200);
		// Async fallback: agent runs in background, wait for sendMessage call
		await vi.waitFor(
			() => {
				expect(mockFetch).toHaveBeenCalled();
			},
			{ timeout: 5000 },
		);
	});

	it("handles voice messages", async () => {
		const { POST } = await import("@/app/api/telegram/webhook/route");

		const response = await POST(
			new Request("http://localhost/api/telegram/webhook", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-telegram-bot-api-secret-token": "test-webhook-secret-2026",
				},
				body: JSON.stringify({
					update_id: 9,
					message: {
						message_id: 108,
						chat: { id: 12345, type: "private" },
						from: { id: 67890, first_name: "Test" },
						voice: { file_id: "voice-file-id", duration: 5 },
					},
				}),
			}),
		);

		expect(response.status).toBe(200);
	});

	it("returns 200 even on downstream error", async () => {
		// Make fetch throw
		mockFetch.mockRejectedValueOnce(new Error("Network down"));

		const { POST } = await import("@/app/api/telegram/webhook/route");

		const response = await POST(
			new Request("http://localhost/api/telegram/webhook", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-telegram-bot-api-secret-token": "test-webhook-secret-2026",
				},
				body: JSON.stringify({
					update_id: 10,
					message: {
						message_id: 109,
						chat: { id: 12345, type: "private" },
						from: { id: 67890, first_name: "Test" },
						text: "/help",
					},
				}),
			}),
		);

		expect(response.status).toBe(200);
	});

	it("ignores non-text, non-voice messages", async () => {
		const { POST } = await import("@/app/api/telegram/webhook/route");

		const response = await POST(
			new Request("http://localhost/api/telegram/webhook", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-telegram-bot-api-secret-token": "test-webhook-secret-2026",
				},
				body: JSON.stringify({
					update_id: 11,
					message: {
						message_id: 110,
						chat: { id: 12345, type: "private" },
						from: { id: 67890 },
					},
				}),
			}),
		);

		expect(response.status).toBe(200);
		// No fetch calls — route returns early without Telegram API call
		expect(mockFetch).not.toHaveBeenCalled();
	});
});
// Note: vi.unstubGlobal/unstubAllEnvs not available in vitest 4.
// The next test's beforeEach re-stubs global fetch, so cleanup happens implicitly.
