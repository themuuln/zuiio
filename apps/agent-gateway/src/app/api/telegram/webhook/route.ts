import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { onUserLinked, onWelcome } from "@/bot-ux";
import { TelegramChannel } from "@/channels/telegram";
import type { TelegramUpdate } from "@/channels/types";
import { startTypingLoop } from "@/channels/typing-loop";
import { handleAgentMessage } from "@/gateway/agent-handler";
import { resolveOrgFromChatUser } from "@/gateway/mode-a";
import { getProductTools, systemPromptFor } from "@/gateway/webhook-helpers";
import { debug } from "@/lib/debug";
import { openAiConfig, openCodeGoConfig } from "@/lib/env";
import { redeemLinkCode } from "@/lib/link-code";
import {
	createServiceClient,
	getSupabaseForProduct,
	type ServiceClient,
} from "@/lib/supabase";
import { verifyCompactToken } from "@/lib/tokens";
import { GptMiniProvider } from "@/providers/gpt-mini";
import { OpenCodeGoProvider } from "@/providers/opencode-go";
import { AiGateway } from "@/providers/types";
import { confirmAction, rejectAction } from "@/runtime/confirmation";
import { runAgentWithFallback } from "@/state/async-job";
import { transcribeVoice } from "@/stt/groq";

export const dynamic = "force-dynamic";

// ─── Lazy singletons ────────────────────────────────────────────────────────

let gateway: AiGateway | null = null;
let telegram: TelegramChannel | null = null;
let supabase: ServiceClient | null = null;
// ─── Idempotency dedup ─────────────────────────────────────────────────────
// Telegram can redeliver webhook updates. Dedup by update_id.
const processedUpdates = new Map<number, number>(); // update_id → timestamp
const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isDuplicateUpdate(updateId: number): boolean {
	const now = Date.now();
	// Clean expired entries
	for (const [id, ts] of processedUpdates) {
		if (now - ts > IDEMPOTENCY_TTL_MS) processedUpdates.delete(id);
	}
	if (processedUpdates.has(updateId)) return true;
	processedUpdates.set(updateId, now);
	return false;
}

function getProviders(): AiGateway {
	if (!gateway) {
		const primary = new OpenCodeGoProvider(openCodeGoConfig());
		const fallbackCfg = openAiConfig();
		gateway = fallbackCfg
			? new AiGateway(primary, new GptMiniProvider(fallbackCfg))
			: new AiGateway(primary);
	}
	return gateway;
}

function getTelegram(): TelegramChannel {
	if (!telegram) telegram = new TelegramChannel();
	return telegram;
}

function getSupabase() {
	if (!supabase) supabase = createServiceClient();
	return supabase;
}

function isAuthorizedTelegramRequest(request: Request): boolean {
	const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
	if (!expectedSecret) {
		capture(new Error("TELEGRAM_WEBHOOK_SECRET is not configured"), {
			context: "agent-gateway: telegram webhook auth",
		});
		return false;
	}
	return (
		request.headers.get("x-telegram-bot-api-secret-token") === expectedSecret
	);
}

// ─── Webhook handler ─────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<NextResponse> {
	try {
		if (!isAuthorizedTelegramRequest(request)) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const update: TelegramUpdate = await request.json();
		debug("webhook", "update received", {
			updateId: update.update_id,
			type: update.callback_query
				? "callback"
				: (update.message?.chat?.type ?? "unknown"),
		});
		// Dedup by update_id — Telegram can redeliver webhooks
		if (update.update_id && isDuplicateUpdate(update.update_id)) {
			return NextResponse.json({ ok: true });
		}

		if (update.callback_query) {
			await handleCallbackQuery(update.callback_query);
			return NextResponse.json({ ok: true });
		}

		const msg = update.message;
if (!msg?.text && !msg?.voice && !msg?.photo) {
	return NextResponse.json({ ok: true });
}

		const chatId = msg.chat.id;
		const userId = msg.from?.id ?? 0;
		const chatType = msg.chat.type;
		const text = msg.text ?? "";

		if (text.startsWith("/start")) {
			await handleStartCommand(chatId, userId, text, msg.from);
			return NextResponse.json({ ok: true });
		}
		if (msg.voice) {
			const tg = getTelegram();
			await tg.sendMessage(chatId, "Аудио хүлээн авлаа. Бичлэг тайлж байна...");

			try {
				const fileInfo = await tg.getFile(msg.voice.file_id);
				const fileBuffer = await tg.downloadFile(fileInfo.file_path);
				const transcribed = await transcribeVoice(fileBuffer, "voice.ogg");

				if (transcribed) {
					await handleUserMessage(
						chatId,
						userId,
						transcribed,
						chatType,
						msg.message_id,
					);
				} else {
					await tg.sendMessage(
						chatId,
						"Уучлаарай, дууны бичлэгийг тайлж чадсангүй. Дахин оролдоно уу.",
					);
				}
			} catch (err) {
				capture(err, { context: "agent-gateway: voice processing" });
				await tg.sendMessage(
					chatId,
					"Уучлаарай, дууны бичлэг боловсруулахад алдаа гарлаа.",
				);
			}

			return NextResponse.json({ ok: true });
		}
		// ─── Photo handling ────────────────────────────────────────────────
		if (msg.photo) {
			const tg = getTelegram();
			// Telegram sends multiple sizes — pick the largest
			const largestPhoto = msg.photo[msg.photo.length - 1];
			if (!largestPhoto?.file_id) {
				return NextResponse.json({ ok: true });
			}

			try {
				const fileInfo = await tg.getFile(largestPhoto.file_id);
				const fileBuffer = await tg.downloadFile(fileInfo.file_path);
				const base64 = fileBuffer.toString("base64");
				const dataUrl = `data:image/jpeg;base64,${base64}`;

				const caption = msg.caption ?? "Энэ зургийг шинжилж үзээрэй.";
				await handleUserMessage(
					chatId,
					userId,
					caption,
					chatType,
					msg.message_id,
					[dataUrl],
				);
			} catch (err) {
				capture(err, { context: "agent-gateway: photo processing" });
				await tg.sendMessage(
					chatId,
					"Уучлаарай, зураг боловсруулахад алдаа гарлаа.",
				);
			}

			return NextResponse.json({ ok: true });
		}


		if (text.startsWith("/switch")) {
			await handleSwitchCommand(chatId, userId);
			return NextResponse.json({ ok: true });
		}

		if (text.startsWith("/help")) {
			await getTelegram().sendMessage(
				chatId,
				"📋 **Боломжууд**\n\n" +
					"Би Zer болон Tolom системтэй холбогдон таны бизнесийн өгөгдөлд дүн шинжилгээ хийж, асуултанд хариулна.\n\n" +
					"🔹 Борлуулалтын хураангуй\n" +
					"🔹 Идэвхтэй захиалгууд\n" +
					"🔹 Харилцагчийн мэдээлэл\n" +
					"🔹 Санхүүгийн тайлан\n" +
					"🔹 Зарлагын дүн шинжилгээ\n" +
					"🔹 Цагийн хуваарь\n\n" +
					"**Хэрэглэх заавар:**\n" +
					"1. Zer/Tolom-ын тохиргооноос холбогдох код авах\n" +
					"2. Кодоо энд илгээх\n" +
					"3. Асуултаа бичих\n\n" +
					"**Командууд:**\n" +
					"/start — Холбогдох\n" +
					"/help — Энэ тусламж\n" +
					"/switch — Байгууллага солих\n" +
					"/link — Кодоор холбогдох",
			);
			return NextResponse.json({ ok: true });
		}

		if (text.startsWith("/link")) {
			await getTelegram().sendMessage(
				chatId,
				"🔗 Холбогдох кодоо оруулна уу.\n\n" +
					"Кодоо Zer эсвэл Tolom-ын **Тохиргоо → Telegram холболт** хэсгээс аваарай.\n\n" +
					"Код жишээ: `ABCD-EFGH`",
			);
			return NextResponse.json({ ok: true });
		}
		if (text.startsWith("/sales")) {
			await handleSalesCommand(chatId, userId);
			return NextResponse.json({ ok: true });
		}

		if (text.startsWith("/orders")) {
			await handleOrdersCommand(chatId, userId);
			return NextResponse.json({ ok: true });
		}

		if (text.startsWith("/search")) {
			const query = text.replace("/search", "").trim();
			await handleSearchCommand(chatId, userId, query);
			return NextResponse.json({ ok: true });
		}

		if (text.startsWith("/daily")) {
			await handleUserMessage(chatId, userId, "Өнөөдрийн хураангуй үзүүлээрэй", "private");
			return NextResponse.json({ ok: true });
		}

		if (text.startsWith("/active")) {
			await handleUserMessage(chatId, userId, "Идэвхтэй ажлын захиалгуудыг жагсааж өгөөч", "private");
			return NextResponse.json({ ok: true });
		}

		if (text.startsWith("/mechanics")) {
			await handleUserMessage(chatId, userId, "Механикчдын жагсаалт үзүүлээрэй", "private");
			return NextResponse.json({ ok: true });
		}

		if (text.startsWith("/schedule")) {
			await handleUserMessage(chatId, userId, "Өнөөдрийн цагийн хуваарийг үзүүлээрэй", "private");
			return NextResponse.json({ ok: true });
		}

		if (text.startsWith("/invoices")) {
			await handleUserMessage(chatId, userId, "Нэхэмжлэлийн хураангуй үзүүлээрэй", "private");
			return NextResponse.json({ ok: true });
		}

		if (text.startsWith("/expenses")) {
			await handleUserMessage(chatId, userId, "Зарлагын хураангуй үзүүлээрэй", "private");
			return NextResponse.json({ ok: true });
		}

		// Try device auth code redemption before general message handling
		if (text.length >= 6 && text.length <= 10) {
			const redeemed = await redeemLinkCode(getSupabase(), text, {
				telegramChatId: chatId,
				telegramUserId: userId,
				telegramUsername: msg.from?.username,
				firstName: msg.from?.first_name,
				lastName: msg.from?.last_name,
			});
			if (redeemed) {
				await handleCodeLinked(chatId, redeemed);
				return NextResponse.json({ ok: true });
			}
		}

	await handleUserMessage(chatId, userId, text, chatType, msg.message_id);
	return NextResponse.json({ ok: true });
	} catch (err) {
		console.error("[webhook] ERROR:", err);
		capture(err, { context: "agent-gateway: telegram webhook" });
		return NextResponse.json({ ok: true });
	}

	// ─── Handlers ────────────────────────────────────────────────────────────────

	async function handleCodeLinked(
		chatId: number,
		payload: { orgId: string; userId: string; productType: string },
	): Promise<void> {
		const tg = getTelegram();
		const sb = getSupabase();

		// Link is already created & activated by redeemLinkCode in Supabase.
		// Just confirm to the user.
		const productName = payload.productType === "tolom" ? "Tolom" : "Zer";

		// Look up org name
		let orgName = productName;
		const { data: org } = await sb
			.from("organizations")
			.select("name")
			.eq("id", payload.orgId)
			.single();
		if (org?.name) orgName = org.name;

		await tg.sendMessage(
			chatId,
			`✅ Амжилттай холбогдлоо! Таныг "${orgName}" байгууллагад холбогдлоо.\n\nОдоо асуултаа бичнэ үү. Жишээ:\n- "Өнөөдрийн борлуулалт хэд вэ?"`,
		);
		await onUserLinked(chatId);
	}

	async function handleStartCommand(
		chatId: number,
		userId: number,
		text: string,
		from?: NonNullable<TelegramUpdate["message"]>["from"],
	): Promise<void> {
		const tg = getTelegram();
		const parts = text.split(" ");
		const token = parts[1];
		if (!token) {
			await tg.sendMessage(
				chatId,
				"👋 Сайн байна уу! Zuiio AI туслах ботод тавтай морил.\n\n" +
					"🔗 Холбогдохын тулд:\n" +
					"1. Zer/Tolom-ын тохиргоо хэсгээс код авах\n" +
					"2. Кодоо энд илгээх (жишээ нь: ABCD-EFGH)\n\n" +
					"📋 Командууд:\n" +
					"/help — Тусламж\n" +
					"/link — Кодоор холбогдох",
			);
			await onWelcome(chatId);
			return;
		}

		// Verify the compact token (HMAC, stateless, fits 64-char limit)
		const payload = verifyCompactToken(token);
		if (!payload) {
			await tg.sendMessage(
				chatId,
				"❌ Холбох токен буруу эсвэл хугацаа дууссан байна. Дахин QR код уншуулна уу.",
			);
			return;
		}

		const sb = getSupabase();

		try {
			// Deactivate any existing active link for this chat+user
			await sb
				.from("telegram_links")
				.update({ is_active: false })
				.eq("telegram_chat_id", chatId)
				.eq("telegram_user_id", userId)
				.eq("is_active", true);

			// Create the new link
			const now = new Date().toISOString();
			const { error: linkErr } = await sb.from("telegram_links").upsert(
				{
					organization_id: payload.orgId,
					user_id: payload.userId,
					telegram_chat_id: chatId,
					telegram_user_id: userId,
					telegram_username: from?.username ?? null,
					first_name: from?.first_name ?? null,
					last_name: from?.last_name ?? null,
					product_type: payload.productType,
					is_active: true,
					notification_preferences: { productType: payload.productType },
					last_active_at: now,
					updated_at: now,
				},
				{ onConflict: "organization_id,user_id" },
			);

			if (linkErr) {
				capture(linkErr, { context: "agent-gateway: compact token link" });
				await tg.sendMessage(
					chatId,
					"❌ Холболт үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.",
				);
				return;
			}

			const productName = payload.productType === "tolom" ? "Tolom" : "Zer";
			await tg.sendMessage(
				chatId,
				`✅ Амжилттай холбогдлоо! Та ${productName} системдээ нэвтэрлээ.\n\nОдоо асуултаа бичнэ үү. Жишээ нь:\n- "Өнөөдрийн борлуулалт хэд вэ?"\n- "Сүүлийн 7 хоногийн хураангуй"`,
			);
			await onUserLinked(chatId);
		} catch (err) {
			capture(err, { context: "agent-gateway: start link" });
			await tg.sendMessage(
				chatId,
				"❌ Холболт амжилтгүй боллоо. Дахин оролдоно уу.",
			);
		}
	}
	async function handleSwitchCommand(
		chatId: number,
		userId: number,
	): Promise<void> {
		const tg = getTelegram();
		const sb = getSupabase();

		// Find all links for this chat+user
		const { data: links } = await sb
			.from("telegram_links")
			.select("organization_id, is_active, product_type")
			.eq("telegram_chat_id", chatId)
			.eq("telegram_user_id", userId)
			.order("updated_at", { ascending: false });

		if (!links || links.length === 0) {
			await tg.sendMessage(
				chatId,
				"❌ Та ямар ч байгууллагад холбогдоогүй байна. /start командаар холбогдоно уу.",
			);
			return;
		}

		// Group links by product_type, query org names from each DB
		const orgMap = new Map<string, string>();
		const byProduct = new Map<string, string[]>();
		for (const l of links) {
			const pt = (l.product_type ?? "zer") as string;
			const ids = byProduct.get(pt) ?? [];
			ids.push(l.organization_id);
			byProduct.set(pt, ids);
		}

		for (const [productType, ids] of byProduct) {
			const client = getSupabaseForProduct(productType);
			const { data: orgs } = await client
				.from("organizations")
				.select("id, name")
				.in("id", ids);
			for (const o of orgs ?? []) {
				orgMap.set(o.id, o.name);
			}
		}

		// Build inline keyboard
		const keyboard = links.map((l) => {
			const orgName = orgMap.get(l.organization_id) ?? l.organization_id;
			const active = l.is_active ? " ✅" : "";
			return [
				{
					text: `${orgName}${active}`,
					callbackData: `switch:${l.organization_id}`,
				},
			];
		});

		await tg.sendInlineKeyboard(
			chatId,
			"🏢 Байгууллагаа сонгоно уу:",
			keyboard,
		);
	}
	async function handleSalesCommand(
		chatId: number,
		userId: number,
	): Promise<void> {
		const tg = getTelegram();
		const sb = getSupabase();

		try {
			const resolved = await resolveOrgFromChatUser(sb, chatId, userId);
			const { orgId, productType } = resolved.context;

			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const todayISO = today.toISOString();

			if (productType === "tolom") {
				const { data } = await sb
					.from("work_orders")
					.select("total_amount, status, created_at")
					.eq("organization_id", orgId)
					.gte("created_at", todayISO)
					.is("deleted_at", null);

				const totalRevenue = (data ?? []).reduce(
					(sum: number, wo: Record<string, unknown>) =>
						sum + (Number(wo.total_amount) || 0),
					0,
				);
				const orderCount = (data ?? []).length;

				await tg.sendMessage(
					chatId,
					`📊 **Өнөөдрийн орлого**\n\n` +
						`💰 Нийт орлого: ₮${totalRevenue.toLocaleString()}\n` +
						`📋 Захиалга: ${orderCount}\n` +
						`📅 ${today.toLocaleDateString("mn-MN")}`,
				);
			} else {
				// Zer - use AI to get sales summary
				const response = await getProviders().runWithTools({
					system:
						"Та Zer retail/accounting-ийн AI туслах бот юм. Монгол хэлээр хариулна. Өнөөдрийн борлуулалтын хураангуйг өгнө үү.",
					userMessage: "Өнөөдрийн борлуулалтын хураангуй өгөөч",
					tools: [],
					context: {
						orgId,
						userId: String(userId),
						supabase: sb,
					},
					maxRounds: 1,
				});
				await tg.sendMessage(chatId, response);
			}
		} catch (err) {
			capture(err, { context: "agent-gateway: sales command" });
			await tg.sendMessage(
				chatId,
				"❌ Борлуулалтын мэдээлэл авахад алдаа гарлаа. Дахин оролдоно уу.",
			);
		}
	}
	async function handleOrdersCommand(
		chatId: number,
		userId: number,
	): Promise<void> {
		const tg = getTelegram();
		const sb = getSupabase();

		try {
			const resolved = await resolveOrgFromChatUser(sb, chatId, userId);
			const { orgId, productType } = resolved.context;

			if (productType === "tolom") {
				const { data } = await sb
					.from("work_orders")
					.select(
						"id, status, total_amount, plate_number, customers(full_name, phone)",
					)
					.eq("organization_id", orgId)
					.is("deleted_at", null)
					.not("status", "in", '("delivered","cancelled","completed")')
					.order("created_at", { ascending: false })
					.limit(10);

				if (!data || data.length === 0) {
					await tg.sendMessage(chatId, "📋 Идэвхтэй захиалга байхгүй байна.");
					return;
				}

				const orders = data
					.map((wo: Record<string, unknown>) => {
						const customer = wo.customers as Record<string, unknown> | null;
						return (
							`• #${wo.id} — ${wo.status}\n` +
							`  💰 ₮${Number(wo.total_amount).toLocaleString()}\n` +
							`  🚗 ${wo.plate_number ?? "—"}\n` +
							`  👤 ${customer?.full_name ?? "—"}`
						);
					})
					.join("\n\n");

				await tg.sendMessage(
					chatId,
					`📋 **Идэвхтэй захиалгууд** (${data.length})\n\n${orders}`,
				);
			} else {
				// Zer - use AI to get orders
				const response = await getProviders().runWithTools({
					system:
						"Та Zer retail/accounting-ийн AI туслах бот юм. Монгол хэлээр хариулна. Сүүлийн захиалгуудыг харуулна уу.",
					userMessage: "Сүүлийн захиалгуудыг харуул",
					tools: [],
					context: {
						orgId,
						userId: String(userId),
						supabase: sb,
					},
					maxRounds: 1,
				});
				await tg.sendMessage(chatId, response);
			}
		} catch (err) {
			capture(err, { context: "agent-gateway: orders command" });
			await tg.sendMessage(
				chatId,
				"❌ Захиалгын мэдээлэл авахад алдаа гарлаа. Дахин оролдоно уу.",
			);
		}
	}
	async function handleSearchCommand(
		chatId: number,
		userId: number,
		query: string,
	): Promise<void> {
		const tg = getTelegram();
		const sb = getSupabase();

		if (!query) {
			await tg.sendMessage(
				chatId,
				"🔍 Хайх зүйлээ бичнэ үү.\n\nЖишээ:\n/search Бат\n/search 99112233",
			);
			return;
		}

		try {
			const resolved = await resolveOrgFromChatUser(sb, chatId, userId);
			const { orgId, productType } = resolved.context;

			if (productType === "tolom") {
				// Search customers
				const { data: customers } = await sb
					.from("customers")
					.select("id, full_name, phone, total_visits")
					.eq("organization_id", orgId)
					.is("deleted_at", null)
					.or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
					.limit(5);

				if (!customers || customers.length === 0) {
					await tg.sendMessage(
						chatId,
						`🔍 "${query}" гэсэн харилцагч олдсонгүй.`,
					);
					return;
				}

				const results = customers
					.map(
						(c: Record<string, unknown>) =>
							`• ${c.full_name}\n  📞 ${c.phone}\n  📊 ${c.total_visits} удаа ирсэн`,
					)
					.join("\n\n");

				await tg.sendMessage(
					chatId,
					`🔍 **Харилцагчдын жагсаалт** (${customers.length})\n\n${results}`,
				);
			} else {
				// Zer - search products
				const { data: products } = await sb
					.from("products")
					.select("id, name, price")
					.ilike("name", `%${query}%`)
					.limit(5);

				if (!products || products.length === 0) {
					await tg.sendMessage(
						chatId,
						`🔍 "${query}" гэсэн бүтээгдэхүүн олдсонгүй.`,
					);
					return;
				}

				const results = products
					.map(
						(p: Record<string, unknown>) =>
							`• ${p.name}\n  💰 ₮${Number(p.price).toLocaleString()}\n  🏷️ ${p.sku ?? "—"}`,
					)
					.join("\n\n");

				await tg.sendMessage(
					chatId,
					`🔍 **Бүтээгдэхүүний жагсаалт** (${products.length})\n\n${results}`,
				);
			}
		} catch (err) {
			capture(err, { context: "agent-gateway: search command" });
			await tg.sendMessage(
				chatId,
				"❌ Хайхад алдаа гарлаа. Дахин оролдоно уу.",
			);
		}
	}

async function handleUserMessage(
	chatId: number,
	userId: number,
	text: string,
	chatType: string,
	messageId?: number,
	images?: string[],
): Promise<void> {
		const tg = getTelegram();
		const sb = getSupabase();

		let resolved;
		try {
			resolved = await resolveOrgFromChatUser(sb, chatId, userId);
		} catch (err) {
			await tg.sendMessage(
				chatId,
				err instanceof Error
					? err.message.slice(0, 200)
					: "Таны Telegram холбогдоогүй байна. Эхлээд QR код уншуулна уу.",
			);
			return;
		}

		const { productType } = resolved.context;
		const dataClient =
			productType === "tolom" ? getSupabaseForProduct("tolom") : sb;

		// Update last_active_at
		await dataClient
			.from("telegram_links")
			.update({ updated_at: new Date().toISOString() })
			.eq("telegram_chat_id", chatId)
			.eq("telegram_user_id", userId)
			.eq("is_active", true);

		// React with 👁️ to acknowledge receipt
		if (messageId) {
			await tg.setReaction(
				chatId,
				messageId,
				TelegramChannel.REACTIONS.received,
			);
		}

		// Streaming: use sendMessageDraft for real-time token delivery
		const draftId = `draft_${chatId}_${Date.now()}`;
		let streamedText = "";
		const STREAM_UPDATE_INTERVAL = 400; // ms between draft updates
		let lastUpdateTime = 0;

		const onToken = (token: string) => {
			streamedText += token;
			// Stop typing indicator once streaming starts delivering content
			if (!typingStopped) {
				typingStopped = true;
				stopTyping();
			}
			const now = Date.now();
			if (now - lastUpdateTime > STREAM_UPDATE_INTERVAL) {
				lastUpdateTime = now;
				// Fire and forget — don't await
				tg.sendMessageDraft(chatId, draftId, streamedText);
			}
		};

		// Start typing indicator loop
		const stopTyping = startTypingLoop(tg, chatId);
		let typingStopped = false;

	// Run agent synchronously — await the result then send to Telegram.
	// Vercel serverless kills background tasks after response, so we MUST
	// await the full flow (agent + telegram send) before returning.
	try {
const response = await handleAgentMessage(resolved.context, text, chatType, {
	getSystemPrompt: systemPromptFor,
	getTools: (ctx) => getProductTools(productType, ctx),
	dataClient,
	onToken,
}, images);
		stopTyping();
	debug("webhook", "agent responded", { chatId, len: response.length });
	if (messageId) {
		tg.setReaction(chatId, messageId, TelegramChannel.REACTIONS.done).catch(() => {});
	}
	await tg.sendMessage(chatId, response);
	} catch (err) {
		stopTyping();
		console.error("[webhook] agent error:", err);
		capture(err, { context: "agent-gateway: agent in handleUserMessage" });
		if (messageId) {
			tg.setReaction(chatId, messageId, TelegramChannel.REACTIONS.error).catch(() => {});
		}
		await tg.sendMessage(chatId, "Уучлаарай, алдаа гарлаа. Дахин оролдоно уу.");
	}
	}

	async function handleCallbackQuery(
		cq: NonNullable<TelegramUpdate["callback_query"]>,
	): Promise<void> {
		const tg = getTelegram();
		const data = cq.data ?? "";
		const chatId = cq.message?.chat.id ?? 0;
		const messageId = cq.message?.message_id ?? 0;
		const userId = cq.from.id;
		const [action, nonce] = data.split(":");

		if (action === "switch") {
			const orgId = nonce;
			if (!orgId) {
				await tg.answerCallbackQuery(cq.id, "❌ Алдаа гарлаа.");
				return;
			}

			const sb = getSupabase();

			// Deactivate all active links for this chat+user
			await sb
				.from("telegram_links")
				.update({ is_active: false })
				.eq("telegram_chat_id", chatId)
				.eq("telegram_user_id", userId)
				.eq("is_active", true);

			// Activate the selected one
			const { error } = await sb
				.from("telegram_links")
				.update({ is_active: true, updated_at: new Date().toISOString() })
				.eq("telegram_chat_id", chatId)
				.eq("telegram_user_id", userId)
				.eq("organization_id", orgId);

			if (error) {
				capture(error, { context: "agent-gateway: switch organization" });
				await tg.answerCallbackQuery(cq.id, "❌ Солиход алдаа гарлаа.");
				return;
			}

			// Get org name for confirmation
			const { data: org } = await sb
				.from("organizations")
				.select("name")
				.eq("id", orgId)
				.single();

			await tg.editMessageText(
				chatId,
				messageId,
				`✅ "${org?.name ?? orgId}" байгууллагад шилжлээ.`,
			);
			await tg.answerCallbackQuery(cq.id, "✅ Амжилттай.");
		} else if (action === "confirm") {
			const staged = confirmAction(nonce, String(chatId), String(userId));
			if (!staged) {
				await tg.answerCallbackQuery(cq.id, "Энэ үйлдлийн хугацаа дууссан.");
				return;
			}
			await tg.editMessageText(
				chatId,
				messageId,
				`✅ Баталгаажууллаа: ${staged.summary}`,
			);
			await tg.answerCallbackQuery(cq.id, "✅ Амжилттай.");
		} else if (action === "reject") {
			rejectAction(nonce);
			await tg.editMessageText(chatId, messageId, "❌ Цуцаллаа.");
			await tg.answerCallbackQuery(cq.id, "❌ Цуцаллаа.");
	} else if (action === "action") {
			// Quick action buttons — forward as a regular message to the agent
			const actionText: Record<string, string> = {
				daily_summary: "Өнөөдрийн хураангуй үзүүлээрэй",
				active_orders: "Идэвхтэй ажлын захиалгуудыг жагсааж өгөөч",
				mechanics: "Механикчдын жагсаалт үзүүлээрэй",
				appointments: "Өнөөдрийн цагийн хуваарийг үзүүлээрэй",
				invoices: "Нэхэмжлэлийн хураангуй үзүүлээрэй",
				expenses: "Зарлагын хураангуй үзүүлээрэй",
			};
			const query = actionText[nonce];
			if (!query) {
				await tg.answerCallbackQuery(cq.id, "❌ Тодорхойгүй үйлдэл.");
				return;
			}
			await tg.answerCallbackQuery(cq.id);
			// Process as a regular message
			await handleUserMessage(chatId, userId, query, "private", messageId);
		}
	}
}
