import "server-only";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

interface ReferralRow {
	ref: string | null;
	source: string | null;
	ad_id: string | null;
	sender_id: string;
	created_at: string;
}

interface AuditRow {
	channel_user_id: string | null;
	tool_name: string;
	created_at: string;
}

const CONVERSION_TOOLS = new Set([
	"placeOrderWithQpay",
	"checkoutCartWithQpay",
	"place_order",
	"create_order",
	"complete_flow",
	"completeFlow",
]);

export async function GET(request: Request) {
	const orgId = new URL(request.url).searchParams.get("orgId")?.trim();
	if (!orgId)
		return NextResponse.json(
			{ error: "orgId parameter is required" },
			{ status: 400 },
		);

	const sb = createServiceClient();
	const [
		{ data: referrals, error: referralError },
		{ data: audit, error: auditError },
	] = await Promise.all([
		sb
			.from("referral_events")
			.select("ref, source, ad_id, sender_id, created_at")
			.eq("organization_id", orgId),
		sb
			.from("agent_audit_log")
			.select("channel_user_id, tool_name, created_at")
			.eq("organization_id", orgId),
	]);
	if (referralError || auditError)
		return NextResponse.json(
			{ error: "ROI мэдээлэл авахад алдаа гарлаа" },
			{ status: 500 },
		);

	const convertedUsers = new Set(
		((audit ?? []) as AuditRow[])
			.filter(
				(row) =>
					CONVERSION_TOOLS.has(row.tool_name) ||
					/order|purchase|flow.*(complete|finish)/i.test(row.tool_name),
			)
			.map((row) => row.channel_user_id)
			.filter((id): id is string => Boolean(id)),
	);
	const now = Date.now();
	const groups = new Map<
		string,
		{
			ref: string;
			source: string;
			adId: string;
			referrals: number;
			conversions: number;
			last7d: number[];
			lastAt: string | null;
		}
	>();
	for (const row of (referrals ?? []) as ReferralRow[]) {
		const ref = row.ref?.trim() || "(хоосон)";
		const source = row.source?.trim() || "(тодорхойгүй)";
		const adId = row.ad_id?.trim() || "—";
		const key = `${ref}\u0000${source}\u0000${adId}`;
		const group = groups.get(key) ?? {
			ref,
			source,
			adId,
			referrals: 0,
			conversions: 0,
			last7d: Array(7).fill(0),
			lastAt: null,
		};
		group.referrals += 1;
		if (convertedUsers.has(row.sender_id)) group.conversions += 1;
		const age = Math.floor(
			(now - new Date(row.created_at).getTime()) / 86_400_000,
		);
		if (age >= 0 && age < 7) group.last7d[6 - age] += 1;
		if (!group.lastAt || row.created_at > group.lastAt)
			group.lastAt = row.created_at;
		groups.set(key, group);
	}
	return NextResponse.json({
		orgId,
		rows: [...groups.values()].map((row) => ({
			...row,
			rate: row.referrals ? row.conversions / row.referrals : 0,
		})),
	});
}
