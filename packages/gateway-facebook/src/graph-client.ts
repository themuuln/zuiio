import { createHmac } from "node:crypto";

const DEFAULT_GRAPH_API_VERSION = "v25.0";
const DEFAULT_TIMEOUT_MS = 15_000;

export interface MetaTokenResponse {
	accessToken: string;
	expiresIn: number | null;
	tokenType: string | null;
}

export interface MetaManagedPage {
	id: string;
	name: string;
	accessToken: string;
	instagramBusinessAccount?: { id: string };
}

export interface MetaPageInfo {
	id: string;
	name: string;
	instagramBusinessAccount?: { id: string };
}

export interface MetaTokenDebug {
	appId: string | null;
	isValid: boolean;
	expiresAt: number | null;
	userId: string | null;
	scopes: string[];
}

interface MetaErrorEnvelope {
	error?: {
		code?: number;
		error_subcode?: number;
		type?: string;
		is_transient?: boolean;
	};
}

export class MetaGraphError extends Error {
	constructor(
		readonly status: number,
		readonly code: string,
		readonly retryable: boolean,
		readonly requiresReauthorization: boolean,
	) {
		super(`Meta Graph request failed (${code})`);
		this.name = "MetaGraphError";
	}
}

export interface MetaGraphClientOptions {
	appId: string;
	appSecret: string;
	apiVersion?: string;
	baseUrl?: string;
	timeoutMs?: number;
}

/** Server-only Meta Graph API client. Tokens never enter URLs after OAuth exchange. */
export class MetaGraphClient {
	private readonly appId: string;
	private readonly appSecret: string;
	private readonly graphBaseUrl: string;
	private readonly timeoutMs: number;

	constructor(options: MetaGraphClientOptions) {
		this.appId = options.appId;
		this.appSecret = options.appSecret;
		const apiVersion = options.apiVersion ?? DEFAULT_GRAPH_API_VERSION;
		this.graphBaseUrl = options.baseUrl ?? `https://graph.facebook.com/${apiVersion}`;
		this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	}

	private appSecretProof(accessToken: string): string {
		return createHmac("sha256", this.appSecret)
			.update(accessToken)
			.digest("hex");
	}

	private async request<T>(
		path: string,
		options: RequestInit,
		accessToken?: string,
	): Promise<T> {
		const url = new URL(`${this.graphBaseUrl}/${path.replace(/^\//, "")}`);
		const headers = new Headers(options.headers);
		headers.set("Accept", "application/json");
		if (accessToken) {
			headers.set("Authorization", `Bearer ${accessToken}`);
			url.searchParams.set("appsecret_proof", this.appSecretProof(accessToken));
		}

		const response = await fetch(url, {
			...options,
			headers,
			signal: options.signal ?? AbortSignal.timeout(this.timeoutMs),
		});
		if (!response.ok) {
			const envelope = (await response.json().catch(() => ({}))) as MetaErrorEnvelope;
			const graphCode = envelope.error?.code;
			const graphSubcode = envelope.error?.error_subcode;
			const code = graphCode
				? `META_${graphCode}${graphSubcode ? `_${graphSubcode}` : ""}`
				: `META_HTTP_${response.status}`;
			const requiresReauthorization =
				graphCode === 190 || response.status === 401 || response.status === 403;
			throw new MetaGraphError(
				response.status,
				code,
				Boolean(envelope.error?.is_transient) ||
					response.status === 429 ||
					response.status >= 500,
				requiresReauthorization,
			);
		}
		return (await response.json()) as T;
	}

	async exchangeCode(input: {
		code: string;
		redirectUri: string;
	}): Promise<MetaTokenResponse> {
		const query = new URLSearchParams({
			client_id: this.appId,
			client_secret: this.appSecret,
			code: input.code,
			redirect_uri: input.redirectUri,
		});
		const result = await this.request<{
			access_token: string;
			expires_in?: number;
			token_type?: string;
		}>(`oauth/access_token?${query.toString()}`, { method: "GET" });
		return {
			accessToken: result.access_token,
			expiresIn: result.expires_in ?? null,
			tokenType: result.token_type ?? null,
		};
	}

	async exchangeLongLivedToken(shortLivedToken: string): Promise<MetaTokenResponse> {
		const query = new URLSearchParams({
			grant_type: "fb_exchange_token",
			client_id: this.appId,
			client_secret: this.appSecret,
			fb_exchange_token: shortLivedToken,
		});
		const result = await this.request<{
			access_token: string;
			expires_in?: number;
			token_type?: string;
		}>(`oauth/access_token?${query.toString()}`, { method: "GET" });
		return {
			accessToken: result.access_token,
			expiresIn: result.expires_in ?? null,
			tokenType: result.token_type ?? null,
		};
	}

	async listManagedPages(userAccessToken: string): Promise<MetaManagedPage[]> {
		const result = await this.request<{
			data?: Array<{
				id: string;
				name: string;
				access_token: string;
				instagram_business_account?: { id: string };
			}>;
		}>(
			"me/accounts?fields=id,name,access_token,instagram_business_account%7Bid%7D",
			{ method: "GET" },
			userAccessToken,
		);
		return (result.data ?? []).map((page) => ({
			id: page.id,
			name: page.name,
			accessToken: page.access_token,
			instagramBusinessAccount: page.instagram_business_account,
		}));
	}

	async getPageInfo(
		pageId: string,
		pageAccessToken: string,
	): Promise<MetaPageInfo> {
		const result = await this.request<{
			id: string;
			name: string;
			instagram_business_account?: { id: string };
		}>(
			`${encodeURIComponent(pageId)}?fields=id,name,instagram_business_account%7Bid%7D`,
			{ method: "GET" },
			pageAccessToken,
		);
		return {
			id: result.id,
			name: result.name,
			instagramBusinessAccount: result.instagram_business_account,
		};
	}

	async subscribePage(
		pageId: string,
		pageAccessToken: string,
		subscribedFields: string[],
	): Promise<void> {
		await this.request(
			`${encodeURIComponent(pageId)}/subscribed_apps`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ subscribed_fields: subscribedFields }),
			},
			pageAccessToken,
		);
	}

	async sendMessage(input: {
		pageId: string;
		pageAccessToken: string;
		recipientId: string;
		text?: string;
		quickReplies?: Array<{ text: string; callbackData: string }>;
		senderAction?: "typing_on" | "typing_off" | "mark_seen";
	}): Promise<string | null> {
		const payload: Record<string, unknown> = {
			recipient: { id: input.recipientId },
			messaging_type: "RESPONSE",
		};
		if (input.senderAction) {
			payload.sender_action = input.senderAction;
		} else {
			payload.message = {
				text: input.text ?? "",
				...(input.quickReplies?.length
					? {
							quick_replies: input.quickReplies.slice(0, 11).map((reply) => ({
								content_type: "text",
								title: reply.text,
								payload: reply.callbackData,
							})),
						}
					: {}),
			};
		}
		const result = await this.request<{ message_id?: string }>(
			`${encodeURIComponent(input.pageId)}/messages`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			},
			input.pageAccessToken,
		);
		return result.message_id ?? null;
	}

	async sendQuickReplies(input: {
		pageId: string;
		pageAccessToken: string;
		recipientId: string;
		text: string;
		quickReplies: Array<{ text: string; callbackData: string }>;
	}): Promise<string | null> {
		return this.sendMessage(input);
	}

	async debugToken(accessToken: string): Promise<MetaTokenDebug> {
		const appToken = `${this.appId}|${this.appSecret}`;
		const query = new URLSearchParams({ input_token: accessToken });
		const result = await this.request<{
			data?: {
				app_id?: string;
				is_valid?: boolean;
				expires_at?: number;
				user_id?: string;
				scopes?: string[];
			};
		}>(`debug_token?${query.toString()}`, { method: "GET" }, appToken);
		return {
			appId: result.data?.app_id ?? null,
			isValid: result.data?.is_valid ?? false,
			expiresAt: result.data?.expires_at ?? null,
			userId: result.data?.user_id ?? null,
			scopes: result.data?.scopes ?? [],
		};
	}
}
