import { describe, expect, it, vi } from "vitest";
import { createMockSupabase, TEST_ORG_ID, TEST_CHAT_ID } from "../fixtures/supabase-mock";

describe("triggerHandoff / getActiveHandoff / resolveHandoff / resumeBotAfterHandoff", () => {
	it("creates a handoff event and returns it", async () => {
		const { triggerHandoff } = await import("@/state/handoff");
		const mockSupabase = createMockSupabase({
			data: {
				id: "handoff-1",
				organization_id: TEST_ORG_ID,
				chat_id: TEST_CHAT_ID,
				user_id: 12345,
				status: "pending_human",
				reason: "Хэрэглэгч хүнтэй ярихыг хүсч байна",
				escalated_by: "keyword",
				customer_query: "оператортай холбогдох",
				admin_user_id: null,
				created_at: new Date().toISOString(),
			},
			error: null,
		});

		const event = await triggerHandoff(mockSupabase, {
			orgId: TEST_ORG_ID,
			chatId: TEST_CHAT_ID,
			userId: 12345,
			reason: "Хэрэглэгч хүнтэй ярихыг хүсч байна",
			escalatedBy: "keyword",
			customerQuery: "оператортай холбогдох",
			botResponse: "Би танд туслахад бэлэн байна",
		});

		expect(event.id).toBe("handoff-1");
		expect(event.status).toBe("pending_human");
		expect(event.reason).toContain("хүнтэй ярихыг хүсч");
	});

	it("returns active handoff for a chat", async () => {
		const { getActiveHandoff } = await import("@/state/handoff");
		const mockSupabase = createMockSupabase({
			data: [
				{
					id: "handoff-2",
					status: "pending_human",
					reason: "Түлхүүр үг",
					escalated_by: "keyword",
					customer_query: "хүнээр үйлчлүүлэх",
					admin_user_id: 999999,
					created_at: new Date().toISOString(),
				},
			],
			error: null,
		});

		const handoff = await getActiveHandoff(mockSupabase, TEST_ORG_ID, TEST_CHAT_ID);
		expect(handoff).not.toBeNull();
		expect(handoff!.id).toBe("handoff-2");
		expect(handoff!.status).toBe("pending_human");
	});

	it("returns null when no active handoff exists", async () => {
		const { getActiveHandoff } = await import("@/state/handoff");
		const mockSupabase = createMockSupabase({ data: [], error: null });

		const handoff = await getActiveHandoff(mockSupabase, TEST_ORG_ID, TEST_CHAT_ID);
		expect(handoff).toBeNull();
	});

	it("resolves a handoff", async () => {
		const { resolveHandoff } = await import("@/state/handoff");
		const mockSupabase = createMockSupabase({ data: null, error: null });

		await expect(resolveHandoff(mockSupabase, "handoff-1")).resolves.toBeUndefined();
	});

	it("resumes bot after human resolution", async () => {
		const { resumeBotAfterHandoff } = await import("@/state/handoff");
		const mockSupabase = createMockSupabase({ data: null, error: null });

		await expect(
			resumeBotAfterHandoff(mockSupabase, TEST_ORG_ID, TEST_CHAT_ID),
		).resolves.toBeUndefined();
	});

	it("throws Mongolian error when handoff trigger fails", async () => {
		const { triggerHandoff } = await import("@/state/handoff");
		const mockSupabase = createMockSupabase({
			data: null,
			error: new Error("DB unavailable"),
		});

		await expect(
			triggerHandoff(mockSupabase, {
				orgId: TEST_ORG_ID,
				chatId: TEST_CHAT_ID,
				userId: 12345,
				reason: "Test",
				escalatedBy: "agent",
				customerQuery: "Help",
				botResponse: "I'll get someone",
			}),
		).rejects.toThrow("Хүнд шилжүүлэхэд алдаа гарлаа");
	});
});
