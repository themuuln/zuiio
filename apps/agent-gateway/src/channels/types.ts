/** A button in an inline keyboard / quick reply. */
export interface InlineButton {
	text: string;
	callbackData: string;
}

/** Options for sending a message. */
export interface SendMessageOptions {
	parseMode?: "HTML" | "Markdown";
	replyToMessageId?: number;
	/** Channel-specific: Messenger quick replies, Instagram quick replies */
	quickReplies?: InlineButton[];
}

/** Generic channel adapter interface. */
export interface Channel {
	/** Page credentials for Meta channels (Messenger/Instagram). Optional for Telegram. */
	pageId?: string;
	pageAccessToken?: string;

	/** Send a plain text message. Returns false when the channel failed to send. */
	sendMessage(
		chatId: number | string,
		text: string,
		options?: SendMessageOptions,
	): Promise<boolean>;

	/** Send a message with inline keyboard buttons. */
	sendInlineKeyboard(
		chatId: number | string,
		text: string,
		buttons: InlineButton[][],
	): Promise<void>;

	/** Respond to a callback query (button tap). No-op for channels without callbacks. */
	answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void>;

	/** Edit a message's text. No-op for channels without editing. */
	editMessageText(
		chatId: number | string,
		messageId: number,
		text: string,
	): Promise<void>;
	/** Send a document/file. Optional — not all channels support it. */
	sendDocument?(
		chatId: number | string,
		fileBuffer: Buffer,
		filename: string,
		caption?: string,
	): Promise<void>;
}

/** Incoming message from any channel. */
export interface IncomingMessage {
	/** Channel-specific ID: number for Telegram, string for FB/IG */
	chatId: number | string;
	/** Channel-specific user ID: number for Telegram, string for FB/IG */
	userId: number | string;
	/** The messaging channel */
	channel: "telegram" | "messenger" | "instagram" | "whatsapp";
	text?: string;
	/** If this is a callback query response (button tap) — Telegram only */
	callbackQuery?: {
		id: string;
		data: string;
		messageId: number;
	};
	/** Voice file ID if the message contains voice */
	voiceFileId?: string;
	/** FB/IG: page ID that received the message */
	pageId?: string;
	/** FB/IG: page access token for sending replies */
	pageAccessToken?: string;
}

/** Raw Telegram update from the API. */
export interface TelegramUpdate {
	update_id: number;
	message?: {
		message_id: number;
		chat: { id: number; type: string };
		from?: {
			id: number;
			first_name?: string;
			last_name?: string;
			username?: string;
		};
		text?: string;
		voice?: { file_id: string; duration: number };
		photo?: Array<{
			file_id: string;
			file_size?: number;
			width?: number;
			height?: number;
		}>;
		caption?: string;
	};
	callback_query?: {
		id: string;
		from: { id: number };
		message?: {
			message_id: number;
			chat: { id: number };
		};
		data?: string;
	};
}

/** A Page feed change value from the "feed" webhook field (comments, posts, reactions). */
export interface MetaFeedChangeValue {
	item: string; // "comment" | "post" | "reaction" | "share" | "video" | ...
	verb: string; // "add" | "edited" | "remove" | ...
	created_time?: number;
	comment_id?: string;
	post_id?: string;
	/** Set when the comment is a reply to another comment. */
	parent_id?: string;
	from?: { id: string; name?: string };
	message?: string;
	permalink_url?: string;
	reaction_type?: string;
	photo_id?: string;
	video_id?: string;
}

/** A single feed change entry from the Page webhook. */
export interface MetaFeedChange {
	field: string;
	value: MetaFeedChangeValue;
}

/** Raw Meta webhook entry (Messenger + Instagram + Page feed). */
export interface MetaWebhookEntry {
	id: string; // page_id
	time: number;
	messaging?: MetaMessagingEvent[];
	changes?: MetaFeedChange[];
}

/** A single messaging event from Meta webhook. */
export interface MetaMessagingEvent {
	sender: { id: string }; // PSID or IGSID
	recipient: { id: string }; // page_id
	timestamp: number;
	message?: {
		mid?: string;
		text?: string;
		attachments?: Array<{
			type: string;
			payload?: { url?: string };
		}>;
		quick_reply?: { payload: string };
		is_echo?: boolean;
	};
	postback?: {
		title: string;
		payload: string;
	};
}

/** Full Meta webhook payload. */
export interface MetaWebhookPayload {
	object: "page";
	entry: MetaWebhookEntry[];
}
