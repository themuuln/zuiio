import type { TelegramChannel } from "./channel";

/**
 * Start a typing indicator loop that refreshes every 4 seconds.
 * Returns a stop function — call it when the operation completes.
 *
 * Usage:
 *   const stop = startTypingLoop(tg, chatId);
 *   try { ... } finally { stop(); }
 */
export function startTypingLoop(
	tg: TelegramChannel,
	chatId: number | string,
): () => void {
	// Send initial action immediately
	tg.sendChatAction(chatId, "typing").catch(() => {});

	// Refresh every 4s (expires after 5s, so 1s safety margin)
	const interval = setInterval(() => {
		tg.sendChatAction(chatId, "typing").catch(() => {});
	}, 4000);

	return () => clearInterval(interval);
}
