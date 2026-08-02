/**
 * Telegram custom-bot webhook tests: /api/telegram/webhook/[botKey].
 * Covers secret-token auth, callback queries (confirm/reject), text and
 * voice messages, async-job fallback wiring.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const REACTIONS = { received: "👁️", processing: "⏳", done: "✅", error: "❌" };
const mockSendMessage = vi.fn(async () => {});
const mockEditMessageText = vi.fn(async () => {});
const mockAnswerCallbackQuery = vi.fn(async () => {});
const mockSetReaction = vi.fn(async () => {});
const mockGetFile = vi.fn(async () => ({ file_path: "voice/1.ogg" }));
const mockDownloadFile = vi.fn(async () => new Uint8Array([1, 2, 3]));
vi.mock("@/channels/telegram", () => ({
	TelegramChannel: class {
		static REACTIONS = REACTIONS;
		sendMessage = mockSendMessage;
		editMessageText = mockEditMessageText;
		answerCallbackQuery = mockAnswerCallbackQuery;
		setReaction = mockSetReaction;
		getFile = mockGetFile;
		downloadFile = mockDownloadFile;
	},
}));

const mockStopTyping = vi.fn();
const mockOnToken = vi.fn();
const mockStreamFinish = vi.fn(async (r: string) => r);
const mockStreamFail = vi.fn(async (m: string) => m);
vi.mock("@/channels/typing-loop", () => ({
	startTypingLoop: () => mockStopTyping,
	createTelegramResponseStream: () => ({
		onToken: mockOnToken,
		finish: mockStreamFinish,
		fail: mockStreamFail,
	}),
}));

const mockHandleAgentMessage = vi.fn(async () => "Хариулт");
vi.mock("@/gateway/agent-handler", () => ({
	handleAgentMessage: (...a: unknown[]) => mockHandleAgentMessage(...a),
}));

const mockResolveOrgFromBotKey = vi.fn(async () => null);
vi.mock("@/gateway/mode-b", () => ({
	resolveOrgFromBotKey: (...a: unknown[]) => mockResolveOrgFromBotKey(...a),
}));

vi.mock("@/gateway/webhook-helpers", () => ({
	systemPromptFor: vi.fn(async () => "prompt"),
	getProductTools: vi.fn(() => []),
}));

const mockConfirmAction = vi.fn(() => null);
const mockRejectAction = vi.fn(() => {});
vi.mock("@/runtime/confirmation", () => ({
	confirmAction: (...a: unknown[]) => mockConfirmAction(...a),
	rejectAction: (...a: unknown[]) => mockRejectAction(...a),
}));

const mockRunAgentWithFallback = vi.fn();
vi.mock("@/state/async-job", () => ({
	runAgentWithFallback: (...a: unknown[]) => mockRunAgentWithFallback(...a),
}));

const mockEnqueueJob = vi.fn(async () => {});
vi.mock("@/state/job-queue", () => ({
	enqueueJob: (...a: unknown[]) => mockEnqueueJob(...a),
}));

const mockTranscribeVoice = vi.fn(async () => "Тайлсан бичвэр");
vi.mock("@/stt/groq", () => ({
	transcribeVoice: (...a: unknown[]) => mockTranscribeVoice(...a),
}));

const mockCreateServiceClient = vi.fn();
vi.mock("@/lib/supabase", () => ({
	createServiceClient: (...a: unknown[]) => mockCreateServiceClient(...a),
}));

function post(req: Request, botKey = "bk-1") {
	// Route uses Next 15-style async params
	return import("@/app/api/telegram/webhook/[botKey]/route").then((m) =>
		m.POST(req, { params: Promise.resolve({ botKey }) }),
	);
}

function secretReq(body: unknown, secret?: string) {
	const headers = new Headers({ "Content-Type": "application/json" });
	if (secret) headers.set("x-telegram-bot-api-secret-token", secret);
	return new Request("http://localhost/api/telegram/webhook/bk-1", {
		method: "POST",
		headers,
		body: JSON.stringify(body),
	});
}

describe("POST /api/telegram/webhook/[botKey]", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.TELEGRAM_WEBHOOK_SECRET = "webhook-secret";
		mockResolveOrgFromBotKey.mockResolvedValue({
			orgId: "org-tg-1",
			userId: "u1",
			productType: "zer",
			audience: "internal",
			chatId: 123,
			telegramUserId: 456,
		});
		mockRunAgentWithFallback.mockImplementation(
			async (
				agentPromise: Promise<string>,
				opts: { onResult: (r: string) => Promise<unknown> },
			) => {
				const response = await agentPromise;
				await opts.onResult(response);
			},
		);
	});
	afterEach(() => {
		delete process.env.TELEGRAM_WEBHOOK_SECRET;
	});

	it("rejects requests without the secret token", async () => {
		const res = await post(secretReq({ message: {} }));
		expect(res.status).toBe(401);
	});

	it("rejects requests with a wrong secret token", async () => {
		const res = await post(secretReq({ message: {} }, "wrong"));
		expect(res.status).toBe(401);
	});

	it("handles confirm callback queries by editing the message", async () => {
		mockConfirmAction.mockReturnValue({
			summary: "Захиалга баталгаажуулах",
			execute: vi.fn(),
		});
		const res = await post(
			secretReq(
				{
					callback_query: {
						id: "cq-1",
						from: { id: 456 },
						data: "confirm:nonce-1",
						message: { chat: { id: 123 }, message_id: 7 },
					},
				},
				"webhook-secret",
			),
		);
		expect(res.status).toBe(200);
		expect(mockConfirmAction).toHaveBeenCalledWith("nonce-1", "123", "456");
		expect(mockEditMessageText).toHaveBeenCalledWith(
			123,
			7,
			expect.stringContaining("Баталгаажууллаа"),
		);
		expect(mockAnswerCallbackQuery).toHaveBeenCalledWith(
			"cq-1",
			expect.stringContaining("Амжилттай"),
		);
	});

	it("answers expired confirm callbacks gracefully", async () => {
		mockConfirmAction.mockReturnValue(null);
		const res = await post(
			secretReq(
				{
					callback_query: {
						id: "cq-2",
						from: { id: 456 },
						data: "confirm:stale",
						message: { chat: { id: 123 }, message_id: 8 },
					},
				},
				"webhook-secret",
			),
		);
		expect(res.status).toBe(200);
		expect(mockAnswerCallbackQuery).toHaveBeenCalledWith(
			"cq-2",
			expect.stringContaining("хугацаа дууссан"),
		);
	});

	it("handles reject callback queries", async () => {
		const res = await post(
			secretReq(
				{
					callback_query: {
						id: "cq-3",
						from: { id: 456 },
						data: "reject:nonce-2",
						message: { chat: { id: 123 }, message_id: 9 },
					},
				},
				"webhook-secret",
			),
		);
		expect(res.status).toBe(200);
		expect(mockRejectAction).toHaveBeenCalledWith("nonce-2");
		expect(mockEditMessageText).toHaveBeenCalledWith(123, 9, "❌ Цуцаллаа.");
	});

	it("ignores updates without a message", async () => {
		const res = await post(
			secretReq({ channel_post: { text: "x" } }, "webhook-secret"),
		);
		expect(res.status).toBe(200);
		expect(mockHandleAgentMessage).not.toHaveBeenCalled();
	});

	it("tells the user when the bot key is unknown", async () => {
		mockResolveOrgFromBotKey.mockResolvedValue(null);
		const res = await post(
			secretReq(
				{
					message: {
						message_id: 1,
						from: { id: 456 },
						chat: { id: 123, type: "private" },
						text: "Сайн уу",
					},
				},
				"webhook-secret",
			),
		);
		expect(res.status).toBe(200);
		expect(mockSendMessage).toHaveBeenCalledWith(
			123,
			expect.stringContaining("идэвхгүй"),
		);
		expect(mockHandleAgentMessage).not.toHaveBeenCalled();
	});

	it("streams text replies through the response stream", async () => {
		const res = await post(
			secretReq(
				{
					message: {
						message_id: 5,
						from: { id: 456 },
						chat: { id: 123, type: "private" },
						text: "Зарлага нэмэх",
					},
				},
				"webhook-secret",
			),
		);
		expect(res.status).toBe(200);
		expect(mockSetReaction).toHaveBeenCalledWith(123, 5, REACTIONS.received);
		expect(mockHandleAgentMessage).toHaveBeenCalledWith(
			expect.objectContaining({ orgId: "org-tg-1", chatId: 123 }),
			"Зарлага нэмэх",
			"private",
			expect.objectContaining({ onToken: mockOnToken }),
		);
		expect(mockRunAgentWithFallback).toHaveBeenCalledTimes(1);
		expect(mockStreamFinish).toHaveBeenCalledWith("Хариулт");
		expect(mockSetReaction).toHaveBeenCalledWith(123, 5, REACTIONS.done);
		expect(mockStopTyping).toHaveBeenCalled();
	});

	it("enqueues a durable job on async fallback", async () => {
		mockRunAgentWithFallback.mockImplementation(
			async (
				_agentPromise: Promise<string>,
				opts: {
					enqueueDurable: () => Promise<unknown>;
					onAsyncFallback: () => Promise<unknown>;
					onResult: (r: string) => Promise<unknown>;
				},
			) => {
				await opts.enqueueDurable();
				await opts.onAsyncFallback();
				await opts.onResult("async reply");
			},
		);
		const res = await post(
			secretReq(
				{
					message: {
						message_id: 6,
						from: { id: 456 },
						chat: { id: 123, type: "private" },
						text: "Уучлаарай",
					},
				},
				"webhook-secret",
			),
		);
		expect(res.status).toBe(200);
		expect(mockEnqueueJob).toHaveBeenCalledTimes(1);
		expect(mockSetReaction).toHaveBeenCalledWith(123, 6, REACTIONS.processing);
		expect(mockStreamFinish).toHaveBeenCalledWith("async reply");
	});

	it("fails the stream when the agent errors", async () => {
		mockRunAgentWithFallback.mockImplementation(
			async (
				_agentPromise: Promise<string>,
				opts: { onError: (m: string) => Promise<unknown> },
			) => {
				await opts.onError("Алдаа гарлаа");
			},
		);
		const res = await post(
			secretReq(
				{
					message: {
						message_id: 10,
						from: { id: 456 },
						chat: { id: 123, type: "private" },
						text: "юм юм",
					},
				},
				"webhook-secret",
			),
		);
		expect(res.status).toBe(200);
		expect(mockStreamFail).toHaveBeenCalledWith("Алдаа гарлаа");
		expect(mockSetReaction).toHaveBeenCalledWith(123, 10, REACTIONS.error);
	});

	it("transcribes voice messages and streams the reply", async () => {
		const res = await post(
			secretReq(
				{
					message: {
						message_id: 11,
						from: { id: 456 },
						chat: { id: 123, type: "private" },
						voice: { file_id: "voice-1", duration: 3 },
					},
				},
				"webhook-secret",
			),
		);
		expect(res.status).toBe(200);
		expect(mockGetFile).toHaveBeenCalledWith("voice-1");
		expect(mockDownloadFile).toHaveBeenCalledWith("voice/1.ogg");
		expect(mockTranscribeVoice).toHaveBeenCalledWith(
			expect.any(Uint8Array),
			"voice-1.ogg",
		);
		expect(mockSendMessage).toHaveBeenCalledWith(
			123,
			expect.stringContaining("Аудио хүлээн авлаа"),
		);
		expect(mockHandleAgentMessage).toHaveBeenCalledWith(
			expect.anything(),
			"Тайлсан бичвэр",
			"private",
			expect.anything(),
		);
		expect(mockStreamFinish).toHaveBeenCalledWith("Хариулт");
	});

	it("apologizes when transcription fails", async () => {
		mockTranscribeVoice.mockResolvedValue(null);
		const res = await post(
			secretReq(
				{
					message: {
						message_id: 12,
						from: { id: 456 },
						chat: { id: 123, type: "private" },
						voice: { file_id: "voice-2", duration: 3 },
					},
				},
				"webhook-secret",
			),
		);
		expect(res.status).toBe(200);
		expect(mockSendMessage).toHaveBeenCalledWith(
			123,
			expect.stringContaining("Дууг таньж чадсангүй"),
		);
		expect(mockHandleAgentMessage).not.toHaveBeenCalled();
	});

	it("returns ok for malformed bodies without crashing", async () => {
		const req = new Request("http://localhost/api/telegram/webhook/bk-1", {
			method: "POST",
			headers: { "x-telegram-bot-api-secret-token": "webhook-secret" },
			body: "{broken",
		});
		const res = await post(req);
		expect(res.status).toBe(200);
		expect((await res.json()).ok).toBe(true);
	});
});
