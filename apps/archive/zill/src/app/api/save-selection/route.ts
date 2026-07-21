import { NextRequest, NextResponse } from "next/server";
import { getSplit, saveSelection } from "@/lib/db";

export async function POST(req: NextRequest) {
	const formData = await req.formData();
	const splitId = formData.get("splitId")?.toString();
	const name = formData.get("name")?.toString().trim();
	const itemsJson = formData.get("items")?.toString();

	if (!splitId || !name || !itemsJson) {
		return NextResponse.json({ error: "Missing fields" }, { status: 400 });
	}

	const split = await getSplit(splitId);
	if (!split) {
		return NextResponse.json({ error: "Split not found" }, { status: 404 });
	}

	if (!split.participants.some((p) => p.name === name)) {
		return NextResponse.json({ error: "Not a participant" }, { status: 403 });
	}

	let raw: unknown;
	try {
		raw = JSON.parse(itemsJson);
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	if (!Array.isArray(raw) || !raw.every((id) => typeof id === "string")) {
		return NextResponse.json(
			{ error: "Items must be an array of strings" },
			{ status: 400 },
		);
	}

	// Validate and filter item IDs
	const validIds = new Set(split.items.map((i) => i.id));
	const selectedItemIds: string[] = (raw as string[]).filter((id) =>
		validIds.has(id),
	);

	const selection = await saveSelection(splitId, name, selectedItemIds);
	if (!selection) {
		return NextResponse.json({ error: "Failed to save" }, { status: 500 });
	}

	return NextResponse.redirect(
		new URL(`/join/${splitId}?as=${encodeURIComponent(name)}`, req.url),
	);
}
