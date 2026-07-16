import { beforeAll, describe, expect, it } from "vitest";

describe("scoreConfidence", () => {
	let scoreConfidence: typeof import("@/state/confidence").scoreConfidence;

	beforeAll(async () => {
		const mod = await import("@/state/confidence");
		scoreConfidence = mod.scoreConfidence;
	});

	it("returns high confidence for successful tool with verified data", () => {
		const result = scoreConfidence({
			toolName: "getSalesSummary",
			toolResult: { totalAmount: 500000, saleCount: 12 },
			dataCompleteness: "full",
		});
		expect(result.level).toBe("high");
		expect(result.score).toBeGreaterThanOrEqual(0.8);
		expect(result.shouldEscalate).toBe(false);
		expect(result.displayPrefix).toBe("");
	});

	it("returns high confidence for getTodaySales", () => {
		const result = scoreConfidence({
			toolName: "getTodaySales",
			toolResult: { totalAmount: 100000 },
			dataCompleteness: "full",
		});
		expect(result.level).toBe("high");
		expect(result.shouldEscalate).toBe(false);
	});

	it("returns medium confidence for partial data", () => {
		const result = scoreConfidence({
			toolName: "getCustomerHistory",
			toolResult: { message: "Харилцагч олдсонгүй" },
			dataCompleteness: "empty",
		});
		expect(result.level).toBe("medium");
		expect(result.score).toBeGreaterThanOrEqual(0.6);
		expect(result.shouldEscalate).toBe(false);
		expect(result.displayPrefix).toContain("баталгаажаагүй");
	});

	it("returns medium confidence and warns for error results", () => {
		const result = scoreConfidence({
			toolName: "getPendingSales",
			toolResult: { error: "Борлуулалтын хураангуй авахад алдаа гарлаа" },
		});
		expect(result.level).toBe("medium");
		expect(result.shouldEscalate).toBe(false);
		expect(result.reasoning).toContain("Үр дүн байгаа эсэх");
	});

	it("detects hallucination indicators in LLM response", () => {
		const result = scoreConfidence({
			toolName: "getSalesSummary",
			toolResult: { totalAmount: 500000 },
			llmResponse: "Таны борлуулалт ойролцоогоор 500,000₮ байна. Магадгүй таамаглаж байна.",
			hallucinationIndicators: ["ойролцоогоор", "магадгүй"],
		});
		expect(result.level).toBe("medium");
		expect(result.reasoning).toContain("Хиймэл мэдээллийн шинж илэрсэн");
	});

	it("returns high confidence for empty array — valid result, not error", () => {
		const result = scoreConfidence({
			toolName: "getCustomerHistory",
			toolResult: [],
		});
		expect(result.level).toBe("high");
		expect(result.score).toBe(1.0);
	});

	it("uses tool-specific confidence for high-confidence tools", () => {
		const result = scoreConfidence({
			toolName: "getSalesSummary",
			toolResult: { totalAmount: 100 },
			dataCompleteness: "full",
		});
		expect(result.reasoning).toContain("Багажийн найдвартай байдал");
	});

	it("rounds score to 2 decimal places", () => {
		const result = scoreConfidence({
			toolName: "getSalesSummary",
			toolResult: { totalAmount: 500 },
			dataCompleteness: "full",
		});
		expect(String(result.score).split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2);
	});

	it("returns medium confidence for unknown tool name", () => {
		const result = scoreConfidence({
			toolName: "unknownTool",
			toolResult: { some: "data" },
		});
		expect(result.level).toBe("medium");
		expect(result.score).toBeCloseTo(0.73, 1);
	});
});
