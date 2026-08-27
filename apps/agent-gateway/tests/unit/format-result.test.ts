import { describe, expect, it, vi } from "vitest";
import { formatWriteResult } from "@/lib/format-result";

vi.mock("server-only", () => ({}));

describe("formatWriteResult", () => {
	it("formats success results with ✅", () => {
		expect(formatWriteResult({ success: true, message: "Бүртгэгдлээ." })).toBe(
			"✅ Бүртгэгдлээ.",
		);
	});

	it("formats error results with ❌", () => {
		expect(formatWriteResult({ success: false, message: "Алдаа гарлаа" })).toBe(
			"❌ Алдаа гарлаа",
		);
	});

	it("handles plain strings", () => {
		expect(formatWriteResult("hello")).toBe("hello");
		expect(formatWriteResult("")).toBe("✅ Амжилттай.");
	});

	it("handles null/undefined", () => {
		expect(formatWriteResult(null)).toBe("✅ Амжилттай.");
		expect(formatWriteResult(undefined)).toBe("✅ Амжилттай.");
	});

	it("handles error-shaped objects", () => {
		expect(formatWriteResult({ error: "бүтсэнгүй" })).toBe("❌ бүтсэнгүй");
	});
	it("formats QPay order results with a clickable payment link", () => {
		expect(
			formatWriteResult({
				payment_method: "qpay",
				message: "Захиалга үүслээ.",
				payment_link: "https://qpay.example/pay/1",
			}),
		).toBe(
			"✅ Захиалга үүслээ.\nQPay төлбөрийн холбоос: https://qpay.example/pay/1",
		);
	});

	it("truncates long JSON", () => {
		const big = { rows: Array.from({ length: 1000 }, (_, i) => ({ i })) };
		const out = formatWriteResult(big);
		expect(out.length).toBeLessThanOrEqual(4001);
		expect(out.endsWith("…")).toBe(true);
	});

	it("stringifies scalars", () => {
		expect(formatWriteResult(42)).toBe("42");
	});
});
