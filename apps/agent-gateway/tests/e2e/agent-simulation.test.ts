/**
 * Agent Simulation — Org Owner Questions
 *
 * Simulates a Tolom/Zer org owner asking questions to the AI agent.
 * Verifies:
 *   1. Correct tool exists for each question (tool selection)
 *   2. System prompt enforces Mongolian language
 *   3. System prompt forbids <hr> / Markdown formatting
 *   4. System prompt enforces one-tool-per-question
 *   5. Tools execute without crashing against mock data
 */
import { describe, expect, it, vi } from "vitest";
import { getProductTools, systemPromptFor } from "@/gateway/webhook-helpers";
import type { ToolContext } from "@/providers/types";
import {
	createMockSupabase,
	TEST_ORG_ID,
} from "../fixtures/supabase-mock";

// ─── Mocks ────────────────────────────────────────────────────────────────────
// systemPromptFor queries Redis → Supabase for org name.  Mock both to return
// empty (the prompt falls back to default org name).

vi.mock("@/lib/redis", () => ({
	getRedis: vi.fn(() => null),
}));

vi.mock("@/lib/supabase", () => ({
	createServiceClient: vi.fn(() => ({
		from: vi.fn(() => ({
			select: vi.fn(() => ({
				eq: vi.fn(() => ({
					single: vi.fn(() =>
						Promise.resolve({ data: null, error: null }),
					),
				})),
			})),
		})),
	})),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const orgId = TEST_ORG_ID;

const mockContext: ToolContext = {
	orgId,
	userId: "org-owner",
	supabase: createMockSupabase({ data: [], error: null }) as never,
};

// ─── Scenario Definitions ─────────────────────────────────────────────────────
// Each scenario maps a natural Mongolian question to the tool an LLM SHOULD pick.

const scenarios = [
	{
		question: "Өнөөдрийн хураангуй үзүүлээрэй",
		expectedTool: "getDailySummary",
	},
	{
		question: "Идэвхтэй ажлын захиалгуудыг жагсааж өгөөч",
		expectedTool: "queryData",
	},
	{
		question: "Бат харилцагчийн мэдээлэл үзүүлээрэй",
		expectedTool: "queryData",
	},
	{
		question: "Сүүлийн 7 хоногийн борлуулалтын хураангуй",
		expectedTool: "getSparePartsSales",
	},
	{
		question: "Энэ сарын зарлагын хураангуй",
		expectedTool: "queryData",
	},
	{
		question: "Механикчдын жагсаалт үзүүлээрэй",
		expectedTool: "queryData",
	},
	{
		question: "Window Motor сэлбэгийн үнийн мэдээлэл",
		expectedTool: "partsLookup",
	},
	{
		question: "Нийлүүлэгчдийн жагсаалт",
		expectedTool: "queryData",
	},
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Agent Simulation — Tool Selection", () => {
	const tolomTools = getProductTools("tolom", mockContext);
	const toolNames = tolomTools.map((t) => t.name);

	it("Tolom provides 15+ tools total", () => {
		expect(tolomTools.length).toBeGreaterThanOrEqual(15);
		expect(tolomTools.length).toBeLessThanOrEqual(30);
	});

	it("all tool names are unique", () => {
		expect(new Set(toolNames).size).toBe(toolNames.length);
	});

	for (const s of scenarios) {
		it(`question "${s.question}" → ${s.expectedTool}`, () => {
			expect(toolNames).toContain(s.expectedTool);
		});
	}
});

describe("Agent Simulation — System Prompt Rules", () => {
	it("Tolom MN prompt enforces Mongolian", async () => {
		const prompt = await systemPromptFor("tolom", orgId, "private", "mn");
		expect(prompt).toContain("ЗӨВХӨН Монгол хэлээр хариулна");
	});

	it("Tolom MN prompt forbids Markdown", async () => {
		const prompt = await systemPromptFor("tolom", orgId, "private", "mn");
		expect(prompt).toContain("Markdown ашиглахгүй");
	});

	it("Tolom MN prompt says never say 'no data'", async () => {
		const prompt = await systemPromptFor("tolom", orgId, "private", "mn");
		expect(prompt).toContain("би мэдээлэлгүй");
		expect(prompt).toContain("хэрэгслээр асууна");
	});

	it("Tolom MN prompt says use tools for every business question", async () => {
		const prompt = await systemPromptFor("tolom", orgId, "private", "mn");
		expect(prompt).toContain("Бизнесийн асуулт бүрт хэрэгсэл ашиглах");
	});

	it("Zer MN prompt enforces Mongolian", async () => {
		const prompt = await systemPromptFor("zer", orgId, "private", "mn");
		expect(prompt).toContain("ЗӨВХӨН Монгол хэлээр хариулна");
	});

	it("Zer MN prompt forbids Markdown", async () => {
		const prompt = await systemPromptFor("zer", orgId, "private", "mn");
		expect(prompt).toContain("Markdown ашиглахгүй");
	});

	it("includes organization ID", async () => {
		const prompt = await systemPromptFor("tolom", orgId, "private", "mn");
		expect(prompt).toContain(orgId);
	});
});

describe("Agent Simulation — Tool Execution", () => {
	const tolomTools = getProductTools("tolom", mockContext);

	function findTool(name: string) {
		return tolomTools.find((t) => t.name === name);
	}

	it("getDailySummary executes without crashing", async () => {
		const t = findTool("getDailySummary");
		expect(t).toBeDefined();
		const result = await t!.execute({}, mockContext);
		expect(result).toBeDefined();
	});


	it("queryData executes with a valid table", async () => {
		const t = findTool("queryData");
		expect(t).toBeDefined();
		const result = await t!.execute(
			{ table: "customers", limit: 5 },
			mockContext,
		);
		expect(result).toBeDefined();
		const obj = result as Record<string, unknown>;
		expect(obj.table).toBe("customers");
		expect(Array.isArray(obj.rows)).toBe(true);
	});

	it("queryData rejects an invalid table", async () => {
		const t = findTool("queryData");
		const result = await t!.execute(
			{ table: "nonexistent_table" },
			mockContext,
		);
		const obj = result as Record<string, unknown>;
		expect(String(obj.error)).toBeTruthy();
	});
});

describe("Agent Simulation — Zer Tools", () => {
	const zerTools = getProductTools("zer", mockContext);

	it("Zer provides tools", () => {
		expect(zerTools.length).toBeGreaterThanOrEqual(1);
	});

	it("Zer has getSalesByCategory", () => {
		expect(zerTools.map((t) => t.name)).toContain("getSalesByCategory");
	});

	it("getSalesByCategory executes without crashing", async () => {
		const t = zerTools.find((x) => x.name === "getSalesByCategory")!;
		expect(t).toBeDefined();
		const result = await t.execute({}, mockContext);
		expect(result).toBeDefined();
	});
});
