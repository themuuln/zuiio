import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { middleware } from "@/middleware";

const AUTH_COOKIE = "ag_dash_auth";

async function sessionValue(secret: string): Promise<string> {
	const { createSessionValue } = await import("@/middleware");
	return createSessionValue(secret);
}

beforeEach(() => {
	delete process.env.DASHBOARD_SECRET;
});

function makeRequest(path: string, cookie?: string): NextRequest {
	return new NextRequest(`http://localhost${path}`, {
		headers: cookie ? { Cookie: cookie } : {},
	});
}

describe("dashboard middleware", () => {
	it("passes through login/logout routes", async () => {
		process.env.DASHBOARD_SECRET = "secret";
		const res = await middleware(makeRequest("/api/dashboard/login"));
		expect(res.status).toBe(200);
	});

	it("503s when DASHBOARD_SECRET is unset", async () => {
		const res = await middleware(makeRequest("/dashboard"));
		expect(res.status).toBe(503);
		const apiRes = await middleware(makeRequest("/api/dashboard/usage"));
		expect(apiRes.status).toBe(503);
	});

	it("redirects unauthenticated page requests to the login page", async () => {
		process.env.DASHBOARD_SECRET = "secret";
		const res = await middleware(makeRequest("/dashboard"));
		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toContain("/dashboard/login");
	});

	it("401s unauthenticated API requests", async () => {
		process.env.DASHBOARD_SECRET = "secret";
		const res = await middleware(makeRequest("/api/dashboard/usage"));
		expect(res.status).toBe(401);
	});

	it("lets requests with a valid cookie through", async () => {
		process.env.DASHBOARD_SECRET = "secret";
		const value = await sessionValue("secret");
		const res = await middleware(
			makeRequest("/dashboard", `${AUTH_COOKIE}=${value}`),
		);
		expect(res.status).toBe(200);
	});

	it("rejects a forged cookie", async () => {
		process.env.DASHBOARD_SECRET = "secret";
		const res = await middleware(
			makeRequest("/dashboard", `${AUTH_COOKIE}=forged`),
		);
		expect(res.status).toBe(307);
	});
});
