import "server-only";

import type { GatewayControlClient } from "@/lib/gateway-control-client";

export interface MetaOAuthPageSecret {
	id: string;
	name: string;
	accessToken: string;
	instagramBusinessAccountId: string | null;
}

export interface MetaOAuthPayload {
	userAccessToken: string;
	userTokenExpiresAt: string | null;
	pages: MetaOAuthPageSecret[];
}

export interface MetaOAuthTransaction {
	id: string;
	tenant_id: string;
	requested_by: string;
	status: "pending" | "authorized" | "selected" | "expired" | "failed";
	encrypted_payload: string | null;
	error_code: string | null;
	expires_at: string;
}

export interface SafeInstallation {
	id: string;
	status: string;
	displayName: string;
	channels: string[];
	connectedAt: string;
	webhookSubscribedAt: string | null;
	tokenExpiresAt: string | null;
}

export class OAuthRepositoryError extends Error {
	constructor(
		readonly code: string,
		readonly status: number,
	) {
		super(code);
		this.name = "OAuthRepositoryError";
	}
}

function ensureData<T>(
	data: T | null,
	error: { code?: string } | null,
	code: string,
): T {
	if (error || data === null) throw new OAuthRepositoryError(code, 500);
	return data;
}

export class MetaOAuthRepository {
	constructor(private readonly client: GatewayControlClient) {}

	async consumeServiceNonce(input: {
		clientId: string;
		nonce: string;
		expiresAt: string;
	}): Promise<boolean> {
		const { data, error } = await this.client.rpc("consume_service_nonce", {
			p_client_id: input.clientId,
			p_nonce: input.nonce,
			p_expires_at: input.expiresAt,
		});
		if (error) throw new OAuthRepositoryError("NONCE_STORE_FAILED", 500);
		return data === true;
	}

	async upsertTenant(organizationId: string): Promise<string> {
		const { data, error } = await this.client
			.from("tenants")
			.upsert(
				{
					product_type: "zer",
					external_organization_id: organizationId,
					status: "active",
				},
				{ onConflict: "product_type,external_organization_id" },
			)
			.select("id")
			.single();
		return ensureData(
			data as { id: string } | null,
			error,
			"TENANT_UPSERT_FAILED",
		).id;
	}

	async createTransaction(input: {
		tenantId: string;
		requestedBy: string;
		stateDigest: string;
		expiresAt: string;
	}): Promise<void> {
		const { error } = await this.client.from("oauth_transactions").insert({
			tenant_id: input.tenantId,
			requested_by: input.requestedBy,
			provider: "meta",
			state_digest: input.stateDigest,
			status: "pending",
			expires_at: input.expiresAt,
		});
		if (error)
			throw new OAuthRepositoryError("OAUTH_TRANSACTION_CREATE_FAILED", 500);
	}

	async claimState(stateDigest: string): Promise<MetaOAuthTransaction | null> {
		const { data, error } = await this.client
			.from("oauth_transactions")
			.update({ status: "authorized" })
			.eq("state_digest", stateDigest)
			.eq("status", "pending")
			.gt("expires_at", new Date().toISOString())
			.select(
				"id, tenant_id, requested_by, status, encrypted_payload, error_code, expires_at",
			)
			.maybeSingle();
		if (error) throw new OAuthRepositoryError("OAUTH_STATE_CLAIM_FAILED", 500);
		return data as MetaOAuthTransaction | null;
	}

	async setAuthorizedPayload(input: {
		transactionId: string;
		selectionDigest: string;
		encryptedPayload: string;
	}): Promise<void> {
		const { error } = await this.client
			.from("oauth_transactions")
			.update({
				selection_digest: input.selectionDigest,
				encrypted_payload: input.encryptedPayload,
				status: "authorized",
				error_code: null,
			})
			.eq("id", input.transactionId)
			.eq("status", "authorized");
		if (error)
			throw new OAuthRepositoryError("OAUTH_PAYLOAD_STORE_FAILED", 500);
	}

	async markFailure(input: {
		transactionId: string;
		selectionDigest: string;
		errorCode: string;
	}): Promise<void> {
		const { error } = await this.client
			.from("oauth_transactions")
			.update({
				selection_digest: input.selectionDigest,
				status: "failed",
				error_code: input.errorCode,
			})
			.eq("id", input.transactionId)
			.eq("status", "authorized");
		if (error) {
			throw new OAuthRepositoryError("OAUTH_FAILURE_STORE_FAILED", 500);
		}
	}

	async getBySelection(
		selectionDigest: string,
		requestedBy: string,
	): Promise<MetaOAuthTransaction | null> {
		const { data, error } = await this.client
			.from("oauth_transactions")
			.select(
				"id, tenant_id, requested_by, status, encrypted_payload, error_code, expires_at",
			)
			.eq("selection_digest", selectionDigest)
			.eq("requested_by", requestedBy)
			.gt("expires_at", new Date().toISOString())
			.maybeSingle();
		if (error)
			throw new OAuthRepositoryError("OAUTH_TRANSACTION_READ_FAILED", 500);
		return data as MetaOAuthTransaction | null;
	}

	async completeInstallation(input: {
		transactionId: string;
		tenantId: string;
		requestedBy: string;
		page: MetaOAuthPageSecret;
		encryptedPageToken: string;
		encryptedUserToken: string;
		keyVersion: number;
		userTokenExpiresAt: string | null;
		enableInstagram: boolean;
	}): Promise<{ installationId: string; status: string }> {
		const { data, error } = await this.client.rpc("complete_meta_oauth", {
			p_transaction_id: input.transactionId,
			p_tenant_id: input.tenantId,
			p_requested_by: input.requestedBy,
			p_page_id: input.page.id,
			p_page_name: input.page.name,
			p_encrypted_page_token: input.encryptedPageToken,
			p_encrypted_user_token: input.encryptedUserToken,
			p_key_version: input.keyVersion,
			p_user_token_expires_at: input.userTokenExpiresAt,
			p_instagram_account_id: input.enableInstagram
				? input.page.instagramBusinessAccountId
				: null,
		});
		if (error?.code === "23505") {
			throw new OAuthRepositoryError("PAGE_ALREADY_CONNECTED", 409);
		}
		const row = ensureData(
			(Array.isArray(data) ? data[0] : data) as {
				installation_id: string;
				status: string;
			} | null,
			error,
			"OAUTH_COMPLETE_FAILED",
		);
		return { installationId: row.installation_id, status: row.status };
	}

	async findTenantId(organizationId: string): Promise<string | null> {
		const { data, error } = await this.client
			.from("tenants")
			.select("id")
			.eq("product_type", "zer")
			.eq("external_organization_id", organizationId)
			.maybeSingle();
		if (error) throw new OAuthRepositoryError("TENANT_READ_FAILED", 500);
		return (data as { id?: string } | null)?.id ?? null;
	}

	async listInstallations(tenantId: string): Promise<SafeInstallation[]> {
		const { data, error } = await this.client
			.from("channel_installations")
			.select(
				"id, status, display_name, created_at, channel_endpoints(channel, webhook_subscribed_at), provider_credentials(credential_type, expires_at)",
			)
			.eq("tenant_id", tenantId)
			.order("created_at", { ascending: false });
		if (error) throw new OAuthRepositoryError("INSTALLATION_LIST_FAILED", 500);
		return (data ?? []).map((raw) => {
			const row = raw as unknown as {
				id: string;
				status: string;
				display_name: string;
				created_at: string;
				channel_endpoints: Array<{
					channel: string;
					webhook_subscribed_at: string | null;
				}>;
				provider_credentials: Array<{
					credential_type: string;
					expires_at: string | null;
				}>;
			};
			return {
				id: row.id,
				status: row.status,
				displayName: row.display_name,
				channels: row.channel_endpoints.map((endpoint) => endpoint.channel),
				connectedAt: row.created_at,
				webhookSubscribedAt:
					row.channel_endpoints.find(
						(endpoint) => endpoint.webhook_subscribed_at !== null,
					)?.webhook_subscribed_at ?? null,
				tokenExpiresAt:
					row.provider_credentials.find(
						(credential) =>
							credential.credential_type === "meta_user_access_token",
					)?.expires_at ?? null,
			};
		});
	}
}
