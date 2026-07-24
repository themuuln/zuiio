import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Build a chainable mock Supabase client that resolves to the given data.
 */
function chainableSupabase(resolveValue: unknown) {
	const chain: Record<string, unknown> = {};
	const methods = [
		"from",
		"select",
		"eq",
		"neq",
		"gt",
		"gte",
		"lt",
		"lte",
		"in",
		"is",
		"contains",
		"or",
		"order",
		"limit",
		"range",
		"single",
		"insert",
		"update",
		"delete",
	];
	for (const m of methods) {
		chain[m] = vi.fn().mockReturnValue(chain);
	}
	// Make the chain thenable
	(chain as any).then = vi.fn(async (resolve: (v: unknown) => unknown) =>
		resolve(resolveValue),
	);
	return chain;
}

// Mock crypto.randomUUID
const testUuid = "test-uuid-1234-5678";
vi.stubGlobal("crypto", {
	randomUUID: vi.fn(() => testUuid),
});

describe("flow persistence", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("loadFlowVersion", () => {
		it("loads a flow version by ID", async () => {
			const resolveValue = {
				data: {
					id: "flow-v1",
					organization_id: "org-1",
					product_type: "tolom",
					nodes: [{ id: "n1", type: "start" }],
					edges: [{ id: "e1", source: "n1", target: "n2" }],
					channel: "telegram",
					trigger_keywords: ["help"],
					metadata: { version: 1 },
				},
				error: null,
			};
			const sb = chainableSupabase(resolveValue);

			const { loadFlowVersion } = await import("@/flow-executor/persistence");

			const result = await loadFlowVersion(sb as never, "flow-v1");

			expect(result).not.toBeNull();
			expect(result?.id).toBe("flow-v1");
			expect(result?.orgId).toBe("org-1");
			expect(result?.nodes).toHaveLength(1);
			expect(sb.from).toHaveBeenCalledWith("flow_versions");
			expect(sb.eq).toHaveBeenCalledWith("id", "flow-v1");
		});

		it("returns null when not found", async () => {
			const sb = chainableSupabase({
				data: null,
				error: { code: "PGRST116" },
			});

			const { loadFlowVersion } = await import("@/flow-executor/persistence");

			const result = await loadFlowVersion(sb as never, "nonexistent");
			expect(result).toBeNull();
		});
	});

	describe("findActiveFlow", () => {
		it("finds active flow for org", async () => {
			const resolveValue = {
				data: {
					id: "flow-1",
					organization_id: "org-1",
					product_type: "zer",
					nodes: [],
					edges: [],
					channel: null,
					trigger_keywords: null,
					metadata: null,
				},
				error: null,
			};
			const sb = chainableSupabase(resolveValue);

			const { findActiveFlow } = await import("@/flow-executor/persistence");

			const result = await findActiveFlow(sb as never, "org-1");

			expect(result).not.toBeNull();
			expect(result?.orgId).toBe("org-1");
			expect(sb.eq).toHaveBeenCalledWith("organization_id", "org-1");
			expect(sb.eq).toHaveBeenCalledWith("is_active", true);
		});

		it("filters by channel and keyword when provided", async () => {
			const resolveValue = {
				data: {
					id: "f1",
					organization_id: "o1",
					product_type: "zer",
					nodes: [],
					edges: [],
				},
				error: null,
			};
			const sb = chainableSupabase(resolveValue);

			const { findActiveFlow } = await import("@/flow-executor/persistence");

			await findActiveFlow(sb as never, "org-1", "telegram", "start");

			expect(sb.or).toHaveBeenCalledWith("channel.is.null,channel.eq.telegram");
			expect(sb.contains).toHaveBeenCalledWith("trigger_keywords", ["start"]);
		});

		it("returns null when not found", async () => {
			const sb = chainableSupabase({
				data: null,
				error: { code: "PGRST116" },
			});

			const { findActiveFlow } = await import("@/flow-executor/persistence");

			const result = await findActiveFlow(sb as never, "org-1");
			expect(result).toBeNull();
		});
	});

	describe("loadActiveRun", () => {
		it("loads active run for user", async () => {
			const resolveValue = {
				data: {
					id: "run-1",
					flow_version_id: "fv-1",
					organization_id: "org-1",
					channel: "telegram",
					channel_chat_id: "chat-1",
					channel_user_id: "user-1",
					status: "active",
					current_node_id: "n1",
					fields: { name: "Test" },
					assignments: { exp1: "a" },
					started_at: "2026-01-01T00:00:00Z",
					updated_at: "2026-01-01T00:00:00Z",
					expires_at: "2026-01-02T00:00:00Z",
					channel_meta: { foo: "bar" },
				},
				error: null,
			};
			const sb = chainableSupabase(resolveValue);

			const { loadActiveRun } = await import("@/flow-executor/persistence");

			const result = await loadActiveRun(
				sb as never,
				"org-1",
				"telegram",
				"chat-1",
				"user-1",
			);

			expect(result).not.toBeNull();
			expect(result?.id).toBe("run-1");
			expect(result?.status).toBe("active");
			expect(result?.fields).toEqual({ name: "Test" });
			expect(result?.channelMeta).toEqual({ foo: "bar" });
			expect(sb.in).toHaveBeenCalledWith("status", [
				"active",
				"waiting",
				"delayed",
			]);
		});

		it("returns null when no active run", async () => {
			const sb = chainableSupabase({
				data: null,
				error: { code: "PGRST116" },
			});

			const { loadActiveRun } = await import("@/flow-executor/persistence");

			const result = await loadActiveRun(
				sb as never,
				"org-1",
				"telegram",
				"chat-1",
				"user-1",
			);
			expect(result).toBeNull();
		});
	});

	describe("createRun", () => {
		it("creates a new run from flow version", async () => {
			const resolveValue = { data: null, error: null };
			const sb = chainableSupabase(resolveValue);

			const flow = {
				id: "fv-1",
				orgId: "org-1",
				productType: "zer",
				nodes: [
					{ id: "start-1", type: "start" },
					{ id: "msg-1", type: "sendMessage" },
				],
				edges: [{ id: "e1", source: "start-1", target: "msg-1" }],
			};

			const { createRun } = await import("@/flow-executor/persistence");

			const result = await createRun(
				sb as never,
				flow as never,
				"telegram",
				"chat-1",
				"user-1",
				{ ref: "abc" },
			);

			expect(result.id).toBe(testUuid);
			expect(result.status).toBe("active");
			expect(result.currentNodeId).toBe("msg-1"); // first edge target
			expect(result.channelMeta).toEqual({ ref: "abc" });
			expect(sb.from).toHaveBeenCalledWith("conversation_runs");
		});

		it("falls back to start node when no edges exist", async () => {
			const resolveValue = { data: null, error: null };
			const sb = chainableSupabase(resolveValue);

			const flow = {
				id: "fv-2",
				orgId: "org-1",
				nodes: [{ id: "start-only", type: "start" }],
				edges: [],
			};

			const { createRun } = await import("@/flow-executor/persistence");

			const result = await createRun(
				sb as never,
				flow as never,
				"telegram",
				"chat-2",
				"user-2",
			);

			expect(result.currentNodeId).toBe("start-only");
		});

		it("throws on insert error", async () => {
			const resolveValue = {
				data: null,
				error: { message: "insert failed" },
			};
			const sb = chainableSupabase(resolveValue);

			const flow = {
				id: "fv-3",
				orgId: "org-1",
				nodes: [{ id: "start-1", type: "start" }],
				edges: [],
			};

			const { createRun } = await import("@/flow-executor/persistence");

			await expect(
				createRun(sb as never, flow as never, "telegram", "c", "u"),
			).rejects.toThrow();
		});
	});

	describe("saveRun", () => {
		it("updates the run in Supabase", async () => {
			const resolveValue = { data: null, error: null };
			const sb = chainableSupabase(resolveValue);

			const { saveRun } = await import("@/flow-executor/persistence");

			await saveRun(
				sb as never,
				{
					id: "run-1",
					status: "completed",
					currentNodeId: "n3",
					fields: { done: "true" },
					assignments: {},
					updatedAt: "2026-01-01T00:00:00Z",
				} as never,
			);

			expect(sb.from).toHaveBeenCalledWith("conversation_runs");
			expect(sb.update).toHaveBeenCalled();
			expect(sb.eq).toHaveBeenCalledWith("id", "run-1");
		});
	});

	describe("wait state operations", () => {
		it("saveWaitState inserts a wait state", async () => {
			const resolveValue = { data: null, error: null };
			const sb = chainableSupabase(resolveValue);

			const { saveWaitState } = await import("@/flow-executor/persistence");

			await saveWaitState(sb as never, {
				id: "wait-1",
				runId: "run-1",
				waitType: "delay",
				scheduledAt: "2026-01-01T00:00:00Z",
				expectedInput: null,
				callbackPattern: null,
				createdAt: "2026-01-01T00:00:00Z",
			});

			expect(sb.from).toHaveBeenCalledWith("flow_wait_states");
			expect(sb.insert).toHaveBeenCalled();
		});

		it("loadReadyWaits returns ready waits with runs", async () => {
			const resolveValue = {
				data: [
					{
						id: "wait-1",
						run_id: "run-1",
						wait_type: "delay",
						scheduled_at: "2026-01-01T00:00:00Z",
						expected_input: null,
						callback_pattern: null,
						created_at: "2026-01-01T00:00:00Z",
						conversation_runs: {
							id: "run-1",
							flow_version_id: "fv-1",
							organization_id: "org-1",
							channel: "telegram",
							channel_chat_id: "chat-1",
							channel_user_id: "user-1",
							status: "delayed",
							current_node_id: "n1",
							fields: {},
							assignments: {},
							started_at: "2026-01-01T00:00:00Z",
							updated_at: "2026-01-01T00:00:00Z",
							expires_at: "2026-01-02T00:00:00Z",
							channel_meta: null,
						},
					},
				],
				error: null,
			};
			const sb = chainableSupabase(resolveValue);

			const { loadReadyWaits } = await import("@/flow-executor/persistence");

			const result = await loadReadyWaits(sb as never);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("wait-1");
			expect(result[0].run.id).toBe("run-1");
		});

		it("loadReadyWaits returns empty when no waits", async () => {
			const sb = chainableSupabase({ data: null, error: null });

			const { loadReadyWaits } = await import("@/flow-executor/persistence");

			const result = await loadReadyWaits(sb as never);
			expect(result).toEqual([]);
		});

		it("deleteWaitState deletes by id", async () => {
			const resolveValue = { data: null, error: null };
			const sb = chainableSupabase(resolveValue);

			const { deleteWaitState } = await import("@/flow-executor/persistence");

			await deleteWaitState(sb as never, "wait-1");

			expect(sb.from).toHaveBeenCalledWith("flow_wait_states");
			expect(sb.delete).toHaveBeenCalled();
			expect(sb.eq).toHaveBeenCalledWith("id", "wait-1");
		});
	});

	describe("outbox operations", () => {
		it("enqueueMessage inserts pending outbox entry", async () => {
			const resolveValue = { data: null, error: null };
			const sb = chainableSupabase(resolveValue);

			const { enqueueMessage } = await import("@/flow-executor/persistence");

			const id = await enqueueMessage(
				sb as never,
				"run-1",
				"telegram",
				"chat-1",
				{ text: "Hello", buttons: [{ text: "OK", callbackData: "ok" }] },
			);

			expect(id).toBe(testUuid);
			expect(sb.from).toHaveBeenCalledWith("flow_outbox");
		});

		it("markSent updates status to sent", async () => {
			const resolveValue = { data: null, error: null };
			const sb = chainableSupabase(resolveValue);

			const { markSent } = await import("@/flow-executor/persistence");

			await markSent(sb as never, "outbox-1");

			expect(sb.from).toHaveBeenCalledWith("flow_outbox");
			expect(sb.update).toHaveBeenCalledWith(
				expect.objectContaining({ status: "sent" }),
			);
			expect(sb.eq).toHaveBeenCalledWith("id", "outbox-1");
		});

		it("markFailed updates status to failed with error", async () => {
			const resolveValue = { data: null, error: null };
			const sb = chainableSupabase(resolveValue);

			const { markFailed } = await import("@/flow-executor/persistence");

			await markFailed(sb as never, "outbox-1", "Network error");

			expect(sb.update).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "failed",
					error: "Network error",
				}),
			);
		});

		it("loadPendingOutbox returns pending entries under retry limit", async () => {
			const resolveValue = {
				data: [
					{
						id: "o1",
						run_id: "run-1",
						channel: "telegram",
						channel_chat_id: "chat-1",
						payload: { text: "Hi" },
						status: "pending",
						retry_count: 1,
						max_retries: 3,
						created_at: "2026-01-01T00:00:00Z",
						sent_at: null,
						error: null,
					},
				],
				error: null,
			};
			const sb = chainableSupabase(resolveValue);

			const { loadPendingOutbox } = await import("@/flow-executor/persistence");

			const result = await loadPendingOutbox(sb as never, 10);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("o1");
			expect(result[0].status).toBe("pending");
			expect(sb.lt).toHaveBeenCalledWith("retry_count", 3);
		});
	});
});
