import { NextRequest, NextResponse } from "next/server";
import { getSplit, confirmSelection } from "@/lib/db";

export async function POST(req: NextRequest) {
	const formData = await req.formData();
	const splitId = formData.get("splitId")?.toString();
	const name = formData.get("name")?.toString().trim();

	if (!splitId || !name) {
		return NextResponse.json({ error: "Missing fields" }, { status: 400 });
	}

	const split = await getSplit(splitId);
	if (!split) {
		return NextResponse.json({ error: "Split not found" }, { status: 404 });
	}

	if (!split.participants.some((p) => p.name === name)) {
		return NextResponse.json({ error: "Not a participant" }, { status: 403 });
	}

	const selection = await confirmSelection(splitId, name);
	if (!selection) {
		return NextResponse.json(
			{ error: "Must save selection before confirming" },
			{ status: 400 },
		);
	}

	return NextResponse.redirect(
		new URL(`/join/${splitId}?as=${encodeURIComponent(name)}`, req.url),
	);
}
