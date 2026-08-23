/**
 * Facebook webhook event-path tests: postbacks, quick replies, confirmation
 * postbacks (confirm:/reject:), the 24h inactivity gate, and the
 * last_user_message_at stamp. Complements facebook-webhook-routing.test.ts,
 * which locks the HMAC validation and messenger/instagram row discrimination.
 */

import crypto from "node:crypto";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

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
	getRawWriteTool: (...a: unknown[]) => mockGetRawWriteTool(...(a as [string])),
}));

// Durable confirmation boundary — deterministic per-test outcomes.
const mockResolveDurablePostback = vi.fn(async () => ({
	handled: false,
	reply: "",
}));
vi.mock("@/runtime/confirmation", () => ({
	resolveDurablePostback: (...a: unknown[]) =>
		mockResolveDurablePostback(...(a as [unknown])),
}));

const mockGetRawWriteTool = vi.fn(() => null);
vi.mock("@/state/pending-action-repository", () => ({
	pendingActionRepository: () => ({}),
}));

// Channel adapter — capture outgoing messages instead of hitting the Graph API.
const mockSendMessage = vi.fn(async () => {});
const mockSendSenderAction = vi.fn(async () => {});
vi.mock("@zuiio/gateway-facebook", () => ({
	FacebookChannel: class {
		sendMessage = mockSendMessage;
		sendSenderAction = mockSendSenderAction;
		constructor(_options?: unknown) {}
	},
}));

let mockConnections: unknown[];
let mockSessionRow: unknown = null;

vi.mock("@/lib/supabase", () => ({
	createServiceClient: vi.fn(() => {
		const chain: Record<string, unknown> = {};
		chain.select = vi.fn(() => chain);
		chain.eq = vi.fn(() => chain);
		chain.or = vi.fn(() => chain);
		chain.update = vi.fn(() => chain);
		chain.maybeSingle = vi.fn(() =>
			Promise.resolve({ data: mockSessionRow, error: null }),
		);
		chain.order = vi.fn(() => chain);
		chain.limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
		chain.insert = vi.fn(() => Promise.resolve({ data: null, error: null }));
		chain.delete = vi.fn(() => chain);
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
	return {
		object: "page",
		entry: [
			{
				id: PAGE_ID,
				messaging: [
					{
						sender: { id: "psid-1" },
						recipient: { id: PAGE_ID },
						message: { is_echo: false },
						...partial,
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
		const ctx = mockHandleAgentMessage.mock.calls[0]![0] as Record<
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
		mockGetRawWriteTool.mockReturnValue({ name: "createSale", execute });
		mockResolveDurablePostback.mockImplementation(
			async (input: {
				payload: string;
				executeTool: (
					toolName: string,
					args: Record<string, unknown>,
				) => Promise<unknown>;
			}) => {
				const result = await input.executeTool("createSale", { amount: 1000 });
				return { handled: true, reply: `✅ ${JSON.stringify(result)}` };
			},
		);
		const { POST } = await import("@/app/api/facebook/webhook/route");
		const res = await POST(
			post(messengerEvent({ postback: { payload: "confirm:nonce-1" } })),
		);

		expect(res.status).toBe(200);
		expect(execute).toHaveBeenCalledWith({ amount: 1000 }, expect.anything());
		expect(mockSendMessage).toHaveBeenCalledWith(
			"psid-1",
			expect.stringContaining("sale-1"),
		);
	});

	it("answers a stale confirm: postback instead of executing", async () => {
		mockResolveDurablePostback.mockResolvedValue({
			handled: true,
			reply: "Баталгаажуулах хүсэлт олдсонгүй эсвэл хугацаа нь дууссан.",
		});
		const { POST } = await import("@/app/api/facebook/webhook/route");
		const res = await POST(
			post(messengerEvent({ postback: { payload: "confirm:expired" } })),
		);

		expect(res.status).toBe(200);
		expect(mockSendMessage).toHaveBeenCalledWith(
			"psid-1",
			"Баталгаажуулах хүсэлт олдсонгүй эсвэл хугацаа нь дууссан.",
		);
	});

	it("rejects a staged action on reject: postback", async () => {
		mockResolveDurablePostback.mockImplementation(
			async (input: { payload: string }) => ({
				handled: input.payload === "reject:nonce-1",
				reply: "❌ Цуцаллаа.",
			}),
		);
		const { POST } = await import("@/app/api/facebook/webhook/route");
		const res = await POST(
			post(messengerEvent({ postback: { payload: "reject:nonce-1" } })),
		);

		expect(res.status).toBe(200);
		expect(mockSendMessage).toHaveBeenCalledWith(
			"psid-1",
			expect.stringContaining("Цуцаллаа"),
		);
	});

	it("does NOT answer when the 24h inactivity gate is closed", async () => {
		// Session last updated 25h ago → the bot prompts the user to write again.
		mockSessionRow = {
			updated_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
		};
		const { POST } = await import("@/app/api/facebook/webhook/route");
		const res = await POST(
			post(messengerEvent({ message: { text: "Сайн уу" } })),
		);

		expect(res.status).toBe(200);
		expect(mockHandleAgentMessage).not.toHaveBeenCalled();
		expect(mockSendMessage).toHaveBeenCalledWith(
			"psid-1",
			expect.stringContaining("ахиад мессеж бичнэ үү"),
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
		expect(mockSendMessage).toHaveBeenCalledWith("psid-1", "Хариулт");
	});

	it("stamps last_user_message_at on the connection row", async () => {
		const { POST } = await import("@/app/api/facebook/webhook/route");
		await POST(post(messengerEvent({ message: { text: "hi" } })));

		// The route's createServiceClient returns one object with .from() plus
		// the shared query chain (spread into the client) — grab the last one.
		const service = (createServiceClient as Mock).mock.results.at(-1)!
			.value as { from: Mock; update: Mock };
		const fromCalls = (service.from as Mock).mock.calls as unknown[][];
		expect(fromCalls.some((c) => c[0] === "channel_connections")).toBe(true);
		expect(service.update).toHaveBeenCalledWith(
			expect.objectContaining({ last_user_message_at: expect.any(String) }),
		);
	});
});
