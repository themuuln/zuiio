import { NextResponse } from "next/server";
import { openCodeGoConfig } from "@/lib/env";
import { OpenCodeGoProvider } from "@/providers/opencode-go";
import type { GatewayTool, ToolContext } from "@/providers/types";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const config = openCodeGoConfig();
		const provider = new OpenCodeGoProvider(config);
		const dummyCtx: ToolContext = { orgId: "test", userId: "test", supabase: null as never };
		const result = await provider.runWithTools({
			system: "You are a helpful assistant. Reply in 1 sentence.",
			userMessage: "Hello",
			tools: [] as GatewayTool[],
			context: dummyCtx,
			maxRounds: 1,
		});
		return NextResponse.json({ ok: true, result: result.slice(0, 200) });
	} catch (err) {
		return NextResponse.json({ ok: false, error: String(err).slice(0, 500) }, { status: 500 });
	}
}
