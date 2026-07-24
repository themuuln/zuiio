import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";

/**
 * Usage analytics and dashboard data.
 * Provides transparent cost tracking per organization.
 */

export interface UsageStats {
	orgId: string;
	period: {
		start: string;
		end: string;
	};
	totalTokens: number;
	totalApiCalls: number;
	totalToolCalls: number;
	topTools: Array<{ name: string; count: number }>;
	topUsers: Array<{ userId: string; messageCount: number }>;
	handoffCount: number;
	handoffResolvedCount: number;
	dailyBreakdown: Array<{
		date: string;
		tokens: number;
		calls: number;
	}>;
	estimatedCost: number; // in USD, based on token usage
}

/**
 * Get usage statistics for an organization over a date range.
 */
export async function getUsageStats(
	supabase: SupabaseClient,
	orgId: string,
	days: number = 7,
	providerCostPer1M: number = 0.14, // OpenCodeGo Flash default
): Promise<UsageStats> {
	const end = new Date();
	const start = new Date(Date.now() - days * 86400000);
	const startDate = start.toISOString().split("T")[0]!;
	const endDate = end.toISOString().split("T")[0]!;

	try {
		// Daily spend
		const { data: spend } = await supabase
			.from("agent_daily_spend")
			.select("date, tokens_used, api_calls")
			.eq("organization_id", orgId)
			.gte("date", startDate)
			.lte("date", endDate)
			.order("date", { ascending: false });

		const dailyBreakdown = (
			(spend ?? []) as Array<Record<string, unknown>>
		).map((row) => ({
			date: row.date as string,
			tokens: Number(row.tokens_used) || 0,
			calls: Number(row.api_calls) || 0,
		}));

		const totalTokens = dailyBreakdown.reduce((s, d) => s + d.tokens, 0);
		const totalApiCalls = dailyBreakdown.reduce((s, d) => s + d.calls, 0);

		// Tool calls
		const { data: tools } = await supabase
			.from("agent_audit_log")
			.select("tool_name")
			.eq("organization_id", orgId)
			.gte("created_at", start.toISOString());

		const totalToolCalls = (tools ?? []).length;

		const toolCounts = new Map<string, number>();
		for (const t of tools ?? []) {
			const name = (t as { tool_name?: string }).tool_name ?? "unknown";
			toolCounts.set(name, (toolCounts.get(name) ?? 0) + 1);
		}
		const topTools = Array.from(toolCounts.entries())
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10)
			.map(([name, count]) => ({ name, count }));

		// Handoff stats
		const { data: handoffs } = await supabase
			.from("agent_handoff_events")
			.select("status")
			.eq("organization_id", orgId)
			.gte("created_at", start.toISOString());

		const handoffCount = (handoffs ?? []).length;
		const handoffResolvedCount = (handoffs ?? []).filter((h: unknown) =>
			["human_resolved", "bot_resumed"].includes(
				(h as Record<string, string>).status,
			),
		).length;

		// Estimated cost
		const estimatedCost = (totalTokens / 1_000_000) * providerCostPer1M;

		return {
			orgId,
			period: { start: start.toISOString(), end: end.toISOString() },
			totalTokens,
			totalApiCalls,
			totalToolCalls,
			topTools,
			topUsers: [],
			handoffCount,
			handoffResolvedCount,
			dailyBreakdown,
			estimatedCost: Math.round(estimatedCost * 10_000) / 10_000,
		};
	} catch (err) {
		capture(err, {
			context: "agent-gateway: usage stats",
			orgId,
		});

		return {
			orgId,
			period: { start: start.toISOString(), end: end.toISOString() },
			totalTokens: 0,
			totalApiCalls: 0,
			totalToolCalls: 0,
			topTools: [],
			topUsers: [],
			handoffCount: 0,
			handoffResolvedCount: 0,
			dailyBreakdown: [],
			estimatedCost: 0,
		};
	}
}
