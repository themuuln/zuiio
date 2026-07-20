import { capture } from "@zuiio/capture";

const TELEGRAM_API = "https://api.telegram.org/bot";

function getBotToken(): string {
	const token = process.env.TELEGRAM_BOT_TOKEN;
	if (!token) throw new Error("TELEGRAM_BOT_TOKEN is required");
	return token;
}

async function api(
	method: string,
	body: Record<string, unknown>,
): Promise<void> {
	const token = getBotToken();
	const res = await fetch(`${TELEGRAM_API}${token}/${method}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		const err = await res.text().catch(() => "unknown");
		capture(new Error(`Telegram ${method} failed: ${res.status} ${err}`), {
			context: "gateway-telegram: bot profile",
		});
	}
}

/** Set the bot's display name, description, and default commands. */
export async function setupBotProfile(): Promise<void> {
	await api("setMyName", { name: "Zuiio AI" });

	await api("setMyDescription", {
		description:
			"Zer ба Tolom системийн AI туслах бот.\n" +
			"Өөрийн бизнесийн өгөгдөлтэй натурал хэлээр ярилцаж, " +
			"борлуулалт, захиалга, харилцагч, санхүүгийн мэдээллээ аваарай.",
	});

	await api("setMyShortDescription", {
		short_description: "Zer & Tolom бизнесийн AI туслах",
	});

	// Default commands for all users (unlinked state)
	await api("setMyCommands", {
		commands: [
			{ command: "start", description: "🚀 Холбогдох эхлэх" },
			{ command: "help", description: "❓ Ботын боломжууд" },
		],
		scope: { type: "default" },
	});

	console.log("✅ Bot profile setup complete");
}

/** Called after a user links their account. Shows full commands for this user. */
export async function onUserLinked(chatId: number): Promise<void> {
	// Set full commands for linked user (chat scope)
	await api("setMyCommands", {
		commands: [
			{ command: "start", description: "🚀 Холбогдох" },
			{ command: "help", description: "❓ Ботын боломжууд" },
			{ command: "daily", description: "📊 Өнөөдрийн хураангуй" },
			{ command: "active", description: "🔧 Идэвхтэй захиалгууд" },
			{ command: "mechanics", description: "👥 Механикчид" },
			{ command: "schedule", description: "📅 Цагийн хуваарь" },
			{ command: "invoices", description: "💰 Нэхэмжлэл" },
			{ command: "expenses", description: "📋 Зарлагын хураангуй" },
			{ command: "search", description: "🔍 Хайх" },
			{ command: "switch", description: "🔄 Байгууллага солих" },
			{ command: "link", description: "🔗 Кодоор холбогдох" },
		],
		scope: { type: "chat", chat_id: chatId },
	});

	// Set commands-type menu button
	await api("setChatMenuButton", {
		chat_id: chatId,
		menu_button: { type: "commands" },
	});
}

/** Called when a user first opens the bot (unlinked). Shows minimal commands. */
export async function onWelcome(chatId: number): Promise<void> {
	// Set minimal commands for unlinked user (chat scope)
	await api("setMyCommands", {
		commands: [
			{ command: "start", description: "🚀 Холбогдох эхлэх" },
			{ command: "help", description: "❓ Ботын боломжууд" },
		],
		scope: { type: "chat", chat_id: chatId },
	});

	// Set commands-type menu button
	await api("setChatMenuButton", {
		chat_id: chatId,
		menu_button: { type: "commands" },
	});
}
