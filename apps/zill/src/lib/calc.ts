import type { Split } from "@/lib/store";

interface LineItem {
	name: string;
	amount: number;
	tag: string;
}

export interface ParticipantResult {
	name: string;
	items: LineItem[];
	subtotal: number;
	rounded: number;
}

export interface CalculationResults {
	participantResults: ParticipantResult[];
	grandTotal: number;
}

/**
 * Distribute `total` among `count` recipients so the sum of their rounded
 * shares equals `total` exactly. The remainder (up to `count - 1` tugriks)
 * is given to later recipients one-at-a-time.
 */
function distributeEvenly(total: number, count: number): number[] {
	const base = Math.floor(total / count);
	const remainder = total - base * count;
	// The first `count - remainder` get `base`, the last `remainder` get `base + 1`
	const shares: number[] = [];
	for (let i = 0; i < count; i++) {
		shares.push(i < count - remainder ? base : base + 1);
	}
	return shares;
}

/**
 * Calculate each participant's share.
 * Every item's amount is allocated **exactly once** so grandTotal always
 * matches the bill total:
 * - Service: divided equally among ALL participants
 * - Shared: divided among SELECTORS
 * - Individual / Alcohol: divided among SELECTORS (not full-price per selector)
 * - Unselected items: assigned to payer (tag="unselected")
 *
 * Remainders stay within the item (at most |selectors|-1 tugriks of drift)
 * via `distributeEvenly`, so totals never drift across items.
 */
export function calculateSplit(split: Split): CalculationResults | null {
	const allConfirmed = split.participants.every(
		(p) => split.selections[p.name]?.confirmed,
	);

	if (!allConfirmed) return null;

	const results: ParticipantResult[] = split.participants.map((p) => ({
		name: p.name,
		items: [],
		subtotal: 0,
		rounded: 0,
	}));

	for (const item of split.items) {
		if (item.tag === "service") {
			// Service split among ALL participants with exact remainder distribution
			const shares = distributeEvenly(item.amount, split.participants.length);
			for (let i = 0; i < split.participants.length; i++) {
				results[i].items.push({
					name: item.name,
					amount: shares[i],
					tag: "service",
				});
				results[i].subtotal += shares[i];
			}
			continue;
		}

		// Find who selected this item
		const selectors = split.participants
			.map((p, i) => ({ name: p.name, index: i }))
			.filter(({ name }) =>
				split.selections[name]?.selectedItemIds.includes(item.id),
			);

		if (selectors.length === 0) {
			// Nothing selected — assign to payer
			const payerIndex = results.findIndex((r) => r.name === split.payer);
			if (payerIndex >= 0) {
				results[payerIndex].items.push({
					name: item.name,
					amount: item.amount,
					tag: "unselected",
				});
				results[payerIndex].subtotal += item.amount;
			}
			continue;
		}

		// All remaining items (shared, individual, alcohol) are divided among
		// selectors.  This guarantees every item is allocated exactly once
		// so grandTotal always equals the bill total.
		const shares = distributeEvenly(item.amount, selectors.length);
		for (let j = 0; j < selectors.length; j++) {
			const idx = selectors[j].index;
			results[idx].items.push({
				name: item.name,
				amount: shares[j],
				tag: item.tag,
			});
			results[idx].subtotal += shares[j];
		}
	}

	const grandTotal = results.reduce((s, r) => s + r.subtotal, 0);
	return { participantResults: results, grandTotal };
}

/**
 * Apply rounding to all results.
 * The surplus/deficit goes to the payer.
 */
export function applyRounding(
	results: ParticipantResult[],
	payer: string,
	unit: number,
): { results: ParticipantResult[]; diff: number } {
	const rounded = results.map((r) => ({
		...r,
		rounded:
			r.name === payer || unit === 0
				? r.subtotal
				: Math.round(r.subtotal / unit) * unit,
	}));

	const totalRounded = rounded.reduce((s, r) => s + r.rounded, 0);
	const grandTotal = results.reduce((s, r) => s + r.subtotal, 0);
	const diff = grandTotal - totalRounded;

	// Adjust payer to absorb the difference
	const payerResult = rounded.find((r) => r.name === payer);
	if (payerResult) {
		payerResult.rounded = payerResult.rounded + diff;
	}

	return { results: rounded, diff };
}
