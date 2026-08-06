import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockCreateServiceClient = vi.fn();
vi.mock("@/lib/supabase", () => ({
	createServiceClient: (...a: unknown[]) => mockCreateServiceClient(...a),
}));

vi.mock("@/lib/api-auth", () => ({
	isGatewayApiKeyValid: vi.fn(() => true),
}));

// Static import for mocking; the route itself is imported dynamically below
// because vi.resetModules() must re-capture module-level mocks per test —
// same convention as facebook-oauth-routes.test.ts.
import { isGatewayApiKeyValid } from "@/lib/api-auth";

const ORG_ID = "org-facebook-1";

describe("GET /api/facebook/connections", () => {
	afterEach(() => {
		vi.resetModules();
		// Reset implementation too — mockReturnValue set in one test must not
		// leak into the next (vi.resetModules() alone keeps mock state).
		vi.mocked(isGatewayApiKeyValid).mockReset();
	});

	it("rejects requests without a valid x-api-key", async () => {
		vi.mocked(isGatewayApiKeyValid).mockReturnValue(false);
		const { GET } = await import("@/app/api/facebook/connections/route");
		const req = new NextRequest(
			"http://localhost/api/facebook/connections?orgId=x",
		);
		const res = await GET(req);
		expect(res.status).toBe(401);
	});

	it("rejects when orgId is missing", async () => {
		vi.mocked(isGatewayApiKeyValid).mockReturnValue(true);
		const { GET } = await import("@/app/api/facebook/connections/route");
		const req = new NextRequest("http://localhost/api/facebook/connections");
		const res = await GET(req);
		expect(res.status).toBe(400);
	});

	it("returns safe connection fields for the org", async () => {
		vi.mocked(isGatewayApiKeyValid).mockReturnValue(true);
		const rows = [
			{
				channel: "messenger",
				page_id: "page-1",
				page_name: "Авто Сервис",
				created_at: "2026-08-01T00:00:00Z",
				webhook_subscribed_at: "2026-08-01T00:00:01Z",
				token_expires_at: "2026-10-01T00:00:00Z",
			},
			{
				channel: "instagram",
				page_id: "page-1",
				page_name: "Авто Сервис (Instagram)",
				created_at: "2026-08-01T00:00:02Z",
				webhook_subscribed_at: null,
				token_expires_at: null,
			},
		];

		// The route chains: from().select().eq().in().eq().order()
		const orderMock = vi.fn().mockResolvedValue({ data: rows, error: null });
		const eqMock = vi.fn().mockReturnValue({ order: orderMock });
		const inMock = vi.fn().mockReturnValue({ eq: eqMock });
		const eq2Mock = vi.fn().mockReturnValue({ in: inMock });
		const selectMock = vi.fn().mockReturnValue({ eq: eq2Mock });
		const fromMock = vi.fn().mockReturnValue({ select: selectMock });
		mockCreateServiceClient.mockReturnValue({ from: fromMock });

		const { GET } = await import("@/app/api/facebook/connections/route");
		const req = new NextRequest(
			`http://localhost/api/facebook/connections?orgId=${ORG_ID}`,
			{ headers: { "x-api-key": "secret" } },
		);
		const res = await GET(req);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.connections).toHaveLength(2);
		expect(body.connections[0]).toEqual({
			channel: "messenger",
			pageId: "page-1",
			pageName: "Авто Сервис",
			connectedAt: "2026-08-01T00:00:00Z",
			webhookSubscribedAt: "2026-08-01T00:00:01Z",
			tokenExpiresAt: "2026-10-01T00:00:00Z",
		});
		// Never leak tokens
		expect(JSON.stringify(body)).not.toContain("access_token");
	});
});
