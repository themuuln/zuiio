/** Raw Meta webhook entry (Messenger + Instagram). */
export interface MetaWebhookEntry {
	id: string; // page_id
	time: number;
	messaging?: MetaMessagingEvent[];
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
