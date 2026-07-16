import { describe, expect, it } from "vitest";
import { sanitizeErrorMessage } from "@/lib/sanitize";

describe("sanitizeErrorMessage", () => {
	it("returns generic message for non-Error values", () => {
		expect(sanitizeErrorMessage("something")).toBe("Алдаа гарлаа. Дахин оролдоно уу.");
		expect(sanitizeErrorMessage(null)).toBe("Алдаа гарлаа. Дахин оролдоно уу.");
		expect(sanitizeErrorMessage(undefined)).toBe("Алдаа гарлаа. Дахин оролдоно уу.");
		expect(sanitizeErrorMessage(42)).toBe("Алдаа гарлаа. Дахин оролдоно уу.");
	});

	it("strips file paths with line numbers", () => {
		const err = new Error("Error at /Users/test/src/file.ts:42:10");
		const result = sanitizeErrorMessage(err);
		expect(result).not.toContain("/Users/test/src/file.ts:42");
		expect(result).toContain("[internal]");
	});

	it("strips stack traces", () => {
		const err = new Error("fail");
		err.stack = "Error: fail\n    at Function.run (/app/src/index.ts:10:5)";
		const result = sanitizeErrorMessage(err);
		expect(result).not.toContain("at Function.run");
	});

	it("redacts secrets", () => {
		const err = new Error("password=secret123 token=abc");
		const result = sanitizeErrorMessage(err);
		expect(result).not.toContain("secret123");
		expect(result).not.toContain("abc");
		expect(result).toContain("[redacted]");
	});

	it("caps length at 200 characters", () => {
		const err = new Error("A".repeat(500));
		const result = sanitizeErrorMessage(err);
		expect(result.length).toBeLessThanOrEqual(200);
	});

	it("returns generic message when stripped content is empty", () => {
		const err = new Error("   ");
		const result = sanitizeErrorMessage(err);
		expect(result).toBe("Алдаа гарлаа. Дахин оролдоно уу.");
	});

	it("preserves useful error messages", () => {
		const err = new Error("Буруу нэр тэмдэглэл");
		const result = sanitizeErrorMessage(err);
		expect(result).toContain("Буруу нэр тэмдэглэл");
	});
});
