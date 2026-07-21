import { NextRequest, NextResponse } from "next/server";
import { createSplit, type ItemTag } from "@/lib/db";

const VALID_TAGS: ItemTag[] = ["shared", "individual", "alcohol", "service"];

export async function POST(req: NextRequest) {
	const formData = await req.formData();

	const title = formData.get("title")?.toString().trim() || "";
	const payer = formData.get("payer")?.toString().trim() || "";
	const date =
		formData.get("date")?.toString() || new Date().toISOString().split("T")[0];
	const itemsJson = formData.get("items")?.toString();
	const participantsJson = formData.get("participants")?.toString();

	if (!title || !payer || !itemsJson || !participantsJson) {
		return NextResponse.redirect(new URL("/split/new", req.url));
	}

	let rawItems: unknown;
	let rawParticipants: unknown;
	try {
		rawItems = JSON.parse(itemsJson);
		rawParticipants = JSON.parse(participantsJson);
	} catch {
		return NextResponse.redirect(new URL("/split/new", req.url));
	}

	// Validate arrays
	if (!Array.isArray(rawItems) || !Array.isArray(rawParticipants)) {
		return NextResponse.redirect(new URL("/split/new", req.url));
	}

	// Filter and validate items
	const items = (rawItems as { name?: string; amount?: number; tag?: string }[])
		.filter((i) => {
			const amount = Number(i.amount);
			return (
				typeof i.name === "string" &&
				i.name.trim().length > 0 &&
				Number.isFinite(amount) &&
				amount > 0 &&
				VALID_TAGS.includes((i.tag ?? "") as ItemTag)
			);
		})
		.map((i) => ({
			name: i.name!.trim(),
			amount: Math.floor(Number(i.amount)),
			tag: i.tag! as ItemTag,
		}));

	// Filter and deduplicate participant names
	let participantNames: string[] = (rawParticipants as string[])
		.filter((n): n is string => typeof n === "string" && n.trim().length > 0)
		.map((n) => n.trim());
	participantNames = [...new Set(participantNames)];

	if (items.length === 0 || participantNames.length === 0) {
		return NextResponse.redirect(new URL("/split/new", req.url));
	}

	if (!participantNames.includes(payer)) {
		participantNames.unshift(payer);
	}

	const split = await createSplit({
		title,
		date,
		items: items.map((item, i) => ({
			id: `item-${i}`,
			name: item.name,
			amount: item.amount,
			tag: item.tag,
		})),
		participants: participantNames.map((name) => ({ name })),
		payer,
	});

	return NextResponse.redirect(new URL(`/split/${split.id}`, req.url));
}
