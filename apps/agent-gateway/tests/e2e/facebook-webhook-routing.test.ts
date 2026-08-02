/**
 * Facebook webhook routing regression tests.
 *
 * A page with BOTH messenger + instagram connections shares one page_id —
 * the old lookup used .single() and dropped every message. These tests lock
 * the per-event channel discrimination and the HMAC validation.
 */

import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const PAGE_ID = "page-123";
const IG_ACCOUNT_ID = "ig-account-456";
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

let mockConnections: unknown[] = [];

vi.mock("@/lib/supabase", () => ({
	createServiceClient: vi.fn(() => {
		const chain: Record<string, unknown> = {};
		chain.select = vi.fn(() => chain);
		chain.eq = vi.fn(() => chain);
		chain.or = vi.fn(() => chain);
		chain.update = vi.fn(() => chain);
		chain.maybeSingle = vi.fn(() =>
			Promise.resolve({ data: null, error: null }),
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

// Real HMAC signature helper (the route computes it the same way).
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

beforeEach(() => {
	vi.clearAllMocks();
	process.env.FB_APP_SECRET = APP_SECRET;
	process.env.FB_VERIFY_TOKEN = "verify";
	// A page with BOTH a messenger and an instagram connection sharing page_id
	// (the .single() regression fixture).
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
		{
			id: "c-instagram",
			organization_id: "org-1",
			channel: "instagram",
			channel_user_id: IG_ACCOUNT_ID,
			channel_chat_id: PAGE_ID,
			page_id: PAGE_ID,
			page_access_token: "tok",
			product_type: "zer",
			is_active: true,
		},
	];
});

describe("facebook webhook — dual-row routing (regression)", () => {
	it("routes Messenger events to the messenger connection when both rows exist", async () => {
		const { POST } = await import("@/app/api/facebook/webhook/route");
		const res = await POST(
			post({
				object: "page",
				entry: [
					{
						id: PAGE_ID,
						messaging: [
							{
								sender: { id: "psid-1" },
								recipient: { id: PAGE_ID },
								message: { text: "Сайн уу", is_echo: false },
							},
						],
					},
				],
			}),
		);

		expect(res.status).toBe(200);
		const ctx = mockHandleAgentMessage.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(ctx.channel).toBe("messenger");
		expect(ctx.channelUserId).toBe("psid-1");
		expect(ctx.audience).toBe("customer");
	});

	it("routes Instagram events to the instagram connection via the IG account id", async () => {
		const { POST } = await import("@/app/api/facebook/webhook/route");
		const res = await POST(
			post({
				object: "page",
				entry: [
					{
						id: IG_ACCOUNT_ID,
						messaging: [
							{
								sender: { id: "igsid-1" },
								recipient: { id: IG_ACCOUNT_ID },
								message: { text: "hello", is_echo: false },
							},
						],
					},
				],
			}),
		);

		expect(res.status).toBe(200);
		const ctx = mockHandleAgentMessage.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(ctx.channel).toBe("instagram");
	});

	it("rejects requests with an invalid signature", async () => {
		const { POST } = await import("@/app/api/facebook/webhook/route");
		const res = await POST(
			new Request("http://localhost/api/facebook/webhook", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-hub-signature-256": "sha256=deadbeef",
				},
				body: JSON.stringify({ object: "page", entry: [] }),
			}),
		);
		expect(res.status).toBe(401);
	});

	it("skips unknown pages silently", async () => {
		const { POST } = await import("@/app/api/facebook/webhook/route");
		const res = await POST(
			post({
				object: "page",
				entry: [{ id: "unknown-page", messaging: [] }],
			}),
		);
		expect(res.status).toBe(200);
		expect(mockHandleAgentMessage).not.toHaveBeenCalled();
	});

	it("skips echo messages", async () => {
		const { POST } = await import("@/app/api/facebook/webhook/route");
		await POST(
			post({
				object: "page",
				entry: [
					{
						id: PAGE_ID,
						messaging: [
							{
								sender: { id: PAGE_ID },
								recipient: { id: "psid-1" },
								message: { text: "echo", is_echo: true },
							},
						],
					},
				],
			}),
		);
		expect(mockHandleAgentMessage).not.toHaveBeenCalled();
	});

	it("verifies webhook subscription challenges via GET", async () => {
		const { GET } = await import("@/app/api/facebook/webhook/route");
		const res = await GET(
			new Request(
				`http://localhost/api/facebook/webhook?hub.mode=subscribe&hub.verify_token=verify&hub.challenge=challenge-123`,
			),
		);
		expect(res.status).toBe(200);
		expect(await res.text()).toBe("challenge-123");
	});
});
