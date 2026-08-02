/**
 * WhatsApp webhook route tests: GET verification, POST message handling,
 * Mode B bot-key resolution, confirm/reject buttons.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockSendMessage = vi.fn(async () => {});
vi.mock("@/channels/whatsapp", () => ({
	WhatsAppChannel: class {
		phoneNumberId: string | undefined;
		token: string | undefined;
		constructor(phoneNumberId?: string, token?: string) {
			this.phoneNumberId = phoneNumberId;
			this.token = token;
		}
		sendMessage = mockSendMessage;
	},
}));

const mockHandleFlowMessage = vi.fn(async () => null);
vi.mock("@/flow-executor", () => ({
	handleFlowMessage: (...a: unknown[]) => mockHandleFlowMessage(...a),
}));

const mockHandleAgentMessage = vi.fn(async () => "Хариулт");
vi.mock("@/gateway/agent-handler", () => ({
	handleAgentMessage: (...a: unknown[]) => mockHandleAgentMessage(...a),
}));

const mockResolveOrgFromBotKey = vi.fn(async () => null);
vi.mock("@/gateway/mode-b", () => ({
	resolveOrgFromBotKey: (...a: unknown[]) => mockResolveOrgFromBotKey(...a),
}));

vi.mock("@/gateway/webhook-helpers", () => ({
	systemPromptFor: vi.fn(async () => "prompt"),
	getProductTools: vi.fn(() => []),
}));

const mockDecryptSecret = vi.fn((t: string) => `plain:${t}`);
vi.mock("@/lib/crypto", () => ({
	decryptSecret: (...a: unknown[]) => mockDecryptSecret(...a),
}));

const mockFormatWriteResult = vi.fn(
	(r: unknown) => `result:${JSON.stringify(r)}`,
);
vi.mock("@/lib/format-result", () => ({
	formatWriteResult: (...a: unknown[]) => mockFormatWriteResult(...a),
}));

vi.mock("@/lib/sanitize", () => ({
	sanitizeUserInput: (t: string) => `san:${t}`,
}));

const mockConfirmAction = vi.fn(() => null);
const mockRejectAction = vi.fn(() => {});
vi.mock("@/runtime/confirmation", () => ({
	confirmAction: (...a: unknown[]) => mockConfirmAction(...a),
	rejectAction: (...a: unknown[]) => mockRejectAction(...a),
}));

const mockCreateServiceClient = vi.fn();
vi.mock("@/lib/supabase", () => ({
	createServiceClient: (...a: unknown[]) => mockCreateServiceClient(...a),
}));

function chainableSupabase() {
	const chain: Record<string, unknown> = {};
	for (const m of ["select", "eq", "maybeSingle"]) {
		chain[m] = vi.fn().mockReturnValue(chain);
	}
	return chain;
}

function waEntry(from: string, text?: string, id = `wamid-${from}`) {
	const messages = text
		? [{ from, id, timestamp: "1", text: { body: text } }]
		: [];
	return {
		id: "entry-1",
		changes: [
			{
				value: {
					messaging_product: "whatsapp",
					metadata: {
						display_phone_number: "+97690000000",
						phone_number_id: "wa-1",
					},
					messages,
				},
			},
		],
	};
}

function postBody(entries: unknown[]) {
	return JSON.stringify({ entry: entries });
}

describe("GET /api/whatsapp/webhook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		delete process.env.WHATSAPP_VERIFY_TOKEN;
	});
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("returns 500 when the verify token is not configured", async () => {
		const { GET } = await import("@/app/api/whatsapp/webhook/route");
		const res = await GET(
			new Request(
				"http://localhost/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=x&hub.challenge=ch1",
			),
		);
		expect(res.status).toBe(500);
	});

	it("echoes the challenge on successful verification", async () => {
		process.env.WHATSAPP_VERIFY_TOKEN = "verify-me";
		const { GET } = await import("@/app/api/whatsapp/webhook/route");
		const res = await GET(
			new Request(
				"http://localhost/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=challenge-42",
			),
		);
		expect(res.status).toBe(200);
		expect(await res.text()).toBe("challenge-42");
	});

	it("returns 403 when the token does not match", async () => {
		process.env.WHATSAPP_VERIFY_TOKEN = "verify-me";
		const { GET } = await import("@/app/api/whatsapp/webhook/route");
		const res = await GET(
			new Request(
				"http://localhost/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=ch1",
			),
		);
		expect(res.status).toBe(403);
	});
});

describe("POST /api/whatsapp/webhook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSendMessage.mockResolvedValue(undefined);
		mockHandleFlowMessage.mockResolvedValue(null);
		mockHandleAgentMessage.mockResolvedValue("Хариулт");
		mockResolveOrgFromBotKey.mockResolvedValue(null);
		mockConfirmAction.mockReturnValue(null);
		mockRejectAction.mockImplementation(() => {});
		mockDecryptSecret.mockImplementation((t: string) => `plain:${t}`);
	});

	it("rejects invalid JSON", async () => {
		const { POST } = await import("@/app/api/whatsapp/webhook/route");
		const res = await POST(
			new Request("http://localhost/api/whatsapp/webhook", {
				method: "POST",
				body: "{broken",
			}),
		);
		expect(res.status).toBe(400);
	});

	it("responds ok to an entry with no messages", async () => {
		const { POST } = await import("@/app/api/whatsapp/webhook/route");
		const res = await POST(
			new Request("http://localhost/api/whatsapp/webhook", {
				method: "POST",
				body: JSON.stringify({ entry: [] }),
			}),
		);
		expect(res.status).toBe(200);
		expect((await res.json()).status).toBe("ok");
	});

	it("skips messages without text or interactive content", async () => {
		const sb = { from: vi.fn(() => chainableSupabase()) };
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/whatsapp/webhook/route");
		const res = await POST(
			new Request("http://localhost/api/whatsapp/webhook", {
				method: "POST",
				body: postBody([waEntry("97690000001")]),
			}),
		);
		expect(res.status).toBe(200);
		expect(mockSendMessage).not.toHaveBeenCalled();
	});

	it("tells unregistered users to register via Telegram", async () => {
		const sb = { from: vi.fn(() => chainableSupabase()) };
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/whatsapp/webhook/route");
		const res = await POST(
			new Request("http://localhost/api/whatsapp/webhook", {
				method: "POST",
				body: postBody([waEntry("97690000001", "Сайн уу")]),
			}),
		);
		expect(res.status).toBe(200);
		expect(mockSendMessage).toHaveBeenCalledWith(
			"97690000001",
			expect.stringContaining("Telegram"),
		);
		expect(mockHandleAgentMessage).not.toHaveBeenCalled();
	});

	it("routes via flow first in bot-key mode", async () => {
		mockResolveOrgFromBotKey.mockResolvedValue({
			orgId: "org-wa-1",
			userId: "u1",
			productType: "zer",
			audience: "internal",
		});
		mockHandleFlowMessage.mockResolvedValue("flow-reply");
		const sb = { from: vi.fn(() => chainableSupabase()) };
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/whatsapp/webhook/route");
		const res = await POST(
			new Request("http://localhost/api/whatsapp/webhook?botKey=bk-1", {
				method: "POST",
				body: postBody([waEntry("97690000002", "захиалга")]),
			}),
		);
		expect(res.status).toBe(200);
		expect(mockHandleFlowMessage).toHaveBeenCalledWith(
			expect.objectContaining({ orgId: "org-wa-1", channel: "whatsapp" }),
			"san:захиалга",
			expect.anything(),
			expect.anything(),
		);
		expect(mockHandleAgentMessage).not.toHaveBeenCalled();
	});

	it("falls through to the agent when no flow matches", async () => {
		mockResolveOrgFromBotKey.mockResolvedValue({
			orgId: "org-wa-1",
			userId: "u1",
			productType: "zer",
			audience: "internal",
		});
		mockHandleFlowMessage.mockResolvedValue(null);
		const sb = { from: vi.fn(() => chainableSupabase()) };
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/whatsapp/webhook/route");
		const res = await POST(
			new Request("http://localhost/api/whatsapp/webhook?botKey=bk-1", {
				method: "POST",
				body: postBody([waEntry("97690000002", "Мэдээлэл авах")]),
			}),
		);
		expect(res.status).toBe(200);
		expect(mockHandleAgentMessage).toHaveBeenCalledTimes(1);
		expect(mockSendMessage).toHaveBeenCalledWith("97690000002", "Хариулт");
	});

	it("skips messages when the bot key resolves to no org", async () => {
		const sb = { from: vi.fn(() => chainableSupabase()) };
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/whatsapp/webhook/route");
		const res = await POST(
			new Request("http://localhost/api/whatsapp/webhook?botKey=unknown", {
				method: "POST",
				body: postBody([waEntry("97690000003", "hi")]),
			}),
		);
		expect(res.status).toBe(200);
		expect(mockSendMessage).not.toHaveBeenCalled();
	});

	it("builds a per-org channel from the encrypted connection token", async () => {
		mockResolveOrgFromBotKey.mockResolvedValue({
			orgId: "org-wa-1",
			userId: "u1",
			productType: "zer",
			audience: "internal",
		});
		mockHandleFlowMessage.mockResolvedValue("ok");
		const waConn = chainableSupabase();
		(waConn.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
			data: {
				channel_user_id: "wa-99",
				page_access_token: "enc:v1:abc",
				token_encrypted: true,
			},
			error: null,
		});
		const sb = { from: vi.fn(() => waConn) };
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/whatsapp/webhook/route");
		const res = await POST(
			new Request("http://localhost/api/whatsapp/webhook?botKey=bk-1", {
				method: "POST",
				body: postBody([waEntry("97690000004", "Тусламж")]),
			}),
		);
		expect(res.status).toBe(200);
		expect(mockDecryptSecret).toHaveBeenCalledWith("enc:v1:abc");
	});

	it("re-executes the staged action on confirm", async () => {
		mockResolveOrgFromBotKey.mockResolvedValue({
			orgId: "org-wa-1",
			userId: "u1",
			productType: "zer",
			audience: "internal",
		});
		const execute = vi.fn(async () => ({ ok: true, id: "w-1" }));
		mockConfirmAction.mockReturnValue({
			summary: "Захиалга үүсгэх",
			execute,
		});
		const sb = { from: vi.fn(() => chainableSupabase()) };
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/whatsapp/webhook/route");
		const res = await POST(
			new Request("http://localhost/api/whatsapp/webhook?botKey=bk-1", {
				method: "POST",
				body: postBody([waEntry("97690000005", "confirm:nonce-1")]),
			}),
		);
		expect(res.status).toBe(200);
		expect(mockConfirmAction).toHaveBeenCalledWith(
			"nonce-1",
			"97690000005",
			"97690000005",
		);
		expect(execute).toHaveBeenCalledTimes(1);
		expect(mockSendMessage).toHaveBeenCalledWith(
			"97690000005",
			expect.stringContaining("Баталгаажлаа"),
		);
		expect(mockSendMessage).toHaveBeenCalledWith(
			"97690000005",
			expect.stringContaining("result:"),
		);
	});

	it("tells the user when a confirm nonce is unknown or expired", async () => {
		mockResolveOrgFromBotKey.mockResolvedValue({
			orgId: "org-wa-1",
			userId: "u1",
			productType: "zer",
			audience: "internal",
		});
		mockConfirmAction.mockReturnValue(null);
		const sb = { from: vi.fn(() => chainableSupabase()) };
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/whatsapp/webhook/route");
		const res = await POST(
			new Request("http://localhost/api/whatsapp/webhook?botKey=bk-1", {
				method: "POST",
				body: postBody([waEntry("97690000005", "confirm:stale")]),
			}),
		);
		expect(res.status).toBe(200);
		expect(mockSendMessage).toHaveBeenCalledWith(
			"97690000005",
			expect.stringContaining("хугацаа дууссан"),
		);
	});

	it("cancels on reject", async () => {
		mockResolveOrgFromBotKey.mockResolvedValue({
			orgId: "org-wa-1",
			userId: "u1",
			productType: "zer",
			audience: "internal",
		});
		const sb = { from: vi.fn(() => chainableSupabase()) };
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/whatsapp/webhook/route");
		const res = await POST(
			new Request("http://localhost/api/whatsapp/webhook?botKey=bk-1", {
				method: "POST",
				body: postBody([waEntry("97690000005", "reject:nonce-2")]),
			}),
		);
		expect(res.status).toBe(200);
		expect(mockRejectAction).toHaveBeenCalledWith("nonce-2");
		expect(mockSendMessage).toHaveBeenCalledWith(
			"97690000005",
			expect.stringContaining("Цуцлагдлаа"),
		);
	});

	it("handles interactive button replies as text", async () => {
		mockResolveOrgFromBotKey.mockResolvedValue({
			orgId: "org-wa-1",
			userId: "u1",
			productType: "zer",
			audience: "internal",
		});
		mockHandleFlowMessage.mockResolvedValue("ok");
		const sb = { from: vi.fn(() => chainableSupabase()) };
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/whatsapp/webhook/route");
		const body = JSON.stringify({
			entry: [
				{
					id: "e",
					changes: [
						{
							value: {
								messaging_product: "whatsapp",
								metadata: {
									display_phone_number: "x",
									phone_number_id: "wa-1",
								},
								messages: [
									{
										from: "97690000006",
										id: "m1",
										timestamp: "1",
										interactive: {
											type: "button_reply",
											button_reply: { id: "btn:go" },
										},
									},
								],
							},
						},
					],
				},
			],
		});
		const res = await POST(
			new Request("http://localhost/api/whatsapp/webhook?botKey=bk-1", {
				method: "POST",
				body,
			}),
		);
		expect(res.status).toBe(200);
		expect(mockHandleFlowMessage).toHaveBeenCalledWith(
			expect.anything(),
			"san:btn:go",
			expect.anything(),
			expect.anything(),
		);
	});
});
