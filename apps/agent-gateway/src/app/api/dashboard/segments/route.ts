import "server-only";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: Request) {
	const orgId = new URL(request.url).searchParams.get("orgId");
	if (!orgId)
		return NextResponse.json(
			{ error: "orgId parameter is required" },
			{ status: 400 },
		);
	const { data, error } = await createServiceClient()
		.from("segments")
		.select("*")
		.eq("organization_id", orgId)
		.order("created_at", { ascending: false });
	if (error)
		return NextResponse.json(
			{ error: "Unable to load segments" },
			{ status: 500 },
		);
	return NextResponse.json({ segments: data ?? [] });
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
	const { data, error } = await createServiceClient()
		.from("segments")
		.insert({
			organization_id: organizationId,
			name: body.name,
			filter: body.filter ?? {},
		})
		.select()
		.single();
	if (error)
		return NextResponse.json(
			{ error: "Unable to create segment" },
			{ status: 500 },
		);
	return NextResponse.json({ segment: data }, { status: 201 });
}
