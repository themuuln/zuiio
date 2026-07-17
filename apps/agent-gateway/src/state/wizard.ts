import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
	getCachedWizard,
	invalidateCachedWizard,
	setCachedWizard,
} from "@/lib/cache";

export interface WizardState {
	type: string;
	step: number;
	data: Record<string, unknown>;
	startedAt: string;
}

const WIZARD_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Get active wizard state for a user session.
 * Checks Redis cache first, falls back to Supabase.
 */
export async function getWizardState(
	sb: SupabaseClient,
	orgId: string,
	channelChatId: string,
	channelUserId: string,
	channel: string,
): Promise<WizardState | null> {
	// Step 1: Check Redis cache
	const cached = await getCachedWizard<WizardState>(
		orgId,
		channelChatId,
		channelUserId,
		channel,
	);
	if (cached) {
		// Check TTL even for cached entries
		if (Date.now() - new Date(cached.startedAt).getTime() > WIZARD_TTL_MS) {
			await clearWizardState(sb, orgId, channelChatId, channelUserId, channel);
			return null;
		}
		return cached;
	}

	// Step 2: Fall back to Supabase
	try {
		const key = `wizard_${orgId}_${channelChatId}_${channelUserId}_${channel}`;
		const { data } = await sb
			.from("app_config")
			.select("value")
			.eq("key", key)
			.single();

		if (!data?.value) return null;

		const state = data.value as unknown as WizardState;
		// Check TTL
		if (Date.now() - new Date(state.startedAt).getTime() > WIZARD_TTL_MS) {
			await clearWizardState(sb, orgId, channelChatId, channelUserId, channel);
			return null;
		}

		// Step 3: Populate cache
		await setCachedWizard(orgId, channelChatId, channelUserId, channel, state);

		return state;
	} catch {
		return null;
	}
}

/**
 * Save wizard state to Supabase and Redis.
 */
export async function saveWizardState(
	sb: SupabaseClient,
	orgId: string,
	channelChatId: string,
	channelUserId: string,
	channel: string,
	state: WizardState,
): Promise<void> {
	const key = `wizard_${orgId}_${channelChatId}_${channelUserId}_${channel}`;
	await Promise.all([
		sb.from("app_config").upsert(
			{ key, value: state as unknown as Record<string, unknown> },
			{
				onConflict: "key",
			},
		),
		setCachedWizard(orgId, channelChatId, channelUserId, channel, state),
	]);
}

/**
 * Clear wizard state from Supabase and Redis.
 */
export async function clearWizardState(
	sb: SupabaseClient,
	orgId: string,
	channelChatId: string,
	channelUserId: string,
	channel: string,
): Promise<void> {
	const key = `wizard_${orgId}_${channelChatId}_${channelUserId}_${channel}`;
	await Promise.all([
		sb.from("app_config").delete().eq("key", key),
		invalidateCachedWizard(orgId, channelChatId, channelUserId, channel),
	]);
}
