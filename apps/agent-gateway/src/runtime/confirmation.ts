/**
 * Confirmation gate for write tools.
 * Stages an action, waits for user confirmation via channel-appropriate UI,
 * then commits or rejects.
 *
 * Channel behavior:
 * - Telegram: Inline Keyboard buttons
 * - Messenger/Instagram: Quick Replies
 */

export interface StagedAction {
	nonce: string;
	toolName: string;
	args: Record<string, unknown>;
	channel: string;
	channelChatId: string;
	channelUserId: string;
	summary: string;
	pageId?: string;
	pageAccessToken?: string;
}

// In-memory store for staged actions (replace with Redis in production)
const stagedActions = new Map<string, StagedAction>();

const nonceTimoutMs = 5 * 60 * 1000; // 5 minutes

/**
 * Stage a write action for user confirmation.
 * Returns the confirmation buttons appropriate for the channel.
 */
export function stageAction(
	toolName: string,
	args: Record<string, unknown>,
	channel: string,
	channelChatId: string,
	channelUserId: string,
	summary: string,
	pageId?: string,
	pageAccessToken?: string,
): {
	nonce: string;
	buttons: Array<Array<{ text: string; callbackData: string }>>;
} {
	const nonce = crypto.randomUUID();

	stagedActions.set(nonce, {
		nonce,
		toolName,
		args,
		channel,
		channelChatId,
		channelUserId,
		summary,
		pageId,
		pageAccessToken,
	});

	// Auto-expire
	setTimeout(() => {
		stagedActions.delete(nonce);
	}, nonceTimoutMs);

	return {
		nonce,
		buttons: [
			[
				{ text: "✅ Тийм", callbackData: `confirm:${nonce}` },
				{ text: "❌ Үгүй", callbackData: `reject:${nonce}` },
			],
		],
	};
}

/**
 * Confirm a staged action. Returns the action if valid, null if expired/invalid.
 */
export function confirmAction(
	nonce: string,
	channelChatId: string,
	channelUserId: string,
): StagedAction | null {
	const action = stagedActions.get(nonce);
	if (!action) return null;
	if (action.channelChatId !== channelChatId) return null;
	if (action.channelUserId !== channelUserId) return null;

	stagedActions.delete(nonce);
	return action;
}

/**
 * Reject a staged action. Cleans up the stored nonce.
 */
export function rejectAction(nonce: string): void {
	stagedActions.delete(nonce);
}
