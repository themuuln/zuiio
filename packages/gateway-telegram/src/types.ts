/** Raw Telegram update from the Bot API webhook. */
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
