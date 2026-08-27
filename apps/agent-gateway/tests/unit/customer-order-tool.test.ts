import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCustomerOrderTool } from "@/gateway/customer-order-tool";
import type { ToolContext } from "@/providers/types";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const context: ToolContext = {
	orgId: "11111111-1111-4111-8111-111111111111",
	userId: "sender-1",
	supabase: {} as never,
	audience: "customer",
	channel: "messenger",
	channelChatId: "page-1",
	channelUserId: "sender-1",
};

const args = {
	items: [
		{
			product_id: "22222222-2222-4222-8222-222222222222",
			quantity: 2,
		},
	],
	contact_name: "Бат",
	contact_phone: "99112233",
	delivery_type: "pickup",
};

function response(body: unknown, status = 200) {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: vi.fn(async () => body),
	};
}

describe("placeOrderWithQpay", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("ZER_APP_URL", "https://zer.example.com/");
		vi.stubEnv("AGENT_GATEWAY_API_SECRET", "shared-secret");
	});

	it("fails closed when the Zer checkout URL is not configured", async () => {
		vi.stubEnv("ZER_APP_URL", "");

		const result = await createCustomerOrderTool(context).execute(
			args,
			context,
		);

		expect(result).toEqual({
			error: "QPay захиалгын холболт одоогоор тохируулагдаагүй байна.",
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("creates a QPay order through Zer and returns the payment link", async () => {
		fetchMock.mockResolvedValue(
			response({
				ok: true,
				data: {
					order_id: "33333333-3333-4333-8333-333333333333",
					total_amount: 50000,
					status: "pending",
					payment_instructions: {
						qpay_short_url: "https://qpay.example/pay/1",
						qpay_qr_text: "qpay-qr",
					},
				},
			}),
		);

		const result = await createCustomerOrderTool(context).execute(
			args,
			context,
		);
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe("https://zer.example.com/api/internal/v1/checkout/orders");

		expect(init.method).toBe("POST");
		expect((init.headers as Record<string, string>)["x-api-key"]).toBe(
			"shared-secret",
		);
		expect(JSON.parse(String(init.body))).toMatchObject({
			organization_id: context.orgId,
			items: args.items,
			contact_name: "Бат",
			idempotency_key: expect.any(String),
		});
		expect(result).toMatchObject({
			order_id: "33333333-3333-4333-8333-333333333333",
			total_amount: 50000,
			payment_method: "qpay",
			payment_link: "https://qpay.example/pay/1",
			qpay_qr_text: "qpay-qr",
		});
	});

	it("does not expose upstream errors to customers", async () => {
		fetchMock.mockResolvedValue(
			response({ ok: false, error: "internal database details" }, 500),
		);

		const result = await createCustomerOrderTool(context).execute(
			args,
			context,
		);

		expect(result).toEqual({ error: "Захиалга үүсгэхэд алдаа гарлаа." });
	});
});
