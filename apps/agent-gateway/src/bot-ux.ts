import "server-only";

const TELEGRAM_API = "https://api.telegram.org/bot";

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is required");
  return token;
}

async function api(method: string, body: Record<string, unknown>): Promise<void> {
  const token = getBotToken();
  const res = await fetch(`${TELEGRAM_API}${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "unknown");
    console.error(`Telegram ${method} failed:`, res.status, err);
  }
}

/** Set the bot's display name, description, and commands. */
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

  await api("setMyCommands", {
    commands: [
      { command: "start", description: "🚀 Холбогдож эхлэх" },
      { command: "help", description: "❓ Тусламж, боломжууд" },
      { command: "switch", description: "🔄 Байгууллага солих" },
      { command: "link", description: "🔗 Кодоор холбогдох" },
    ],
    scope: { type: "default" },
  });

  console.log("✅ Bot profile setup complete");
}

/** Called after a user links their account. Sets their menu + contextual commands. */
export async function onUserLinked(chatId: number): Promise<void> {
  // Use commands-type menu for linked users (shows command list)
  await api("setChatMenuButton", {
    chat_id: chatId,
    menu_button: { type: "commands" },
  });
}

/** Called when a user first opens the bot (unlinked). */
export async function onWelcome(chatId: number): Promise<void> {
  // Show web_app menu button that opens /start
  await api("setChatMenuButton", {
    chat_id: chatId,
    menu_button: {
      type: "web_app",
      text: "🚀 Эхлэх",
      web_app: { url: "https://t.me/zuiio_bot?start" },
    },
  });
}
