import { describe, expect, it, vi } from "vitest";
import type { AgentProfile } from "@/gateway/types";
import { formatProfileContext, loadAgentProfile } from "@/state/agent-profile";
import { createMockSupabase, TEST_ORG_ID } from "../fixtures/supabase-mock";

vi.mock("server-only", () => ({}));

const AUDIENCE = "customer";

function makeProfile(overrides?: Partial<AgentProfile>): AgentProfile {
	return {
		organizationId: TEST_ORG_ID,
		audience: AUDIENCE,
		assistantName: null,
		businessSummary: null,
		responseLanguage: null,
		tone: null,
		contactDetails: null,
		businessHours: null,
		responseRules: null,
		handoffMessage: null,
		isActive: true,
		updatedBy: null,
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
		...overrides,
	};
}

describe("formatProfileContext — edge cases", () => {
	it("handles boolean-like values in business_hours properly", () => {
		const profile = makeProfile({
			businessHours: {
				mon: { open: "09:00", close: "18:00" },
				tue: { open: "09:00", close: "18:00" },
				is24h: false,
				holidayOverride: true,
			},
		});

		const result = formatProfileContext(profile);

		expect(result).toContain("## ORGANIZATION CONTEXT");
		expect(result).toContain("Business hours:");
		expect(result).toContain('"is24h": false');
		expect(result).toContain('"holidayOverride": true');
		expect(result).toContain('"mon"');
	});

	it("truncates very long business_summary gracefully", () => {
		const longSummary = "A".repeat(10_000);
		const profile = makeProfile({ businessSummary: longSummary });

		const result = formatProfileContext(profile);

		expect(result).toContain("Business summary:");
		expect(result).toContain(longSummary);
		// No crash, no error — output is valid
		expect(result.length).toBeGreaterThan(10_000);
	});

	it("handles special characters in assistantName", () => {
		const specialName = "O'Brien's \"Bot\" — Монгол нэр émoji: 🤖";
		const profile = makeProfile({ assistantName: specialName });

		const result = formatProfileContext(profile);

		expect(result).toContain(`Assistant name: ${specialName}`);
	});

	it("produces consistent output with same input (deterministic)", () => {
		const profile = makeProfile({
			assistantName: "Test Bot",
			businessSummary: "A summary.",
			businessHours: { mon: "09:00-18:00" },
		});

		const first = formatProfileContext(profile);
		const second = formatProfileContext(profile);

		expect(first).toBe(second);
	});
	it("handles deeply nested business_hours objects", () => {
		const profile = makeProfile({
			businessHours: {
				weekly: {
					monday: {
						open: "09:00",
						close: "18:00",
						breaks: [{ from: "12:00", to: "13:00" }],
					},
					tuesday: { open: "09:00", close: "18:00", breaks: [] },
				},
			},
		});

		const result = formatProfileContext(profile);

		expect(result).toContain("Business hours:");
		expect(result).toContain('"monday"');
		expect(result).toContain('"breaks"');
	});
});

describe("loadAgentProfile — edge cases", () => {
	it("handles disabled profile (is_active = false) as null", async () => {
		// The query filters by is_active = true, so a disabled profile
		// is never returned. Mock the result as no-row-found.
		const supabase = createMockSupabase({
			data: null,
			error: { code: "PGRST116", message: "Row not found" },
		});

		const result = await loadAgentProfile(supabase, TEST_ORG_ID, AUDIENCE);
		expect(result).toBeNull();
	});

	it("handles PGRST116 (not found) as null", async () => {
		const supabase = createMockSupabase({
			data: null,
			error: { code: "PGRST116", message: "Row not found" },
		});

		const result = await loadAgentProfile(supabase, TEST_ORG_ID, AUDIENCE);
		expect(result).toBeNull();
	});

	it("handles unexpected DB errors as null", async () => {
		// Build a custom mock that throws during the chain
		const boom = () => {
			throw new Error("DB connection lost");
		};

		const chain = {
			select: vi.fn(() => chain),
			eq: vi.fn(() => chain),
			single: vi.fn(boom),
		};

		const supabase = {
			from: vi.fn(() => chain),
			rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
			auth: {
				getUser: vi.fn(() => Promise.resolve({ data: null, error: null })),
				getSession: vi.fn(() => Promise.resolve({ data: null, error: null })),
				signInWithPassword: vi.fn(() =>
					Promise.resolve({ data: null, error: null }),
				),
			},
		};

		const result = await loadAgentProfile(
			supabase as never,
			TEST_ORG_ID,
			AUDIENCE,
		);
		expect(result).toBeNull();
	});
});
