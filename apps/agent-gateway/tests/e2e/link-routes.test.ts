/**
 * E2E tests for the link generation API routes.
 *
 * These tests directly invoke the Next.js route handlers with mock Request objects,
 * testing input validation, response formatting, and error handling.
 */
import { describe, expect, it, vi } from "vitest";

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

describe("POST /api/link/code", () => {
	it("generates a link code with valid input", async () => {
		const { POST } = await import("@/app/api/link/code/route");

		const request = new Request("http://localhost/api/link/code", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				orgId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
				userId: "user-123",
				productType: "zer",
			}),
		});

		const response = await POST(request);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toHaveProperty("code");
		expect(body).toHaveProperty("formatted");
		expect(body.formatted).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
		expect(body).toHaveProperty("expiresInMinutes", 10);
	});

	it("rejects missing orgId", async () => {
		const { POST } = await import("@/app/api/link/code/route");

		const request = new Request("http://localhost/api/link/code", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				userId: "user-123",
				productType: "zer",
			}),
		});

		const response = await POST(request);
		expect(response.status).toBe(400);
	});

	it("rejects invalid productType", async () => {
		const { POST } = await import("@/app/api/link/code/route");

		const request = new Request("http://localhost/api/link/code", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				orgId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
				userId: "user-123",
				productType: "invalid",
			}),
		});

		const response = await POST(request);
		expect(response.status).toBe(400);
	});

	it("rejects empty body", async () => {
		const { POST } = await import("@/app/api/link/code/route");

		const request = new Request("http://localhost/api/link/code", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: "{}",
		});

		const response = await POST(request);
		expect(response.status).toBe(400);
	});
});

describe("POST /api/link/generate (compact token)", () => {
	it("generates a compact token with valid input", async () => {
		const { POST } = await import("@/app/api/link/generate/route");

		const request = new Request("http://localhost/api/link/generate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				orgId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
				userId: "11111111-2222-3333-4444-555555555555",
				productType: "zer",
			}),
		});

		const response = await POST(request);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toHaveProperty("token");
		expect(body.token.length).toBeLessThanOrEqual(64);
		expect(body).toHaveProperty("telegramUrl");
		expect(body.telegramUrl).toContain("https://t.me/");
		expect(body).toHaveProperty("expiresInMinutes", 15);
	});

	it("rejects missing userId", async () => {
		const { POST } = await import("@/app/api/link/generate/route");

		const request = new Request("http://localhost/api/link/generate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				orgId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
				productType: "zer",
			}),
		});

		const response = await POST(request);
		expect(response.status).toBe(400);
	});

	it("rejects invalid productType", async () => {
		const { POST } = await import("@/app/api/link/generate/route");

		const request = new Request("http://localhost/api/link/generate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				orgId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
				userId: "user-123",
				productType: "invalid",
			}),
		});

		const response = await POST(request);
		expect(response.status).toBe(400);
	});
});
