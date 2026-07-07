import type { Split } from "@/lib/store";

/** Participants who have confirmed their selection. */
export function getConfirmedParticipants(split: Split) {
	return split.participants.filter((p) => split.selections[p.name]?.confirmed);
}

/** Participants who have NOT yet confirmed (may or may not have saved). */
export function getPendingParticipants(split: Split) {
	return split.participants.filter((p) => !split.selections[p.name]?.confirmed);
}

/** True when every participant has confirmed. */
export function isSplitReadyForReview(split: Split): boolean {
	return split.participants.every((p) => split.selections[p.name]?.confirmed);
}

/** Total bill amount across all items. */
export function getSplitTotal(split: Split): number {
	return split.items.reduce((s, i) => s + i.amount, 0);
}

/** Count of confirmed participants (literal number). */
export function getConfirmedCount(split: Split): number {
	return getConfirmedParticipants(split).length;
}

/** Count of total participants. */
export function getParticipantCount(split: Split): number {
	return split.participants.length;
}
