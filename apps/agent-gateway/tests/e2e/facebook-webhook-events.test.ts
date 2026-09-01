/**
 * Facebook webhook event-path tests: postbacks, quick replies, confirmation
 * postbacks (confirm:/reject:), the 24h inactivity gate, and the
 * last_user_message_at stamp. Complements facebook-webhook-routing.test.ts,
 * which locks the HMAC validation and messenger/instagram row discrimination.
 */

import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createServiceClient } from "@/lib/supabase";

vi.mock("server-only", () => ({}));

const PAGE_ID = "page-123";
const APP_SECRET = "test-app-secret";

const mockHandleAgentMessage = vi.fn(async () => "Хариулт");
vi.mock("@/gateway/agent-handler", () => ({
	handleAgentMessage: (...a: unknown[]) => mockHandleAgentMessage(...a),
}));

vi.mock("@/flow-executor", () => ({
	handleFlowMessage: vi.fn(async () => null),
}));

vi.mock("@/gateway/webhook-helpers", () => ({
	systemPromptFor: vi.fn(async () => "prompt"),
	getProductTools: vi.fn(() => []),
}));

// Confirmation store — deterministic per-test staged actions.
const mockConfirmAction = vi.fn(() => null);
const mockRejectAction = vi.fn();
vi.mock("@/runtime/confirmation", () => ({
	confirmAction: (...a: unknown[]) => mockConfirmAction(...a),
	rejectAction: (...a: unknown[]) => mockRejectAction(...a),
	confirmStoredAction: (...a: unknown[]) => mockConfirmAction(...a),
	rejectStoredAction: (...a: unknown[]) => mockRejectAction(...a),
	stageAction: vi.fn(),
	stagePersistentAction: vi.fn(async () => ({ nonce: "n", buttons: [] })),
	confirmButtons: vi.fn(() => []),
}));

// Channel adapter — capture outgoing messages instead of hitting the Graph API.
const mockSendMessage = vi.fn(async () => {});
const mockSendSenderAction = vi.fn(async () => {});
const mockSendProductCards = vi.fn(async () => true);
const mockSendImage = vi.fn(async () => true);
vi.mock("@/channels/facebook", () => ({
	FacebookChannel: class {
		sendMessage = mockSendMessage;
		sendSenderAction = mockSendSenderAction;
		sendProductCards = mockSendProductCards;
		sendImage = mockSendImage;
	},
}));
let mockConnections: unknown[];
let mockSessionRow: unknown = null;
let mockQpayPendingRow: unknown = null;
vi.mock("@/lib/supabase", () => ({
	createServiceClient: vi.fn(() => {
		const chain: Record<string, unknown> = {};
		chain.select = vi.fn(() => chain);
		chain.eq = vi.fn(() => chain);
		chain.or = vi.fn(() => chain);
		chain.update = vi.fn(() => chain);
		chain.insert = vi.fn(() => Promise.resolve({ data: null, error: null }));
		chain.maybeSingle = vi.fn(() =>
			Promise.resolve({
				data: mockQpayPendingRow ?? mockSessionRow,
				error: null,
			}),
		);
		chain.order = vi.fn(() => chain);
		chain.limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
		// Awaited queries resolve with the configured connection rows.
		chain.then = (resolve: (v: unknown) => unknown) =>
			resolve({ data: mockConnections, error: null });
		return {
			from: vi.fn(() => chain),
			...chain,
		} as never;
	}),
	getSupabaseForProduct: vi.fn(() => ({
		from: vi.fn(() => ({
			select: vi.fn(() => ({
				eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
			})),
		})),
	})),
}));

function signature(rawBody: string): string {
	return (
		"sha256=" +
		crypto
			.createHmac("sha256", APP_SECRET)
			.update(rawBody, "utf8")
			.digest("hex")
	);
}

function post(body: unknown): Request {
	const raw = JSON.stringify(body);
	return new Request("http://localhost/api/facebook/webhook", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-hub-signature-256": signature(raw),
		},
		body: raw,
	});
}

function messengerEvent(partial: Record<string, unknown>): unknown {
	const partialMessage =
		typeof partial.message === "object" && partial.message !== null
			? partial.message
			: {};
	return {
		object: "page",
		entry: [
			{
				id: PAGE_ID,
				messaging: [
					{
						sender: { id: "psid-1" },
						recipient: { id: PAGE_ID },
						...partial,
						message: {
							is_echo: false,
							mid: crypto.randomUUID(),
							...partialMessage,
						},
					},
				],
			},
		],
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	process.env.FB_APP_SECRET = APP_SECRET;
	process.env.FB_VERIFY_TOKEN = "verify";
	mockConnections = [
		{
			id: "c-messenger",
			organization_id: "org-1",
			channel: "messenger",
			channel_user_id: PAGE_ID,
			channel_chat_id: PAGE_ID,
			page_id: PAGE_ID,
			page_access_token: "tok",
			product_type: "zer",
			is_active: true,
		},
	];
	mockSessionRow = null;
	mockSendMessage.mockClear();
	mockSendSenderAction.mockClear();
});

describe("facebook webhook — event paths", () => {
	it("routes postback payloads to the agent as text", async () => {
		const { POST } = await import("@/app/api/facebook/webhook/route");
		const res = await POST(
			post(messengerEvent({ postback: { payload: "GET_STARTED" } })),
		);

		expect(res.status).toBe(200);
		expect(mockHandleAgentMessage).toHaveBeenCalledTimes(1);
		const ctx = mockHandleAgentMessage.mock.calls[0]?.[0] as Record<
			string,
			unknown
		>;
		expect(ctx.channelUserId).toBe("psid-1");
	});

	it("routes quick reply payloads to the agent as text", async () => {
		const { POST } = await import("@/app/api/facebook/webhook/route");
		const res = await POST(
			post(
				messengerEvent({
					message: {
						text: "Тийм",
						quick_reply: { payload: "quick:yes" },
					},
				}),
			),
		);

		expect(res.status).toBe(200);
		expect(mockHandleAgentMessage).toHaveBeenCalledTimes(1);
	});

	it("executes a staged action on confirm: postback", async () => {
		const execute = vi.fn(async () => ({ ok: true, id: "sale-1" }));
		mockConfirmAction.mockReturnValue({
			toolName: "createSale",
			args: { amount: 1000 },
			execute,
		});
		const { POST } = await import("@/app/api/facebook/webhook/route");
		const res = await POST(
			post(messengerEvent({ postback: { payload: "confirm:nonce-1" } })),
		);

		expect(res.status).toBe(200);
		expect(mockConfirmAction).toHaveBeenCalledWith(
			"nonce-1",
			"org-1",
			PAGE_ID,
			"psid-1",
		);
		expect(execute).toHaveBeenCalledWith({ amount: 1000 });
		// The formatted write result is sent back to the sender (now with quickReplies for order checkout).
		expect(mockSendMessage).toHaveBeenCalledWith(
			"psid-1",
			expect.stringContaining("sale-1"),
			expect.anything(),
		);
	});

	it("answers a stale confirm: postback instead of executing", async () => {
		mockConfirmAction.mockReturnValue(null);
		const { POST } = await import("@/app/api/facebook/webhook/route");
		const res = await POST(
			post(messengerEvent({ postback: { payload: "confirm:expired" } })),
		);

		expect(res.status).toBe(200);
		expect(mockSendMessage).toHaveBeenCalledWith(
			"psid-1",
			expect.stringContaining("хугацаа дууссан"),
		);
	});

	it("rejects a staged action on reject: postback", async () => {
		const { POST } = await import("@/app/api/facebook/webhook/route");
		const res = await POST(
			post(messengerEvent({ postback: { payload: "reject:nonce-1" } })),
		);

		expect(res.status).toBe(200);
		expect(mockRejectAction).toHaveBeenCalledWith("nonce-1");
		expect(mockSendMessage).toHaveBeenCalledWith(
			"psid-1",
			expect.stringContaining("Цуцаллаа"),
		);
	});

	it("answers normally when user messages even if previous session was older than 24h", async () => {
		// User messaging opens the 24h window — never locks out returning users.
		mockSessionRow = {
			updated_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
		};
		const { POST } = await import("@/app/api/facebook/webhook/route");
		const res = await POST(
			post(messengerEvent({ message: { text: "Сайн уу" } })),
		);

		expect(res.status).toBe(200);
		expect(mockHandleAgentMessage).toHaveBeenCalledTimes(1);
		expect(mockSendMessage).toHaveBeenCalledWith(
			"psid-1",
			"Хариулт",
			expect.objectContaining({ quickReplies: expect.any(Array) }),
		);
	});

	it("answers when the session is fresh (within 24h)", async () => {
		mockSessionRow = {
			updated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
		};
		const { POST } = await import("@/app/api/facebook/webhook/route");
		const res = await POST(
			post(messengerEvent({ message: { text: "Сайн уу" } })),
		);

		expect(res.status).toBe(200);
		expect(mockHandleAgentMessage).toHaveBeenCalledTimes(1);
		// Agent reply is sent back to the sender.
		expect(mockSendMessage).toHaveBeenCalledWith(
			"psid-1",
			"Хариулт",
			expect.objectContaining({ quickReplies: expect.any(Array) }),
		);
	});

	it("stamps last_user_message_at on the connection row", async () => {
		const { POST } = await import("@/app/api/facebook/webhook/route");
		await POST(post(messengerEvent({ message: { text: "hi" } })));
		// @ts-expect-error
		const allServices = createServiceClient.mock.results.map((r) => r.value);
		// @ts-expect-error
		const hasFrom = allServices.some((s) =>
			s.from.mock.calls.some((c) => c[0] === "channel_connections"),
		);
		expect(hasFrom).toBe(true);
		// @ts-expect-error
		const hasUpdate = allServices.some((s) =>
			s.update.mock.calls.some((c) => c[0]?.last_user_message_at),
		);
		expect(hasUpdate).toBe(true);
	});

	it("sends bank deeplink on QPAY_BANK: postback", async () => {
		mockQpayPendingRow = {
			order_id: "order-123",
			payment_link: "https://qpay.mn/q/123",
			payment_urls: [
				{ name: "Хаан банк", link: "khanbank://q?qPay_QRcode=000201" },
			],
			qr_text: "000201",
		};
		const { POST } = await import("@/app/api/facebook/webhook/route");
		const res = await POST(
			post(
				messengerEvent({
					postback: { payload: "QPAY_BANK:Хаан банк:order-123" },
				}),
			),
		);
		expect(res.status).toBe(200);
		expect(mockSendMessage).toHaveBeenCalledWith(
			"psid-1",
			expect.stringContaining("Хаан банк"),
			expect.objectContaining({ quickReplies: expect.any(Array) }),
		);
		expect(mockSendMessage).toHaveBeenCalledWith(
			"psid-1",
			expect.stringContaining("khanbank://q?qPay_QRcode=000201"),
			expect.anything(),
		);
	});

	it("sends QPay general link on QPAY_LINK: postback", async () => {
		mockQpayPendingRow = {
			order_id: "order-123",
			payment_link: "https://qpay.mn/q/123",
			payment_urls: [],
			qr_text: "000201",
		};
		const { POST } = await import("@/app/api/facebook/webhook/route");
		const res = await POST(
			post(messengerEvent({ postback: { payload: "QPAY_LINK:order-123" } })),
		);
		expect(res.status).toBe(200);
		expect(mockSendMessage).toHaveBeenCalledWith(
			"psid-1",
			expect.stringContaining("https://qpay.mn/q/123"),
			expect.objectContaining({ quickReplies: expect.any(Array) }),
		);
	});
});
