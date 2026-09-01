import { createHash } from "node:crypto";

import { capture } from "@zuiio/capture";
import { z } from "zod";
import { resolveZerBaseUrl } from "@/lib/zer-resolver";
import type { GatewayTool, ToolContext } from "@/providers/types";

const API_SECRET = "AGENT_GATEWAY_API_SECRET";
const MongolianPhoneSchema = z
	.string()
	.trim()
	.min(1)
	.max(50)
	.refine((value) => /^(976)?[89]\d{7}$/.test(value.replace(/[\s\-+]/g, "")), {
		message: "Утасны дугаар буруу байна. 8 оронтой, 8 эсвэл 9-өөр эхлэх ёстой.",
	});
const PlaceOrderSchema = z.object({
	items: z
		.array(
			z.object({
				product_id: z.string().uuid(),
				quantity: z.number().int().min(1).max(1000),
				variant_id: z.string().uuid().optional(),
			}),
		)
		.min(1)
		.max(50),
	contact_name: z.string().trim().min(1).max(500),
	contact_phone: MongolianPhoneSchema,
	contact_email: z.string().trim().max(254).optional(),
	delivery_type: z.enum(["delivery", "pickup"]).optional().default("delivery"),
	address: z.string().trim().max(500).optional(),
	address_note: z.string().trim().max(500).optional(),
	pickup_branch_slug: z.string().trim().max(100).optional(),
});

const PaymentInstructionsSchema = z
	.object({
		qpay_short_url: z.string().nullable().optional(),
		qpay_qr_text: z.string().nullable().optional(),
		qpay_qr_image: z.string().nullable().optional(),
		payment_urls: z
			.array(
				z.object({
					name: z.string(),
					link: z.string(),
					description: z.string().optional(),
					logo: z.string().optional(),
				}),
			)
			.nullable()
			.optional(),
		qpay_urls: z
			.array(
				z.object({
					name: z.string(),
					link: z.string(),
					description: z.string().optional(),
					logo: z.string().optional(),
				}),
			)
			.nullable()
			.optional(),
		urls: z
			.array(
				z.object({
					name: z.string(),
					link: z.string(),
					description: z.string().optional(),
					logo: z.string().optional(),
				}),
			)
			.nullable()
			.optional(),
	})
	.passthrough();

const ChatOrderResponseSchema = z.object({
	ok: z.boolean(),
	error: z.string().optional(),
	data: z
		.object({
			order_id: z.string().uuid(),
			total_amount: z.number(),
			status: z.string(),
			payment_instructions: PaymentInstructionsSchema.nullable().optional(),
		})
		.optional(),
});

export interface NormalizedPaymentInstructions {
	paymentLink: string | null;
	qrText: string | null;
	qrImage: string | null;
	paymentUrls: Array<{
		name: string;
		link: string;
		description?: string;
		logo?: string;
	}>;
}

export function normalizeInstructions(
	instructions: z.infer<typeof PaymentInstructionsSchema> | null | undefined,
): NormalizedPaymentInstructions {
	if (!instructions) {
		return {
			paymentLink: null,
			qrText: null,
			qrImage: null,
			paymentUrls: [],
		};
	}
	const rawUrls =
		instructions.payment_urls ??
		instructions.qpay_urls ??
		instructions.urls ??
		[];
	const paymentUrls = rawUrls.map((u) => ({
		name: u.name,
		link: u.link,
		description:
			"description" in u && typeof u.description === "string"
				? u.description
				: undefined,
		logo: "logo" in u && typeof u.logo === "string" ? u.logo : undefined,
	}));
	return {
		paymentLink: instructions.qpay_short_url ?? paymentUrls[0]?.link ?? null,
		qrText: instructions.qpay_qr_text ?? null,
		qrImage: instructions.qpay_qr_image ?? null,
		paymentUrls,
	};
}

/**
 * Customer order creation for Zer Messenger and Instagram conversations.
 * The actual order and QPay invoice are created by Zer, not by the gateway.
 */
export function createCustomerOrderTool(_context: ToolContext): GatewayTool {
	return {
		name: "placeOrderWithQpay",
		description:
			"Бараа сонгосон үед нэр, утас, хаяг (хүргэлтийн)-г нэг мессежээр бөөнөөр асуу. Жишээ: 'Нэр, утас, хаягаа бичнэ үү (ex: Temuulen 88650115 10-р хороолол)'. pickup-г хэрэглэгч өөрөө хэлсэн үед л сонго. Эцсийн зөвшөөрөл авсны дараа дууд.",
		parameters: [
			{
				name: "items",
				type: "array",
				description:
					"Барааны мөрүүдийн JSON массив: [{product_id: UUID, quantity: эерэг бүхэл тоо, variant_id?: UUID}].",
				required: true,
			},
			{
				name: "contact_name",
				type: "string",
				description: "Хүлээн авагчийн бүтэн нэр.",
				required: true,
			},
			{
				name: "contact_phone",
				type: "string",
				description: "Холбогдох утасны дугаар.",
				required: true,
			},
			{
				name: "delivery_type",
				type: "string",
				description:
					"delivery (хүргэлт, default) эсвэл pickup — заагаагүй бол delivery гэж үзэж, бүү асуу.",
				required: false,
				enum: ["delivery", "pickup"],
			},
			{
				name: "address",
				type: "string",
				description: "Хүргэлтийн дэлгэрэнгүй хаяг; delivery үед заавал.",
				required: false,
			},
			{
				name: "address_note",
				type: "string",
				description: "Хаягийн нэмэлт тэмдэглэл.",
				required: false,
			},
			{
				name: "pickup_branch_slug",
				type: "string",
				description: "Pickup салбарын slug, хэрэглэгч салбар сонгосон үед.",
				required: false,
			},
			{
				name: "contact_email",
				type: "string",
				description: "Имэйл (заавал биш).",
				required: false,
			},
		],
		execute: async (args) => {
			const parsed = PlaceOrderSchema.safeParse(args);
			if (!parsed.success) {
				return {
					error:
						"Захиалгын бараа, холбоо барих мэдээлэл дутуу эсвэл буруу байна.",
				};
			}
			const canonicalPhone = parsed.data.contact_phone
				.replace(/[^0-9]/g, "")
				.replace(/^976/, "");

			const secret = process.env[API_SECRET]?.trim();
			if (!secret) {
				return {
					error: "QPay захиалгын холболт одоогоор тохируулагдаагүй байна.",
				};
			}
			const baseUrl = await resolveZerBaseUrl(
				_context.orgId,
				_context.supabase,
			);
			if (!baseUrl) {
				return {
					error: "QPay захиалгын холболт одоогоор тохируулагдаагүй байна.",
				};
			}
			try {
				// Deterministic idempotency key so confirmation replays and retried
				// webhook deliveries don't create duplicate orders/invoices.
				const stablePayload = {
					orgId: _context.orgId,
					channel: _context.channel ?? "messenger",
					chat: _context.channelChatId ?? "",
					user: _context.channelUserId ?? _context.userId,
					args: { ...parsed.data, contact_phone: canonicalPhone },
				};
				const idempotency_key = createHash("sha256")
					.update(JSON.stringify(stablePayload))
					.digest("hex")
					.slice(0, 32);
				const response = await fetch(
					`${baseUrl}/api/internal/v1/checkout/orders`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"x-api-key": secret,
						},
						body: JSON.stringify({
							organization_id: _context.orgId,
							...parsed.data,
							contact_phone: canonicalPhone,
							idempotency_key,
						}),
						signal: AbortSignal.timeout(15_000),
					},
				);
				const payload = ChatOrderResponseSchema.safeParse(
					await response.json(),
				);
				if (!payload.success || !payload.data.ok || !payload.data.data) {
					return { error: "Захиалга үүсгэхэд алдаа гарлаа." };
				}

				const order = payload.data.data;
				const payment = normalizeInstructions(order.payment_instructions);
				if (typeof _context.supabase.from === "function") {
					const pending = {
						order_id: order.order_id,
						organization_id: _context.orgId,
						psid: _context.channelUserId ?? _context.userId,
						channel: _context.channel ?? "messenger",
						channel_chat_id:
							_context.channelChatId ??
							_context.channelUserId ??
							_context.userId,
						amount: order.total_amount,
						status: "pending",
						expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
						trace_id: _context.traceId ?? null,
						payment_urls: payment.paymentUrls,
						payment_link: payment.paymentLink,
						qr_text: payment.qrText,
						qr_image: payment.qrImage,
					};
					let { error: pendingError } = await _context.supabase
						.from("qpay_pending")
						.insert(pending);
					if (pendingError) {
						const retry = await _context.supabase
							.from("qpay_pending")
							.upsert(pending, { onConflict: "order_id" });
						pendingError = retry.error;
					}
					if (pendingError) {
						capture(pendingError, {
							context: "agent-gateway: qpay_pending insert",
							orderId: order.order_id,
						});
						return { error: "Төлбөрийн захиалгыг хадгалахад алдаа гарлаа." };
					}
				}
				return {
					order_id: order.order_id,
					total_amount: order.total_amount,
					status: order.status,
					payment_method: "qpay",
					payment_link: payment.paymentLink,
					qpay_qr_text: payment.qrText,
					qpay_qr_image: payment.qrImage,
					payment_urls: payment.paymentUrls,
					message: payment.paymentLink
						? "Захиалга үүслээ. QPay холбоосоор төлбөрөө хийнэ үү. Төлбөр баталгаажсаны дараа захиалга боловсруулагдана."
						: "Захиалга үүслээ. QPay холбоосыг бэлдэхэд түр асуудал гарлаа. Манай ажилтан тантай холбогдоно.",
				};
			} catch (error) {
				capture(error, { context: "agent-gateway: placeOrderWithQpay" });
				return { error: "Захиалга үүсгэх үйлчилгээ түр ажиллахгүй байна." };
			}
		},
	};
}
