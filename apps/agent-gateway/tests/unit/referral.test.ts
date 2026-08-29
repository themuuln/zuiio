import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const APP_SECRET = "referral-test-secret";
const PAGE_ID = "page-123";
const mockHandleAgentMessage = vi.fn(async () => "Хариулт");
const mockInsert = vi.fn(async () => ({ data: null, error: null }));
let mockConnections: unknown[];

vi.mock("@/gateway/agent-handler", () => ({
	handleAgentMessage: (...args: unknown[]) => mockHandleAgentMessage(...args),
}));
vi.mock("@/flow-executor", () => ({
	handleFlowMessage: vi.fn(async () => null),
}));
vi.mock("@/gateway/webhook-helpers", () => ({
	systemPromptFor: vi.fn(async () => "prompt"),
	getProductTools: vi.fn(() => []),
}));
vi.mock("@/lib/redis", () => ({ getRedis: vi.fn(() => null) }));
vi.mock("@/lib/crypto", () => ({
	decryptSecret: vi.fn((value: string) => value),
}));
vi.mock("@/lib/supabase", () => ({
	createServiceClient: vi.fn(() => {
		const chain: Record<string, unknown> = {};
		chain.select = vi.fn(() => chain);
		chain.eq = vi.fn(() => chain);
		chain.or = vi.fn(() => chain);
		chain.update = vi.fn(() => chain);
		chain.insert = mockInsert;
		chain.maybeSingle = vi.fn(async () => ({ data: null, error: null }));
		chain.order = vi.fn(() => chain);
		chain.limit = vi.fn(async () => ({ data: [], error: null }));
		chain.then = (resolve: (value: unknown) => unknown) =>
			resolve({ data: mockConnections, error: null });
		return { from: vi.fn(() => chain), ...chain } as never;
	}),
}));

function signedPost(body: unknown): Request {
	const raw = JSON.stringify(body);
	return new Request("http://localhost/api/facebook/webhook", {
		method: "POST",
		headers: {
			"x-hub-signature-256": `sha256=${crypto.createHmac("sha256", APP_SECRET).update(raw).digest("hex")}`,
		},
		body: raw,
	});
}

beforeEach(() => {
	vi.clearAllMocks();
	process.env.FB_APP_SECRET = APP_SECRET;
	mockConnections = [
		{
			id: "connection-1",
			organization_id: "org-1",
			channel: "messenger",
			channel_user_id: PAGE_ID,
			page_id: PAGE_ID,
			page_access_token: "token",
			product_type: "zer",
			is_active: true,
		},
	];
});

describe("Facebook messaging referrals", () => {
	it("parses referral fields, maps persistence, and starts the Mongolian flow", async () => {
		const { POST } = await import("@/app/api/facebook/webhook/route");
		await POST(
			signedPost({
				object: "page",
				entry: [
					{
						id: PAGE_ID,
						messaging: [
							{
								sender: { id: "sender-1" },
								recipient: { id: PAGE_ID },
								timestamp: 1,
								referral: {
									ref: "campaign-1",
									source: "ADS",
									type: "OPEN_THREAD",
									ad_id: "ad-9",
								},
								message: { text: "ignored", mid: "mid-1" },
								postback: { title: "ignored", payload: "also-ignored" },
							},
						],
					},
				],
			}),
		);
		const insert = mockInsert.mock.calls[0]?.[0] as Record<string, unknown>;
		expect(insert).toEqual({
			organization_id: "org-1",
			channel: "messenger",
			page_id: PAGE_ID,
			sender_id: "sender-1",
			ref: "campaign-1",
			source: "ADS",
			type: "OPEN_THREAD",
			ad_id: "ad-9",
		});
		expect(mockHandleAgentMessage.mock.calls[0]?.[1]).toContain(
			"Хэрэглэгч campaign-1 эх үүсвэрээс орлоо",
		);
		expect(mockHandleAgentMessage).toHaveBeenCalledTimes(1);
	});

	it("uses the ref sender ad dedupe key and does not process referral message/postback twice", async () => {
		const { POST } = await import("@/app/api/facebook/webhook/route");
		const body = {
			object: "page",
			entry: [
				{
					id: PAGE_ID,
					messaging: [
						{
							sender: { id: "sender-2" },
							recipient: { id: PAGE_ID },
							timestamp: 2,
							referral: {
								ref: "campaign-2",
								source: "SHORTLINK",
								type: "OPEN_THREAD",
								ad_id: "ad-2",
							},
							message: { text: "double", mid: "message-mid" },
							postback: { title: "double", payload: "POSTBACK" },
						},
					],
				},
			],
		};
		await POST(signedPost(body));
		await POST(signedPost(body));
		const referralInserts = mockInsert.mock.calls.filter(
			([value]) => (value as Record<string, unknown>).ref === "campaign-2",
		);
		expect(referralInserts).toHaveLength(1);
		expect(mockHandleAgentMessage).toHaveBeenCalledTimes(1);
	});
});
