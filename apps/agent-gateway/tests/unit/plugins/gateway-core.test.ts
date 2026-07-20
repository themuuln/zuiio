import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiProvider } from "@zuiio/gateway-core";
import {
	AiGateway,
	convertTablesToPlainList,
	markdownToMessengerFormat,
} from "@zuiio/gateway-core";
import { describe, expect, it, vi } from "vitest";

const mockSupabase = {} as unknown as SupabaseClient;
const baseParams = {
	system: "test",
	userMessage: "hi",
	tools: [],
	context: {
		orgId: "o1",
		userId: "u1",
		audience: "internal" as const,
		supabase: mockSupabase,
	},
};

// ─── AiGateway ──────────────────────────────────────────────────────────────

describe("AiGateway", () => {
	it("returns primary provider result on success", async () => {
		const primary: AiProvider = {
			runWithTools: vi.fn().mockResolvedValue("Hello from primary"),
		};
		const gateway = new AiGateway(primary);

		const result = await gateway.runWithTools(baseParams);

		expect(result).toBe("Hello from primary");
		expect(primary.runWithTools).toHaveBeenCalledTimes(1);
	});

	it("falls back to secondary when primary throws non-rate-limit error", async () => {
		const primary: AiProvider = {
			runWithTools: vi.fn().mockRejectedValue(new Error("Network failure")),
		};
		const fallback: AiProvider = {
			runWithTools: vi.fn().mockResolvedValue("Fallback response"),
		};
		const gateway = new AiGateway(primary, fallback);

		const result = await gateway.runWithTools(baseParams);

		expect(result).toBe("Fallback response");
		expect(fallback.runWithTools).toHaveBeenCalledTimes(1);
	});

	it("returns Mongolian rate-limit message on 429 without calling fallback", async () => {
		const primary: AiProvider = {
			runWithTools: vi
				.fn()
				.mockRejectedValue(new Error("HTTP 429 Too Many Requests")),
		};
		const fallback: AiProvider = {
			runWithTools: vi.fn(),
		};
		const gateway = new AiGateway(primary, fallback);

		const result = await gateway.runWithTools(baseParams);

		expect(result).toContain("хязгаарт");
		expect(fallback.runWithTools).not.toHaveBeenCalled();
	});

	it("re-throws when no fallback and primary fails", async () => {
		const primary: AiProvider = {
			runWithTools: vi.fn().mockRejectedValue(new Error("Fatal")),
		};
		const gateway = new AiGateway(primary);

		await expect(gateway.runWithTools(baseParams)).rejects.toThrow("Fatal");
	});

	it("detects rate-limit from quota-exceeded message", async () => {
		const primary: AiProvider = {
			runWithTools: vi.fn().mockRejectedValue(new Error("quota exceeded")),
		};
		const gateway = new AiGateway(primary);

		const result = await gateway.runWithTools(baseParams);

		expect(result).toContain("хязгаарт");
	});
});

// ─── markdownToMessengerFormat ──────────────────────────────────────────────

describe("markdownToMessengerFormat", () => {
	it("converts **bold** to *bold*", () => {
		expect(markdownToMessengerFormat("Hello **world**")).toBe("Hello *world*");
	});

	it("strips markdown links keeping text", () => {
		const result = markdownToMessengerFormat(
			"Check [this](https://example.com) out",
		);
		expect(result).toContain("Check this out");
		expect(result).not.toContain("https://");
	});

	it("strips headers", () => {
		const result = markdownToMessengerFormat("## Title\n\nBody");
		expect(result).not.toContain("##");
		expect(result).toContain("Title");
		expect(result).toContain("Body");
	});

	it("converts tables to data-row pairs (first_col: second_col)", () => {
		const table = "| Name | Value |\n| --- | --- |\n| Item | 100 |";
		const result = markdownToMessengerFormat(table);
		// Function skips header row and renders data cells as key: value
		expect(result).toContain("Item: 100");
	});

	it("handles plain text without markdown", () => {
		expect(markdownToMessengerFormat("Just text")).toBe("Just text");
	});

	it("handles empty string", () => {
		expect(markdownToMessengerFormat("")).toBe("");
	});
});

// ─── convertTablesToPlainList ───────────────────────────────────────────────

describe("convertTablesToPlainList", () => {
	it("converts 2-column table data cells to first_col: second_col", () => {
		const table =
			"| Name | Value |\n| --- | --- |\n| Item | 100 |\n| Tax | 10 |";
		const result = convertTablesToPlainList(table);
		// Header row is used only for structure; data cells are rendered as pairs
		expect(result).toContain("Item: 100");
		expect(result).toContain("Tax: 10");
	});

	it("converts 2-column cells even with wider columns", () => {
		const table = "| ID | Name |\n| --- | --- |\n| 1 | Alice |\n| 2 | Bob |";
		const result = convertTablesToPlainList(table);
		expect(result).toContain("1: Alice");
		expect(result).toContain("2: Bob");
	});

	it("returns non-table text unchanged", () => {
		expect(convertTablesToPlainList("Just text")).toBe("Just text");
	});

	it("handles empty string", () => {
		expect(convertTablesToPlainList("")).toBe("");
	});
});
