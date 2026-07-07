"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSplit } from "@/lib/db";

const COOKIE_NAME = "zill_user_name";
const COOKIE_OPTIONS = {
	httpOnly: true,
	sameSite: "lax" as const,
	path: "/",
	maxAge: 60 * 60 * 24 * 365,
};

export async function setName(formData: FormData) {
	const name = formData.get("name")?.toString().trim();
	if (!name) return;
	const cookieStore = await cookies();
	cookieStore.set(COOKIE_NAME, name, COOKIE_OPTIONS);
	redirect("/");
}

export async function clearName() {
	const cookieStore = await cookies();
	cookieStore.delete(COOKIE_NAME);
	redirect("/");
}

export async function getName(): Promise<string | null> {
	const cookieStore = await cookies();
	return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export type ItemTag = "shared" | "individual" | "alcohol" | "service";

export interface ItemEntry {
	name: string;
	amount: number;
	tag: ItemTag;
}

export async function createSplitAction(formData: FormData) {
	const title = formData.get("title")?.toString().trim();
	if (!title) throw new Error("Restaurant name required");

	const payer = formData.get("payer")?.toString().trim();
	if (!payer) throw new Error("Payer required");

	// Parse items from JSON hidden field
	const itemsJson = formData.get("items")?.toString();
	if (!itemsJson) throw new Error("Items required");
	const items: ItemEntry[] = JSON.parse(itemsJson);
	if (items.length === 0) throw new Error("At least one item required");

	// Parse participants from JSON hidden field
	const participantsJson = formData.get("participants")?.toString();
	if (!participantsJson) throw new Error("Participants required");
	const participantNames: string[] = JSON.parse(participantsJson);
	if (participantNames.length === 0)
		throw new Error("At least one participant required");

	// Ensure payer is in participants list
	if (!participantNames.includes(payer)) {
		participantNames.unshift(payer);
	}

	const date =
		formData.get("date")?.toString() || new Date().toISOString().split("T")[0];

	const split = await createSplit({
		title,
		date,
		items: items.map((item, i) => ({
			id: `item-${i}-${Date.now()}`,
			name: item.name,
			amount: item.amount,
			tag: item.tag,
		})),
		participants: participantNames.map((name) => ({ name })),
		payer,
	});

	redirect(`/split/${split.id}`);
}
