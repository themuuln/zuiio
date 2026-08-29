import { describe, expect, it, vi } from "vitest";
import type { GatewayContext } from "@/gateway/types";
import {
	claimJobs,
	completeJob,
	enqueueJob,
	MAX_ATTEMPTS,
} from "@/state/job-queue";

vi.mock("server-only", () => ({}));

const CTX: GatewayContext = {
	orgId: "org-1",
	userId: "u-1",
	productType: "zer",
	audience: "customer",
	chatId: 0,
	telegramUserId: 0,
	channel: "whatsapp",
	channelChatId: "1",
	channelUserId: "2",
};

function makeSupabase() {
	const chain: Record<string, unknown> = {};
	chain.select = vi.fn(() => chain);
	chain.eq = vi.fn(() => chain);
	chain.order = vi.fn(() => chain);
	chain.limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
	chain.insert = vi.fn(() => chain);
	chain.update = vi.fn(() => chain);
	chain.in = vi.fn(() => chain);
	chain.single = vi.fn(() =>
		Promise.resolve({ data: { id: "job-1" }, error: null }),
	);
	const from = vi.fn(() => chain);
	return { from, ...chain } as never;
}

describe("enqueueJob", () => {
	it("inserts a pending job with the full payload", async () => {
		const sb = makeSupabase();
		const result = await enqueueJob(sb, CTX, "hello", "private");
		expect(result).toEqual({ id: "job-1" });

		const insertCall = (sb as { insert: ReturnType<typeof vi.fn> }).insert.mock
			.calls[0]?.[0] as Record<string, unknown>;
		expect(insertCall).toMatchObject({
			organization_id: "org-1",
			channel: "whatsapp",
		});
		const payload = insertCall.payload as {
			ctx: GatewayContext;
			text: string;
			productType: string;
		};
		expect(payload.text).toBe("hello");
		expect(payload.ctx.orgId).toBe("org-1");
		expect(payload.productType).toBe("zer");
	});

	it("returns null when insert fails", async () => {
		const sb = makeSupabase();
		(sb as { single: ReturnType<typeof vi.fn> }).single.mockResolvedValueOnce({
			data: null,
			error: { message: "x" },
		});
		const result = await enqueueJob(sb, CTX, "hi", "private");
		expect(result).toBeNull();
	});
});

describe("claimJobs", () => {
	it("claims the oldest pending jobs and flips them to processing", async () => {
		const sb = makeSupabase();
		(sb as { limit: ReturnType<typeof vi.fn> }).limit.mockResolvedValueOnce({
			data: [
				{
					id: "j1",
					organization_id: "org-1",
					channel: "telegram",
					payload: { text: "a" },
					status: "pending",
					attempts: 0,
					last_error: null,
					created_at: "2026-01-01T00:00:00Z",
					updated_at: "2026-01-01T00:00:00Z",
				},
			],
			error: null,
		});

		const rows = await claimJobs(sb, 5);

		expect(rows).toHaveLength(1);
		expect(rows[0]?.id).toBe("j1");
		const updateCall = (sb as { update: ReturnType<typeof vi.fn> }).update.mock
			.calls[0]?.[0] as { status: string };
		expect(updateCall.status).toBe("processing");
	});

	it("returns [] when nothing is pending", async () => {
		const sb = makeSupabase();
		const rows = await claimJobs(sb);
		expect(rows).toEqual([]);
	});

	it("returns [] when the select fails", async () => {
		const sb = makeSupabase();
		(sb as { limit: ReturnType<typeof vi.fn> }).limit.mockResolvedValueOnce({
			data: null,
			error: { message: "x" },
		});
		const rows = await claimJobs(sb);
		expect(rows).toEqual([]);
	});
});

describe("completeJob", () => {
	it("marks a job done on success", async () => {
		const sb = makeSupabase();
		(sb as { single: ReturnType<typeof vi.fn> }).single.mockResolvedValueOnce({
			data: { attempts: 1 },
			error: null,
		});

		await completeJob(sb, "j1");

		const patch = (sb as { update: ReturnType<typeof vi.fn> }).update.mock
			.calls[0]?.[0] as { status: string; attempts: number };
		expect(patch.status).toBe("done");
		expect(patch.attempts).toBe(2);
	});

	it("requeues as pending under the attempt cap, failed beyond it", async () => {
		const sb = makeSupabase();

		(sb as { single: ReturnType<typeof vi.fn> }).single.mockResolvedValueOnce({
			data: { attempts: 1 },
			error: null,
		});
		await completeJob(sb, "j1", "boom");
		let patch = (sb as { update: ReturnType<typeof vi.fn> }).update.mock
			.calls[0]?.[0] as { status: string; last_error: string };
		expect(patch.status).toBe("pending");
		expect(patch.last_error).toBe("boom");

		(sb as { single: ReturnType<typeof vi.fn> }).single.mockResolvedValueOnce({
			data: { attempts: MAX_ATTEMPTS },
			error: null,
		});
		await completeJob(sb, "j1", "boom");
		patch = (sb as { update: ReturnType<typeof vi.fn> }).update.mock
			.calls[1]?.[0] as { status: string };
		expect(patch.status).toBe("failed");
	});
});
