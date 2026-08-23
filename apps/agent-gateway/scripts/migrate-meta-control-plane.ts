import { createClient, type SupabaseClient } from "@supabase/supabase-js";
// Static imports: both modules are plain server-only helpers, no runtime
// selection involved.
import { decryptSecret } from "../src/lib/crypto";
import { encryptMetaSecret } from "../src/lib/meta-token-crypto";

interface SourceConnection {
	id: string;
	organization_id: string;
	channel: string;
	page_id: string | null;
	page_name: string | null;
	page_access_token: string | null;
	token_expires_at: string | null;
	product_type: string;
	user_id: string | null;
	webhook_subscribed_at: string | null;
	is_active: boolean;
}

interface SourceSession {
	id: string;
	organization_id: string;
	telegram_chat_id: number;
	telegram_user_id: number;
	messages: unknown;
	token_count: number;
	updated_at: string;
}

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is required`);
	return value;
}

function controlClient(): SupabaseClient {
	return createClient(
		requireEnv("GATEWAY_SUPABASE_URL"),
		requireEnv("GATEWAY_SUPABASE_SECRET_KEY"),
		{ auth: { persistSession: false, autoRefreshToken: false } },
	);
}

function sourceClient(): SupabaseClient {
	return createClient(
		requireEnv("SOURCE_ZER_SUPABASE_URL"),
		requireEnv("SOURCE_ZER_SERVICE_ROLE_KEY"),
		{ auth: { persistSession: false, autoRefreshToken: false } },
	);
}

function reencrypt(encryptedValue: string | null): string | null {
	if (!encryptedValue) return null;
	if (!encryptedValue.startsWith("enc:v1:")) {
		throw new Error(`SOURCE_PLAINTEXT_TOKEN:${encryptedValue.slice(0, 12)}`);
	}
	let plaintext: string;
	try {
		plaintext = decryptSecret(encryptedValue);
	} catch {
		throw new Error(`SOURCE_DECRYPT_FAILED:${encryptedValue.slice(0, 12)}`);
	}
	return encryptMetaSecret(plaintext);
}

async function migrateConnections(
	source: SupabaseClient,
	control: SupabaseClient,
	dryRun: boolean,
): Promise<number> {
	const { data, error } = await source
		.from("channel_connections")
		.select(
			"id, organization_id, channel, page_id, page_name, page_access_token, token_expires_at, product_type, user_id, webhook_subscribed_at, is_active",
		)
		.in("channel", ["messenger", "instagram"]);
	if (error) throw new Error(`SOURCE_READ_FAILED:${error.message}`);

	const conflicts: string[] = [];
	for (const row of (data ?? []) as SourceConnection[]) {
		if (!row.page_id) continue;
		const { data: existing } = await control
			.from("channel_installations")
			.select("id, tenant_id")
			.eq("provider", "meta")
			.eq("external_account_id", row.page_id)
			.maybeSingle();
		if (existing) {
			conflicts.push(
				`PAGE_CONFLICT source=${row.id} page=${row.page_id} existing_installation=${existing.id}`,
			);
			continue;
		}
		if (dryRun) continue;

		const encryptedPage = await reencrypt(row.page_access_token);
		if (!encryptedPage) {
			conflicts.push(`MISSING_PAGE_TOKEN source=${row.id}`);
			continue;
		}
		const { data: tenant, error: tenantError } = await control
			.from("tenants")
			.upsert(
				{
					product_type:
						row.product_type === "tolom" || row.product_type === "zatly"
							? row.product_type
							: "zer",
					external_organization_id: row.organization_id,
					status: "active",
				},
				{ onConflict: "product_type,external_organization_id" },
			)
			.select("id")
			.single();
		if (tenantError || !tenant) {
			conflicts.push(`TENANT_UPSERT_FAILED source=${row.id}`);
			continue;
		}
		const status = row.is_active ? "reauthorization_required" : "disabled";
		const { data: installation, error: installError } = await control
			.from("channel_installations")
			.insert({
				tenant_id: tenant.id,
				provider: "meta",
				external_account_id: row.page_id,
				display_name: row.page_name ?? row.page_id,
				status,
				connected_by: row.user_id ?? "migration",
			})
			.select("id")
			.single();
		if (installError || !installation) {
			conflicts.push(`INSTALLATION_INSERT_FAILED source=${row.id}`);
			continue;
		}
		await control.from("channel_endpoints").insert({
			installation_id: installation.id,
			channel: row.channel,
			external_endpoint_id: row.page_id,
			external_parent_id: row.page_id,
			status: row.is_active ? "active" : "disabled",
			webhook_subscribed_at: row.webhook_subscribed_at ?? null,
		});
		await control.from("provider_credentials").insert({
			installation_id: installation.id,
			credential_type: "meta_page_access_token",
			encrypted_value: encryptedPage,
			key_version: Number(
				process.env.META_TOKEN_ENCRYPTION_ACTIVE_VERSION ?? "1",
			),
			expires_at: row.token_expires_at,
			status: row.is_active ? "reauthorization_required" : "revoked",
		});
	}
	if (conflicts.length > 0) {
		process.stderr.write(`${conflicts.join("\n")}\n`);
		throw new Error(`MIGRATION_CONFLICTS:${conflicts.length}`);
	}
	return (data ?? []).length;
}

async function migrateSessions(
	source: SupabaseClient,
	control: SupabaseClient,
	dryRun: boolean,
): Promise<number> {
	const since = new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString();
	const { data, error } = await source
		.from("agent_sessions")
		.select(
			"id, organization_id, telegram_chat_id, telegram_user_id, messages, token_count, updated_at",
		)
		.gte("updated_at", since);
	if (error) throw new Error(`SOURCE_SESSIONS_FAILED:${error.message}`);
	if (dryRun) return (data ?? []).length;

	for (const row of (data ?? []) as SourceSession[]) {
		const { data: tenant } = await control
			.from("tenants")
			.select("id")
			.eq("product_type", "zer")
			.eq("external_organization_id", row.organization_id)
			.maybeSingle();
		if (!tenant) continue;
		const { data: conversation } = await control
			.from("conversations")
			.upsert(
				{
					tenant_id: tenant.id,
					endpoint_id: `legacy:telegram:${row.telegram_chat_id}`,
					external_user_id: String(row.telegram_user_id),
					audience: "internal",
					status: "closed",
					last_inbound_at: row.updated_at,
				},
				{ onConflict: "endpoint_id,external_user_id" },
			)
			.select("id")
			.maybeSingle();
		if (!conversation) continue;
		const messages = Array.isArray(row.messages) ? row.messages : [];
		for (const message of messages) {
			const entry = message as { role?: string; content?: unknown };
			if (typeof entry.role !== "string") continue;
			await control.from("conversation_messages").insert({
				conversation_id: conversation.id,
				direction: entry.role === "user" ? "inbound" : "outbound",
				kind: "text",
				content: { text: String(entry.content ?? "") },
				trace_id: "migration",
			});
		}
	}
	return (data ?? []).length;
}

async function main(): Promise<void> {
	const dryRun = process.argv.includes("--dry-run");
	const source = sourceClient();
	const control = controlClient();
	const connections = await migrateConnections(source, control, dryRun);
	const sessions = await migrateSessions(source, control, dryRun);
	process.stdout.write(
		`${dryRun ? "DRY-RUN" : "MIGRATED"} meta_connections=${connections} recent_sessions=${sessions}\n`,
	);
}

main().catch((error: unknown) => {
	process.stderr.write(
		`migrate-meta-control-plane failed: ${error instanceof Error ? error.message : "unknown"}\n`,
	);
	process.exit(1);
});
