import "server-only";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

function bucket(value: string): number {
	let hash = 2166136261;
	for (let i = 0; i < value.length; i++)
		hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
	return (hash >>> 0) % 100;
}

export async function GET(request: Request) {
	const orgId = new URL(request.url).searchParams.get("orgId");
	if (!orgId)
		return NextResponse.json(
			{ error: "orgId parameter is required" },
			{ status: 400 },
		);
	const sb = createServiceClient();
	const { data, error } = await sb
		.from("experiments")
		.select("*")
		.eq("organization_id", orgId)
		.order("created_at", { ascending: false });
	if (error)
		return NextResponse.json(
			{ error: "Unable to load experiments" },
			{ status: 500 },
		);
	return NextResponse.json({ experiments: data ?? [] });
}

export async function POST(request: Request) {
	const body = (await request.json()) as Record<string, unknown>;
	const organizationId = (body.organizationId ??
		new URL(request.url).searchParams.get("orgId")) as string | null;
	if (!organizationId || typeof body.name !== "string")
		return NextResponse.json(
			{ error: "organizationId and name are required" },
			{ status: 400 },
		);
	const sb = createServiceClient();
	const { data, error } = await sb
		.from("experiments")
		.insert({
			organization_id: organizationId,
			name: body.name,
			variants: body.variants ?? [],
			traffic_split: body.trafficSplit ?? {},
			status: body.status ?? "draft",
		})
		.select()
		.single();
	if (error)
		return NextResponse.json(
			{ error: "Unable to create experiment" },
			{ status: 500 },
		);
	return NextResponse.json({ experiment: data }, { status: 201 });
}

export async function PUT(request: Request) {
	const body = (await request.json()) as {
		organizationId?: string;
		experimentId?: string;
		channelUserId?: string;
	};
	if (!body.organizationId || !body.experimentId || !body.channelUserId)
		return NextResponse.json(
			{ error: "organizationId, experimentId, and channelUserId are required" },
			{ status: 400 },
		);
	const sb = createServiceClient();
	const { data: experiment } = await sb
		.from("experiments")
		.select("*")
		.eq("id", body.experimentId)
		.eq("organization_id", body.organizationId)
		.single();
	if (!experiment)
		return NextResponse.json(
			{ error: "Experiment not found" },
			{ status: 404 },
		);
	const variants = Array.isArray(experiment.variants)
		? experiment.variants.map(String)
		: [];
	if (!variants.length)
		return NextResponse.json(
			{ error: "Experiment has no variants" },
			{ status: 400 },
		);
	const split = (experiment.traffic_split ?? {}) as Record<string, number>;
	const point = bucket(body.channelUserId);
	let cursor = 0;
	let variant = variants[variants.length - 1];
	for (const candidate of variants) {
		cursor += Number(split[candidate] ?? 0);
		if (point < cursor) {
			variant = candidate;
			break;
		}
	}
	const { data, error } = await sb
		.from("experiment_assignments")
		.upsert(
			{
				experiment_id: experiment.id,
				channel_user_id: body.channelUserId,
				variant,
			},
			{ onConflict: "experiment_id,channel_user_id" },
		)
		.select()
		.single();
	if (error)
		return NextResponse.json(
			{ error: "Unable to assign experiment" },
			{ status: 500 },
		);
	return NextResponse.json({ assignment: data });
}
