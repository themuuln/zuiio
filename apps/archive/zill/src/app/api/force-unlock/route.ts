import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSplit, saveSelection, confirmSelection } from "@/lib/db";

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

	// Authenticate via session cookie, not form field
	const cookieStore = await cookies();
	const sessionName = cookieStore.get("zill_user_name")?.value;
	if (!sessionName || sessionName !== split.payer) {
		return NextResponse.json(
			{ error: "Only payer can force-unlock" },
			{ status: 403 },
		);
	}

	// Confirm all pending participants, creating empty selections for those who never joined
	for (const p of split.participants) {
		const sel = split.selections[p.name];
		if (!sel) {
			// Participant never joined — create empty selection and auto-confirm
			await saveSelection(splitId, p.name, []);
		}
		if (!sel || !sel.confirmed) {
			await confirmSelection(splitId, p.name);
		}
	}

	return NextResponse.redirect(new URL(`/split/${splitId}`, req.url));
}
