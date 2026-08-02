/**
 * Debug logger gating + root health webhook.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockEnv = vi.fn();
vi.mock("@/lib/env", () => ({
	env: (...a: unknown[]) => mockEnv(...a),
}));

describe("debug logger", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		vi.spyOn(console, "log").mockImplementation(() => {});
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("logs nothing when DEBUG is not enabled", async () => {
		mockEnv.mockReturnValue("false");
		const { debug } = await import("@/lib/debug");
		debug("agent", "hello", { chatId: 1 });
		expect(console.log).not.toHaveBeenCalled();
	});

	it("logs structured lines when DEBUG=true", async () => {
		mockEnv.mockReturnValue("true");
		const { debug } = await import("@/lib/debug");
		debug("agent", "processing", { chatId: 42 });
		expect(console.log).toHaveBeenCalledTimes(1);
		const line = (console.log as ReturnType<typeof vi.fn>).mock
			.calls[0]?.[0] as string;
		expect(line).toContain("[DEBUG:");
		expect(line).toContain("[agent]");
		expect(line).toContain("processing");
		expect(line).toContain("chatId=42");
	});

	it("omits the data section when no data is passed", async () => {
		mockEnv.mockReturnValue("true");
		const { debug } = await import("@/lib/debug");
		debug("cron", "done");
		const line = (console.log as ReturnType<typeof vi.fn>).mock
			.calls[0]?.[0] as string;
		expect(line.endsWith("[cron] done")).toBe(true);
	});
});

describe("GET /api/webhook (root health)", () => {
	it("returns 200 with service identity", async () => {
		const { GET } = await import("@/app/api/webhook/route");
		const res = await GET();
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.status).toBe("ok");
		expect(body.service).toBe("agent-gateway");
		expect(typeof body.timestamp).toBe("string");
	});
});
