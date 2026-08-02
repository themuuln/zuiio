/**
 * Cron route tests: process-jobs (durable queue drain) + cleanup-sessions
 * (session pruning + stale handoff sweep).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockClaimJobs = vi.fn();
const mockCompleteJob = vi.fn();
vi.mock("@/state/job-queue", () => ({
	claimJobs: (...a: unknown[]) => mockClaimJobs(...a),
	completeJob: (...a: unknown[]) => mockCompleteJob(...a),
}));

const mockHandleAgentMessage = vi.fn(async () => "Хариулт");
vi.mock("@/gateway/agent-handler", () => ({
	handleAgentMessage: (...a: unknown[]) => mockHandleAgentMessage(...a),
}));

vi.mock("@/gateway/webhook-helpers", () => ({
	systemPromptFor: vi.fn(async () => "prompt"),
	getProductTools: vi.fn(() => []),
}));

const mockSendMessage = vi.fn(async () => {});
vi.mock("@/channels/telegram", () => ({
	TelegramChannel: class {
		sendMessage = mockSendMessage;
	},
}));
vi.mock("@/channels/whatsapp", () => ({
	WhatsAppChannel: class {
		sendMessage = mockSendMessage;
	},
}));

vi.mock("@/lib/supabase", () => ({
	createServiceClient: vi.fn(() => ({
		from: vi.fn(() => ({
			delete: vi.fn(() => ({
				lt: vi.fn(() => Promise.resolve({ count: 3, error: null })),
			})),
		})),
	})),
}));

vi.mock("@/state/handoff", () => ({
	resolveStaleHandoffs: vi.fn(async () => 1),
}));

function makeJob(id: string, channel = "telegram") {
	return {
		id,
		organization_id: "org-1",
		channel,
		payload: {
			ctx: {
				orgId: "org-1",
				userId: "u",
				productType: "zer",
				audience: "internal",
				chatId: 123,
				telegramUserId: 456,
				channel,
				channelChatId: "123",
				channelUserId: "456",
			},
			text: "hello",
			chatType: "private",
			productType: "zer",
		},
		status: "processing",
		attempts: 1,
		last_error: null,
		created_at: "",
		updated_at: "",
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	mockClaimJobs.mockResolvedValue([]);
	mockCompleteJob.mockResolvedValue(undefined);
});

describe("POST /api/cron/process-jobs", () => {
	it("rejects without the CRON_SECRET bearer", async () => {
		process.env.CRON_SECRET = "cron-secret";
		const { POST } = await import("@/app/api/cron/process-jobs/route");
		const res = await POST(
			new Request("http://localhost/api/cron/process-jobs", { method: "POST" }),
		);
		expect(res.status).toBe(401);
	});

	it("processes claimed jobs and delivers replies", async () => {
		delete process.env.CRON_SECRET;
		mockClaimJobs.mockResolvedValue([makeJob("j1"), makeJob("j2", "whatsapp")]);

		const { POST } = await import("@/app/api/cron/process-jobs/route");
		const res = await POST(
			new Request("http://localhost/api/cron/process-jobs", { method: "POST" }),
		);
		const json = (await res.json()) as { processed: number; failed: number };

		expect(json.processed).toBe(2);
		expect(json.failed).toBe(0);
		expect(mockHandleAgentMessage).toHaveBeenCalledTimes(2);
		expect(mockSendMessage).toHaveBeenCalledTimes(2);
		expect(mockCompleteJob).toHaveBeenCalledTimes(2);
	});

	it("marks failing jobs as failed and continues", async () => {
		delete process.env.CRON_SECRET;
		mockHandleAgentMessage.mockRejectedValueOnce(new Error("LLM down"));
		mockClaimJobs.mockResolvedValue([makeJob("j1"), makeJob("j2")]);

		const { POST } = await import("@/app/api/cron/process-jobs/route");
		const res = await POST(
			new Request("http://localhost/api/cron/process-jobs", { method: "POST" }),
		);
		const json = (await res.json()) as { processed: number; failed: number };

		expect(json.processed).toBe(1);
		expect(json.failed).toBe(1);
		expect(mockCompleteJob).toHaveBeenCalledWith(
			expect.anything(),
			"j1",
			"LLM down",
		);
	});
});

describe("POST /api/cron/cleanup-sessions", () => {
	it("deletes stale sessions and resolves stale handoffs", async () => {
		delete process.env.CRON_SECRET;
		const { POST } = await import("@/app/api/cron/cleanup-sessions/route");
		const res = await POST(
			new Request("http://localhost/api/cron/cleanup-sessions", {
				method: "POST",
			}),
		);
		const json = (await res.json()) as {
			deleted: number;
			staleHandoffsResolved: number;
		};
		expect(json.deleted).toBe(3);
		expect(json.staleHandoffsResolved).toBe(1);
	});
});
