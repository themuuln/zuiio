import { TelegramChannel } from "@zuiio/gateway-telegram";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const TOKEN = "test-bot-token";
const CHAT_ID = 12345;

describe("TelegramChannel", () => {
	let channel: TelegramChannel;
	let fetchSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		process.env.TELEGRAM_BOT_TOKEN = TOKEN;
		fetchSpy = vi.fn();
		globalThis.fetch = fetchSpy;
		channel = new TelegramChannel();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("sends a plain text message via sendMessage", async () => {
		fetchSpy.mockResolvedValue(
			new Response(JSON.stringify({ ok: true }), { status: 200 }),
		);

		await channel.sendMessage(CHAT_ID, "Hello world");

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body as string);
		expect(body.chat_id).toBe(CHAT_ID);
		expect(body.text).toContain("Hello");
	});

	it("sends inline keyboard via sendInlineKeyboard", async () => {
		fetchSpy.mockResolvedValue(
			new Response(JSON.stringify({ ok: true }), { status: 200 }),
		);

		await channel.sendInlineKeyboard(CHAT_ID, "Choose", [
			[{ text: "Yes", callbackData: "yes" }],
			[{ text: "No", callbackData: "no" }],
		]);

		const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body as string);
		expect(body.reply_markup.inline_keyboard).toHaveLength(2);
		expect(body.reply_markup.inline_keyboard[0][0].text).toBe("Yes");
		expect(body.reply_markup.inline_keyboard[0][0].callback_data).toBe("yes");
	});

	it("answers callback query via answerCallbackQuery", async () => {
		fetchSpy.mockResolvedValue(new Response("", { status: 200 }));

		await channel.answerCallbackQuery("query-123", "Done");

		const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body as string);
		expect(body.callback_query_id).toBe("query-123");
		expect(body.text).toBe("Done");
	});

	it("edits message text via editMessageText", async () => {
		fetchSpy.mockResolvedValue(new Response("", { status: 200 }));

		await channel.editMessageText(CHAT_ID, 42, "Updated text");

		const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body as string);
		expect(body.chat_id).toBe(CHAT_ID);
		expect(body.message_id).toBe(42);
		expect(body.text).toBe("Updated text");
	});

	it("sends a document via sendDocument", async () => {
		fetchSpy.mockResolvedValue(
			new Response(JSON.stringify({ ok: true }), { status: 200 }),
		);

		await channel.sendDocument(
			CHAT_ID,
			Buffer.from("test"),
			"report.txt",
			"Summary",
		);

		expect(fetchSpy.mock.calls[0]?.[0]).toContain("/sendDocument");
	});

	it("sends chat action via sendChatAction", async () => {
		fetchSpy.mockResolvedValue(new Response("", { status: 200 }));

		await channel.sendChatAction(CHAT_ID, "typing");

		const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body as string);
		expect(body.action).toBe("typing");
	});

	it("sets message reaction via setReaction", async () => {
		fetchSpy.mockResolvedValue(new Response("", { status: 200 }));

		await channel.setReaction(CHAT_ID, 42, "✅");

		expect(fetchSpy.mock.calls[0]?.[0]).toContain("/setMessageReaction");
	});

	it("splits long messages on paragraph boundaries", async () => {
		fetchSpy.mockResolvedValue(
			new Response(JSON.stringify({ ok: true }), { status: 200 }),
		);
		const longText = "A\n".repeat(5000);
		await channel.sendMessage(CHAT_ID, longText);
		expect(fetchSpy.mock.calls.length).toBeGreaterThan(1);
	});

	it("throws on missing TELEGRAM_BOT_TOKEN", () => {
		delete process.env.TELEGRAM_BOT_TOKEN;
		expect(() => new TelegramChannel()).toThrow("TELEGRAM_BOT_TOKEN");
	});

	it("sends short messages as-is (no splitting)", async () => {
		fetchSpy.mockResolvedValue(
			new Response(JSON.stringify({ ok: true }), { status: 200 }),
		);
		await channel.sendMessage(CHAT_ID, "Short");
		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});

	it("uses provided token instead of env var", async () => {
		fetchSpy.mockResolvedValue(
			new Response(JSON.stringify({ ok: true }), { status: 200 }),
		);
		const custom = new TelegramChannel("custom-token");
		await custom.sendMessage(CHAT_ID, "Hi");
		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});
});
