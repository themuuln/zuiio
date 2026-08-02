/**
 * Route tests for the dashboard APIs (usage, quota, KB, handoffs, channels,
 * profile). Direct handler invocation with mocked Supabase + state modules,
 * following the link-routes.test.ts pattern.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Infinitely chainable Supabase mock: every method returns the chain until a
// terminal resolver (single/order/limit/select-with-head) is reached.
const resolvers: Record<string, ReturnType<typeof vi.fn>> = {};

vi.mock("@/lib/supabase", () => ({
	createServiceClient: vi.fn(() => {
		const chain: Record<string, unknown> = {};
		const mk = (name: string, terminal = false) =>
			vi.fn(() => {
				if (terminal && resolvers[name]) return resolvers[name]();
				return chain;
			});
		chain.select = mk("select");
		chain.eq = mk("eq");
		chain.in = mk("in");
		chain.order = mk("order", true);
		chain.limit = mk("limit", true);
		chain.single = mk("single", true);
		chain.maybeSingle = mk("maybeSingle", true);
		chain.update = mk("update");
		chain.upsert = mk("upsert", true);
		chain.delete = mk("delete");
		chain.insert = mk("insert");
		return { from: vi.fn(() => chain) } as never;
	}),
}));

vi.mock("@/state/usage", () => ({
	getUsageStats: vi.fn(async () => ({
		totalTokens: 1000,
		totalApiCalls: 50,
		totalToolCalls: 40,
		topTools: [],
		topUsers: [],
		handoffCount: 2,
		handoffResolvedCount: 1,
		dailyBreakdown: [],
		estimatedCost: 0.01,
		responseTimeMs: { p50: 100, p95: 200, p99: 300, toolAverages: [] },
		conversationCount: 5,
		byChannel: [{ channel: "telegram", toolCalls: 40, errors: 1 }],
		errorRate: 0.025,
		orgId: "org-1",
		period: { start: "", end: "" },
	})),
}));

vi.mock("@/state/handoff", () => ({
	listPendingHandoffs: vi.fn(async () => [
		{
			id: "h-1",
			organizationId: "org-1",
			chatId: 1,
			userId: 2,
			status: "pending_human",
			reason: "хүн хүсэв",
			escalatedBy: "keyword",
			customerQuery: "хүнтэй ярих",
			adminUserId: null,
			createdAt: "2026-01-01T00:00:00Z",
		},
	]),
	resolveHandoff: vi.fn(async () => {}),
}));

vi.mock("@/state/knowledge", () => ({
	ingestKnowledge: vi.fn(async () => "kb-1"),
}));

vi.mock("@/state/agent-profile", () => ({
	loadAgentProfile: vi.fn(async () => ({
		organizationId: "org-1",
		audience: "internal",
		assistantName: "Assistant",
		businessSummary: null,
		responseLanguage: "mn",
		tone: null,
		contactDetails: null,
		businessHours: null,
		responseRules: null,
		handoffMessage: null,
		isActive: true,
		updatedBy: null,
		createdAt: "",
		updatedAt: "",
	})),
}));

vi.mock("@/state/budget", () => ({
	DAILY_LIMITS: { softCapTokens: 5_000_000, hardCapTokens: 10_000_000 },
}));

beforeEach(() => {
	vi.clearAllMocks();
	Object.keys(resolvers).forEach((k) => {
		delete resolvers[k];
	});
});

function makeRequest(url: string, body?: unknown): Request {
	return new Request(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
}

describe("GET /api/dashboard/usage", () => {
	it("returns usage stats for an org", async () => {
		const { GET } = await import("@/app/api/dashboard/usage/route");
		const res = await GET(
			makeRequest("http://localhost/api/dashboard/usage?orgId=org-1"),
		);
		const json = (await res.json()) as Record<string, unknown>;
		expect(res.status).toBe(200);
		expect(json.totalTokens).toBe(1000);
		expect(json.conversationCount).toBe(5);
		expect(json.byChannel).toEqual([
			{ channel: "telegram", toolCalls: 40, errors: 1 },
		]);
		expect(json.errorRate).toBe(0.025);
	});

	it("requires orgId", async () => {
		const { GET } = await import("@/app/api/dashboard/usage/route");
		const res = await GET(makeRequest("http://localhost/api/dashboard/usage"));
		expect(res.status).toBe(400);
	});
});

describe("GET /api/dashboard/quota", () => {
	it("returns limits and today's usage", async () => {
		resolvers.single = vi.fn(() =>
			Promise.resolve({
				data: { tokens_used: 1000, api_calls: 5 },
				error: null,
			}),
		);
		const { GET } = await import("@/app/api/dashboard/quota/route");
		const res = await GET(
			makeRequest("http://localhost/api/dashboard/quota?orgId=org-1"),
		);
		const json = (await res.json()) as Record<string, unknown>;
		expect(json.softLimitTokens).toBe(5_000_000);
		expect(json.hardLimitTokens).toBe(10_000_000);
		expect(json.tokensUsed).toBe(1000);
		expect(json.apiCalls).toBe(5);
		expect(json.allowed).toBe(true);
	});

	it("treats PGRST116 (no row yet) as zero usage", async () => {
		resolvers.single = vi.fn(() =>
			Promise.resolve({ data: null, error: { code: "PGRST116" } }),
		);
		const { GET } = await import("@/app/api/dashboard/quota/route");
		const res = await GET(
			makeRequest("http://localhost/api/dashboard/quota?orgId=org-1"),
		);
		const json = (await res.json()) as { tokensUsed: number };
		expect(json.tokensUsed).toBe(0);
	});

	it("requires orgId", async () => {
		const { GET } = await import("@/app/api/dashboard/quota/route");
		const res = await GET(makeRequest("http://localhost/api/dashboard/quota"));
		expect(res.status).toBe(400);
	});
});

describe("dashboard KB routes", () => {
	it("lists knowledge sources", async () => {
		resolvers.order = vi.fn(() =>
			Promise.resolve({
				data: [
					{
						id: "kb-1",
						title: "Rules",
						source_type: "manual",
						visibility: "both",
					},
				],
				error: null,
			}),
		);
		const { GET } = await import("@/app/api/dashboard/kb/route");
		const res = await GET(
			makeRequest("http://localhost/api/dashboard/kb?orgId=org-1"),
		);
		const json = (await res.json()) as { sources: unknown[] };
		expect(json.sources).toHaveLength(1);
	});

	it("ingests a knowledge source", async () => {
		const { POST } = await import("@/app/api/dashboard/kb/route");
		const res = await POST(
			makeRequest("http://localhost/api/dashboard/kb", {
				orgId: "org-1",
				sourceType: "manual",
				title: "FAQ",
				content: "Бидний талаар",
			}),
		);
		expect(res.status).toBe(200);
	});

	it("rejects missing content", async () => {
		const { POST } = await import("@/app/api/dashboard/kb/route");
		const res = await POST(
			makeRequest("http://localhost/api/dashboard/kb", {
				orgId: "org-1",
				sourceType: "manual",
			}),
		);
		expect(res.status).toBe(400);
	});

	it("soft-deletes a knowledge source", async () => {
		const { DELETE } = await import("@/app/api/dashboard/kb/[id]/route");
		const res = await DELETE(
			makeRequest("http://localhost/api/dashboard/kb/kb-1?orgId=org-1"),
			{ params: Promise.resolve({ id: "kb-1" }) },
		);
		expect(res.status).toBe(200);
	});
});

describe("dashboard handoff routes", () => {
	it("lists pending handoffs", async () => {
		const { GET } = await import("@/app/api/dashboard/handoffs/route");
		const res = await GET(
			makeRequest("http://localhost/api/dashboard/handoffs?orgId=org-1"),
		);
		const json = (await res.json()) as { handoffs: Array<{ id: string }> };
		expect(json.handoffs).toHaveLength(1);
		expect(json.handoffs[0]?.id).toBe("h-1");
	});

	it("resolves a handoff", async () => {
		const { POST } = await import(
			"@/app/api/dashboard/handoffs/[id]/resolve/route"
		);
		const res = await POST(
			makeRequest("http://localhost/api/dashboard/handoffs/h-1/resolve"),
			{ params: Promise.resolve({ id: "h-1" }) },
		);
		expect(res.status).toBe(200);
	});
});

describe("dashboard channels route", () => {
	it("disconnects a channel", async () => {
		const { POST } = await import("@/app/api/dashboard/channels/route");
		const res = await POST(
			makeRequest("http://localhost/api/dashboard/channels", {
				orgId: "org-1",
				id: "conn-1",
			}),
		);
		expect(res.status).toBe(200);
	});

	it("rejects missing id", async () => {
		const { POST } = await import("@/app/api/dashboard/channels/route");
		const res = await POST(
			makeRequest("http://localhost/api/dashboard/channels", {
				orgId: "org-1",
			}),
		);
		expect(res.status).toBe(400);
	});
});

describe("dashboard profile route", () => {
	it("gets the internal profile", async () => {
		const { GET } = await import("@/app/api/dashboard/profile/route");
		const res = await GET(
			makeRequest("http://localhost/api/dashboard/profile?orgId=org-1"),
		);
		const json = (await res.json()) as { profile: { assistantName: string } };
		expect(json.profile.assistantName).toBe("Assistant");
	});

	it("upserts the profile", async () => {
		const { PUT } = await import("@/app/api/dashboard/profile/route");
		const res = await PUT(
			makeRequest("http://localhost/api/dashboard/profile", {
				orgId: "org-1",
				assistantName: "Bot",
				tone: "friendly",
			}),
		);
		expect(res.status).toBe(200);
	});

	it("rejects missing orgId", async () => {
		const { PUT } = await import("@/app/api/dashboard/profile/route");
		const res = await PUT(
			makeRequest("http://localhost/api/dashboard/profile", {
				assistantName: "Bot",
			}),
		);
		expect(res.status).toBe(400);
	});
});
