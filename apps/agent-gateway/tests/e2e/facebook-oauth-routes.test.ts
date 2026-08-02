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
vi.mock("@/channels/facebook", () => ({
	FacebookChannel: class {
		subscribeToWebhook = mockSubscribeToWebhook;
		getPageInfo = mockGetPageInfo;
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
}

function clearFbEnv() {
	delete process.env.FB_APP_ID;
	delete process.env.FB_APP_SECRET;
	delete process.env.FB_OAUTH_REDIRECT_URI;
	delete process.env.FB_GRAPH_API_VERSION;
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
		expect(url.searchParams.get("scope")).toContain("pages_messaging");
		expect(url.searchParams.get("scope")).toContain(
			"instagram_manage_messages",
		);

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
		expect(mockSubscribeToWebhook).toHaveBeenCalledWith("page-1", "page-token");
		expect(mockGetPageInfo).toHaveBeenCalledWith("page-1", "page-token");
		expect(res.cookies.get("fb_pages")?.maxAge).toBe(0);
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

describe("GET /api/facebook/callback", () => {
	const NONCE = "nonce-abc-123";

	function validQuery(overrides: Record<string, string> = {}) {
		const params = new URLSearchParams({
			code: "auth-code-1",
			state: makeStateParam(ORG_ID, "zer", NONCE),
			...overrides,
		});
		return `http://localhost/api/facebook/callback?${params.toString()}`;
	}

	function cookieReq(url: string, cookie?: string): NextRequest {
		const headers = new Headers();
		if (cookie) headers.set("cookie", cookie);
		return new NextRequest(url, { headers });
	}

	function oauthResponse(
		body: Record<string, unknown>,
		ok = true,
	): { ok: boolean; json: () => Promise<Record<string, unknown>> } {
		return { ok, json: async () => body };
	}

	beforeEach(() => {
		vi.resetModules();
		setFbEnv();
		vi.clearAllMocks();
	});

	it("rejects when the state cookie is missing", async () => {
		const { GET } = await import("@/app/api/facebook/callback/route");
		const res = await GET(cookieReq(validQuery()));
		expect(res.status).toBe(400);
		expect((await res.json()).error).toBe("Invalid OAuth state");
	});

	it("rejects when the cookie nonce does not match the state param", async () => {
		const { GET } = await import("@/app/api/facebook/callback/route");
		const res = await GET(
			cookieReq(
				validQuery(),
				`fb_oauth_state=${encodeURIComponent(
					JSON.stringify({ orgId: ORG_ID, productType: "zer", state: "other" }),
				)}`,
			),
		);
		expect(res.status).toBe(400);
	});

	it("rejects when the state param is malformed", async () => {
		const { GET } = await import("@/app/api/facebook/callback/route");
		const res = await GET(
			cookieReq(
				`http://localhost/api/facebook/callback?code=x&state=%%%not-base64`,
				`fb_oauth_state=${encodeURIComponent(JSON.stringify({ state: "x" }))}`,
			),
		);
		expect(res.status).toBe(400);
	});

	it("rejects when the authorization code is missing", async () => {
		const { GET } = await import("@/app/api/facebook/callback/route");
		const url = validQuery();
		const { GET: CallbackGET } = await import(
			"@/app/api/facebook/callback/route"
		);
		void GET;
		const res = await CallbackGET(
			cookieReq(
				url.replace("code=auth-code-1", ""),
				`fb_oauth_state=${encodeURIComponent(
					JSON.stringify({ orgId: ORG_ID, productType: "zer", state: NONCE }),
				)}`,
			),
		);
		expect(res.status).toBe(400);
		expect((await res.json()).error).toBe("Missing authorization code");
	});

	it("rejects when the app is not configured", async () => {
		clearFbEnv();
		const { GET } = await import("@/app/api/facebook/callback/route");
		const res = await GET(
			cookieReq(
				validQuery(),
				`fb_oauth_state=${encodeURIComponent(
					JSON.stringify({ orgId: ORG_ID, productType: "zer", state: NONCE }),
				)}`,
			),
		);
		expect(res.status).toBe(500);
	});

	it("rejects when the token exchange fails", async () => {
		const mockFetch = vi.fn(async () =>
			oauthResponse({ error: { message: "invalid code" } }, false),
		);
		vi.stubGlobal("fetch", mockFetch);
		const { GET } = await import("@/app/api/facebook/callback/route");
		const res = await GET(
			cookieReq(
				validQuery(),
				`fb_oauth_state=${encodeURIComponent(
					JSON.stringify({ orgId: ORG_ID, productType: "zer", state: NONCE }),
				)}`,
			),
		);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toBe("invalid code");
	});

	it("rejects when the user manages no pages", async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValueOnce(
				oauthResponse({ access_token: "short", expires_in: 3600 }),
			)
			.mockResolvedValueOnce(oauthResponse({ access_token: "long" }))
			.mockResolvedValueOnce(
				oauthResponse({ data: [], error: { message: "no pages" } }, false),
			);
		vi.stubGlobal("fetch", mockFetch);
		const { GET } = await import("@/app/api/facebook/callback/route");
		const res = await GET(
			cookieReq(
				validQuery(),
				`fb_oauth_state=${encodeURIComponent(
					JSON.stringify({ orgId: ORG_ID, productType: "zer", state: NONCE }),
				)}`,
			),
		);
		expect(res.status).toBe(400);
	});

	it("redirects to page selection with the pages cookie on success", async () => {
		const pages = [
			{ id: "p1", name: "Page A", access_token: "tok-a" },
			{ id: "p2", name: "Page B", access_token: "tok-b" },
		];
		const mockFetch = vi
			.fn()
			.mockResolvedValueOnce(
				oauthResponse({ access_token: "short-token", expires_in: 3600 }),
			)
			.mockResolvedValueOnce(oauthResponse({ access_token: "long-token" }))
			.mockResolvedValueOnce(oauthResponse({ data: pages }));
		vi.stubGlobal("fetch", mockFetch);
		const { GET } = await import("@/app/api/facebook/callback/route");
		const res = await GET(
			cookieReq(
				validQuery(),
				`fb_oauth_state=${encodeURIComponent(
					JSON.stringify({ orgId: ORG_ID, productType: "zer", state: NONCE }),
				)}`,
			),
		);

		expect(res.status).toBe(307);
		const location = res.headers.get("location") ?? "";
		expect(location).toContain("/link/select");
		expect(location).toContain(`orgId=${ORG_ID}`);
		expect(location).toContain("productType=zer");

		const pagesCookie = res.cookies.get("fb_pages");
		expect(pagesCookie).toBeDefined();
		expect(JSON.parse(pagesCookie?.value)).toHaveLength(2);
		// State cookie cleared
		expect(res.cookies.get("fb_oauth_state")?.maxAge).toBe(0);

		// 3 Graph API calls: exchange, long-lived, pages
		expect(mockFetch).toHaveBeenCalledTimes(3);
		const longLivedUrl = mockFetch.mock.calls[1]?.[0] as URL;
		expect(longLivedUrl.searchParams.get("grant_type")).toBe(
			"fb_exchange_token",
		);
	});

	afterEach(() => {
		clearFbEnv();
		vi.unstubAllGlobals();
	});
});
