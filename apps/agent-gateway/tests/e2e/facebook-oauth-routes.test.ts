/**
 * Facebook OAuth flow route tests: /api/facebook/connect (GET start),
 * /api/facebook/select (POST page pick), /api/facebook/callback (GET code
 * exchange). Uses vi.resetModules() so module-level env consts are captured
 * per-test.
 */

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockSubscribeToWebhook = vi.fn(async () => true);
const mockGetPageInfo = vi.fn(async () => null);
vi.mock("@zuiio/gateway-facebook", () => ({
	FacebookChannel: class {
		subscribeToWebhook = mockSubscribeToWebhook;
		getPageInfo = mockGetPageInfo;
		constructor(_options?: unknown) {}
	},
}));

vi.mock("@/lib/crypto", () => ({
	encryptSecret: (t: string) => `enc:${t}`,
	decryptSecret: (t: string) => t,
}));

const mockCreateServiceClient = vi.fn();
vi.mock("@/lib/supabase", () => ({
	createServiceClient: (...a: unknown[]) => mockCreateServiceClient(...a),
}));

const FB_ENV = {
	FB_APP_ID: "app-id-123",
	FB_APP_SECRET: "app-secret-abc",
	FB_OAUTH_REDIRECT_URI: "https://gw.example.com/api/facebook/callback",
	FB_GRAPH_API_VERSION: "v25.0",
};

function setFbEnv() {
	process.env.FB_APP_ID = FB_ENV.FB_APP_ID;
	process.env.FB_APP_SECRET = FB_ENV.FB_APP_SECRET;
	process.env.FB_OAUTH_REDIRECT_URI = FB_ENV.FB_OAUTH_REDIRECT_URI;
	process.env.FB_GRAPH_API_VERSION = FB_ENV.FB_GRAPH_API_VERSION;
	process.env.TOKEN_SIGNING_SECRET = "test-token-secret";
}

function clearFbEnv() {
	delete process.env.FB_APP_ID;
	delete process.env.FB_APP_SECRET;
	delete process.env.FB_OAUTH_REDIRECT_URI;
	delete process.env.FB_GRAPH_API_VERSION;
	delete process.env.TOKEN_SIGNING_SECRET;
}

/** base64url(JSON) state param — matches what connect stores. */
function makeStateParam(orgId: string, productType: string, nonce: string) {
	return Buffer.from(
		JSON.stringify({ orgId, productType, state: nonce }),
	).toString("base64url");
}

const ORG_ID = "org-facebook-1";

describe("GET /api/facebook/connect", () => {
	beforeEach(() => {
		vi.resetModules();
		setFbEnv();
	});
	afterEach(() => {
		clearFbEnv();
		vi.unstubAllGlobals();
	});

	it("rejects when orgId is missing", async () => {
		const { GET } = await import("@/app/api/facebook/connect/route");
		const res = await GET(new Request("http://localhost/api/facebook/connect"));
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toContain("orgId");
	});

	it("rejects when the Facebook app is not configured", async () => {
		clearFbEnv();
		const { GET } = await import("@/app/api/facebook/connect/route");
		const res = await GET(
			new Request(
				`http://localhost/api/facebook/connect?orgId=${ORG_ID}&productType=zer`,
			),
		);
		expect(res.status).toBe(500);
	});

	it("redirects to the OAuth dialog and stores a state cookie", async () => {
		const { GET } = await import("@/app/api/facebook/connect/route");
		const res = await GET(
			new Request(
				`http://localhost/api/facebook/connect?orgId=${ORG_ID}&productType=tolom`,
			),
		);

		expect(res.status).toBe(307);
		const location = res.headers.get("location") ?? "";
		expect(location).toContain("https://www.facebook.com/v25.0/dialog/oauth");
		const url = new URL(location);
		expect(url.searchParams.get("client_id")).toBe("app-id-123");
		expect(url.searchParams.get("redirect_uri")).toBe(
			FB_ENV.FB_OAUTH_REDIRECT_URI,
		);
		expect(url.searchParams.get("response_type")).toBe("code");
		expect(url.searchParams.get("scope")).toContain("pages_show_list");
		expect(url.searchParams.get("scope")).toContain("pages_manage_metadata");
		expect(url.searchParams.get("scope")).not.toContain("instagram_");

		// State param round-trips the orgId/productType
		const stateParam = url.searchParams.get("state") ?? "";
		const decoded = JSON.parse(
			Buffer.from(stateParam, "base64url").toString(),
		) as { orgId: string; productType: string; state: string };
		expect(decoded.orgId).toBe(ORG_ID);
		expect(decoded.productType).toBe("tolom");
		expect(decoded.state).toBeTruthy();

		// Raw-JSON cookie for callback comparison
		const cookie = res.cookies.get("fb_oauth_state");
		expect(cookie).toBeDefined();
		const cookieData = JSON.parse(cookie?.value) as {
			orgId: string;
			state: string;
		};
		expect(cookieData.orgId).toBe(ORG_ID);
		expect(cookieData.state).toBe(decoded.state);
		expect(cookie?.maxAge).toBe(600);
	});

	it("never adds Instagram permissions to the Facebook dialog", async () => {
		process.env.FB_ENABLE_INSTAGRAM = "1";
		const { GET } = await import("@/app/api/facebook/connect/route");
		const res = await GET(
			new Request(
				`http://localhost/api/facebook/connect?orgId=${ORG_ID}&productType=zer`,
			),
		);
		const url = new URL(res.headers.get("location") ?? "");
		expect(url.searchParams.get("scope")).not.toContain("instagram_");
	});
});

describe("POST /api/facebook/select", () => {
	const page = {
		id: "page-1",
		name: "Авто Сервис",
		access_token: "page-token",
	};
	const pagesCookie = JSON.stringify([page]);

	function chainableSupabase() {
		const chain: Record<string, unknown> = {};
		for (const m of ["select", "upsert", "eq", "single", "maybeSingle"]) {
			chain[m] = vi.fn().mockReturnValue(chain);
		}
		return chain;
	}

	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		mockSubscribeToWebhook.mockResolvedValue(true);
		mockGetPageInfo.mockResolvedValue(null);
	});
	it("returns page names without exposing access tokens", async () => {
		const { GET } = await import("@/app/api/facebook/select/route");
		const req = new NextRequest("http://localhost/api/facebook/select", {
			headers: { cookie: `fb_pages=${encodeURIComponent(pagesCookie)}` },
		});
		const res = await GET(req);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.pages).toEqual([{ id: "page-1", name: "Авто Сервис" }]);
		expect(JSON.stringify(body)).not.toContain("page-token");
	});

	it("rejects when required fields are missing", async () => {
		const { POST } = await import("@/app/api/facebook/select/route");
		const req = new NextRequest("http://localhost/api/facebook/select", {
			method: "POST",
			body: JSON.stringify({ pageId: "page-1" }),
		});
		const res = await POST(req);
		expect(res.status).toBe(400);
	});

	it("rejects when the pages cookie is missing", async () => {
		const { POST } = await import("@/app/api/facebook/select/route");
		const req = new NextRequest("http://localhost/api/facebook/select", {
			method: "POST",
			body: JSON.stringify({
				pageId: "page-1",
				pageName: "Авто Сервис",
				orgId: ORG_ID,
			}),
		});
		const res = await POST(req);
		expect(res.status).toBe(400);
		expect((await res.json()).error).toContain("OAuth session expired");
	});

	it("rejects when the page is not in the OAuth session", async () => {
		const { POST } = await import("@/app/api/facebook/select/route");
		const req = new NextRequest("http://localhost/api/facebook/select", {
			method: "POST",
			headers: { cookie: `fb_pages=${encodeURIComponent(pagesCookie)}` },
			body: JSON.stringify({
				pageId: "other-page",
				pageName: "X",
				orgId: ORG_ID,
			}),
		});
		const res = await POST(req);
		expect(res.status).toBe(400);
		expect((await res.json()).error).toContain("Page not found");
	});

	it("stores a messenger connection and clears the pages cookie", async () => {
		const sb = { from: vi.fn(() => chainableSupabase()) };
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/facebook/select/route");
		const req = new NextRequest("http://localhost/api/facebook/select", {
			method: "POST",
			headers: { cookie: `fb_pages=${encodeURIComponent(pagesCookie)}` },
			body: JSON.stringify({
				pageId: "page-1",
				pageName: "Авто Сервис",
				orgId: ORG_ID,
				productType: "tolom",
			}),
		});
		const res = await POST(req);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.instagramLinked).toBe(false);

		// messenger upsert contains encrypted token + page identity
		const upsertCalls = sb.from.mock.calls
			.map((c: [string]) => c[0])
			.filter((t: string) => t === "channel_connections");
		expect(upsertCalls.length).toBe(1);
		const upsert = sb.from.mock.results.find(
			(r: { value: { upsert: unknown } }) => r.value.upsert,
		);
		expect(upsert).toBeDefined();
		const upsertArgs = (upsert!.value.upsert as ReturnType<typeof vi.fn>).mock
			.calls[0] as unknown[];
		expect(upsertArgs[0]).toMatchObject({
			organization_id: ORG_ID,
			channel: "messenger",
			channel_user_id: "page-1",
			page_access_token: "enc:page-token",
			token_encrypted: true,
			product_type: "tolom",
			is_active: true,
		});
		expect(mockSubscribeToWebhook).toHaveBeenCalledTimes(1);
		expect(mockGetPageInfo).toHaveBeenCalledTimes(1);
		expect(res.cookies.get("fb_pages")?.maxAge).toBe(0);
	});

	it("returns the server-configured return URL for the product, null otherwise", async () => {
		const sb = { from: vi.fn(() => chainableSupabase()) };
		mockCreateServiceClient.mockReturnValue(sb);
		process.env.FB_RETURN_URL_ZER = "https://app.zer.example/settings?tab=ai";
		delete process.env.FB_RETURN_URL_TOLOM;
		try {
			// zer product → env-configured URL returned
			const { POST } = await import("@/app/api/facebook/select/route");
			let req = new NextRequest("http://localhost/api/facebook/select", {
				method: "POST",
				headers: { cookie: `fb_pages=${encodeURIComponent(pagesCookie)}` },
				body: JSON.stringify({
					pageId: "page-1",
					pageName: "Авто Сервис",
					orgId: ORG_ID,
					productType: "zer",
				}),
			});
			let res = await POST(req);
			expect((await res.json()).returnUrl).toBe(
				"https://app.zer.example/settings?tab=ai",
			);

			// tolom product → no env configured → null (no redirect)
			req = new NextRequest("http://localhost/api/facebook/select", {
				method: "POST",
				headers: { cookie: `fb_pages=${encodeURIComponent(pagesCookie)}` },
				body: JSON.stringify({
					pageId: "page-1",
					pageName: "Авто Сервис",
					orgId: ORG_ID,
					productType: "tolom",
				}),
			});
			res = await POST(req);
			expect((await res.json()).returnUrl).toBeNull();
		} finally {
			delete process.env.FB_RETURN_URL_ZER;
			delete process.env.FB_RETURN_URL_TOLOM;
		}
	});

	it("additionally stores an instagram connection when linked", async () => {
		mockGetPageInfo.mockResolvedValue({
			instagramBusinessAccount: { id: "ig-42" },
		});
		const sb = { from: vi.fn(() => chainableSupabase()) };
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/facebook/select/route");
		const req = new NextRequest("http://localhost/api/facebook/select", {
			method: "POST",
			headers: { cookie: `fb_pages=${encodeURIComponent(pagesCookie)}` },
			body: JSON.stringify({
				pageId: "page-1",
				pageName: "Авто Сервис",
				orgId: ORG_ID,
			}),
		});
		const res = await POST(req);
		const body = await res.json();
		expect(body.instagramLinked).toBe(true);
		const upserts = sb.from.mock.results
			.map((r: { value: { upsert: unknown } }) => r.value.upsert)
			.filter(Boolean);
		expect(upserts).toHaveLength(2);
		const igUpsert = (upserts[1] as ReturnType<typeof vi.fn>).mock
			.calls[0][0] as { channel: string };
		expect(igUpsert.channel).toBe("instagram");
	});

	it("returns 500 when the connection insert fails", async () => {
		const failing = chainableSupabase();
		(failing.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
			error: new Error("constraint"),
		});
		mockCreateServiceClient.mockReturnValue({ from: vi.fn(() => failing) });
		const { POST } = await import("@/app/api/facebook/select/route");
		const req = new NextRequest("http://localhost/api/facebook/select", {
			method: "POST",
			headers: { cookie: `fb_pages=${encodeURIComponent(pagesCookie)}` },
			body: JSON.stringify({
				pageId: "page-1",
				pageName: "Авто Сервис",
				orgId: ORG_ID,
			}),
		});
		const res = await POST(req);
		expect(res.status).toBe(500);
	});

	it("returns 500 when webhook subscription throws", async () => {
		mockSubscribeToWebhook.mockRejectedValue(new Error("graph down"));
		const sb = { from: vi.fn(() => chainableSupabase()) };
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/facebook/select/route");
		const req = new NextRequest("http://localhost/api/facebook/select", {
			method: "POST",
			headers: { cookie: `fb_pages=${encodeURIComponent(pagesCookie)}` },
			body: JSON.stringify({
				pageId: "page-1",
				pageName: "Авто Сервис",
				orgId: ORG_ID,
			}),
		});
		const res = await POST(req);
		expect(res.status).toBe(500);
	});
});

describe("GET /api/facebook/callback (transaction state machine)", () => {
	const STATE = "a".repeat(43);
	const SELECTOR = "https://zer.example.com/settings/meta/select";

	type Final = { data?: unknown; error?: unknown };

	function chainableSupabase(final: Final) {
		const chain: Record<string, unknown> = {};
		const terminal = {
			then: (resolve: (v: Final) => void) => resolve(final),
		};
		for (const method of ["update", "eq", "gt", "select"]) {
			chain[method] = vi.fn(() => chain);
		}
		chain.maybeSingle = vi.fn(async () => final);
		return Object.assign(chain, terminal);
	}

	function controlStub(final: Final) {
		return {
			createGatewayControlClient: () => ({
				from: () => chainableSupabase(final),
			}),
		};
	}

	beforeEach(() => {
		vi.resetModules();
		setFbEnv();
		process.env.ZER_META_SELECTOR_URL = SELECTOR;
	});

	afterEach(() => {
		clearFbEnv();
		delete process.env.ZER_META_SELECTOR_URL;
	});

	it("rejects a state that is not claimable with 400 OAUTH_STATE_INVALID", async () => {
		vi.doMock("@/lib/gateway-control-client", () =>
			controlStub({ data: null, error: null }),
		);
		const { GET } = await import("@/app/api/facebook/callback/route");
		const res = await GET(
			new NextRequest(
				`http://localhost/api/facebook/callback?code=c&state=${STATE}`,
			),
		);
		expect(res.status).toBe(400);
		expect((await res.json()).error.code).toBe("OAUTH_STATE_INVALID");
	});

	it("marks denial and redirects to the Zer selector on access_denied", async () => {
		vi.doMock("@/lib/gateway-control-client", () =>
			controlStub({
				data: {
					id: "tx-1",
					tenant_id: "t1",
					requested_by: "u1",
					status: "authorized",
					encrypted_payload: "enc:v2:1:a:b:c",
					error_code: null,
					expires_at: new Date(Date.now() + 60_000).toISOString(),
				},
				error: null,
			}),
		);
		const { GET } = await import("@/app/api/facebook/callback/route");
		const res = await GET(
			new NextRequest(
				`http://localhost/api/facebook/callback?error=access_denied&state=${STATE}`,
			),
		);
		expect([302, 307]).toContain(res.status);
		const location = new URL(res.headers.get("location") ?? "");
		expect(location.origin + location.pathname).toBe(SELECTOR);
		expect(location.searchParams.get("transaction")).toBeTruthy();
	});
});
