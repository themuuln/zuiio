import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/qpay/open/route";

describe("/api/qpay/open", () => {
	it("returns HTML with bank deep link redirect", async () => {
		const req = new Request(
			"https://example.com/api/qpay/open?link=khanbank%3A%2F%2Fq%3FqPay_QRcode%3D123&name=%D0%A5%D0%B0%D0%B0%D0%BD%20%D0%B1%D0%B0%D0%BD%D0%BA&qpay=https%3A%2F%2Fqpay.mn%2Fq%2F123",
		);
		const res = await GET(req);
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("text/html");
		const html = await res.text();
		expect(html).toContain("khanbank://q?qPay_QRcode=123");
		expect(html).toContain("Хаан банк");
		expect(html).toContain("https://qpay.mn/q/123");
		expect(html).toContain("window.location.href");
	});

	it("redirects directly to qpay if link is missing but qpay is provided", async () => {
		const req = new Request(
			"https://example.com/api/qpay/open?qpay=https%3A%2F%2Fqpay.mn%2Fq%2F123",
		);
		const res = await GET(req);
		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toBe("https://qpay.mn/q/123");
	});

	it("rejects invalid or dangerous link schemes", async () => {
		const req = new Request(
			"https://example.com/api/qpay/open?link=javascript%3Aalert(1)",
		);
		const res = await GET(req);
		expect(res.status).toBe(400);
	});

	it("rejects request missing both link and qpay", async () => {
		const req = new Request("https://example.com/api/qpay/open");
		const res = await GET(req);
		expect(res.status).toBe(400);
	});
});
