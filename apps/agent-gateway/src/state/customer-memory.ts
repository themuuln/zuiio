import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";

/**
 * Cross-session customer memory.
 * Persists facts about specific customers across conversations.
 */

export interface CustomerFact {
	id: string;
	fact: string;
	factType: string;
	confidence: number;
	createdAt: string;
}

/**
 * Remember a fact about a specific customer.
 */
export async function rememberCustomerFact(
	supabase: SupabaseClient,
	params: {
		orgId: string;
		customerId: string;
		customerName?: string;
		fact: string;
		factType?: string;
		chatId?: number;
		confidence?: number;
	},
): Promise<void> {
	const { error } = await supabase.from("agent_customer_memory").insert({
		organization_id: params.orgId,
		customer_id: params.customerId,
		customer_name: params.customerName ?? null,
		fact: params.fact,
		fact_type: params.factType ?? "general",
		source_chat_id: params.chatId ?? null,
		confidence: params.confidence ?? 1.0,
	});

	if (error) {
		capture(error, { context: "agent-gateway: customer memory insert" });
	}
}

/**
 * Recall facts about a customer.
 */
export async function recallCustomerFacts(
	supabase: SupabaseClient,
	orgId: string,
	customerId: string,
	options?: { factType?: string; limit?: number },
): Promise<CustomerFact[]> {
	const limit = options?.limit ?? 10;

	let query = supabase
		.from("agent_customer_memory")
		.select("id, fact, fact_type, confidence, created_at")
		.eq("organization_id", orgId)
		.eq("customer_id", customerId)
		.eq("is_active", true)
		.order("confidence", { ascending: false })
		.limit(limit);

	if (options?.factType) {
		query = query.eq("fact_type", options.factType);
	}

	const { data } = await query;

	return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
		id: row.id as string,
		fact: row.fact as string,
		factType: row.fact_type as string,
		confidence: row.confidence as number,
		createdAt: row.created_at as string,
	}));
}

/**
 * Format customer memory for injection into system prompt.
 */
export function formatCustomerMemory(
	customerName: string,
	facts: CustomerFact[],
): string {
	if (facts.length === 0) return "";

	const formatted = facts
		.map(
			(f, i) =>
				`${i + 1}. ${f.fact} (итгэлцэл: ${Math.round(f.confidence * 100)}%)`,
		)
		.join("\n");

	return `\n--- Харилцагчийн түүх: ${customerName} ---\n${formatted}\n--- Харилцагчийн түүх дууслаа ---\n\nДээрх мэдээллийг хариултандаа тохирох үед ашиглана уу.`;
}

/**
 * Forget a customer fact (invalidate).
 */
export async function forgetCustomerFact(
	supabase: SupabaseClient,
	factId: string,
): Promise<void> {
	await supabase
		.from("agent_customer_memory")
		.update({ is_active: false, updated_at: new Date().toISOString() })
		.eq("id", factId);
}
