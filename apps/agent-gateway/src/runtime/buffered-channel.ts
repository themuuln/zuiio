import type {
	Channel,
	InlineButton,
	OutboundIntent,
	SendMessageOptions,
} from "@zuiio/gateway-core";

/** Channel implementation for flow/agent code: records intents, never sends IO. */
export class BufferedChannel implements Channel {
	readonly intents: OutboundIntent[] = [];

	constructor(
		private readonly conversationId: string,
		private readonly sourceEventId: string | null,
		private readonly traceId: string,
	) {}

	sendMessage(
		_chatId: number | string,
		text: string,
		options?: SendMessageOptions,
	): Promise<boolean> {
		this.intents.push({
			conversationId: this.conversationId,
			kind: options?.quickReplies?.length ? "quick_replies" : "text",
			text,
			quickReplies: options?.quickReplies,
			sourceEventId: this.sourceEventId,
			traceId: this.traceId,
		});
		return Promise.resolve(true);
	}

	sendInlineKeyboard(
		_chatId: number | string,
		text: string,
		buttons: InlineButton[][],
	): Promise<void> {
		this.intents.push({
			conversationId: this.conversationId,
			kind: "quick_replies",
			text,
			quickReplies: buttons.flat(),
			sourceEventId: this.sourceEventId,
			traceId: this.traceId,
		});
		return Promise.resolve();
	}

	answerCallbackQuery(_callbackQueryId: string, _text?: string): Promise<void> {
		return Promise.resolve();
	}

	editMessageText(
		_chatId: number | string,
		_messageId: number,
		text: string,
	): Promise<void> {
		return this.sendMessage(_chatId, text).then(() => undefined);
	}
}
