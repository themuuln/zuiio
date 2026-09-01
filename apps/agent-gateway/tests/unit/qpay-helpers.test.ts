import { describe, expect, it } from "vitest";
import {
	buildQpayBankQuickReplies,
	formatBankPaymentMessage,
	resolveBankDeeplink,
} from "@/gateway/qpay-helpers";

describe("qpay-helpers", () => {
	describe("resolveBankDeeplink", () => {
		const sampleUrls = [
			{
				name: "Хаан банк",
				link: "khanbank://q?qPay_QRcode=000201",
				description: "Khan bank",
			},
			{
				name: "Хас банк",
				link: "xacbank://q?qPay_QRcode=000201",
				description: "Xac bank",
			},
		];

		it("matches bank by name from payment_urls", () => {
			const res = resolveBankDeeplink("Хаан банк", sampleUrls);
			expect(res).not.toBeNull();
			expect(res?.name).toBe("Хаан банк");
			expect(res?.link).toBe("khanbank://q?qPay_QRcode=000201");
		});

		it("matches bank case-insensitively or partially", () => {
			const res = resolveBankDeeplink("хас", sampleUrls);
			expect(res).not.toBeNull();
			expect(res?.name).toBe("Хас банк");
			expect(res?.link).toBe("xacbank://q?qPay_QRcode=000201");
		});

		it("generates standard deeplink from qrText if payment_urls is empty", () => {
			const res = resolveBankDeeplink("khan", [], "00020112345");
			expect(res).not.toBeNull();
			expect(res?.name).toBe("Хаан банк");
			expect(res?.link).toContain("khanbank://q?qPay_QRcode=");
			expect(res?.link).toContain(encodeURIComponent("00020112345"));
		});

		it("generates Golomt bank deeplink from qrText", () => {
			const res = resolveBankDeeplink("голомт", null, "00020112345");
			expect(res).not.toBeNull();
			expect(res?.name).toBe("Голомт банк");
			expect(res?.link).toContain("golomtbank://q?qPay_QRcode=");
		});
	});

	describe("buildQpayBankQuickReplies", () => {
		it("builds quick replies from paymentUrls", () => {
			const urls = [
				{ name: "Хаан банк", link: "khanbank://..." },
				{ name: "Хас банк", link: "xacbank://..." },
				{ name: "Голомт банк", link: "golomtbank://..." },
			];
			const replies = buildQpayBankQuickReplies("order-123", urls);
			expect(replies.length).toBe(5); // 3 banks + QPay link + order_status
			expect(replies[0]?.text).toContain("Хаан банк");
			expect(replies[0]?.callbackData).toBe(
				"QPAY_BANK:%D0%A5%D0%B0%D0%B0%D0%BD%20%D0%B1%D0%B0%D0%BD%D0%BA:order-123",
			);
			expect(replies[3]?.text).toBe("🔗 QPay линк");
			expect(replies[3]?.callbackData).toBe("QPAY_LINK:order-123");
			expect(replies[4]?.text).toBe("📦 Захиалга шалгах");
			expect(replies[4]?.callbackData).toBe("order_status");
		});

		it("falls back to common banks when paymentUrls is empty but qrText exists", () => {
			const replies = buildQpayBankQuickReplies("order-456", [], "QR123");
			expect(replies.length).toBeGreaterThan(3);
			expect(replies.some((r) => r.text.includes("Хаан банк"))).toBe(true);
			expect(replies.some((r) => r.text.includes("Хас банк"))).toBe(true);
			expect(replies.some((r) => r.text.includes("QPay линк"))).toBe(true);
		});
	});

	describe("formatBankPaymentMessage", () => {
		it("formats message with deeplink and payment link", () => {
			const msg = formatBankPaymentMessage({
				bankName: "Хаан банк",
				deeplink: "khanbank://q?qPay_QRcode=123",
				paymentLink: "https://qpay.mn/q/123",
			});
			expect(msg).toContain("Хаан банк");
			expect(msg).toContain("khanbank://q?qPay_QRcode=123");
			expect(msg).toContain("https://qpay.mn/q/123");
		});
	});
});
