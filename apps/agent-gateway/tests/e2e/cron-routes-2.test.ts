/**
 * Cron route tests (batch 2): resume-flows, re-embed, reminders, briefing,
 * drain-queue, refresh-meta-tokens.
 */
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

vi.mock("server-only", () => ({}));

const mockSendMessage = vi.fn(async () => true);
const mockIsChatAvailable = vi.fn(async () => true);
vi.mock("@/channels/telegram", () => ({
	TelegramChannel: class {
		sendMessage = mockSendMessage;
		isChatAvailable = mockIsChatAvailable;
	},
}));
vi.mock("@/channels/facebook", () => ({
	FacebookChannel: class {
		sendMessage = mockSendMessage;
	},
}));

const mockResumeDelayedFlows = vi.fn(async () => 2);
vi.mock("@/flow-executor", () => ({
	resumeDelayedFlows: (...a: unknown[]) => mockResumeDelayedFlows(...a),
}));

const mockGenerateEmbedding = vi.fn(
	async (content: string) => `emb:${content.length}`,
);
vi.mock("@/lib/embeddings", () => ({
	generateEmbedding: (...a: unknown[]) => mockGenerateEmbedding(...a),
}));

const mockHandleAgentMessage = vi.fn(async () => "Хариулт");
vi.mock("@/gateway/agent-handler", () => ({
	handleAgentMessage: (...a: unknown[]) => mockHandleAgentMessage(...a),
}));

const mockResolveOrgFromChatUser = vi.fn(async () => ({
	context: {
		orgId: "org-1",
		userId: "u",
		productType: "zer",
		audience: "internal",
		chatId: 123,
		telegramUserId: 456,
	},
}));
vi.mock("@/gateway/mode-a", () => ({
	resolveOrgFromChatUser: (...a: unknown[]) => mockResolveOrgFromChatUser(...a),
}));

vi.mock("@/gateway/webhook-helpers", () => ({
	systemPromptFor: vi.fn(async () => "prompt"),
	getProductTools: vi.fn(() => []),
}));

const mockDecryptSecret = vi.fn((t: string) =>
	t.startsWith("enc:") ? "plain-token" : t,
);
const mockEncryptSecret = vi.fn((t: string) => `enc:${t}`);
vi.mock("@/lib/crypto", () => ({
	decryptSecret: (...a: unknown[]) => mockDecryptSecret(...a),
	encryptSecret: (...a: unknown[]) => mockEncryptSecret(...a),
}));

// Chainable supabase mock: `from(table)` returns an independent chain whose
// await resolves to the per-table handler result.
const TABLE_METHODS = [
	"select",
	"eq",
	"neq",
	"in",
	"is",
	"not",
	"order",
	"limit",
	"single",
	"maybeSingle",
	"gte",
	"lte",
	"gt",
	"lt",
	"update",
	"insert",
	"upsert",
	"delete",
	"or",
	"ilike",
	"contains",
	"textSearch",
] as const;

function makeSupabase(
	handlers: Record<string, () => unknown | Promise<unknown>>,
) {
	const from = vi.fn((table: string) => {
		const chain: Record<string, unknown> = {};
		for (const m of TABLE_METHODS) {
			chain[m] = vi.fn().mockReturnValue(chain);
		}
		const handler = handlers[table];
		if (handler) {
			(chain as unknown as { then: unknown }).then = (
				resolve: (v: unknown) => unknown,
			) => Promise.resolve().then(handler).then(resolve);
		}
		return chain;
	});
	return { from };
}

const mockCreateServiceClient = vi.fn();
vi.mock("@/lib/supabase", () => ({
	createServiceClient: (...a: unknown[]) => mockCreateServiceClient(...a),
}));

function bearerReq(url: string, secret?: string): Request {
	const headers = new Headers();
	if (secret) headers.set("authorization", `Bearer ${secret}`);
	return new Request(url, { method: "POST", headers });
}

beforeEach(() => {
	vi.clearAllMocks();
	delete process.env.CRON_SECRET;
	mockSendMessage.mockResolvedValue(true);
	mockIsChatAvailable.mockResolvedValue(true);
	mockResumeDelayedFlows.mockResolvedValue(2);
	mockGenerateEmbedding.mockResolvedValue("emb");
	mockDecryptSecret.mockImplementation((t: string) =>
		t.startsWith("enc:") ? "plain-token" : t,
	);
	mockEncryptSecret.mockImplementation((t: string) => `enc:${t}`);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("POST /api/cron/resume-flows", () => {
	it("rejects without the CRON_SECRET bearer", async () => {
		process.env.CRON_SECRET = "s3cret";
		const { POST } = await import("@/app/api/cron/resume-flows/route");
		const res = await POST(bearerReq("http://localhost/api/cron/resume-flows"));
		expect(res.status).toBe(401);
	});

	it("resumes delayed flows and reports the count", async () => {
		mockCreateServiceClient.mockReturnValue(makeSupabase({}));
		const { POST } = await import("@/app/api/cron/resume-flows/route");
		const res = await POST(
			bearerReq("http://localhost/api/cron/resume-flows", "s3cret"),
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.status).toBe("ok");
		expect(body.resumed).toBe(2);
		expect(mockResumeDelayedFlows).toHaveBeenCalledTimes(1);
		expect(typeof body.timestamp).toBe("string");
	});

	it("returns 500 when the executor throws", async () => {
		mockCreateServiceClient.mockReturnValue(makeSupabase({}));
		mockResumeDelayedFlows.mockRejectedValue(new Error("boom"));
		const { POST } = await import("@/app/api/cron/resume-flows/route");
		const res = await POST(bearerReq("http://localhost/api/cron/resume-flows"));
		expect(res.status).toBe(500);
	});
});

describe("POST /api/cron/re-embed", () => {
	it("rejects without the CRON_SECRET bearer", async () => {
		process.env.CRON_SECRET = "s3cret";
		const { POST } = await import("@/app/api/cron/re-embed/route");
		const res = await POST(bearerReq("http://localhost/api/cron/re-embed"));
		expect(res.status).toBe(401);
	});

	it("embeds sources missing an embedding", async () => {
		const sb = makeSupabase({
			agent_knowledge_sources: () => ({
				data: [
					{ id: "s1", content: "Агуулга нэг" },
					{ id: "s2", content: "Агуулга хоёр" },
				],
				error: null,
			}),
		});
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/cron/re-embed/route");
		const res = await POST(bearerReq("http://localhost/api/cron/re-embed"));
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.processed).toBe(2);
		expect(body.embedded).toBe(2);
		expect(body.failed).toBe(0);
		expect(mockGenerateEmbedding).toHaveBeenCalledTimes(2);
	});

	it("counts failures per source without aborting", async () => {
		const sb = makeSupabase({
			agent_knowledge_sources: () => ({
				data: [
					{ id: "s1", content: "a" },
					{ id: "s2", content: "b" },
				],
				error: null,
			}),
		});
		mockCreateServiceClient.mockReturnValue(sb);
		mockGenerateEmbedding.mockRejectedValueOnce(new Error("api down"));
		const { POST } = await import("@/app/api/cron/re-embed/route");
		const res = await POST(bearerReq("http://localhost/api/cron/re-embed"));
		const body = await res.json();
		expect(body.embedded).toBe(1);
		expect(body.failed).toBe(1);
	});

	it("returns 200 with zero when there are no sources", async () => {
		const sb = makeSupabase({
			agent_knowledge_sources: () => ({ data: [], error: null }),
		});
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/cron/re-embed/route");
		const res = await POST(bearerReq("http://localhost/api/cron/re-embed"));
		const body = await res.json();
		expect(body.processed).toBe(0);
		expect(mockGenerateEmbedding).not.toHaveBeenCalled();
	});
});

describe("GET /api/cron/reminders", () => {
	it("rejects without the CRON_SECRET bearer", async () => {
		process.env.CRON_SECRET = "s3cret";
		const { GET } = await import("@/app/api/cron/reminders/route");
		const res = await GET(new Request("http://localhost/api/cron/reminders"));
		expect(res.status).toBe(401);
	});

	it("returns 0 when there are no pending reminders", async () => {
		const sb = makeSupabase({
			notifications: () => ({ data: [], error: null }),
		});
		mockCreateServiceClient.mockReturnValue(sb);
		const { GET } = await import("@/app/api/cron/reminders/route");
		const res = await GET(new Request("http://localhost/api/cron/reminders"));
		const body = await res.json();
		expect(body.processed).toBe(0);
		expect(mockSendMessage).not.toHaveBeenCalled();
	});

	it("sends reminders to linked chats and marks them read", async () => {
		const sb = makeSupabase({
			notifications: () => ({
				data: [
					{
						id: "n1",
						message: "Тооцоо хийхээ мартуузай",
						organization_id: "org-1",
					},
				],
				error: null,
			}),
			telegram_links: () => ({
				data: { telegram_chat_id: "123" },
				error: null,
			}),
		});
		mockCreateServiceClient.mockReturnValue(sb);
		const { GET } = await import("@/app/api/cron/reminders/route");
		const res = await GET(new Request("http://localhost/api/cron/reminders"));
		const body = await res.json();
		expect(body.processed).toBe(1);
		expect(mockSendMessage).toHaveBeenCalledWith(
			123,
			expect.stringContaining("Сануулга"),
		);
	});

	it("skips reminders whose org has no active link", async () => {
		const sb = makeSupabase({
			notifications: () => ({
				data: [{ id: "n1", message: "x", organization_id: "org-1" }],
				error: null,
			}),
			telegram_links: () => ({ data: null, error: null }),
		});
		mockCreateServiceClient.mockReturnValue(sb);
		const { GET } = await import("@/app/api/cron/reminders/route");
		const res = await GET(new Request("http://localhost/api/cron/reminders"));
		const body = await res.json();
		expect(body.processed).toBe(1); // still marked read
		expect(mockSendMessage).not.toHaveBeenCalled();
	});
});

describe("GET /api/cron/briefing", () => {
	it("rejects without the CRON_SECRET bearer", async () => {
		process.env.CRON_SECRET = "s3cret";
		const { GET } = await import("@/app/api/cron/briefing/route");
		const res = await GET(new Request("http://localhost/api/cron/briefing"));
		expect(res.status).toBe(401);
	});

	it("returns 0 when there are no active links", async () => {
		const sb = makeSupabase({
			telegram_links: () => ({ data: [], error: null }),
		});
		mockCreateServiceClient.mockReturnValue(sb);
		const { GET } = await import("@/app/api/cron/briefing/route");
		const res = await GET(new Request("http://localhost/api/cron/briefing"));
		const body = await res.json();
		expect(body.sent).toBe(0);
		expect(mockSendMessage).not.toHaveBeenCalled();
	});

	it("sends a daily briefing with aggregated org numbers", async () => {
		const sb = makeSupabase({
			telegram_links: () => ({
				data: [{ organization_id: "org-1", telegram_chat_id: "123" }],
				error: null,
			}),
			work_orders: () => ({
				data: [{ id: "w1" }, { id: "w2" }],
				error: null,
			}),
			appointments: () => ({ data: [{ id: "a1" }], error: null }),
			invoices: () => ({
				data: [
					{ id: "i1", balance_due: 5000 },
					{ id: "i2", balance_due: 2500 },
				],
				error: null,
			}),
			expenses: () => ({ data: [{ amount: 1000 }], error: null }),
		});
		mockCreateServiceClient.mockReturnValue(sb);
		const { GET } = await import("@/app/api/cron/briefing/route");
		const res = await GET(new Request("http://localhost/api/cron/briefing"));
		const body = await res.json();
		expect(body.sent).toBe(1);
		expect(mockSendMessage).toHaveBeenCalledTimes(1);
		const message = mockSendMessage.mock.calls[0]?.[1] as string;
		expect(message).toContain("Өгрийн мэдээ");
		expect(message).toContain("Идэвхтэй ажлын захиалга: <b>2</b>");
		expect(message).toContain("Төлөгдөөгүй нэхэмжлэх: <b>2</b> (7,500₮)");
		expect(message).toContain("Өнөөдрийн зарлага: <b>1,000₮</b>");
	});

	it("retires the link when the chat is gone and counts nothing as sent", async () => {
		const sb = makeSupabase({
			telegram_links: () => ({
				data: [{ organization_id: "org-1", telegram_chat_id: "123" }],
				error: null,
			}),
			work_orders: () => ({ data: [{ id: "w1" }], error: null }),
			appointments: () => ({ data: [], error: null }),
			invoices: () => ({ data: [], error: null }),
			expenses: () => ({ data: [], error: null }),
		});
		mockSendMessage.mockResolvedValueOnce(false);
		mockIsChatAvailable.mockResolvedValueOnce(false);
		mockCreateServiceClient.mockReturnValue(sb);
		const { GET } = await import("@/app/api/cron/briefing/route");
		const res = await GET(new Request("http://localhost/api/cron/briefing"));
		const body = await res.json();
		expect(body.sent).toBe(0);

		// First telegram_links chain = link select; second = retirement update.
		const linkFromIndexes = sb.from.mock.calls
			.map((call: string[], i: number) => ({ call, i }))
			.filter(({ call }) => call[0] === "telegram_links")
			.map(({ i }) => i);
		expect(linkFromIndexes).toHaveLength(2);
		const updateChain = sb.from.mock.results[linkFromIndexes[1]].value as {
			update: ReturnType<typeof vi.fn>;
			eq: ReturnType<typeof vi.fn>;
		};
		expect(updateChain.update).toHaveBeenCalledWith({ is_active: false });
		expect(updateChain.eq).toHaveBeenCalledWith("telegram_chat_id", "123");
	});

	it("keeps the link active on transient send failure", async () => {
		const sb = makeSupabase({
			telegram_links: () => ({
				data: [{ organization_id: "org-1", telegram_chat_id: "123" }],
				error: null,
			}),
			work_orders: () => ({ data: [], error: null }),
			appointments: () => ({ data: [], error: null }),
			invoices: () => ({ data: [], error: null }),
			expenses: () => ({ data: [], error: null }),
		});
		mockSendMessage.mockResolvedValueOnce(false);
		mockIsChatAvailable.mockResolvedValueOnce(true);
		mockCreateServiceClient.mockReturnValue(sb);
		const { GET } = await import("@/app/api/cron/briefing/route");
		const res = await GET(new Request("http://localhost/api/cron/briefing"));
		const body = await res.json();
		expect(body.sent).toBe(0);

		const linkFromIndexes = sb.from.mock.calls
			.map((call: string[], i: number) => ({ call, i }))
			.filter(({ call }) => call[0] === "telegram_links")
			.map(({ i }) => i);
		// Only the select chain — no retirement update issued.
		expect(linkFromIndexes).toHaveLength(1);
	});
});

describe("POST /api/cron/drain-queue", () => {
	it("rejects without the CRON_SECRET bearer", async () => {
		process.env.CRON_SECRET = "s3cret";
		const { POST } = await import("@/app/api/cron/drain-queue/route");
		const res = await POST(bearerReq("http://localhost/api/cron/drain-queue"));
		expect(res.status).toBe(401);
	});

	it("returns ok with 0 when queue is empty", async () => {
		const sb = makeSupabase({
			pending_updates: () => ({ data: [], error: null }),
		});
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/cron/drain-queue/route");
		const res = await POST(bearerReq("http://localhost/api/cron/drain-queue"));
		const body = await res.json();
		expect(body.status).toBe("ok");
		expect(body.processed).toBe(0);
	});

	it("marks non-text updates processed without calling the agent", async () => {
		const sb = makeSupabase({
			pending_updates: () => ({
				data: [
					{
						id: 1,
						raw_json: {
							message: {
								chat: { id: 1, type: "private" },
								text: undefined,
								message_id: 7,
							},
						},
					},
				],
				error: null,
			}),
		});
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/cron/drain-queue/route");
		const res = await POST(bearerReq("http://localhost/api/cron/drain-queue"));
		const body = await res.json();
		expect(body.processed).toBe(1);
		expect(mockHandleAgentMessage).not.toHaveBeenCalled();
	});

	it("processes text updates through the agent", async () => {
		const sb = makeSupabase({
			pending_updates: () => ({
				data: [
					{
						id: 2,
						raw_json: {
							message: {
								chat: { id: 42, type: "private" },
								from: { id: 99 },
								text: "Сайн уу",
								message_id: 8,
							},
						},
					},
				],
				error: null,
			}),
		});
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/cron/drain-queue/route");
		const res = await POST(bearerReq("http://localhost/api/cron/drain-queue"));
		const body = await res.json();
		expect(body.processed).toBe(1);
		expect(body.failed).toBe(0);
		expect(mockResolveOrgFromChatUser).toHaveBeenCalledWith(
			expect.anything(),
			42,
			99,
		);
		expect(mockHandleAgentMessage).toHaveBeenCalledWith(
			expect.objectContaining({ orgId: "org-1" }),
			"Сайн уу",
			"private",
			expect.anything(),
		);
	});

	it("counts failures and leaves them unmarked for retry", async () => {
		const sb = makeSupabase({
			pending_updates: () => ({
				data: [
					{
						id: 3,
						raw_json: {
							message: {
								chat: { id: 1, type: "group" },
								from: { id: 2 },
								text: "x",
								message_id: 9,
							},
						},
					},
				],
				error: null,
			}),
		});
		mockCreateServiceClient.mockReturnValue(sb);
		mockHandleAgentMessage.mockRejectedValue(new Error("provider down"));
		const { POST } = await import("@/app/api/cron/drain-queue/route");
		const res = await POST(bearerReq("http://localhost/api/cron/drain-queue"));
		const body = await res.json();
		expect(body.processed).toBe(0);
		expect(body.failed).toBe(1);
	});
});

describe("GET /api/cron/refresh-meta-tokens", () => {
	beforeAll(() => {
		process.env.FB_APP_ID = "fb-app-id";
		process.env.FB_APP_SECRET = "fb-app-secret";
	});
	afterAll(() => {
		delete process.env.FB_APP_ID;
		delete process.env.FB_APP_SECRET;
	});

	it("rejects without the CRON_SECRET bearer", async () => {
		process.env.CRON_SECRET = "s3cret";
		const { GET } = await import("@/app/api/cron/refresh-meta-tokens/route");
		const res = await GET(
			new Request("http://localhost/api/cron/refresh-meta-tokens"),
		);
		expect(res.status).toBe(401);
	});

	it("skips when there are no expiring connections", async () => {
		const sb = makeSupabase({
			channel_connections: () => ({ data: [], error: null }),
		});
		mockCreateServiceClient.mockReturnValue(sb);
		const { GET } = await import("@/app/api/cron/refresh-meta-tokens/route");
		const res = await GET(
			new Request("http://localhost/api/cron/refresh-meta-tokens"),
		);
		const body = await res.json();
		expect(body.status).toBe("ok");
		expect(body.processed).toBe(0);
		expect(body.refreshed).toBe(0);
	});

	it("refreshes page tokens via user-token exchange + /me/accounts", async () => {
		const sb = makeSupabase({
			channel_connections: () => ({
				data: [
					{
						id: "c1",
						page_id: "page-1",
						page_access_token: "enc:secret",
						metadata: { user_access_token: "enc:user-token" },
					},
					{
						// Page no longer managed by the user → /me/accounts has no
						// matching page → row fails but the cron keeps going.
						id: "c2",
						page_id: "page-2",
						page_access_token: "enc:secret-2",
						metadata: { user_access_token: "enc:user-token-2" },
					},
				],
				error: null,
			}),
		});
		mockCreateServiceClient.mockReturnValue(sb);
		const accountsResponse = {
			ok: true,
			json: async () => ({
				data: [{ id: "page-1", access_token: "new-page-token" }],
			}),
		};
		const mockFetch = vi
			.fn()
			// c1: fb_exchange_token on the user token.
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ access_token: "user-token-2" }),
			})
			// c1: /me/accounts with the fresh user token.
			.mockResolvedValueOnce(accountsResponse)
			// c2: exchange ok, but page-2 is missing from the accounts list.
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ access_token: "user-token-3" }),
			})
			.mockResolvedValueOnce(accountsResponse);
		vi.stubGlobal("fetch", mockFetch);
		const { GET } = await import("@/app/api/cron/refresh-meta-tokens/route");
		const res = await GET(
			new Request("http://localhost/api/cron/refresh-meta-tokens"),
		);
		const body = await res.json();
		expect(body.processed).toBe(2);
		expect(body.refreshed).toBe(1);
		expect(body.failed).toBe(1);
		// The refreshed page token is re-encrypted, plus the refreshed user token.
		expect(mockEncryptSecret).toHaveBeenCalledWith("new-page-token");
		expect(mockEncryptSecret).toHaveBeenCalledWith("user-token-2");
		const updateChain = sb.from.mock.results
			.map((r: { value: { update?: unknown } }) => r.value)
			.find((v: { update?: unknown }) => v.update);
		expect(updateChain).toBeTruthy();
	});

	it("counts failed exchanges and keeps going", async () => {
		const sb = makeSupabase({
			channel_connections: () => ({
				data: [
					{
						id: "c1",
						page_id: "page-1",
						page_access_token: "enc:bad",
						metadata: { user_access_token: "enc:user" },
					},
				],
				error: null,
			}),
		});
		mockCreateServiceClient.mockReturnValue(sb);
		const mockFetch = vi.fn(async () => ({
			ok: false,
			json: async () => ({ error: { message: "invalid token" } }),
		}));
		vi.stubGlobal("fetch", mockFetch);
		const { GET } = await import("@/app/api/cron/refresh-meta-tokens/route");
		const res = await GET(
			new Request("http://localhost/api/cron/refresh-meta-tokens"),
		);
		const body = await res.json();
		expect(body.refreshed).toBe(0);
		expect(body.failed).toBe(1);
	});

	it("skips connections without a stored user token (pre-migration rows)", async () => {
		const sb = makeSupabase({
			channel_connections: () => ({
				data: [
					{
						id: "c-old",
						page_id: "page-1",
						page_access_token: "enc:secret",
						metadata: {},
					},
				],
				error: null,
			}),
		});
		mockCreateServiceClient.mockReturnValue(sb);
		vi.stubGlobal("fetch", vi.fn());
		const { GET } = await import("@/app/api/cron/refresh-meta-tokens/route");
		const res = await GET(
			new Request("http://localhost/api/cron/refresh-meta-tokens"),
		);
		const body = await res.json();
		expect(body.processed).toBe(1);
		expect(body.skipped).toBe(1);
		expect(body.refreshed).toBe(0);
		expect(vi.mocked(fetch)).not.toHaveBeenCalled();
	});

	it("returns error status when the query fails", async () => {
		const sb = makeSupabase({
			channel_connections: () => ({ data: null, error: new Error("db down") }),
		});
		mockCreateServiceClient.mockReturnValue(sb);
		const { GET } = await import("@/app/api/cron/refresh-meta-tokens/route");
		const res = await GET(
			new Request("http://localhost/api/cron/refresh-meta-tokens"),
		);
		expect(res.status).toBe(500);
	});
});
