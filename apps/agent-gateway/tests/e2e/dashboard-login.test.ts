/**
 * Dashboard login/logout route tests.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

beforeEach(() => {
	delete process.env.DASHBOARD_SECRET;
});

function makeRequest(body: unknown): Request {
	return new Request("http://localhost/api/dashboard/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("POST /api/dashboard/login", () => {
	it("sets an HttpOnly auth cookie with the right password", async () => {
		process.env.DASHBOARD_SECRET = "dash-secret";
		const { POST } = await import("@/app/api/dashboard/login/route");
		const res = await POST(makeRequest({ password: "dash-secret" }));
		expect(res.status).toBe(200);
		const cookies = res.headers.getSetCookie();
		expect(cookies.some((c) => c.startsWith("ag_dash_auth="))).toBe(true);
		expect(cookies.some((c) => c.includes("HttpOnly"))).toBe(true);
	});

	it("rejects a wrong password", async () => {
		process.env.DASHBOARD_SECRET = "dash-secret";
		const { POST } = await import("@/app/api/dashboard/login/route");
		const res = await POST(makeRequest({ password: "wrong" }));
		expect(res.status).toBe(401);
	});

	it("503s when DASHBOARD_SECRET is unset", async () => {
		const { POST } = await import("@/app/api/dashboard/login/route");
		const res = await POST(makeRequest({ password: "x" }));
		expect(res.status).toBe(503);
	});

	it("rate-limits repeated failures", async () => {
		process.env.DASHBOARD_SECRET = "dash-secret";
		const { POST } = await import("@/app/api/dashboard/login/route");
		for (let i = 0; i < 5; i++) {
			await POST(makeRequest({ password: "wrong" }));
		}
		const res = await POST(makeRequest({ password: "dash-secret" }));
		expect(res.status).toBe(429);
	});
});

describe("POST /api/dashboard/logout", () => {
	it("clears the auth cookie", async () => {
		const { POST } = await import("@/app/api/dashboard/logout/route");
		const res = await POST(
			new Request("http://localhost/api/dashboard/logout", {
				method: "POST",
			}),
		);
		expect(res.status).toBe(200);
		const cookies = res.headers.getSetCookie();
		expect(
			cookies.some(
				(c) => c.startsWith("ag_dash_auth=;") && c.includes("Max-Age=0"),
			),
		).toBe(true);
	});
});
