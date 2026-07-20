import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";

/**
 * Daily briefing generator.
 * Summarizes overnight activity and pending items for business owners.
 */

export interface BriefingData {
	orgId: string;
	orgName: string;
	overnightMessages: number;
	overnightToolCalls: number;
	pendingHandoffs: number;
	topQueries: string[];
	anomalies: string[];
	date: string;
}

/**
 * Gather data for a daily briefing.
 */
export async function gatherBriefingData(
	supabase: SupabaseClient,
	orgId: string,
	_adminChatId: number,
): Promise<BriefingData | null> {
	const yesterday = new Date(Date.now() - 86400000).toISOString();
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	try {
		// Get org name
		const { data: org } = await supabase
			.from("organizations")
			.select("name")
			.eq("id", orgId)
			.single();

		const orgName = (org as { name?: string } | null)?.name ?? orgId;

		// Count overnight audit events (tool calls)
		const { data: toolCalls } = await supabase
			.from("agent_audit_log")
			.select("tool_name")
			.eq("organization_id", orgId)
			.gte("created_at", yesterday)
			.order("created_at", { ascending: false });

		const overnightToolCalls = (toolCalls ?? []).length;

		// Count overnight session activity
		const { data: sessions } = await supabase
			.from("agent_sessions")
			.select("messages")
			.eq("organization_id", orgId)
			.gte("updated_at", yesterday);

		const overnightMessages = (sessions ?? []).reduce((count, s) => {
			const msgs = s.messages as unknown[] | undefined;
			return count + (msgs?.length ?? 0);
		}, 0);

		// Pending handoffs
		const { data: handoffs } = await supabase
			.from("agent_handoff_events")
			.select("id, reason, created_at")
			.eq("organization_id", orgId)
			.in("status", ["pending_human", "human_active"]);

		const pendingHandoffs = (handoffs ?? []).length;

		// Top queries from tool calls
		const toolCounts = new Map<string, number>();
		for (const tc of toolCalls ?? []) {
			const name = (tc as { tool_name?: string }).tool_name ?? "unknown";
			toolCounts.set(name, (toolCounts.get(name) ?? 0) + 1);
		}
		const topQueries = Array.from(toolCounts.entries())
			.sort(([, a], [, b]) => b - a)
			.slice(0, 5)
			.map(([name, count]) => `${name} (${count} удаа)`);

		// Anomaly detection: check for spikes in error responses
		const { data: errors } = await supabase
			.from("agent_audit_log")
			.select("error")
			.eq("organization_id", orgId)
			.gte("created_at", yesterday)
			.not("error", "is", null);

		const anomalies: string[] = [];
		const errorCount = (errors ?? []).length;
		if (errorCount > overnightToolCalls * 0.3 && overnightToolCalls > 10) {
			anomalies.push(
				`Өчигдрийн хүсэлтийн ${Math.round((errorCount / overnightToolCalls) * 100)}% нь алдаатай байна (${errorCount} алдаа).`,
			);
		}

		if (pendingHandoffs > 3) {
			anomalies.push(
				`${pendingHandoffs} ширхэг шийдвэрлэгдээгүй хүнд шилжүүлэлт байна.`,
			);
		}

		return {
			orgId,
			orgName,
			overnightMessages,
			overnightToolCalls,
			pendingHandoffs,
			topQueries,
			anomalies,
			date: todayStart.toISOString().split("T")[0]!,
		};
	} catch (err) {
		capture(err, {
			context: "agent-gateway: briefing data gather",
			orgId,
		});
		return null;
	}
}

/**
 * Log a delivered briefing.
 */
export async function logBriefing(
	supabase: SupabaseClient,
	data: BriefingData,
	briefingText: string,
	adminChatId: number,
): Promise<void> {
	try {
		await supabase.from("agent_briefing_log").insert({
			organization_id: data.orgId,
			admin_chat_id: adminChatId,
			briefing_text: briefingText,
			overnight_messages: data.overnightMessages,
			overnight_tool_calls: data.overnightToolCalls,
			pending_handoffs: data.pendingHandoffs,
			events_summary: {
				topQueries: data.topQueries,
				anomalies: data.anomalies,
			},
		});
	} catch (err) {
		capture(err, { context: "agent-gateway: briefing log" });
	}
}
