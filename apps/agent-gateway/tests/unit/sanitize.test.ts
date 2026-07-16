import { describe, expect, it } from "vitest";
import {
	sanitizeUserInput,
	sanitizeDisplayName,
	sanitizeDbError,
	truncateResult,
} from "@/lib/sanitize";

describe("sanitizeUserInput", () => {
	it("strips control characters", () => {
		const result = sanitizeUserInput("hello\x00world\x1Ftest");
		expect(result).toBe("helloworldtest");
	});

	it("trims whitespace", () => {
		expect(sanitizeUserInput("  hello world  ")).toBe("hello world");
	});

	it("caps length at 2000 characters", () => {
		const long = "a".repeat(3000);
		const result = sanitizeUserInput(long);
		expect(result.length).toBe(2000);
	});

	it("preserves normal text", () => {
		expect(sanitizeUserInput("Today sales summary?")).toBe(
			"Today sales summary?",
		);
	});

	it("preserves Mongolian characters", () => {
		const mongolian = "Өнөөдрийн борлуулалт хэд вэ?";
		expect(sanitizeUserInput(mongolian)).toBe(mongolian);
	});

	it("handles empty input", () => {
		expect(sanitizeUserInput("")).toBe("");
	});

	it("handles only-whitespace input", () => {
		expect(sanitizeUserInput("   ")).toBe("");
	});
});

describe("sanitizeDisplayName", () => {
	it("strips bracket characters that could contain prompt instructions", () => {
		expect(
			sanitizeDisplayName('John "DROP TABLE" Smith <script>alert(1)</script>'),
		).toBe("John DROP TABLE Smith scriptalert1/script");
	});

	it("trims whitespace", () => {
		expect(sanitizeDisplayName("  John  ")).toBe("John");
	});

	it("caps length at 100 characters", () => {
		const long = "a".repeat(150);
		expect(sanitizeDisplayName(long).length).toBe(100);
	});

	it("preserves normal names", () => {
		expect(sanitizeDisplayName("Бат-Эрдэнэ")).toBe("Бат-Эрдэнэ");
	});
});

describe("sanitizeDbError", () => {
	it("always returns generic Mongolian error message", () => {
		const sqlError = new Error('column "secret_column" does not exist');
		expect(sanitizeDbError(sqlError)).toBe(
			"Би тэр өгөгдлийг олж чадсангүй. Өөр үг хэллэгээр асууна уу.",
		);
	});

	it("does not expose schema details in the message", () => {
		const pgError = {
			message: 'relation "users" does not exist',
			code: "42P01",
		};
		const result = sanitizeDbError(pgError);
		expect(result).not.toContain("users");
		expect(result).not.toContain("42P01");
	});
});

describe("truncateResult", () => {
	it("returns result as-is when under the limit", () => {
		const short = "hello world";
		expect(truncateResult(short)).toBe(short);
	});

	it("truncates when over the limit with Mongolian message", () => {
		const long = "x".repeat(10_000);
		const result = truncateResult(long, 500);
		// 500 tokens * 4 chars = 2000 max
		expect(result.length).toBeLessThanOrEqual(2100);
		expect(result).toContain("үр дүн хэтэрхий урт");
	});

	it("uses default max of 2048 tokens", () => {
		const long = "x".repeat(50_000);
		const result = truncateResult(long);
		// 2048 * 4 = 8192 chars max
		expect(result.length).toBeLessThanOrEqual(8300);
	});
});
