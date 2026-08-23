import { capture } from "@zuiio/capture";
import type { Channel, InlineButton, SendMessageOptions } from "@zuiio/gateway-core";
import {
	MetaGraphClient,
	MetaGraphError,
	type MetaPageInfo,
} from "./graph-client";

export interface FacebookChannelOptions {
	pageId: string;
	pageAccessToken: string;
	client?: MetaGraphClient;
	appId?: string;
	appSecret?: string;
	apiVersion?: string;
}

/** Messenger and Instagram adapter with method-local credential access. */
export class FacebookChannel implements Channel {
	private readonly pageId: string;
	private readonly pageAccessToken: string;
	private readonly client: MetaGraphClient;

	constructor(options: FacebookChannelOptions) {
		this.pageId = options.pageId;
		this.pageAccessToken = options.pageAccessToken;
		this.client =
			options.client ??
			new MetaGraphClient({
				appId:
					options.appId ??
					process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ??
					process.env.FB_APP_ID ??
					"",
				appSecret: options.appSecret ?? process.env.FB_APP_SECRET ?? "",
				apiVersion: options.apiVersion ?? process.env.FB_GRAPH_API_VERSION,
			});
	}

	private captureFailure(operation: string, error: unknown): void {
		const safeError =
			error instanceof MetaGraphError
				? new Error(`${operation} failed: ${error.code}`)
				: new Error(`${operation} failed`);
		capture(safeError, {
			context: "gateway-facebook",
			operation,
			...(error instanceof MetaGraphError
				? {
						status: error.status,
						code: error.code,
						retryable: error.retryable,
					}
				: {}),
		});
	}

	async sendMessage(
		chatId: number | string,
		text: string,
		options?: SendMessageOptions,
	): Promise<boolean> {
		try {
			await this.client.sendMessage({
				pageId: this.pageId,
				pageAccessToken: this.pageAccessToken,
				recipientId: String(chatId),
				text,
				quickReplies: options?.quickReplies,
			});
			return true;
		} catch (error) {
			this.captureFailure("send_message", error);
			return false;
		}
	}

	async sendInlineKeyboard(
		chatId: number | string,
		text: string,
		buttons: InlineButton[][],
	): Promise<void> {
		try {
			await this.client.sendQuickReplies({
				pageId: this.pageId,
				pageAccessToken: this.pageAccessToken,
				recipientId: String(chatId),
				text,
				quickReplies: buttons.flat(),
			});
		} catch (error) {
			this.captureFailure("send_quick_replies", error);
		}
	}

	async answerCallbackQuery(
		_callbackQueryId: string,
		_text?: string,
	): Promise<void> {}

	async editMessageText(
		chatId: number | string,
		_messageId: number,
		text: string,
	): Promise<void> {
		await this.sendMessage(chatId, `(засварласан) ${text}`);
	}

	async sendConfirmation(
		chatId: number | string,
		text: string,
		confirmationId: string,
	): Promise<void> {
		await this.sendInlineKeyboard(chatId, text, [
			[
				{
					text: "✅ Баталгаажуулах",
					callbackData: `confirm:${confirmationId}`,
				},
				{ text: "❌ Цуцлах", callbackData: `reject:${confirmationId}` },
			],
		]);
	}

	async subscribeToWebhook(
		subscribedFields = ["messages", "messaging_postbacks"],
	): Promise<boolean> {
		try {
			await this.client.subscribePage(
				this.pageId,
				this.pageAccessToken,
				subscribedFields,
			);
			return true;
		} catch (error) {
			this.captureFailure("subscribe_page", error);
			return false;
		}
	}

	async getPageInfo(): Promise<MetaPageInfo | null> {
		try {
			return await this.client.getPageInfo(
				this.pageId,
				this.pageAccessToken,
			);
		} catch (error) {
			this.captureFailure("get_page_info", error);
			return null;
		}
	}

	async sendSenderAction(
		recipientId: string,
		action: "typing_on" | "typing_off" | "mark_seen",
	): Promise<void> {
		try {
			await this.client.sendMessage({
				pageId: this.pageId,
				pageAccessToken: this.pageAccessToken,
				recipientId,
				senderAction: action,
			});
		} catch (error) {
			this.captureFailure("send_sender_action", error);
		}
	}
}
