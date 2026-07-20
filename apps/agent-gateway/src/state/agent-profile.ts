import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";
import type { AgentAudience } from "@zuiio/gateway-core";
import type { AgentProfile } from "@/gateway/types";

/**
 * Load an active agent context profile for the given org and audience.
 * Returns null when not found or on error — safe fallback, never throws.
 */
export async function loadAgentProfile(
	supabase: SupabaseClient,
	orgId: string,
	audience: AgentAudience,
): Promise<AgentProfile | null> {
	try {
		const { data, error } = await supabase
			.from("agent_context_profiles")
			.select("*")
			.eq("organization_id", orgId)
			.eq("audience", audience)
			.eq("is_active", true)
			.single();

		if (error) {
			// PGRST116 = no rows returned — expected when profile doesn't exist
			if (error.code === "PGRST116") return null;
			capture(error, { context: "agent-gateway: loadAgentProfile" });
			return null;
		}

		if (!data) return null;

		return mapProfileRow(data);
	} catch (err) {
		capture(err, { context: "agent-gateway: loadAgentProfile" });
		return null;
	}
}

/** Map snake_case DB row to camelCase AgentProfile. */
function mapProfileRow(row: Record<string, unknown>): AgentProfile {
	return {
		id: row.id as string | undefined,
		organizationId: row.organization_id as string,
		audience: row.audience as AgentAudience,
		assistantName: (row.assistant_name as string | null) ?? null,
		businessSummary: (row.business_summary as string | null) ?? null,
		responseLanguage: (row.response_language as string | null) ?? null,
		tone: (row.tone as string | null) ?? null,
		contactDetails: (row.contact_details as string | null) ?? null,
		businessHours: (row.business_hours as Record<string, unknown>) ?? null,
		responseRules: (row.response_rules as string | null) ?? null,
		handoffMessage: (row.handoff_message as string | null) ?? null,
		isActive: row.is_active as boolean,
		updatedBy: (row.updated_by as string | null) ?? null,
		createdAt: row.created_at as string,
		updatedAt: row.updated_at as string,
	};
}

/**
 * Format an AgentProfile into a deterministic prompt section.
 * Only includes non-null fields. Returns empty string when all fields are null.
 */
export function formatProfileContext(profile: AgentProfile): string {
	const sections: string[] = [];

	const fields: [
		string,
		string | null | Record<string, unknown> | undefined,
	][] = [
		["Assistant name", profile.assistantName],
		["Business summary", profile.businessSummary],
		["Response language", profile.responseLanguage],
		["Tone", profile.tone],
		["Contact details", profile.contactDetails],
		["Business hours", profile.businessHours],
		["Response rules", profile.responseRules],
		["Handoff message", profile.handoffMessage],
	];

	for (const [label, value] of fields) {
		if (value == null) continue;

		const display =
			typeof value === "object"
				? JSON.stringify(value, null, 2)
				: String(value);
		sections.push(`${label}: ${display}`);
	}

	if (sections.length === 0) return "";

	return `## ORGANIZATION CONTEXT\n${sections.join("\n")}`;
}
