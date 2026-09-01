import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FacebookChannel } from "@/channels/facebook";

const PAGE_ID = "page-123";
const PAGE_TOKEN = "page-token-abc";

describe("FacebookChannel", () => {
	let channel: FacebookChannel;
	let fetchSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		process.env.FB_GRAPH_API_VERSION = "v25.0";
		fetchSpy = vi.fn();
		globalThis.fetch = fetchSpy;
		channel = new FacebookChannel({
			pageId: PAGE_ID,
			pageAccessToken: PAGE_TOKEN,
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("sends a text message via sendMessage", async () => {
		fetchSpy.mockResolvedValue(new Response("", { status: 200 }));

		await channel.sendMessage("user-1", "Hello from bot");

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const [url, opts] = fetchSpy.mock.calls[0]!;
		expect(url).toContain(PAGE_ID);
		expect(url).toContain("messages");
		const body = JSON.parse(opts.body as string);
		expect(body.recipient.id).toBe("user-1");
		expect(body.message.text).toContain("Hello");
	});

	it("sends inline keyboard via sendInlineKeyboard", async () => {
		fetchSpy.mockResolvedValue(new Response("", { status: 200 }));

		await channel.sendInlineKeyboard("user-1", "Choose:", [
			[{ text: "Yes", callbackData: "confirm" }],
		]);

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body as string);
		expect(body.message.quick_replies).toHaveLength(1);
		expect(body.message.quick_replies[0].title).toBe("Yes");
		expect(body.message.quick_replies[0].payload).toBe("confirm");
	});

	it("is silent when pageId or pageAccessToken is missing", async () => {
		const unconfigured = new FacebookChannel();
		await unconfigured.sendMessage("user-1", "test");
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("editMessageText sends updated text with indicator", async () => {
		fetchSpy.mockResolvedValue(new Response("", { status: 200 }));

		await channel.editMessageText("user-1", 0, "corrected");

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body as string);
		expect(body.message.text).toContain("засварласан");
	});

	it("answerCallbackQuery is a no-op", async () => {
		await channel.answerCallbackQuery("q-1");
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("sends sender action via sendSenderAction", async () => {
		fetchSpy.mockResolvedValue(new Response("", { status: 200 }));

		await channel.sendSenderAction("user-1", "typing_on");

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body as string);
		expect(body.sender_action).toBe("typing_on");
	});

	it("subscribeToWebhook sends POST to subscribed_apps", async () => {
		fetchSpy.mockResolvedValue(new Response("", { status: 200 }));

		const result = await channel.subscribeToWebhook(PAGE_ID, PAGE_TOKEN);

		expect(result).toBe(true);
		expect(fetchSpy.mock.calls[0]?.[0]).toContain("/subscribed_apps");
	});

	it("subscribeToWebhook returns false on failure", async () => {
		fetchSpy.mockResolvedValue(new Response("error", { status: 400 }));

		const result = await channel.subscribeToWebhook(PAGE_ID, PAGE_TOKEN);

		expect(result).toBe(false);
	});

	it("getPageInfo returns page data on success", async () => {
		const pageInfo = { id: PAGE_ID, name: "Test Page" };
		fetchSpy.mockResolvedValue(
			new Response(JSON.stringify(pageInfo), { status: 200 }),
		);

		const result = await channel.getPageInfo(PAGE_ID, PAGE_TOKEN);

		expect(result).toMatchObject({ id: PAGE_ID, name: "Test Page" });
	});

	it("getPageInfo returns null on failure", async () => {
		fetchSpy.mockResolvedValue(new Response("", { status: 403 }));

		const result = await channel.getPageInfo(PAGE_ID, PAGE_TOKEN);

		expect(result).toBeNull();
	});

	describe("sendImage", () => {
		it("sends image via URL as JSON attachment", async () => {
			fetchSpy.mockResolvedValue(new Response(JSON.stringify({ message_id: "m_1" }), { status: 200 }));
			const ok = await channel.sendImage("user-1", "https://example.com/qr.png");
			expect(ok).toBe(true);
			expect(fetchSpy).toHaveBeenCalledWith(
				expect.stringContaining(`/messages?access_token=${PAGE_TOKEN}`),
				expect.objectContaining({
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: expect.stringContaining("https://example.com/qr.png"),
				}),
			);
		});

		it("sends raw base64 image data as multipart/form-data", async () => {
			fetchSpy.mockResolvedValue(new Response(JSON.stringify({ message_id: "m_2" }), { status: 200 }));
			const rawBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
			const ok = await channel.sendImage("user-1", rawBase64);
			expect(ok).toBe(true);
			expect(fetchSpy).toHaveBeenCalledWith(
				expect.stringContaining(`/messages?access_token=${PAGE_TOKEN}`),
				expect.objectContaining({
					method: "POST",
					body: expect.any(FormData),
				}),
			);
		});

		it("sends data:image/png;base64 as multipart/form-data", async () => {
			fetchSpy.mockResolvedValue(new Response(JSON.stringify({ message_id: "m_3" }), { status: 200 }));
			const dataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
			const ok = await channel.sendImage("user-1", dataUri);
			expect(ok).toBe(true);
			expect(fetchSpy).toHaveBeenCalledWith(
				expect.stringContaining(`/messages?access_token=${PAGE_TOKEN}`),
				expect.objectContaining({
					method: "POST",
					body: expect.any(FormData),
				}),
			);
		});
	});
});
