/**
 * Manual agent test — simulates real user interactions.
 * Run: npx vitest run tests/e2e/manual-agent-test.ts
 * (Cannot use tsx due to Next.js server-only imports)
 */
import { describe, expect, it, vi } from "vitest";
import {
	getProductTools,
	systemPromptFor,
} from "../../src/gateway/webhook-helpers";
import type { ToolContext } from "../../src/providers/types";
import { createMockSupabase, TEST_ORG_ID } from "../fixtures/supabase-mock";

// Mock external deps
vi.mock("../../src/lib/redis", () => ({
	getRedis: vi.fn(() => null),
}));
vi.mock("../../src/lib/supabase", () => ({
	createServiceClient: vi.fn(() => ({
		from: vi.fn(() => ({
			select: vi.fn(() => ({
				eq: vi.fn(() => ({
					single: vi.fn(() => Promise.resolve({ data: null, error: null })),
				})),
			})),
		})),
	})),
}));

const orgId = process.env.TEST_ORG_ID || TEST_ORG_ID;

const mockContext: ToolContext = {
	orgId,
	userId: "manual-test-user",
	supabase: createMockSupabase({ data: [], error: null }) as never,
};

describe("Manual Agent Test — System Prompt", () => {
	it("Tolom MN: Mongolian enforced", async () => {
		const prompt = await systemPromptFor("tolom", orgId, "private", "mn");
		expect(prompt).toContain("ЗӨВХӨН Монгол хэлээр хариулна");
	});

	it("Tolom MN: Markdown forbidden", async () => {
		const prompt = await systemPromptFor("tolom", orgId, "private", "mn");
		expect(prompt).toContain("Markdown ашиглахгүй");
	});

	it("Tolom MN: never say no data", async () => {
		const prompt = await systemPromptFor("tolom", orgId, "private", "mn");
		expect(prompt).toContain("би мэдээлэлгүй");
	});

	it("Zer MN: Mongolian enforced", async () => {
		const prompt = await systemPromptFor("zer", orgId, "private", "mn");
		expect(prompt).toContain("ЗӨВХӨН Монгол хэлээр хариулна");
	});
});

describe("Manual Agent Test — Tool Counts", () => {
	it("Tolom has read tools + writeData", () => {
		const tools = getProductTools("tolom", mockContext);
		expect(tools.length).toBeGreaterThanOrEqual(8);
		expect(tools.map((t) => t.name)).toContain("writeData");
	});

	it("Zer has 2+ tools", () => {
		expect(getProductTools("zer", mockContext).length).toBeGreaterThanOrEqual(
			2,
		);
	});
});

describe("Manual Agent Test — Tool Execution", () => {
	const tolomTools = getProductTools("tolom", mockContext);

	it("getDailySummary executes", async () => {
		const t = tolomTools.find((x) => x.name === "getDailySummary")!;
		expect(await t.execute({}, mockContext)).toBeDefined();
	});

	it("partsLookup executes", async () => {
		const t = tolomTools.find((x) => x.name === "partsLookup")!;
		expect(await t.execute({ query: "test" }, mockContext)).toBeDefined();
	});
});
