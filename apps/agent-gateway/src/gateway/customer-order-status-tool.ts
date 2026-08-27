import "server-only";

import { capture } from "@zuiio/capture";
import type { GatewayTool, ToolContext } from "@/providers/types";
import { resolveZerBaseUrl } from "@/lib/zer-resolver";

/**
 * Customer order status lookup for Zer Messenger/Instagram.
 * Read-only, org-scoped, fail-closed.
 */
export function createCustomerOrderStatusTool(context: ToolContext): GatewayTool {
	const { supabase, orgId } = context;
	return {
		name: "getMyOrders",
		description:
			"Харилцагчийн өөрийн захиалгын төлөв шалгах — суваг (Messenger PSID) эсвэл утасны дугаараар. Хамгийн сүүлийн 5 захиалга буцаана. Жишээ: getMyOrders({}) эсвэл getMyOrders({ phone: \"99119911\" }).",
		parameters: [
			{ name: "phone", type: "string", description: "Утасны дугаар.", required: false },
			{ name: "limit", type: "number", description: "Буцаах тоо (1-5, анхдагч 5).", required: false },
		],
		execute: async (args) => {
			const phone = typeof args.phone === "string" ? args.phone.trim() : "";
			const limit = typeof args.limit === "number" && Number.isFinite(args.limit) ? Math.min(Math.max(Math.floor(args.limit), 1), 5) : 5;
			try {
				const secret = process.env.AGENT_GATEWAY_API_SECRET?.trim();
				const baseUrl = await resolveZerBaseUrl(orgId, supabase);
				if (secret && baseUrl) {
					const url = new URL(`${baseUrl}/api/internal/v1/checkout/orders`);
					url.searchParams.set("organization_id", orgId);
					if (phone) url.searchParams.set("contact_phone", phone);
					if (context.channelUserId) url.searchParams.set("channel_user_id", context.channelUserId);
					url.searchParams.set("limit", String(limit));
					const res = await fetch(url.toString(), { headers: { "x-api-key": secret }, signal: AbortSignal.timeout(8000) });
					if (res.ok) {
						const json = (await res.json()) as unknown;
						if (json && typeof json === "object" && "data" in json) {
							const data = (json as { data: unknown }).data;
							if (Array.isArray(data) && data.length > 0) return { orders: data.slice(0, limit) };
						}
						if (Array.isArray(json) && json.length > 0) return { orders: (json as unknown[]).slice(0, limit) };
					}
				}
			} catch (err) {
				capture(err, { context: "agent-gateway: getMyOrders http" });
			}
			try {
				let query = supabase.from("orders").select("id, total_amount, status, contact_name, contact_phone, delivery_type, created_at").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(limit);
				if (context.channelUserId) query = query.eq("channel_user_id", context.channelUserId);
				else if (phone) query = query.eq("contact_phone", phone);
				else return { orders: [], message: "Захиалга олдсонгүй. Утасны дугаараа хэлнэ үү?" };
				const { data, error } = await query;
				if (!error && data && data.length > 0) return { orders: data };
				if (phone && context.channelUserId) {
					const { data: phoneData, error: phoneErr } = await supabase.from("orders").select("id, total_amount, status, contact_name, contact_phone, delivery_type, created_at").eq("organization_id", orgId).eq("contact_phone", phone).order("created_at", { ascending: false }).limit(limit);
					if (!phoneErr && phoneData) return { orders: phoneData };
				}
				if (error) return { orders: [], message: "Захиалга олдсонгүй." };
				return { orders: data ?? [] };
			} catch (err) {
				capture(err, { context: "agent-gateway: getMyOrders supabase" });
				return { error: "Захиалга шалгахад алдаа гарлаа." };
			}
		},
	};
}
