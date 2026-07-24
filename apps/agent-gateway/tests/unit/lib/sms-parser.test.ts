import { describe, expect, it, vi } from "vitest";

function makeSupabase(resolveValue: unknown) {
	const chain: Record<string, unknown> = {};
	const methods = [
		"from",
		"select",
		"eq",
		"neq",
		"gt",
		"gte",
		"lt",
		"lte",
		"in",
		"is",
		"order",
		"limit",
		"range",
		"single",
		"maybeSingle",
		"insert",
		"update",
		"delete",
	];
	for (const m of methods) {
		chain[m] = vi.fn().mockReturnValue(chain);
	}
	(chain as unknown as { then: unknown }).then = vi.fn(
		async (resolve: (v: unknown) => unknown) => resolve(resolveValue),
	);
	return chain;
}

describe("sms-parser", () => {
	describe("parseSms", () => {
		it("parses a Khan Bank SMS with amount and reference", async () => {
			const sb = makeSupabase({ data: [], error: null });

			const { parseSms } = await import("@/lib/sms-parser");

			const result = await parseSms(
				"Данснаас мөнгө шилжүүлэх: 150,000₮ Илгээгч: Болд Утга: захиалга-123",
				"khanbank",
				sb as never,
			);

			expect(result.bank).toBe("khanbank");
			expect(result.amount).toBe(150000);
			expect(result.sender_name).toBe("Болд");
			expect(result.reference).toBe("захиалга-123");
			expect(result.transaction_type).toBe("incoming");
		});

		it("parses a Golomt bank SMS", async () => {
			const sb = makeSupabase({ data: [], error: null });

			const { parseSms } = await import("@/lib/sms-parser");

			const result = await parseSms(
				"50000₮ шилжилт Илгээгч: Туяа Утга: төлбөр",
				"golomt",
				sb as never,
			);

			expect(result.bank).toBe("golomt");
			expect(result.amount).toBe(50000);
			expect(result.sender_name).toBe("Туяа");
		});

		it("matches by sender name in message content", async () => {
			const sb = makeSupabase({ data: [], error: null });

			const { parseSms } = await import("@/lib/sms-parser");

			const result = await parseSms(
				"Хаанбанк: 200,000₮ Илгээгч: Бат Утга: худалдаа",
				"unknown-sender",
				sb as never,
			);

			expect(result.bank).toBe("khanbank");
			expect(result.amount).toBe(200000);
		});

		it("handles amounts with commas", async () => {
			const sb = makeSupabase({ data: [], error: null });

			const { parseSms } = await import("@/lib/sms-parser");

			const result = await parseSms(
				"1,500,000₮ шилжилт Илгээгч: Ганбат Утга: төлбөр",
				"golomt",
				sb as never,
			);

			expect(result.amount).toBe(1500000);
		});

		it("throws when no bank pattern matches and no LLM API key", async () => {
			const sb = makeSupabase({ data: [], error: null });

			const { parseSms } = await import("@/lib/sms-parser");

			await expect(
				parseSms("Some random non-Mongolian SMS text", "unknown", sb as never),
			).rejects.toThrow("OPENAI_API_KEY");
		});
	});

	describe("storeParsedSms", () => {
		it("stores SMS and payment records, returns payment ID", async () => {
			let step = 0;
			const sb = {
				from: vi.fn().mockReturnThis(),
				insert: vi.fn().mockReturnThis(),
				select: vi.fn().mockReturnThis(),
				single: vi.fn().mockImplementation(() => {
					step++;
					if (step === 1) {
						return Promise.resolve({ data: { id: "sms-1" }, error: null });
					}
					return Promise.resolve({ data: { id: "payment-1" }, error: null });
				}),
				update: vi.fn().mockReturnThis(),
				eq: vi.fn().mockResolvedValue({ data: null, error: null }),
			};

			const { storeParsedSms } = await import("@/lib/sms-parser");

			const paymentId = await storeParsedSms(
				"org-1",
				"+97699112233",
				"Test SMS message",
				"2026-01-01T00:00:00Z",
				{
					bank: "khanbank",
					amount: 150000,
					sender_name: "Болд",
					sender_account: null,
					reference: "ref-123",
					transaction_type: "incoming",
					raw_message: "Test SMS message",
				},
				sb as never,
			);

			expect(paymentId).toBe("payment-1");
			expect(sb.from).toHaveBeenCalledWith("sms_messages");
			expect(sb.from).toHaveBeenCalledWith("sms_payments");
		});

		it("throws on SMS insert failure", async () => {
			const sb = {
				from: vi.fn().mockReturnThis(),
				insert: vi.fn().mockReturnThis(),
				select: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: null,
					error: { message: "insert failed" },
				}),
			};

			const { storeParsedSms } = await import("@/lib/sms-parser");

			await expect(
				storeParsedSms(
					"org-1",
					"sender",
					"msg",
					"2026-01-01T00:00:00Z",
					{
						bank: "test",
						amount: 100,
						sender_name: null,
						sender_account: null,
						reference: null,
						transaction_type: "incoming",
						raw_message: "msg",
					},
					sb as never,
				),
			).rejects.toThrow("store SMS");
		});
	});
});
