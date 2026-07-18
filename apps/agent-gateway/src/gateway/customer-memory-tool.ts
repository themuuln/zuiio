import { capture } from "@zuiio/capture";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GatewayTool } from "@/providers/types";
import {
	formatCustomerMemory,
	recallCustomerFacts,
	rememberCustomerFact,
} from "@/state/customer-memory";

type Ctx = {
	orgId: string;
	supabase: SupabaseClient;
};

/**
 * Resolve a customer id from a phone number within the org.
 * Returns null when not found (caller decides how to handle).
 */
async function resolveCustomerIdByPhone(
	ctx: Ctx,
	phone: string,
): Promise<string | null> {
	const { data } = await ctx.supabase
		.from("customers")
		.select("id")
		.eq("organization_id", ctx.orgId)
		.eq("phone", phone)
		.is("deleted_at", null)
		.limit(1);
	if (data && data.length > 0) {
		return (data[0] as { id: string }).id;
	}
	return null;
}

/**
 * Customer memory tools (recall + remember).
 *
 * @/state/customer-memory was built but never wired into the agent loop. The
 * agent resolves a customerId itself (via readData on "customers"), so we
 * expose recall/remember as tools the LLM calls once it has that id — the same
 * pattern as readData. This lets the agent surface durable, cross-session facts
 * ("call me Bob", "prefers SMS") and accumulate new ones.
 */
export function createCustomerMemoryTools(context: Ctx): GatewayTool[] {
	const recallTool: GatewayTool = {
		name: "recallCustomerMemory",
		description:
			"Харилцагчийн өмнөх харилцааны түүх, таамаглал, дуртай зүйл зэрэг хадгалагдсан мэдээллийг авах. Харилцагчийн ID-г readData-ээр олсны дараа дуудна. Хэрэглэгчийн ID эсвэл утасны дугаараар ажиллана.",
		parameters: [
			{
				name: "customerId",
				type: "string",
				description: "Харилцагчийн ID (readData-ээс олдог)",
				required: false,
			},
			{
				name: "phone",
				type: "string",
				description: "Утасны дугаар (ID байхгүй үед хайлт хийнэ)",
				required: false,
			},
		],
		execute: async (args: Record<string, unknown>) => {
			try {
				let customerId = (args.customerId as string) || undefined;
				if (!customerId && args.phone) {
					customerId =
						(await resolveCustomerIdByPhone(
							context,
							args.phone as string,
						)) ?? undefined;
				}
				if (!customerId) {
					return {
						found: false,
						message: "Харилцагч олдсонгүй. ID эсвэл утас оруулна уу.",
					};
				}
				const facts = await recallCustomerFacts(
					context.supabase,
					context.orgId,
					customerId,
				);
				if (facts.length === 0) {
					return { found: false, message: "Энэ харилцагчийн түүх байхгүй байна." };
				}
				const { data: cust } = await context.supabase
					.from("customers")
					.select("full_name")
					.eq("organization_id", context.orgId)
					.eq("id", customerId)
					.limit(1);
				const name =
					(cust && cust.length > 0
						? (cust[0] as { full_name?: string }).full_name
						: undefined) ?? "Харилцагч";
				return { found: true, memory: formatCustomerMemory(name, facts) };
			} catch (err) {
				capture(err, { context: "agent-gateway: recallCustomerMemory" });
				return { error: "Харилцагчийн түүх авахад алдаа гарлаа" };
			}
		},
	};

	const rememberTool: GatewayTool = {
		name: "rememberCustomerFact",
		description:
			"Харилцагчийн тухай шинэ, бат бөх мэдээллийг хадгалах (жишээ нь: 'Боб гэж хайхар', 'SMS-ээр холбогдохыг илүүд үздэг', 'засварын төлбөрийг бэлнээр тооцооздог'). Хэрэглэгч шууд хэлсэн эсвэл мэдэгдсэн байнгын шинж чанарыг л хадгал. Нэг удаагийн хүсэлт, нууц мэдээлэл (картын дугаар гэх мэт) БҮҮ хадгал.",
		parameters: [
			{
				name: "customerId",
				type: "string",
				description: "Харилцагчийн ID (readData-ээс олдог)",
				required: false,
			},
			{
				name: "phone",
				type: "string",
				description: "Утасны дугаар (ID байхгүй үед хайлт хийнэ)",
				required: false,
			},
			{
				name: "factType",
				type: "string",
				description:
					"Фактын төрөл: 'preference' | 'contact' | 'note' | 'vehicle' | 'history' | 'general'",
				required: false,
			},
			{
				name: "fact",
				type: "string",
				description: "Хадгалах мэдээлэл (тодорхой, богино)",
				required: true,
			},
		],
		execute: async (args: Record<string, unknown>) => {
			try {
				if (!args.fact || String(args.fact).trim().length === 0) {
					return { error: "fact хоосон байж болохгүй" };
				}
				let customerId = (args.customerId as string) || undefined;
				let customerName: string | undefined;
				if (!customerId && args.phone) {
					customerId =
						(await resolveCustomerIdByPhone(
							context,
							args.phone as string,
						)) ?? undefined;
				}
				if (customerId) {
					const { data: cust } = await context.supabase
						.from("customers")
						.select("full_name")
						.eq("organization_id", context.orgId)
						.eq("id", customerId)
						.limit(1);
					if (cust && cust.length > 0) {
						customerName = (cust[0] as { full_name?: string }).full_name;
					}
				}
				if (!customerId) {
					return {
						error: "Харилцагч олдсонгүй. customerId эсвэл phone оруулна уу.",
					};
				}
				await rememberCustomerFact(context.supabase, {
					orgId: context.orgId,
					customerId,
					customerName,
					fact: String(args.fact).trim(),
					factType: (args.factType as string) ?? "general",
				});
				return { success: true, message: "Хадгалагдлаа." };
			} catch (err) {
				capture(err, { context: "agent-gateway: rememberCustomerFact" });
				return { error: "Мэдээлэл хадгалахад алдаа гарлаа" };
			}
		},
	};

	return [recallTool, rememberTool];
}
