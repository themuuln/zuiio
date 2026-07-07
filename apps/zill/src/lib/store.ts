// Global-scope store that survives module hot-reloading in dev
// Swap to file-backed JSON or Supabase later

export type ItemTag = "shared" | "individual" | "alcohol" | "service";

export interface SplitItem {
	id: string;
	name: string;
	amount: number;
	tag: ItemTag;
}

export interface Participant {
	name: string;
}

export interface ParticipantSelection {
	participantName: string;
	selectedItemIds: string[];
	confirmed: boolean;
	saved: boolean;
	joinedAt: string;
}

export interface Split {
	id: string;
	title: string;
	date: string;
	items: SplitItem[];
	participants: Participant[];
	payer: string;
	createdAt: string;
	status: "open" | "confirming" | "settled";
	privacyMode: "private" | "open";
	selections: Record<string, ParticipantSelection>;
}

// Use globalThis so the map survives module hot-reloads in dev
const globalForStore = globalThis as { __zill_splits?: Map<string, Split> };

function getSplits(): Map<string, Split> {
	if (!globalForStore.__zill_splits) {
		globalForStore.__zill_splits = new Map<string, Split>();
	}
	return globalForStore.__zill_splits;
}

export function createSplit(data: {
	title: string;
	date: string;
	items: SplitItem[];
	participants: Participant[];
	payer: string;
}): Split {
	const id = crypto.randomUUID();
	const split: Split = {
		id,
		...data,
		createdAt: new Date().toISOString(),
		status: "open",
		privacyMode: "private",
		selections: {},
	};
	getSplits().set(id, split);
	return split;
}

export function getSplit(id: string): Split | undefined {
	return getSplits().get(id);
}

export function getAllSplits(): Split[] {
	return Array.from(getSplits().values()).sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
}

export function updateSplit(
	id: string,
	data: Partial<Omit<Split, "id" | "createdAt">>,
): Split | undefined {
	const split = getSplits().get(id);
	if (!split) return undefined;
	Object.assign(split, data);
	return split;
}

// ── Selection helpers ─────────────────────────────────────────────

export function saveSelection(
	splitId: string,
	participantName: string,
	selectedItemIds: string[],
): ParticipantSelection | undefined {
	const split = getSplits().get(splitId);
	if (!split) return undefined;

	const existing = split.selections[participantName];
	const selection: ParticipantSelection = {
		participantName,
		selectedItemIds,
		confirmed: existing?.confirmed ?? false,
		saved: true,
		joinedAt: existing?.joinedAt ?? new Date().toISOString(),
	};
	split.selections[participantName] = selection;
	return selection;
}

export function confirmSelection(
	splitId: string,
	participantName: string,
): ParticipantSelection | undefined {
	const split = getSplits().get(splitId);
	if (!split) return undefined;

	const existing = split.selections[participantName];
	if (!existing || !existing.saved) return undefined;

	existing.confirmed = true;

	// If all participants confirmed, auto-advance status
	const allConfirmed = split.participants.every(
		(p) => split.selections[p.name]?.confirmed,
	);
	if (allConfirmed && split.status === "open") {
		split.status = "confirming";
	}

	return existing;
}

export function getConfirmedCount(splitId: string): number {
	const split = getSplits().get(splitId);
	if (!split) return 0;
	return split.participants.filter((p) => split.selections[p.name]?.confirmed)
		.length;
}

export function getSelectionSummary(
	splitId: string,
	participantName: string,
): { selected: SplitItem[]; total: number } | undefined {
	const split = getSplits().get(splitId);
	if (!split) return undefined;

	const sel = split.selections[participantName];
	if (!sel) return { selected: [], total: 0 };

	const selected = split.items.filter((item) =>
		sel.selectedItemIds.includes(item.id),
	);
	const total = selected.reduce((sum, i) => sum + i.amount, 0);
	return { selected, total };
}

// ── Destroy ────────────────────────────────────────────────────────

export function deleteSplit(id: string): boolean {
	return getSplits().delete(id);
}
