/**
 * E2E tests for the link generation API routes.
 *
 * These tests directly invoke the Next.js route handlers with mock Request objects,
 * testing input validation, response formatting, error handling, and the
 * server-to-server x-api-key gate.
 */

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Supabase so routes don't make real network calls
vi.mock("@/lib/supabase", () => ({
	createServiceClient: vi.fn().mockReturnValue({
		from: vi.fn().mockReturnThis(),
		select: vi.fn().mockReturnThis(),
		insert: vi.fn().mockReturnThis(),
		update: vi.fn().mockReturnThis(),
		delete: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		in: vi.fn().mockReturnThis(),
		order: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		is: vi.fn().mockReturnThis(),
		or: vi.fn().mockReturnThis(),
		single: vi.fn().mockResolvedValue({
			data: { tokens_used: 0 },
			error: null,
		}),
		rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
		then: undefined,
	}),
}));

const TEST_SECRET = "test-gateway-secret";
const AUTH_HEADERS = { "x-api-key": TEST_SECRET };

function makeRequest(
	url: string,
	body: unknown,
	headers: Record<string, string> = {},
) {
	return new NextRequest(url, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: typeof body === "string" ? body : JSON.stringify(body),
	});
}

beforeEach(() => {
	process.env.AGENT_GATEWAY_API_SECRET = TEST_SECRET;
});

afterEach(() => {
	delete process.env.AGENT_GATEWAY_API_SECRET;
});

describe("POST /api/link/code", () => {
	it("generates a link code with valid input", async () => {
		const { POST } = await import("@/app/api/link/code/route");

		const request = makeRequest(
			"http://localhost/api/link/code",
			{
				orgId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
				userId: "user-123",
				productType: "zer",
			},
			AUTH_HEADERS,
		);

		const response = await POST(request);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toHaveProperty("code");
		expect(body).toHaveProperty("formatted");
		expect(body.formatted).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
		expect(body).toHaveProperty("expiresInMinutes", 10);
	});

	it("rejects requests without a valid x-api-key", async () => {
		const { POST } = await import("@/app/api/link/code/route");

		const request = makeRequest("http://localhost/api/link/code", {
			orgId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
			userId: "user-123",
			productType: "zer",
		});

		const response = await POST(request);
		expect(response.status).toBe(401);
	});

	it("rejects requests with a wrong x-api-key", async () => {
		const { POST } = await import("@/app/api/link/code/route");

		const request = makeRequest(
			"http://localhost/api/link/code",
			{
				orgId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
				userId: "user-123",
				productType: "zer",
			},
			{ "x-api-key": "wrong-secret" },
		);

		const response = await POST(request);
		expect(response.status).toBe(401);
	});

	it("rejects missing orgId", async () => {
		const { POST } = await import("@/app/api/link/code/route");

		const request = makeRequest(
			"http://localhost/api/link/code",
			{ userId: "user-123", productType: "zer" },
			AUTH_HEADERS,
		);

		const response = await POST(request);
		expect(response.status).toBe(400);
	});

	it("rejects invalid productType", async () => {
		const { POST } = await import("@/app/api/link/code/route");

		const request = makeRequest(
			"http://localhost/api/link/code",
			{
				orgId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
				userId: "user-123",
				productType: "invalid",
			},
			AUTH_HEADERS,
		);

		const response = await POST(request);
		expect(response.status).toBe(400);
	});

	it("rejects empty body", async () => {
		const { POST } = await import("@/app/api/link/code/route");

		const request = makeRequest(
			"http://localhost/api/link/code",
			"{}",
			AUTH_HEADERS,
		);

		const response = await POST(request);
		expect(response.status).toBe(400);
	});
});

describe("POST /api/link/generate (compact token)", () => {
	it("generates a compact token with valid input", async () => {
		const { POST } = await import("@/app/api/link/generate/route");

		const request = makeRequest(
			"http://localhost/api/link/generate",
			{
				orgId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
				userId: "user-123",
				productType: "zer",
			},
			AUTH_HEADERS,
		);

		const response = await POST(request);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toHaveProperty("token");
		expect(body.token.length).toBeLessThanOrEqual(64);
		expect(body).toHaveProperty("telegramUrl");
		expect(body.telegramUrl).toContain("start=");
	});

	it("rejects requests without x-api-key", async () => {
		const { POST } = await import("@/app/api/link/generate/route");

		const request = makeRequest("http://localhost/api/link/generate", {
			orgId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
			userId: "user-123",
			productType: "zer",
		});

		const response = await POST(request);
		expect(response.status).toBe(401);
	});

	it("rejects missing userId", async () => {
		const { POST } = await import("@/app/api/link/generate/route");

		const request = makeRequest(
			"http://localhost/api/link/generate",
			{ orgId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", productType: "zer" },
			AUTH_HEADERS,
		);

		const response = await POST(request);
		expect(response.status).toBe(400);
	});

	it("rejects invalid productType", async () => {
		const { POST } = await import("@/app/api/link/generate/route");

		const request = makeRequest(
			"http://localhost/api/link/generate",
			{
				orgId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
				userId: "user-123",
				productType: "invalid",
			},
			AUTH_HEADERS,
		);

		const response = await POST(request);
		expect(response.status).toBe(400);
	});
});
