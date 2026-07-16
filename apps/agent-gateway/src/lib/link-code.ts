import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";

const CODE_EXPIRY_MS = 10 * 60 * 1000;
const CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 8;

interface TelegramLinkIdentity {
	telegramChatId: number;
	telegramUserId: number;
	telegramUsername?: string;
	firstName?: string;
	lastName?: string;
}

function hashCode(code: string): string {
	return createHash("sha256").update(code).digest("hex");
}

export async function createLinkCode(
	supabase: SupabaseClient,
	orgId: string,
	userId: string,
	productType: string,
): Promise<{ code: string; formatted: string } | null> {
	const bytes = randomBytes(8);
	const chars: string[] = [];
	for (let i = 0; i < CODE_LENGTH; i++) {
		chars.push(CHARS[bytes[i]! % CHARS.length]!);
	}
	const code = chars.join("");

	const { error } = await supabase.from("one_time_tokens").insert({
		token_hash: hashCode(code),
		organization_id: orgId,
		user_id: userId,
		product_type: productType,
		expires_at: new Date(Date.now() + CODE_EXPIRY_MS).toISOString(),
	});

	if (error) {
		capture(error, { context: "agent-gateway: create link code" });
		return null;
	}

	return { code, formatted: `${code.slice(0, 4)}-${code.slice(4, 8)}` };
}

export async function redeemLinkCode(
	supabase: SupabaseClient,
	rawInput: string,
	identity: TelegramLinkIdentity,
): Promise<{
	orgId: string;
	userId: string;
	productType: "tolom" | "zer";
} | null> {
	const code = rawInput.replace(/[\s-]/g, "").toUpperCase();
	if (code.length !== CODE_LENGTH) return null;

	const { data, error } = await supabase
		.from("one_time_tokens")
		.select("*")
		.eq("token_hash", hashCode(code))
		.is("used_at", null)
		.single();

	if (error || !data) return null;
	if (new Date(data.expires_at) < new Date()) {
		await supabase.from("one_time_tokens").delete().eq("id", data.id);
		return null;
	}

	const productType = data.product_type as "tolom" | "zer";
	const now = new Date().toISOString();

	await supabase
		.from("telegram_links")
		.update({ is_active: false, updated_at: now })
		.eq("telegram_chat_id", identity.telegramChatId)
		.eq("telegram_user_id", identity.telegramUserId)
		.eq("is_active", true);

	const { error: linkError } = await supabase.from("telegram_links").upsert(
		{
			organization_id: data.organization_id,
			user_id: data.user_id,
			telegram_chat_id: identity.telegramChatId,
			telegram_user_id: identity.telegramUserId,
			telegram_username: identity.telegramUsername ?? null,
			first_name: identity.firstName ?? null,
			last_name: identity.lastName ?? null,
			product_type: productType,
			notification_preferences: { productType },
			is_active: true,
			last_active_at: now,
			updated_at: now,
		},
		{ onConflict: "organization_id,user_id" },
	);

	if (linkError) {
		capture(linkError, { context: "agent-gateway: redeem link code" });
		return null;
	}

	await supabase
		.from("one_time_tokens")
		.update({ used_at: now })
		.eq("id", data.id);

	return {
		orgId: data.organization_id,
		userId: data.user_id,
		productType,
	};
}
