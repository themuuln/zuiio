/**
 * Database abstraction layer.
 *
 * Two modes:
 * 1. In-memory (default) — globalThis Map, survives dev hot-reloads
 * 2. Supabase — when SUPABASE_SERVICE_ROLE_KEY env var is set
 *
 * After pasting the schema in Supabase Dashboard SQL Editor:
 *   1. Add SUPABASE_SERVICE_ROLE_KEY to .env.local
 *   2. The app automatically switches to Supabase on next restart
 */

import type {
	Split,
	SplitItem,
	ParticipantSelection,
	ItemTag,
} from "@/lib/store";

export type { Split, SplitItem, ParticipantSelection, ItemTag };

// ── Detect backend ────────────────────────────────────────────────

const USE_SUPABASE = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

// ── Supabase client (lazy-init) ────────────────────────────────────

let _supabase: ReturnType<
	typeof import("./supabase/admin").createAdminClient
> | null = null;

async function getDb() {
	if (!USE_SUPABASE) {
		// Fallback to in-memory
		const mem = await import("./store");
		return { type: "memory" as const, store: mem };
	}

	if (!_supabase) {
		const { createAdminClient } = await import("./supabase/admin");
		_supabase = createAdminClient();
	}
	return { type: "supabase" as const, sb: _supabase };
}

// ── Build a Split object from Supabase row data ────────────────────

interface SplitRow {
	id: string;
	title: string;
	date: string;
	payer: string;
	created_at: string;
	status: "open" | "confirming" | "settled";
	privacy_mode: "private" | "open";
}

interface ItemRow {
	id: string;
	split_id: string;
	name: string;
	amount: number;
	tag: ItemTag;
	sort_order: number;
}

interface ParticipantRow {
	id: string;
	split_id: string;
	name: string;
}

interface SelectionRow {
	split_id: string;
	participant_name: string;
	selected_item_ids: string[];
	confirmed: boolean;
	saved: boolean;
	joined_at: string;
}

function assembleSplit(
	split: SplitRow,
	items: ItemRow[],
	participants: ParticipantRow[],
	selections: SelectionRow[],
): Split {
	const selectionsMap: Record<string, ParticipantSelection> = {};
	for (const s of selections) {
		selectionsMap[s.participant_name] = {
			participantName: s.participant_name,
			selectedItemIds: s.selected_item_ids,
			confirmed: s.confirmed,
			saved: s.saved,
			joinedAt: s.joined_at,
		};
	}

	return {
		id: split.id,
		title: split.title,
		date: split.date,
		payer: split.payer,
		createdAt: split.created_at,
		status: split.status,
		privacyMode: split.privacy_mode,
		items: items
			.sort((a, b) => a.sort_order - b.sort_order)
			.map((i) => ({
				id: i.id,
				name: i.name,
				amount: i.amount,
				tag: i.tag,
			})),
		participants: participants.map((p) => ({ name: p.name })),
		selections: selectionsMap,
	};
}

// ── Public API ─────────────────────────────────────────────────────

export async function createSplit(data: {
	title: string;
	date: string;
	items: SplitItem[];
	participants: { name: string }[];
	payer: string;
}): Promise<Split> {
	const db = await getDb();

	if (db.type === "memory") {
		return db.store.createSplit(data);
	}

	const sb = db.sb;

	// 1. Create the split
	const { data: split, error: splitErr } = await sb
		.from("splits")
		.insert({
			title: data.title,
			date: data.date,
			payer: data.payer,
		})
		.select()
		.single();

	if (splitErr || !split)
		throw new Error(`Failed to create split: ${splitErr?.message}`);
	const s = split as unknown as SplitRow;

	// 2. Insert items
	const itemRows = data.items.map((item, i) => ({
		split_id: s.id,
		name: item.name,
		amount: item.amount,
		tag: item.tag,
		sort_order: i,
	}));

	const { data: createdItems, error: itemsErr } = await sb
		.from("split_items")
		.insert(itemRows)
		.select();

	if (itemsErr) throw new Error(`Failed to create items: ${itemsErr.message}`);
	const items = (createdItems ?? []) as unknown as ItemRow[];

	// 3. Insert participants
	const participantRows = data.participants.map((p) => ({
		split_id: s.id,
		name: p.name,
	}));

	const { data: createdParticipants, error: partErr } = await sb
		.from("split_participants")
		.insert(participantRows)
		.select();

	if (partErr)
		throw new Error(`Failed to add participants: ${partErr.message}`);
	const participants = (createdParticipants ??
		[]) as unknown as ParticipantRow[];

	return assembleSplit(s, items, participants, []);
}

export async function getSplit(id: string): Promise<Split | undefined> {
	const db = await getDb();

	if (db.type === "memory") {
		return db.store.getSplit(id);
	}

	const sb = db.sb;

	const { data: split } = await sb
		.from("splits")
		.select()
		.eq("id", id)
		.single();
	if (!split) return undefined;
	const s = split as unknown as SplitRow;

	const [itemsRes, participantsRes, selectionsRes] = await Promise.all([
		sb.from("split_items").select().eq("split_id", id),
		sb.from("split_participants").select().eq("split_id", id),
		sb.from("participant_selections").select().eq("split_id", id),
	]);

	return assembleSplit(
		s,
		(itemsRes.data ?? []) as unknown as ItemRow[],
		(participantsRes.data ?? []) as unknown as ParticipantRow[],
		(selectionsRes.data ?? []) as unknown as SelectionRow[],
	);
}

export async function getAllSplits(): Promise<Split[]> {
	const db = await getDb();

	if (db.type === "memory") {
		return db.store.getAllSplits();
	}

	const sb = db.sb;

	const { data: splits } = await sb
		.from("splits")
		.select()
		.order("created_at", { ascending: false });

	if (!splits || splits.length === 0) return [];

	const results: Split[] = [];
	for (const split of splits as unknown as SplitRow[]) {
		const [itemsRes, participantsRes, selectionsRes] = await Promise.all([
			sb.from("split_items").select().eq("split_id", split.id),
			sb.from("split_participants").select().eq("split_id", split.id),
			sb.from("participant_selections").select().eq("split_id", split.id),
		]);

		results.push(
			assembleSplit(
				split,
				(itemsRes.data ?? []) as unknown as ItemRow[],
				(participantsRes.data ?? []) as unknown as ParticipantRow[],
				(selectionsRes.data ?? []) as unknown as SelectionRow[],
			),
		);
	}

	return results;
}

export async function updateSplit(
	id: string,
	data: Partial<Omit<Split, "id" | "createdAt">>,
): Promise<Split | undefined> {
	const db = await getDb();

	if (db.type === "memory") {
		return db.store.updateSplit(id, data);
	}

	const sb = db.sb;

	const updateData: Record<string, unknown> = {};
	if (data.status !== undefined) updateData.status = data.status;
	if (data.privacyMode !== undefined)
		updateData.privacy_mode = data.privacyMode;
	if (data.title !== undefined) updateData.title = data.title;

	if (Object.keys(updateData).length > 0) {
		const { error } = await sb.from("splits").update(updateData).eq("id", id);
		if (error) throw new Error(`Failed to update split: ${error.message}`);
	}

	return getSplit(id);
}

export async function saveSelection(
	splitId: string,
	participantName: string,
	selectedItemIds: string[],
): Promise<ParticipantSelection | undefined> {
	const db = await getDb();

	if (db.type === "memory") {
		return db.store.saveSelection(splitId, participantName, selectedItemIds);
	}

	const sb = db.sb;

	const { data: existing } = await sb
		.from("participant_selections")
		.select()
		.eq("split_id", splitId)
		.eq("participant_name", participantName)
		.single();

	const row = {
		split_id: splitId,
		participant_name: participantName,
		selected_item_ids: selectedItemIds,
		saved: true,
		confirmed: existing?.confirmed ?? false,
	};

	const { error } = await sb.from("participant_selections").upsert(row, {
		onConflict: "split_id, participant_name",
	});

	if (error) throw new Error(`Failed to save selection: ${error.message}`);

	return {
		participantName,
		selectedItemIds,
		confirmed: row.confirmed,
		saved: true,
		joinedAt: existing?.joined_at ?? new Date().toISOString(),
	};
}

export async function confirmSelection(
	splitId: string,
	participantName: string,
): Promise<ParticipantSelection | undefined> {
	const db = await getDb();

	if (db.type === "memory") {
		return db.store.confirmSelection(splitId, participantName);
	}

	const sb = db.sb;

	const { data: existing } = await sb
		.from("participant_selections")
		.select()
		.eq("split_id", splitId)
		.eq("participant_name", participantName)
		.single();

	if (!existing) return undefined;

	const { error } = await sb
		.from("participant_selections")
		.update({ confirmed: true })
		.eq("split_id", splitId)
		.eq("participant_name", participantName);

	if (error) throw new Error(`Failed to confirm: ${error.message}`);

	return {
		participantName,
		selectedItemIds: existing.selected_item_ids ?? [],
		confirmed: true,
		saved: existing.saved,
		joinedAt: existing.joined_at,
	};
}

export async function getConfirmedCount(splitId: string): Promise<number> {
	const db = await getDb();

	if (db.type === "memory") {
		return db.store.getConfirmedCount(splitId);
	}

	const sb = db.sb;

	const { count } = await sb
		.from("participant_selections")
		.select("", { count: "exact", head: true })
		.eq("split_id", splitId)
		.eq("confirmed", true);

	return count ?? 0;
}

export async function deleteSplit(id: string): Promise<boolean> {
	const db = await getDb();

	if (db.type === "memory") {
		return db.store.deleteSplit(id);
	}

	const sb = db.sb;

	// CASCADE deletes handle items, participants, selections
	const { error } = await sb.from("splits").delete().eq("id", id);
	if (error) throw new Error(`Failed to delete split: ${error.message}`);
	return true;
}

export async function getSelectionSummary(
	splitId: string,
	participantName: string,
): Promise<{ selected: SplitItem[]; total: number } | undefined> {
	const db = await getDb();

	if (db.type === "memory") {
		return db.store.getSelectionSummary(splitId, participantName);
	}

	const split = await getSplit(splitId);
	if (!split) return undefined;

	const sel = split.selections[participantName];
	if (!sel) return { selected: [], total: 0 };

	const selected = split.items.filter((item) =>
		sel.selectedItemIds.includes(item.id),
	);
	const total = selected.reduce((sum, i) => sum + i.amount, 0);
	return { selected, total };
}
