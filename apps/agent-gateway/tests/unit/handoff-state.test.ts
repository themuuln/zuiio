import { describe, expect, it, vi } from "vitest";
import {
	getHandoffConfig,
	listPendingHandoffs,
	resolveStaleHandoffs,
} from "@/state/handoff";

vi.mock("server-only", () => ({}));

function makeSupabase(overrides: Record<string, unknown> = {}) {
	// Generic chainable mock: from(table) returns a chain where every
	// query method returns the chain until a terminal resolver.
	const chain: Record<string, unknown> = {};
	chain.select = vi.fn(() => chain);
	chain.eq = vi.fn(() => chain);
	chain.in = vi.fn(() => chain);
	chain.order = vi.fn(() => chain);
	chain.limit = vi.fn(() =>
		Promise.resolve({ data: overrides.pending ?? [], error: null }),
	);
	chain.lt = vi.fn(() => chain);
	chain.update = vi.fn(() => chain);
	chain.maybeSingle = vi.fn(() =>
		Promise.resolve({ data: overrides.config ?? null, error: null }),
	);
	chain.selectTerminal = vi.fn(() =>
		Promise.resolve({ data: overrides.stale ?? [], error: null }),
	);
	// resolveStaleHandoffs: .update().eq().lt().select()
	chain.lt = vi.fn(() => ({ select: chain.selectTerminal }));
	// listPendingHandoffs: .select().eq().in().order().limit()
	chain.eq = vi.fn(() => chain);
	chain.in = vi.fn(() => chain);
	chain.order = vi.fn(() => chain);
	chain.limit = vi.fn(() =>
		Promise.resolve({ data: overrides.pending ?? [], error: null }),
	);
	const from = vi.fn(() => chain);
	return { from } as never;
}

describe("getHandoffConfig", () => {
	it("returns defaults when no row exists", async () => {
		const config = await getHandoffConfig(makeSupabase(), "org-1");
		expect(config).toMatchObject({
			keywordTriggers: [],
			sentimentEnabled: true,
			adminChatId: null,
			autoHandoffAfterHours: true,
		});
	});

	it("maps the DB row", async () => {
		const supabase = makeSupabase({
			config: {
				keyword_triggers: ["ажилтан"],
				sentiment_enabled: false,
				admin_chat_id: 555,
				auto_handoff_after_hours: false,
			},
		});
		const config = await getHandoffConfig(supabase, "org-1");
		expect(config.keywordTriggers).toEqual(["ажилтан"]);
		expect(config.sentimentEnabled).toBe(false);
		expect(config.adminChatId).toBe(555);
	});
});

describe("listPendingHandoffs", () => {
	it("maps pending handoff rows", async () => {
		const supabase = makeSupabase({
			pending: [
				{
					id: "h-1",
					organization_id: "org-1",
					chat_id: 111,
					user_id: 222,
					status: "pending_human",
					reason: "хүн хүсэв",
					escalated_by: "keyword",
					customer_query: "хүнтэй ярихыг хүсэж байна",
					admin_user_id: null,
					created_at: "2026-08-01T00:00:00Z",
				},
			],
		});
		const rows = await listPendingHandoffs(supabase, "org-1");
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			id: "h-1",
			organizationId: "org-1",
			status: "pending_human",
			customerQuery: "хүнтэй ярихыг хүсэж байна",
		});
	});

	it("returns [] on empty", async () => {
		const rows = await listPendingHandoffs(makeSupabase(), "org-1");
		expect(rows).toEqual([]);
	});
});

describe("resolveStaleHandoffs", () => {
	it("returns the count of resolved rows", async () => {
		const supabase = makeSupabase({ stale: [{ id: "h-1" }, { id: "h-2" }] });
		const count = await resolveStaleHandoffs(supabase, "2026-01-01T00:00:00Z");
		expect(count).toBe(2);
	});
});
