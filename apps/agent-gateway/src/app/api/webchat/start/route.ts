import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface WidgetRow {
	display_name: string | null;
	greeting: string | null;
	product_type: "tolom" | "zer";
}

export async function GET(request: Request): Promise<NextResponse> {
	const widgetKey =
		new URL(request.url).searchParams.get("widgetKey")?.trim() ?? "";

	if (!widgetKey) {
		return NextResponse.json({ error: "Missing widgetKey" }, { status: 400 });
	}

	const sb = createServiceClient();
	const { data, error } = await sb
		.from("agent_webchat_widgets")
		.select("display_name, greeting, product_type")
		.eq("widget_key", widgetKey)
		.eq("is_active", true)
		.maybeSingle();

	if (error) {
		capture(error, { context: "agent-gateway: webchat start lookup" });
		return NextResponse.json({ error: "Widget not found" }, { status: 404 });
	}

	if (!data) {
		return NextResponse.json({ error: "Widget not found" }, { status: 404 });
	}

	const row = data as WidgetRow;
	return NextResponse.json({
		displayName: row.display_name,
		greeting: row.greeting,
		productType: row.product_type,
	});
}
