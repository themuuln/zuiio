/** A button in an inline keyboard. */
export interface InlineButton {
  text: string;
  callbackData: string;
}

/** Options for sending a message. */
export interface SendMessageOptions {
  parseMode?: "HTML" | "Markdown";
  replyToMessageId?: number;
}

/** Generic channel adapter interface. */
export interface Channel {
  /** Send a plain text message. */
  sendMessage(chatId: number | string, text: string, options?: SendMessageOptions): Promise<void>;

  /** Send a message with inline keyboard buttons. */
  sendInlineKeyboard(chatId: number | string, text: string, buttons: InlineButton[][]): Promise<void>;

  /** Respond to a callback query (button tap). */
  answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void>;

  /** Edit a message's text (used after confirmation). */
  editMessageText(chatId: number | string, messageId: number, text: string): Promise<void>;
}

/** Incoming message from a channel. */
export interface IncomingMessage {
  chatId: number;
  userId: number;
  text?: string;
  /** If this is a callback query response (button tap). */
  callbackQuery?: {
    id: string;
    data: string;
    messageId: number;
  };
  /** Voice file ID if the message contains voice. */
  voiceFileId?: string;
}

/** Raw Telegram update from the API. */
export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    from?: { id: number; first_name?: string; last_name?: string };
    text?: string;
    voice?: { file_id: string; duration: number };
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
