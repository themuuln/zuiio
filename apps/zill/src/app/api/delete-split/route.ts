import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSplit, deleteSplit } from "@/lib/db";

export async function POST(req: NextRequest) {
	const formData = await req.formData();
	const splitId = formData.get("splitId")?.toString();

	if (!splitId) {
		return NextResponse.json({ error: "Missing splitId" }, { status: 400 });
	}

	const split = await getSplit(splitId);
	if (!split) {
		return NextResponse.json({ error: "Split not found" }, { status: 404 });
	}

	// Authenticate via session cookie
	const cookieStore = await cookies();
	const sessionName = cookieStore.get("zill_user_name")?.value;
	if (!sessionName || sessionName !== split.payer) {
		return NextResponse.json(
			{ error: "Only payer can delete a split" },
			{ status: 403 },
		);
	}

	await deleteSplit(splitId);
	return NextResponse.redirect(new URL("/", req.url));
}
