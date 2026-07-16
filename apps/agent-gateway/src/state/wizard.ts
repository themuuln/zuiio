import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export interface WizardState {
	type: string;
	step: number;
	data: Record<string, unknown>;
	startedAt: string;
}

const WIZARD_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Get active wizard state for a user session.
 */
export async function getWizardState(
	sb: SupabaseClient,
	orgId: string,
	channelChatId: string,
	channelUserId: string,
	channel: string,
): Promise<WizardState | null> {
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
		return state;
	} catch {
		return null;
	}
}

/**
 * Save wizard state.
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
	await sb
		.from("app_config")
		.upsert({ key, value: state as unknown as Record<string, unknown> }, {
			onConflict: "key",
		});
}

/**
 * Clear wizard state.
 */
export async function clearWizardState(
	sb: SupabaseClient,
	orgId: string,
	channelChatId: string,
	channelUserId: string,
	channel: string,
): Promise<void> {
	const key = `wizard_${orgId}_${channelChatId}_${channelUserId}_${channel}`;
	await sb.from("app_config").delete().eq("key", key);
}
