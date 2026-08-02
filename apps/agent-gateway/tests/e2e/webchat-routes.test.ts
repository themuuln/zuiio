/**
 * Web chat widget routes: message, start, widget.js + stream-draft dev gate.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockMaybeSingle = vi.fn();
const mockOrder = vi.fn();

vi.mock("@/lib/supabase", () => ({
	createServiceClient: vi.fn(() => {
		const chain: Record<string, unknown> = {};
		const mk = (terminal = false) =>
			vi.fn(() => {
				if (terminal) {
					if (chain === undefined)
						return Promise.resolve({ data: null, error: null });
				}
				return chain;
			});
		chain.select = mk();
		chain.eq = mk();
		chain.maybeSingle = vi.fn(() => mockMaybeSingle());
		chain.order = vi.fn(() => mockOrder());
		return { from: vi.fn(() => chain) } as never;
	}),
}));

const mockHandleAgentMessage = vi.fn(async () => "Сайн уу! Хэрхэн туслах вэ?");
vi.mock("@/gateway/agent-handler", () => ({
	handleAgentMessage: (...a: unknown[]) => mockHandleAgentMessage(...a),
}));

vi.mock("@/state/rate-limit", () => ({
	checkRateLimit: vi.fn(async () => ({
		allowed: true,
		remaining: 19,
		resetInMs: 1000,
	})),
	RATE_LIMITS: { messagesPerMinute: 20 },
}));

vi.mock("@/lib/sanitize", () => ({
	sanitizeUserInput: vi.fn((s: string) => s),
}));

vi.mock("@/gateway/webhook-helpers", () => ({
	systemPromptFor: vi.fn(async () => "prompt"),
	getProductTools: vi.fn(() => []),
}));

beforeEach(() => {
	vi.clearAllMocks();
	mockMaybeSingle.mockResolvedValue({
		data: {
			organization_id: "org-1",
			product_type: "zer",
			display_name: "Zer Store",
			greeting: "Сайн уу!",
		},
		error: null,
	});
	mockOrder.mockResolvedValue({ data: [], error: null });
});

describe("POST /api/webchat/message", () => {
	it("resolves the widget and runs the customer-audience agent", async () => {
		const { POST } = await import("@/app/api/webchat/message/route");
		const res = await POST(
			new Request("http://localhost/api/webchat/message", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					widgetKey: "k",
					visitorId: "v1",
					text: "Сайн уу",
				}),
			}),
		);
		const json = (await res.json()) as { reply: string };
		expect(res.status).toBe(200);
		expect(json.reply).toContain("Сайн уу");

		const ctx = mockHandleAgentMessage.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(ctx.audience).toBe("customer");
		expect(ctx.channel).toBe("webchat");
		expect(ctx.orgId).toBe("org-1");
	});

	it("404s for an unknown widget", async () => {
		mockMaybeSingle.mockResolvedValue({ data: null, error: null });
		const { POST } = await import("@/app/api/webchat/message/route");
		const res = await POST(
			new Request("http://localhost/api/webchat/message", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					widgetKey: "missing",
					visitorId: "v1",
					text: "hi",
				}),
			}),
		);
		expect(res.status).toBe(404);
	});

	it("400s on missing fields", async () => {
		const { POST } = await import("@/app/api/webchat/message/route");
		const res = await POST(
			new Request("http://localhost/api/webchat/message", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ widgetKey: "k", visitorId: "v1" }),
			}),
		);
		expect(res.status).toBe(400);
	});

	it("returns a polite fallback on agent timeout", async () => {
		vi.useFakeTimers();
		try {
			mockHandleAgentMessage.mockImplementationOnce(
				() => new Promise(() => {}), // never resolves
			);
			const { POST } = await import("@/app/api/webchat/message/route");
			const pending = POST(
				new Request("http://localhost/api/webchat/message", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						widgetKey: "k",
						visitorId: "v1",
						text: "hi",
					}),
				}),
			);
			// Advance past the route's 30s race timeout.
			await vi.advanceTimersByTimeAsync(31_000);
			const res = await pending;
			const json = (await res.json()) as { reply: string };
			expect(res.status).toBe(200);
			expect(json.reply).toContain("Уучлаарай");
		} finally {
			vi.useRealTimers();
		}
	});
});

describe("GET /api/webchat/start", () => {
	it("returns widget config", async () => {
		const { GET } = await import("@/app/api/webchat/start/route");
		const res = await GET(
			new Request("http://localhost/api/webchat/start?widgetKey=k"),
		);
		const json = (await res.json()) as {
			displayName: string;
			greeting: string;
		};
		expect(json.displayName).toBe("Zer Store");
		expect(json.greeting).toBe("Сайн уу!");
	});

	it("404s for unknown widget", async () => {
		mockMaybeSingle.mockResolvedValue({ data: null, error: null });
		const { GET } = await import("@/app/api/webchat/start/route");
		const res = await GET(
			new Request("http://localhost/api/webchat/start?widgetKey=missing"),
		);
		expect(res.status).toBe(404);
	});
});

describe("GET /api/webchat/widget.js", () => {
	it("serves the widget script with JS content type", async () => {
		const { GET } = await import("@/app/api/webchat/widget.js/route");
		const res = await GET(
			new Request("http://localhost/api/webchat/widget.js"),
		);
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("application/javascript");
		const body = await res.text();
		expect(body).toContain("data-widget-key");
		expect(body).toContain("api/webchat/message");
	});
});

describe("GET /api/test/stream-draft (dev gate)", () => {
	it("404s outside development", async () => {
		const original = process.env.NODE_ENV;
		process.env.NODE_ENV = "production";
		try {
			const { GET } = await import("@/app/api/test/stream-draft/route");
			const res = await GET(
				new Request("http://localhost/api/test/stream-draft?chatId=1"),
			);
			expect(res.status).toBe(404);
		} finally {
			process.env.NODE_ENV = original;
		}
	});
});
