import { beforeEach, describe, expect, it, vi } from "vitest";
import { isGatewayApiKeyValid } from "@/lib/api-auth";

vi.mock("server-only", () => ({}));

const SECRET = "test-secret-123";

function makeRequest(apiKey?: string): Request {
	return new Request("http://localhost/api/link/generate", {
		method: "POST",
		headers: apiKey ? { "x-api-key": apiKey } : {},
	});
}

beforeEach(() => {
	delete process.env.AGENT_GATEWAY_API_SECRET;
});

describe("isGatewayApiKeyValid", () => {
	it("accepts the configured key", () => {
		process.env.AGENT_GATEWAY_API_SECRET = SECRET;
		expect(isGatewayApiKeyValid(makeRequest(SECRET))).toBe(true);
	});

	it("rejects a wrong key", () => {
		process.env.AGENT_GATEWAY_API_SECRET = SECRET;
		expect(isGatewayApiKeyValid(makeRequest("wrong"))).toBe(false);
	});

	it("rejects a missing key", () => {
		process.env.AGENT_GATEWAY_API_SECRET = SECRET;
		expect(isGatewayApiKeyValid(makeRequest())).toBe(false);
	});

	it("fails closed when the env secret is unset", () => {
		expect(isGatewayApiKeyValid(makeRequest(SECRET))).toBe(false);
	});
});
