/**
 * Token-verified connect flows: /api/facebook/start + /api/whatsapp/connect.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase", () => ({
	createServiceClient: vi.fn(() => ({
		from: vi.fn(() => ({
			upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
		})),
	})),
}));

// Real token machinery (no network) — mint a valid token for the happy path.
import { createCompactToken, verifyCompactToken } from "@/lib/tokens";

const ORG_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const USER_ID = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
const PRODUCT = "zer" as const;

function validToken(): string {
	return createCompactToken(ORG_ID, USER_ID, PRODUCT);
}

describe("verifyCompactToken", () => {
	it("rejects garbage", () => {
		expect(verifyCompactToken("not-a-token")).toBeNull();
	});

	it("rejects tampered signatures", () => {
		const token = validToken();
		const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
		expect(verifyCompactToken(tampered)).toBeNull();
	});

	it("accepts a valid token and decodes the payload", () => {
		const decoded = verifyCompactToken(validToken());
		expect(decoded).toMatchObject({
			orgId: ORG_ID,
			userId: USER_ID,
			productType: PRODUCT,
		});
	});
});

describe("POST /api/facebook/start", () => {
	beforeEach(() => {
		process.env.FB_APP_ID = "fb-app";
		process.env.FB_OAUTH_REDIRECT_URI = "https://gateway.test/cb";
	});

	it("returns a FB dialog URL for a valid token", async () => {
		const { POST } = await import("@/app/api/facebook/start/route");
		const res = await POST(
			new Request("http://localhost/api/facebook/start", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token: validToken() }),
			}),
		);
		expect(res.status).toBe(200);
		const json = (await res.json()) as { redirectUrl: string };
		expect(json.redirectUrl).toContain("facebook.com");
		expect(json.redirectUrl).toContain("dialog/oauth");
		const dialogUrl = new URL(json.redirectUrl);
		expect(dialogUrl.searchParams.get("state")).toBe(validToken());
		expect(res.headers.getSetCookie()).not.toContain(
			expect.stringContaining("fb_oauth_state="),
		);
	});

	it("401s for an invalid token", async () => {
		const { POST } = await import("@/app/api/facebook/start/route");
		const res = await POST(
			new Request("http://localhost/api/facebook/start", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token: "garbage" }),
			}),
		);
		expect(res.status).toBe(401);
	});

	it("400s when the token is missing", async () => {
		const { POST } = await import("@/app/api/facebook/start/route");
		const res = await POST(
			new Request("http://localhost/api/facebook/start", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "{}",
			}),
		);
		expect(res.status).toBe(400);
	});
});

describe("POST /api/whatsapp/connect", () => {
	beforeEach(() => {
		process.env.AGENT_GATEWAY_URL = "https://gateway.test";
		process.env.WHATSAPP_VERIFY_TOKEN = "wa-verify";
		process.env.META_TOKEN_ENCRYPTION_KEY = "test-key";
	});

	it("registers the org's WhatsApp account and returns webhook config", async () => {
		const { POST } = await import("@/app/api/whatsapp/connect/route");
		const res = await POST(
			new Request("http://localhost/api/whatsapp/connect", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					token: validToken(),
					phoneNumberId: "123456789",
					accessToken: "secret-token",
					phoneNumber: "+97690000000",
				}),
			}),
		);
		expect(res.status).toBe(200);
		const json = (await res.json()) as {
			success: boolean;
			botKey: string;
			webhookUrl: string;
			verifyToken: string;
		};
		expect(json.success).toBe(true);
		expect(json.botKey).toBeTruthy();
		expect(json.webhookUrl).toContain("api/whatsapp/webhook?botKey=");
		expect(json.verifyToken).toBe("wa-verify");
	});

	it("401s for an invalid token", async () => {
		const { POST } = await import("@/app/api/whatsapp/connect/route");
		const res = await POST(
			new Request("http://localhost/api/whatsapp/connect", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					token: "garbage",
					phoneNumberId: "1",
					accessToken: "t",
				}),
			}),
		);
		expect(res.status).toBe(401);
	});

	it("400s on missing fields", async () => {
		const { POST } = await import("@/app/api/whatsapp/connect/route");
		const res = await POST(
			new Request("http://localhost/api/whatsapp/connect", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token: validToken() }),
			}),
		);
		expect(res.status).toBe(400);
	});
});
