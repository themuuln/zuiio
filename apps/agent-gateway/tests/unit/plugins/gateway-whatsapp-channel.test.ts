import { WhatsAppChannel } from "@zuiio/gateway-whatsapp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const PHONE_ID = "phone-123";
const ACCESS_TOKEN = "wa-token-abc";

describe("WhatsAppChannel", () => {
	let channel: WhatsAppChannel;
	let fetchSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchSpy = vi.fn();
		globalThis.fetch = fetchSpy;
		process.env.WHATSAPP_PHONE_NUMBER_ID = PHONE_ID;
		process.env.WHATSAPP_ACCESS_TOKEN = ACCESS_TOKEN;
		channel = new WhatsAppChannel();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("sends a text message via sendMessage", async () => {
		fetchSpy.mockResolvedValue(new Response("", { status: 200 }));

		await channel.sendMessage("1234567890", "Hello from WhatsApp");

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const [url, opts] = fetchSpy.mock.calls[0]!;
		expect(url).toContain(PHONE_ID);
		expect(url).toContain("/messages");
		const body = JSON.parse(opts.body as string);
		expect(body.to).toBe("1234567890");
		expect(body.type).toBe("text");
		expect(body.text.body).toContain("Hello");
	});

	it("sends interactive buttons via sendInlineKeyboard (max 3)", async () => {
		fetchSpy.mockResolvedValue(new Response("", { status: 200 }));

		await channel.sendInlineKeyboard("1234567890", "Choose:", [
			[{ text: "Option A", callbackData: "a" }],
			[{ text: "Option B", callbackData: "b" }],
			[{ text: "Option C", callbackData: "c" }],
			[{ text: "Option D", callbackData: "d" }],
		]);

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body as string);
		expect(body.type).toBe("interactive");
		expect(body.interactive.type).toBe("button");
		// WhatsApp max 3 buttons
		expect(body.interactive.action.buttons).toHaveLength(3);
	});

	it("formats **bold** to *bold* for WhatsApp", async () => {
		fetchSpy.mockResolvedValue(new Response("", { status: 200 }));

		await channel.sendMessage("1234567890", "**bold** text");

		const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body as string);
		expect(body.text.body).toContain("*bold*");
	});

	it("answerCallbackQuery is a no-op", async () => {
		await channel.answerCallbackQuery("q-1");
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("editMessageText is a no-op", async () => {
		await channel.editMessageText("1234567890", 1, "new text");
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("throws on missing env vars", () => {
		delete process.env.WHATSAPP_PHONE_NUMBER_ID;
		delete process.env.WHATSAPP_ACCESS_TOKEN;
		expect(() => new WhatsAppChannel()).toThrow("WHATSAPP_PHONE_NUMBER_ID");
	});

	it("uses provided constructor args over env vars", async () => {
		fetchSpy.mockResolvedValue(new Response("", { status: 200 }));
		const custom = new WhatsAppChannel("custom-phone", "custom-token");
		await custom.sendMessage("1", "test");
		expect(fetchSpy.mock.calls[0]?.[0]).toContain("custom-phone");
	});

	it("configures webhook via configureWebhook", async () => {
		process.env.WHATSAPP_APP_ID = "app-123";
		fetchSpy.mockResolvedValue(new Response("", { status: 200 }));

		await channel.configureWebhook(
			"https://example.com/webhook",
			"verify-token",
		);

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body as string);
		expect(body.object).toBe("whatsapp_business_account");
		expect(body.callback_url).toBe("https://example.com/webhook");
	});

	it("configureWebhook throws without WHATSAPP_APP_ID", async () => {
		delete process.env.WHATSAPP_APP_ID;

		await expect(
			channel.configureWebhook("https://example.com", "token"),
		).rejects.toThrow("WHATSAPP_APP_ID");
	});

	it("configureWebhook throws on API error", async () => {
		process.env.WHATSAPP_APP_ID = "app-123";
		fetchSpy.mockResolvedValue(new Response("error", { status: 400 }));

		await expect(
			channel.configureWebhook("https://example.com", "token"),
		).rejects.toThrow("webhook");
	});
});
